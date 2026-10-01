import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  User,
  Phone,
  Scale,
  Ruler,
  Droplets,
  Dumbbell,
  X,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  UserPlus,
  Edit3,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    profile,
    updateProfile,
    createNewAccount,
    resetAllDataToZero,
    supabaseStatus,
    isAdmin,
    setIsAdminModalOpen,
    setIsAdminLoginModalOpen,
    logoutAdmin,
  } = useHealth();

  // Mode: 'register' (buat akun baru & reset ke 0) vs 'edit' (ubah profil saja)
  const [mode, setMode] = useState<'register' | 'edit'>('register');

  const [name, setName] = useState(mode === 'register' ? '' : profile.name || '');
  const [phone, setPhone] = useState(mode === 'register' ? '' : profile.phone || '');
  const [age, setAge] = useState(profile.age || 25);
  const [gender, setGender] = useState<'pria' | 'wanita'>(profile.gender || 'pria');
  const [weight, setWeight] = useState(profile.weight || 60);
  const [height, setHeight] = useState(profile.height || 165);
  const [targetWaterMl, setTargetWaterMl] = useState(profile.targetWaterMl || 2500);
  const [dailyWorkoutTarget, setDailyWorkoutTarget] = useState(profile.dailyWorkoutMinutesTarget || 30);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleWeightChange = (newWeight: number) => {
    setWeight(newWeight);
    const suggested = Math.round((newWeight * 35) / 100) * 100;
    setTargetWaterMl(suggested);
  };

  const handleModeChange = (newMode: 'register' | 'edit') => {
    setMode(newMode);
    if (newMode === 'register') {
      setName('');
      setPhone('');
    } else {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAge(profile.age || 26);
      setWeight(profile.weight || 64);
      setHeight(profile.height || 170);
      setTargetWaterMl(profile.targetWaterMl || 2500);
      setDailyWorkoutTarget(profile.dailyWorkoutMinutesTarget || 30);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'register') {
      // Buat akun baru & reset semua data ke 0
      await createNewAccount({
        name: name.trim(),
        phone: phone.trim(),
        age: Number(age),
        gender,
        weight: Number(weight),
        height: Number(height),
        targetWaterMl: Number(targetWaterMl),
        dailyWorkoutMinutesTarget: Number(dailyWorkoutTarget),
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (err) {
        // ignore
      }
    } else {
      // Hanya perbarui profil tanpa reset riwayat
      updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        age: Number(age),
        gender,
        weight: Number(weight),
        height: Number(height),
        targetWaterMl: Number(targetWaterMl),
        dailyWorkoutMinutesTarget: Number(dailyWorkoutTarget),
      });
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1000);
  };

  const handleManualReset = async () => {
    await resetAllDataToZero();
    setShowResetConfirm(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[2px] mx-auto mb-2.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300 font-extrabold text-lg">
              {name ? name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
          </div>
          <h2 className="text-base font-extrabold text-white">
            {mode === 'register' ? 'Buat Akun Baru (Mulai dari Nol)' : 'Pengaturan Profil Pengguna'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'register'
              ? 'Mulai perjalanan hidup sehat Anda dengan riwayat bersih dari 0.'
              : 'Perbarui data berat, tinggi, atau target hidrasi Anda.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Buat Akun Baru</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('edit')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              mode === 'edit'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Ubah Profil</span>
          </button>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Database Cloud:</span>
          {supabaseStatus?.connected ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase Terhubung (Sinkron Otomatis)
            </span>
          ) : (
            <span className="text-amber-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Belum Terhubung ke Supabase
            </span>
          )}
        </div>

        {/* Notice for New Account */}
        {mode === 'register' && (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-slate-300 mb-4 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong className="text-white font-semibold">Mulai dari Nol (0):</strong> Saat Anda membuat akun baru, semua riwayat minum air, log olahraga, dan catatan demo lama akan otomatis <strong>direset ke 0 ml & 0 menit</strong> agar Anda dapat mulai mencatat aktivitas asli Anda.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Nama Lengkap */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Nama Lengkap Anda <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Contoh: Rian Pratama..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Nomor Handphone */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Nomor Handphone / WhatsApp
            </label>
            <div className="relative">
              <input
                type="tel"
                placeholder="Contoh: 0812-3456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Jenis Kelamin & Usia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setGender('pria')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    gender === 'pria'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pria
                </button>
                <button
                  type="button"
                  onClick={() => setGender('wanita')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    gender === 'wanita'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wanita
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Usia (Tahun)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Berat Badan & Tinggi Badan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                Berat Badan (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                value={weight}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                Tinggi Badan (cm)
              </label>
              <input
                type="number"
                min="100"
                max="240"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Harian Minum & Target Olahraga */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                Target Air (ml)
              </label>
              <input
                type="number"
                min="1000"
                max="5000"
                step="100"
                value={targetWaterMl}
                onChange={(e) => setTargetWaterMl(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                Target Olahraga (Mnt)
              </label>
              <input
                type="number"
                min="10"
                max="180"
                step="5"
                value={dailyWorkoutTarget}
                onChange={(e) => setDailyWorkoutTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-cyan-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-emerald-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {mode === 'register'
                      ? 'Akun Dibuat & Riwayat Direset ke 0!'
                      : 'Data Profil Berhasil Disimpan!'}
                  </span>
                </>
              ) : mode === 'register' ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Akun & Mulai dari Nol (0)</span>
                </>
              ) : (
                <span>Simpan Perubahan Profil</span>
              )}
            </button>
          </div>
        </form>

        {/* Reset Data Manual Section (Jika Pengguna Ingin Reset Mandiri) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Riwayat ke 0 (Mulai Ulang)</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Konfirmasi Reset Riwayat ke 0?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tindakan ini akan mengosongkan semua riwayat minum air, log olahraga, dan catatan kesehatan menjadi 0 ml & 0 menit.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualReset}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-colors"
                >
                  Ya, Reset ke 0
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Administrator Portal Switch */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          {!isAdmin ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsAdminLoginModalOpen(true);
                }}
                className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-800/60"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk sebagai Administrator</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Mode Admin Aktif</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsAdminModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black hover:brightness-110 active:scale-95 transition-all"
                >
                  Buka Admin Panel
                </button>
                <button
                  type="button"
                  onClick={() => logoutAdmin()}
                  className="px-2 py-1 rounded-xl bg-slate-800 text-rose-300 text-[11px] font-semibold hover:bg-slate-700 transition-all"
                >
                  Keluar Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
