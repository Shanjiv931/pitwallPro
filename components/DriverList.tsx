
import React, { useEffect, useState } from 'react';
import { Driver } from '../types';
import { getAllDrivers, deleteDriver, checkIsAdmin } from '../services/driverService';
import { supabase } from '../services/supabaseClient';
import { Trash2, Shield, User, ChevronLeft, Loader2, Database, Plus, X, Lock, HelpCircle } from 'lucide-react';

interface DriverListProps {
  onBack: () => void;
  onAddNew: () => void;
  onContact: () => void;
}

const DriverList: React.FC<DriverListProps> = ({ onBack, onAddNew, onContact }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAdminAlert, setShowAdminAlert] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
          const [allDrivers, adminStatus, userResponse] = await Promise.all([
            getAllDrivers(),
            checkIsAdmin(),
            supabase ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } })
          ]);
          
          setDrivers(allDrivers);
          setIsAdmin(adminStatus);
          setCurrentUserId(userResponse.data.user?.id || null);
      } catch (error) {
          console.error("Initialization error:", error);
      } finally {
          setLoading(false);
      }
    };
    init();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    // 1. Strict Admin Check
    if (!isAdmin) {
        setShowAdminAlert(true);
        return;
    }

    // 2. Confirmation & Execution
    if (confirm(`ADMIN OVERRIDE: Are you sure you want to delete ${name}? This will permanently remove the record from Supabase.`)) {
        try {
            await deleteDriver(id);
            // Optimistic UI update
            setDrivers(prev => prev.filter(d => d.id !== id));
        } catch (e: any) {
            console.error("Delete failed:", e);
            alert(`Database Error: ${e.message || "Could not delete driver."}`);
        }
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-6 overflow-y-auto relative">
        {/* Admin Restriction Modal */}
        {showAdminAlert && (
            <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-neutral-900 border-2 border-red-600 p-8 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.2)] relative flex flex-col items-center text-center">
                    <button 
                        onClick={() => setShowAdminAlert(false)} 
                        className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
                        <Lock size={32} className="text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-3">
                        Access Restricted
                    </h2>
                    
                    <p className="text-neutral-400 text-sm font-medium mb-8 leading-relaxed">
                        Only system administrators can delete driver profiles.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <button 
                            onClick={onContact}
                            className="bg-neutral-800 text-white hover:bg-neutral-700 w-full py-3 font-bold uppercase tracking-widest border border-neutral-700 transition-all flex items-center justify-center gap-2"
                        >
                            <HelpCircle size={16} /> Contact Admin
                        </button>
                        <button 
                            onClick={() => setShowAdminAlert(false)}
                            className="bg-white text-black hover:bg-neutral-200 w-full py-3 font-black uppercase tracking-widest skew-box transition-all"
                        >
                            <span className="unskew">Dismiss</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-6 sticky top-0 bg-neutral-950/95 backdrop-blur z-20 pt-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-neutral-900 hover:bg-neutral-800 p-2 border border-neutral-700 transition-colors">
                        <ChevronLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">Driver Database</h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                           <Database size={12} /> {drivers.length} Profiles Registered
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <div className="bg-red-900/20 border border-red-800 text-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 rounded">
                            <Shield size={12} /> Admin Access
                        </div>
                    )}
                    <button 
                        onClick={onAddNew}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 font-black uppercase tracking-widest skew-box transition-all"
                    >
                        <span className="unskew flex items-center gap-2"><Plus size={18} /> New Entry</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {drivers.map(driver => {
                    // @ts-ignore - userId injected in getAllDrivers service
                    const isOwner = currentUserId && driver.userId === currentUserId;
                    const isSystem = !driver.userId; // System drivers have null user_id
                    
                    // Button Visibility Logic:
                    // 1. Never show for System Drivers
                    // 2. Show if Admin (Admin can delete anyone)
                    // 3. Show if Owner (Owner sees button, but clicking triggers alert if !Admin)
                    const showDeleteButton = !isSystem && (isAdmin || isOwner);

                    return (
                        <div key={driver.id} className="bg-neutral-900 border border-neutral-800 group relative overflow-hidden transition-all hover:border-neutral-600 hover:shadow-2xl hover:-translate-y-1">
                            {/* Color Strip */}
                            <div className="h-2 w-full" style={{ backgroundColor: driver.color }}></div>
                            
                            {/* Card Body */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-5xl font-black text-neutral-800 group-hover:text-white/10 transition-colors absolute top-4 right-4 z-0 pointer-events-none italic">
                                        {driver.number}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-2xl font-black italic text-white uppercase leading-none mb-1">{driver.name}</div>
                                        <div className="text-xs font-bold uppercase text-red-500 tracking-wider">{driver.team}</div>
                                    </div>
                                </div>

                                {/* Stat Bars */}
                                <div className="space-y-3 relative z-10 mt-6">
                                    <StatBar label="Pace Index" value={(1 - driver.basePace) * 100} color="blue" />
                                    <StatBar label="Consistency" value={driver.consistency * 100} color="green" />
                                    <StatBar label="Tyre Mgmt" value={driver.tyreManagement * 100} color="yellow" />
                                    <StatBar label="Aggression" value={driver.aggression * 100} color="orange" />
                                    <StatBar label="Wet Skill" value={driver.wetWeatherAbility * 100} color="indigo" />
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="bg-neutral-950 p-4 border-t border-neutral-800 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2">
                                    {isSystem ? (
                                        <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded uppercase font-bold border border-neutral-700">Official</span>
                                    ) : (
                                        <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded uppercase font-bold border border-blue-900/50 flex items-center gap-1">
                                            <User size={10} /> User Created
                                        </span>
                                    )}
                                </div>

                                {showDeleteButton && (
                                    <button 
                                        onClick={() => handleDelete(driver.id, driver.name)}
                                        className="text-neutral-600 hover:text-red-500 transition-colors"
                                        title="Delete Driver"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => {
    const getColor = (c: string) => {
        const map: any = { blue: 'bg-blue-500', green: 'bg-emerald-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500', indigo: 'bg-indigo-500' };
        return map[c] || 'bg-white';
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase text-neutral-500 w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getColor(color)}`} style={{ width: `${value}%` }}></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 w-6 text-right">{value.toFixed(0)}</span>
        </div>
    )
}

export default DriverList;
