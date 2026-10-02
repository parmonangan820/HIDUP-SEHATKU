import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  KeyRound,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const {
    isAdmin,
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    loginAsAdmin,
  } = useHealth();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAdminLoginModalOpen || !isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Masukkan PIN Admin terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await loginAsAdmin(pin.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setPin('');
    }
  };

  const handleQuickFill = (presetPin: string) => {
    setPin(presetPin);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <button
          onClick={() => {
            setIsAdminLoginModalOpen(false);
            setErrorMsg(null);
            setPin('');
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[2px] mx-auto mb-3 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Autentikasi Panel Administrator
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan PIN Otoritas Admin untuk mengakses manajemen pengguna dan metrik sistem.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs text-center mb-4 animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              PIN Keamanan Admin
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                required
                maxLength={10}
                placeholder="Masukkan 4 angka PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-lg tracking-widest focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>PIN Admin Canggih Marbun:</span>
              <button
                type="button"
                onClick={() => handleQuickFill('060319')}
                className="text-amber-400 font-mono font-bold hover:underline"
              >
                060319
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk sebagai Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500">
            Akses ini dibatasi hanya untuk pengelola sistem Hidup Sehatku.
          </p>
        </div>
      </div>
    </div>
  );
};
