import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { signInWithSupabase } from '../services/supabaseService';
import {
  LogIn,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccountSwitchModalProps {
  onOpenRegister: () => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({ onOpenRegister }) => {
  const {
    isAccountModalOpen,
    setIsAccountModalOpen,
    loginWithAccount,
  } = useHealth();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isAccountModalOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setFeedback({ type: 'error', message: 'Email dan password wajib diisi.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      // 1. Coba autentikasi resmi Supabase Auth
      const authRes = await signInWithSupabase(cleanEmail, cleanPassword);

      // 2. Ambil profil & riwayat pengguna dari Supabase
      const loginRes = await loginWithAccount({ identifier: cleanEmail });

      if (authRes.success || loginRes.success) {
        setFeedback({
          type: 'success',
          message: loginRes.message || 'Login berhasil! Selamat datang kembali.',
        });

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }

        setTimeout(() => {
          setIsAccountModalOpen(false);
          setFeedback(null);
          setPassword('');
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          message: authRes.message || loginRes.message || 'Email atau password salah. Pastikan akun sudah terdaftar.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat memproses login.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setFeedback({ type: 'error', message: 'Nomor telepon wajib diisi.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await loginWithAccount({ identifier: cleanPhone });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Login berhasil! Selamat datang kembali.',
        });

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore
        }

        setTimeout(() => {
          setIsAccountModalOpen(false);
          setFeedback(null);
          setPassword('');
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Akun dengan nomor HP tersebut tidak ditemukan di Supabase. Silakan daftar baru.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Gagal masuk dengan nomor telepon.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl relative flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsAccountModalOpen(false);
            setFeedback(null);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300">
              <LogIn className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">Masuk ke Akun</h3>
            <p className="text-xs text-slate-400">
              Masukkan kredensial akun terdaftar Anda untuk memuat profil kesehatan.
            </p>
          </div>
        </div>

        {/* Privacy & Security Notice Banner */}
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/20 mb-4 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-bold text-white">Privasi Akun Terlindungi: </span>
            Daftar akun pengguna tersimpan aman di database Supabase dan tidak dimunculkan ke publik agar akun Anda tidak dapat diakses orang lain.
          </div>
        </div>

        {/* Tab Switcher: Email vs Phone */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMethod('email');
              setFeedback(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'email'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod('phone');
              setFeedback(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              loginMethod === 'phone'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Nomor Telepon</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs mb-3 flex items-start gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/50 border border-rose-500/30 text-rose-300'
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

        {/* Content / Login Forms */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-4">
          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Akun Terdaftar <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="namaanda@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Password Login <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Kredensial Anda dienkripsi secara aman melalui Supabase Auth.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi Akun di Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor HP / WhatsApp Terdaftar <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 085760525942"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Masukkan nomor telepon yang digunakan saat mendaftar akun di aplikasi ini.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari Profil di Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Masuk dengan Nomor HP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Action to Register New Account */}
          <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Belum memiliki akun kesehatan terdaftar?
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAccountModalOpen(false);
                onOpenRegister();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Buat Akun Baru Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginModal = AccountSwitchModal;
