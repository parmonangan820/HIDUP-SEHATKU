import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { User, Phone, Scale, Ruler, Droplets, Dumbbell, X, Check, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useHealth();

  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [age, setAge] = useState(profile.age || 26);
  const [gender, setGender] = useState<'pria' | 'wanita'>(profile.gender || 'pria');
  const [weight, setWeight] = useState(profile.weight || 64);
  const [height, setHeight] = useState(profile.height || 170);
  const [targetWaterMl, setTargetWaterMl] = useState(profile.targetWaterMl || 2500);
  const [dailyWorkoutTarget, setDailyWorkoutTarget] = useState(profile.dailyWorkoutMinutesTarget || 30);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Auto-calculate suggested water if weight changes
  const handleWeightChange = (newWeight: number) => {
    setWeight(newWeight);
    const suggested = Math.round((newWeight * 35) / 100) * 100;
    setTargetWaterMl(suggested);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      age: Number(age),
      gender,
      weight: Number(weight),
      height: Number(height),
      targetWaterMl: Number(targetWaterMl),
      dailyWorkoutMinutesTarget: Number(dailyWorkoutTarget),
      isRegistered: true,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[2px] mx-auto mb-3 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-cyan-300 font-extrabold text-xl">
              {name ? name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>
          </div>
          <h2 className="text-lg font-bold text-white">Profil & Pendaftaran Pengguna</h2>
          <p className="text-xs text-slate-400 mt-1">
            Data pribadi Anda digunakan untuk menyesuaikan target hidrasi dan evaluasi AI kesehatan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama Lengkap */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Nama Lengkap <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Masukkan nama Anda..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Nomor Handphone */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Nomor Handphone / WhatsApp <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="Contoh: 0812-3456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Jenis Kelamin & Usia */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setGender('pria')}
                  className={`py-1 rounded-lg font-bold transition-all ${
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
                  className={`py-1 rounded-lg font-bold transition-all ${
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-500 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-500 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Harian Minum & Target Olahraga */}
          <div className="grid grid-cols-2 gap-3 pt-1">
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-cyan-300 focus:border-cyan-500 focus:outline-none"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-cyan-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Data Berhasil Disimpan!</span>
                </>
              ) : (
                <span>Simpan & Perbarui Profil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
