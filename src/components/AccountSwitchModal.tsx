import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { AccountSummary } from '../services/accountService';
import {
  Users,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Phone,
  Droplets,
  Flame,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccountSwitchModalProps {
  onOpenRegister: () => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({ onOpenRegister }) => {
  const {
    profile,
    isAccountModalOpen,
    setIsAccountModalOpen,
    registeredAccounts,
    loadRegisteredAccounts,
    switchAccount,
    loginWithAccount,
    logoutAccount,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<'switch' | 'login'>('switch');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isAccountModalOpen) return null;

  const handleSelectAccount = async (acc: AccountSummary) => {
    if (acc.id === profile.id) {
      setFeedback({ type: 'success', message: 'Anda sudah berada di akun ini.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    const res = await switchAccount(acc);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', message: `Berhasil beralih ke akun ${acc.name}!` });
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        setIsAccountModalOpen(false);
      }, 700);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setFeedback(null);
    const res = await loginWithAccount({ identifier: identifier.trim() });
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        setIsAccountModalOpen(false);
      }, 700);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const filteredAccounts = registeredAccounts.filter((acc) => {
    const q = searchQuery.toLowerCase();
    return acc.name.toLowerCase().includes(q) || acc.phone.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsAccountModalOpen(false);
            setFeedback(null);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Ganti Akun & Masuk</h3>
            <p className="text-xs text-slate-400">
              Pilih akun yang sudah terdaftar atau masuk dengan nomor telepon
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('switch')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'switch'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pilih Akun ({registeredAccounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk No. HP / Nama</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs mb-3 flex items-start gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-[11px] leading-relaxed flex-1">{feedback.message}</p>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* TAB 1: SWITCH AKUN DARI DAFTAR */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              {/* Search filter if more than 3 accounts */}
              {registeredAccounts.length > 3 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari akun..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              )}

              {registeredAccounts.length === 0 ? (
                <div className="text-center py-8 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-300">Belum ada akun lain di database</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Buat akun baru untuk memulai profil kesehatan terpisah.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAccounts.map((acc) => {
                    const isCurrent = acc.id === profile.id || (!profile.id && acc.name === profile.name);

                    return (
                      <div
                        key={acc.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-cyan-950/30 border-cyan-500/40 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-2xl bg-slate-900 border border-slate-750 flex items-center justify-center text-cyan-300 font-extrabold text-sm flex-shrink-0">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {acc.phone && acc.phone !== '-' && (
                                <span className="font-mono">{acc.phone}</span>
                              )}
                              <span>•</span>
                              <span className="text-cyan-400 font-medium">{acc.targetWaterMl} ml</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">{acc.dailyWorkoutMinutesTarget} mnt</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span className="text-[11px] text-cyan-400 font-bold px-2 py-1 rounded-lg bg-cyan-500/10">
                              ✓ Sedang Digunakan
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectAccount(acc)}
                              disabled={loading}
                              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                            >
                              <span>Pilih</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons: Buat Akun Baru / Muat Ulang */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    onOpenRegister();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Buat Akun Baru</span>
                </button>

                <button
                  type="button"
                  onClick={loadRegisteredAccounts}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  title="Muat Ulang Akun"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FORM MASUK / LOGIN DENGAN IDENTIFIER */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 p-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor HP atau Nama Akun Terdaftar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 08123456789 atau Budi"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Masukkan nomor telepon atau nama akun yang sebelumnya pernah didaftarkan.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari Akun di Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    onOpenRegister();
                  }}
                  className="text-xs text-cyan-400 hover:underline font-semibold"
                >
                  Belum punya akun? Buat Akun Baru
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
