
import React, { useEffect, useState } from 'react';
import { supabase, signOut } from '../services/supabaseClient';
import { getAllDrivers, deleteUserAccount } from '../services/driverService';
import { Driver } from '../types';
import { User, AlertOctagon, Trash2, ChevronLeft, Shield, Mail, Car, Loader2, X } from 'lucide-react';

interface UserProfileProps {
  onBack: () => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack, onLogout, onAccountDeleted }) => {
  const [user, setUser] = useState<any>(null);
  const [userDrivers, setUserDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const allDrivers = await getAllDrivers();
          const myDrivers = allDrivers.filter(d => d.userId === user.id);
          setUserDrivers(myDrivers);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      // Notify parent to handle clean redirect to Registration
      onAccountDeleted();
    } catch (e: any) {
      alert(`Error deleting account: ${e.message}`);
      setIsDeleting(false);
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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6 relative overflow-hidden">
        {/* Background FX */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Delete Modal */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-neutral-900 border-2 border-red-600 p-8 max-w-lg w-full shadow-[0_0_50px_rgba(220,38,38,0.3)] relative">
                    <button 
                        onClick={() => setShowDeleteModal(false)} 
                        className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center mb-6">
                        <AlertOctagon size={48} className="text-red-500 mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Warning: Irreversible Action</h2>
                    </div>
                    
                    <p className="text-neutral-300 text-sm mb-6 leading-relaxed bg-red-900/10 p-4 border border-red-900/30 rounded">
                        You are about to permanently delete your profile. This action cannot be undone.
                        <br/><br/>
                        <span className="font-bold text-red-500 block mb-2">The following data will be erased immediately:</span>
                        <ul className="list-disc list-inside text-neutral-400">
                            <li>Your user profile settings</li>
                            <li>{userDrivers.length} Custom Driver{userDrivers.length !== 1 ? 's' : ''} you created</li>
                            <li>All historical simulation records</li>
                        </ul>
                    </p>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 font-bold uppercase tracking-widest border border-neutral-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 font-black uppercase tracking-widest skew-box transition-all"
                        >
                            <span className="unskew flex items-center justify-center gap-2">
                                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={16} />}
                                Confirm Deletion
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-4xl mx-auto relative z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-neutral-900 hover:bg-neutral-800 p-2 border border-neutral-700 transition-colors">
                        <ChevronLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">My Profile</h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Account & Data Management</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-neutral-900 border-t-4 border-neutral-700 p-6 shadow-xl">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-700">
                                <User size={40} className="text-neutral-400" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                                    <Mail size={12} /> Email Address
                                </label>
                                <div className="text-white font-mono text-sm break-all">{user?.email}</div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                                    <Shield size={12} /> Account ID
                                </label>
                                <div className="text-neutral-500 font-mono text-[10px]">{user?.id}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-900/10 border border-red-900/30 p-6">
                        <h3 className="text-red-500 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                            <AlertOctagon size={14} /> Danger Zone
                        </h3>
                        <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
                            Deleting your account removes all data. This cannot be recovered.
                        </p>
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Delete Profile
                        </button>
                    </div>
                </div>

                {/* Content Stats */}
                <div className="md:col-span-2">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 h-full">
                        <h3 className="text-white font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Car size={18} className="text-red-600" /> Your Garage
                        </h3>

                        {userDrivers.length === 0 ? (
                            <div className="text-center py-12 text-neutral-600">
                                <div className="mb-2">No custom drivers created yet.</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {userDrivers.map(d => (
                                    <div key={d.id} className="bg-neutral-950 p-4 border border-neutral-800 flex justify-between items-center group hover:border-neutral-600 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1 h-8 skew-box" style={{backgroundColor: d.color}}></div>
                                            <div>
                                                <div className="text-white font-bold uppercase">{d.name}</div>
                                                <div className="text-neutral-500 text-[10px] font-bold uppercase">{d.team} | #{d.number}</div>
                                            </div>
                                        </div>
                                        <div className="text-neutral-600 text-xs font-mono group-hover:text-neutral-400">
                                            PACE: {((1-d.basePace)*100).toFixed(0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-6 pt-6 border-t border-neutral-800">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-neutral-500 font-bold uppercase">Total Database Entries</span>
                                <span className="text-white font-mono font-bold">{userDrivers.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfile;
