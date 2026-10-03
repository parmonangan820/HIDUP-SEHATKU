import React from 'react';
import { useHealth } from '../context/HealthContext';
import { NavTab } from './BottomNav';
import {
  Droplets,
  Dumbbell,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  Heart,
  TrendingUp,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  BookOpen,
  Mic,
  Calendar,
  Bell,
  BellRing,
  Salad,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HomeTabProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenAiChat: () => void;
  onOpenProfile: () => void;
  onOpenVoiceDrink: () => void;
  onOpenDietTips: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  setActiveTab,
  onOpenAiChat,
  onOpenProfile,
  onOpenVoiceDrink,
  onOpenDietTips,
}) => {
  const {
    profile,
    todayRecord,
    todayWaterByPeriod,
    aiAnalysis,
    logWater,
    logWorkout,
    weeklySummary,
    notes,
    alarms,
    selectedDate,
    isPro,
  } = useHealth();

  const totalWater = todayRecord.totalWaterMl;
  const targetWater = profile.targetWaterMl;
  const waterPercent = Math.min(100, Math.round((totalWater / targetWater) * 100));

  const totalWorkoutMins = todayRecord.totalWorkoutMinutes;
  const targetWorkoutMins = profile.dailyWorkoutMinutesTarget;
  const workoutPercent = Math.min(100, Math.round((totalWorkoutMins / targetWorkoutMins) * 100));

  const handleQuickAddWater = () => {
    logWater(250, 'gelas');
    if (totalWater + 250 >= targetWater && totalWater < targetWater) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleQuickAddWalk = () => {
    logWorkout({
      activityType: 'jalan_kaki',
      activityName: 'Jalan Kaki',
      durationMinutes: 20,
      intensity: 'sedang',
      notes: 'Jalan cepat singkat di sekitar rumah',
    });
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-900/60 via-slate-900 to-emerald-900/50 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Aplikasi Hidup Sehatku
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {profile.phone ? profile.phone : '0812-xxxx-xxxx'}
          </span>
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">
          Tetap Terhidrasi & Aktif, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            {profile.name || 'Sahabat Sehat'}!
          </span>
        </h2>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-sm">
          Pantau asupan air putih dari pagi hingga malam, dan seimbangkan dengan aktivitas olahraga
          teratur untuk tubuh sehat dan bugar.
        </p>

        {/* AI Health Classification Mini Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-medium block">
              Golongan Sehat AI Anda:
            </span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300 truncate block">
              {aiAnalysis?.category || 'Ksatria Hidup Sehat'}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('stats')}
            className="flex-shrink-0 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>Detail AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero "Tombol Minum & Suara AI" Feature Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-xl shadow-cyan-500/20">
        <div className="rounded-2xl bg-slate-900/95 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenVoiceDrink}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-transform"
              title="Ketuk untuk bicara / memilih takaran minum"
            >
              <Mic className="w-6 h-6 stroke-[2.5] animate-pulse" />
            </button>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                <span>Tombol Minum Suara AI</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                Ucapkan: "Minum 100 ml", "Minum satu gelas", "Minum dua gelas", dll.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenVoiceDrink}
            className="flex-shrink-0 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
          >
            Catat Minum
          </button>
        </div>
      </div>

      {/* AI Health Scanner & Chat Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-[1px] shadow-xl shadow-amber-500/15">
        <div className="rounded-2xl bg-slate-900/95 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenAiChat}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform"
              title="Ketuk untuk scan foto makanan atau konsultasi Dokter AI"
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                <span>AI Health Scanner & Chat</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black">
                  PRO UNLOCKED
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 truncate">
                Analisis kalori & nutrisi foto makanan + Konsultasi Dokter AI
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAiChat}
            className="flex-shrink-0 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            Pindai / Tanya AI
          </button>
        </div>
      </div>

      {/* Tips Diet Sukses ala Dokter AI Feature Banner (Eksklusif PRO) */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-[1px] shadow-xl shadow-emerald-500/15">
        <div className="rounded-2xl bg-slate-900/95 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenDietTips}
              className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 flex-shrink-0 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-transform"
              title="Buka panduan Tips Diet Sukses ala Dokter AI"
            >
              <Salad className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                  <span>Tips Diet Sukses Dokter AI</span>
                </h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 font-black flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 fill-current" />
                  <span>{isPro ? 'PRO UNLOCKED' : 'PRO'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Target kalori ilmiah, menu harian nusantara & protokol hidrasi bakar lemak
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDietTips}
            className="flex-shrink-0 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1"
          >
            <span>{isPro ? 'Buka Diet' : 'Akses PRO'}</span>
            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Main Dual Cards: Water Tracker & Workout Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* WATER CARD */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/20 p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Minum Air Putih</h3>
                  <span className="text-[10px] text-slate-400">Target: {targetWater} ml</span>
                </div>
              </div>

              <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                {waterPercent}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-baseline text-xs mb-3">
              <span className="text-slate-400">Tercatat Hari Ini:</span>
              <span className="text-base font-extrabold text-white">
                {(totalWater ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ml</span>
              </span>
            </div>

            {/* Time of day mini dots */}
            <div className="grid grid-cols-4 gap-1 text-center py-2 border-t border-slate-800/80">
              <div className="bg-slate-900/90 p-1 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Pagi</span>
                <span className="text-[10px] font-bold text-white">{todayWaterByPeriod.morning}ml</span>
              </div>
              <div className="bg-slate-900/90 p-1 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Siang</span>
                <span className="text-[10px] font-bold text-white">{todayWaterByPeriod.afternoon}ml</span>
              </div>
              <div className="bg-slate-900/90 p-1 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Sore</span>
                <span className="text-[10px] font-bold text-white">{todayWaterByPeriod.evening}ml</span>
              </div>
              <div className="bg-slate-900/90 p-1 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Malam</span>
                <span className="text-[10px] font-bold text-white">{todayWaterByPeriod.night}ml</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-2">
            <button
              onClick={handleQuickAddWater}
              className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              +250 ml
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Detail
            </button>
          </div>
        </div>

        {/* WORKOUT CARD */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/20 p-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Aktivitas Olahraga</h3>
                  <span className="text-[10px] text-slate-400">Target: {targetWorkoutMins} menit</span>
                </div>
              </div>

              <span className="text-xs font-black text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {workoutPercent}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${workoutPercent}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-baseline text-xs mb-3">
              <span className="text-slate-400">Waktu Latihan:</span>
              <span className="text-base font-extrabold text-white">
                {totalWorkoutMins} <span className="text-xs font-normal text-slate-400">menit</span>
              </span>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 text-center py-2 border-t border-slate-800/80">
              <div className="bg-slate-900/90 p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-bold text-white">{todayRecord.totalCalories} kcal</span>
              </div>
              <div className="bg-slate-900/90 p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {todayRecord.workoutLogs.length} sesi
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-2">
            <button
              onClick={handleQuickAddWalk}
              className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              +20m Jalan Kaki
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Detail
            </button>
          </div>
        </div>
      </div>

      {/* Widget Catatan Hari Ini & Alarm Pengingat */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/30 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Catatan & Alarm Hari Ini</span>
              </h3>
              <span className="text-[10px] text-slate-400">Jurnal kondisi tubuh & jadwal pengingat</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('notes')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>Buka</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Latest note preview */}
        {notes.filter((n) => n.date === selectedDate).length > 0 ? (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white truncate mr-2">
                {notes.filter((n) => n.date === selectedDate)[0].title}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {notes.filter((n) => n.date === selectedDate)[0].time}
              </span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {notes.filter((n) => n.date === selectedDate)[0].content}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 mb-3 text-center">
            <p className="text-xs text-slate-400 mb-1.5">Belum ada catatan kesehatan hari ini</p>
            <button
              onClick={() => setActiveTab('notes')}
              className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors"
            >
              + Tulis Catatan Hari Ini
            </button>
          </div>
        )}

        {/* Next Alarm & Action */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-xs text-slate-300 truncate">
              {alarms.find((a) => a.isActive) ? (
                <>
                  Alarm Aktif: <strong className="text-amber-400">{alarms.find((a) => a.isActive)?.time}</strong> - {alarms.find((a) => a.isActive)?.label}
                </>
              ) : (
                'Tidak ada alarm aktif'
              )}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('notes')}
            className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Atur Alarm
          </button>
        </div>
      </div>

      {/* Daily Health Habits Checklist */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Checklist Kebiasaan Sehat Hari Ini</h3>
          </div>
          <span className="text-xs text-slate-400">Pola Hidup Prima</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            {todayWaterByPeriod.morning >= 400 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
            <span className={todayWaterByPeriod.morning >= 400 ? 'text-slate-200' : 'text-slate-400'}>
              Minum 1-2 gelas air hangat segera setelah bangun pagi (min. 400 ml)
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            {totalWorkoutMins >= 20 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
            <span className={totalWorkoutMins >= 20 ? 'text-slate-200' : 'text-slate-400'}>
              Olahraga minimal 20-30 menit (Jalan kaki / Jogging / Badminton / Senam)
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            {todayWaterByPeriod.afternoon >= 500 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
            <span className={todayWaterByPeriod.afternoon >= 500 ? 'text-slate-200' : 'text-slate-400'}>
              Jaga hidrasi siang hari di ruang kerja atau saat beraktivitas (min. 500 ml)
            </span>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            {totalWater >= targetWater ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
            <span className={totalWater >= targetWater ? 'text-slate-200' : 'text-slate-400'}>
              Mencapai target harian air putih ({targetWater} ml)
            </span>
          </div>
        </div>
      </div>

      {/* Featured Educational Article Teaser */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Panduan Hidup Sehat
          </span>
          <button
            onClick={() => setActiveTab('education')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
          >
            Semua Artikel
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <h4 className="text-sm font-bold text-white mb-1">
          Ketahui Khasiat Luar Biasa Hidrasi Teratur bagi Organ Tubuh & Otak
        </h4>
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          Kekurangan cairan 1-2% saja menurunkan konsentrasi dan memperlambat pembakaran lemak. Pelajari
          jadwal ideal minum 8 gelas sehari dan waktu terbaiknya!
        </p>

        <button
          onClick={() => setActiveTab('education')}
          className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          Baca Edukasi & Manfaat Lengkap
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
