
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Activity, Mail, Lock, ChevronRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, initialMode = 'LOGIN' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Update internal state if prop changes
  useEffect(() => {
    setIsLogin(initialMode === 'LOGIN');
  }, [initialMode]);

  const validate = () => {
    if (!email.includes('@') || !email.includes('.')) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!validate()) return;
    if (!supabase) {
        setError("Supabase client not initialized. Check environment variables.");
        return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        
        // 1. Check if user exists (by email)
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !users) {
            // Email not found
            setError("Credentials not found.");
            setIsLoading(false);
            return;
        }

        // 2. Email exists, try login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
           if (error.message.includes("Invalid login")) {
              // We know email exists, so must be password
              setError("Incorrect password.");
           } else if (error.message.includes("Email not confirmed")) {
              setError("Email pending verification. Check your inbox or Supabase dashboard.");
           } else {
              throw error;
           }
        } else {
            onAuthSuccess();
        }
      } else {
        // REGISTRATION FLOW
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    password_copy: password 
                }
            }
        });
        
        if (error) throw error;

        // Attempt to save password via client-side if trigger didn't catch it or just to be sure
        // We need a session to update the profile due to RLS
        let activeSession = data.session;
        
        if (!activeSession && data.user) {
            // Try to sign in to get a session (since our trigger auto-confirms email)
            const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
            activeSession = signInData.session;
        }

        if (activeSession && data.user) {
             await supabase.from('profiles').update({ password: password }).eq('id', data.user.id);
        }

        // If session exists (Email confirm disabled or auto-confirmed by trigger), log them in
        if (activeSession) {
            onAuthSuccess();
            return;
        }

        // If no session (Email confirm enabled and trigger failed), fallback to prompt
        setIsLogin(true);
        setMessage("Account created. Please verify email to continue.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-neutral-900 border-t-4 border-red-600 shadow-2xl relative z-10 p-8">
         <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
                <Activity className="text-red-600 h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">
              PitWall<span className="text-red-600">.PRO</span>
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">
               Strategy Intelligence System
            </p>
         </div>

         <form onSubmit={handleAuth} className="space-y-6">
            {error && (
                <div className="bg-red-900/20 border border-red-800 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-red-200 text-xs font-mono">{error}</p>
                </div>
            )}
            
            {message && (
                <div className="bg-green-900/20 border border-green-800 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                    <p className="text-green-200 text-xs font-mono">{message}</p>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Email Access
                </label>
                <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-bold outline-none focus:border-red-600 transition-colors"
                    placeholder="name@email.com"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Secure Key
                </label>
                <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white p-3 text-sm font-bold outline-none focus:border-red-600 transition-colors"
                    placeholder="••••••••"
                />
                <p className="text-[10px] text-neutral-600 text-right">Min. 8 Characters</p>
            </div>

            <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic uppercase tracking-widest py-4 skew-box transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="unskew flex items-center justify-center gap-2 relative z-10">
                    {isLoading ? <Loader2 className="animate-spin" /> : (
                        <>{isLogin ? 'Initialize Session' : 'Create Credentials'} <ChevronRight size={16} /></>
                    )}
                </span>
                {/* Hover shine */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine skew-x-12"></div>
            </button>
         </form>

         <div className="mt-8 text-center border-t border-neutral-800 pt-6">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wide mb-3">
                {isLogin ? "No credentials found?" : "Already have access?"}
            </p>
            <button 
                onClick={() => { setError(null); setMessage(null); setIsLogin(!isLogin); }}
                className="text-white hover:text-red-500 text-xs font-black uppercase tracking-widest underline transition-colors"
            >
                {isLogin ? "Register New Team" : "Login to Console"}
            </button>
         </div>
      </div>
    </div>
  );
};

export default AuthScreen;
