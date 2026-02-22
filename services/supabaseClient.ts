
import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const supabaseUrl = 'https://mrrgieokpdjtxztticzv.supabase.co';
const supabaseAnonKey = 'sb_publishable_gHKCKge-ofOUlTRN50SK9w_DKQO7kfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signOut = async () => {
    await supabase.auth.signOut();
};
