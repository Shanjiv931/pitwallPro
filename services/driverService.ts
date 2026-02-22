
import { supabase } from './supabaseClient';
import { Driver, PirelliCompound } from '../types';

const STORAGE_KEY = 'pitwall_custom_drivers';

// Fetch all drivers (System + User Created)
export const getAllDrivers = async (): Promise<Driver[]> => {
  if (supabase) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('base_pace', { ascending: true }); // Sort by fastest

    if (!error && data) {
       return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          team: d.team,
          number: d.number,
          color: d.color,
          // Runtime state (not stored in DB usually, but needed for types)
          position: 0,
          gapToLeader: 0,
          currentTyre: 'C3' as PirelliCompound,
          tyreAge: 0,
          lapTimes: [],
          pitStops: 0,
          status: 'OnTrack' as const,
          // Stats
          basePace: d.base_pace,
          consistency: d.consistency,
          tyreManagement: d.tyre_management,
          aggression: d.aggression,
          wetWeatherAbility: d.wet_weather_ability,
          // Metadata
          userId: d.user_id // Useful for determining ownership in UI
       }));
    }
  }
  // Fallback to local storage + Constants if DB fails or is missing
  return getCustomDrivers(); 
};

export const saveDriver = async (driver: Driver): Promise<void> => {
  try {
    if (supabase) {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { error } = await supabase
        .from('drivers')
        .insert([
          {
            id: driver.id,
            user_id: userId, // Bind to creator
            name: driver.name,
            team: driver.team,
            number: driver.number,
            color: driver.color,
            base_pace: driver.basePace,
            consistency: driver.consistency,
            tyre_management: driver.tyreManagement,
            aggression: driver.aggression,
            wet_weather_ability: driver.wetWeatherAbility
          }
        ]);
      
      if (error) throw error;
    } else {
      const existing = getLocalDrivers();
      existing.push(driver);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.error("Error saving driver:", e);
    throw e;
  }
};

export const deleteDriver = async (driverId: string): Promise<void> => {
    try {
        if (supabase) {
            const { error } = await supabase.from('drivers').delete().eq('id', driverId);
            if (error) throw error;
        } else {
            let drivers = getLocalDrivers();
            drivers = drivers.filter(d => d.id !== driverId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
        }
    } catch (e) {
        console.error("Error deleting driver:", e);
        throw e; // Important: Rethrow so UI can handle validation/permissions errors
    }
};

// Permanently delete user data (Drivers + Profile + Auth Account)
export const deleteUserAccount = async (): Promise<void> => {
    if (!supabase) return;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user authenticated");

        // Try RPC first (best for full account deletion)
        const { error: rpcError } = await supabase.rpc('delete_user_account');
        
        if (rpcError) {
             console.warn("RPC delete_user_account failed or missing, falling back to manual table cleanup. Auth user will remain.", rpcError);
             
             // Fallback: Delete drivers
             const { error: driversError } = await supabase
                .from('drivers')
                .delete()
                .eq('user_id', user.id);
                
            if (driversError) throw driversError;

            // Fallback: Delete profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;
        }
        
    } catch (e) {
        console.error("Account deletion error:", e);
        throw e;
    }
};

// Deprecated in favor of getAllDrivers for main list, but kept for fallback
export const getCustomDrivers = async (): Promise<Driver[]> => {
  return getLocalDrivers();
};

const getLocalDrivers = (): Driver[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const checkIsAdmin = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        
        const { data, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
        if (error) return false;
        
        return data?.is_admin || false;
    } catch (e) {
        return false;
    }
}
