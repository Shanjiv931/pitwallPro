
import React from 'react';
import { Mail, Copy, Check, ChevronLeft, ShieldAlert } from 'lucide-react';

interface ContactAdminProps {
  onBack: () => void;
}

const ContactAdmin: React.FC<ContactAdminProps> = ({ onBack }) => {
  const [copied, setCopied] = React.useState(false);
  const email = "shanjivkr931@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50"></div>

      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 relative z-10 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 text-neutral-500 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest"
        >
            <ChevronLeft size={14} /> Back
        </button>

        <div className="text-center mt-8 mb-8">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-700 shadow-inner">
                <ShieldAlert className="text-red-500" size={32} />
            </div>
            <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">
                System Support
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed px-4">
                For account issues, permission requests, or technical support, please contact the system administrator directly.
            </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-6 relative group hover:border-red-600/50 transition-colors">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail size={12} /> Admin Email
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-lg font-mono text-white font-bold truncate select-all">
                    {email}
                </span>
                <button 
                    onClick={handleCopy}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-400 hover:text-white transition-all"
                    title="Copy Email"
                >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
            </div>
        </div>

        <div className="mt-8 flex justify-center">
            <a 
                href={`mailto:${email}`}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 font-black uppercase tracking-widest skew-box transition-all text-sm inline-block"
            >
                <span className="unskew flex items-center gap-2">
                    Open Mail Client
                </span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default ContactAdmin;
