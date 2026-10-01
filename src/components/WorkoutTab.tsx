import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { ACTIVITIES, calculateCalories } from '../data/activities';
import { ActivityCategory, WorkoutLog } from '../types';
import {
  Dumbbell,
  Play,
  Square,
  Flame,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Trophy,
  Zap,
  Activity,
  Heart,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WorkoutTab: React.FC = () => {
  const { todayRecord, profile, logWorkout, deleteWorkoutLog } = useHealth();

  // Manual Log Form State
  const [selectedActivity, setSelectedActivity] = useState<ActivityCategory>('jalan_kaki');
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<'ringan' | 'sedang' | 'berat'>('sedang');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [steps, setSteps] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Live Workout Session State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveActivity, setLiveActivity] = useState<ActivityCategory>('jalan_kaki');

  useEffect(() => {
    let timer: any = null;
    if (isLiveActive) {
      timer = setInterval(() => {
        setLiveSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLiveActive]);

  const activeDef = ACTIVITIES.find((a) => a.type === selectedActivity) || ACTIVITIES[0];
  const liveDef = ACTIVITIES.find((a) => a.type === liveActivity) || ACTIVITIES[0];

  const estimatedCalories = calculateCalories(selectedActivity, duration, profile.weight, intensity);
  const liveMinutes = Math.max(1, Math.round(liveSeconds / 60));
  const liveCalories = calculateCalories(liveActivity, liveMinutes, profile.weight, 'sedang');

  const totalMins = todayRecord.totalWorkoutMinutes;
  const totalCals = todayRecord.totalCalories;
  const targetMins = profile.dailyWorkoutMinutesTarget || 30;
  const targetAchieved = totalMins >= targetMins;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logWorkout({
      activityType: selectedActivity,
      activityName: activeDef.name,
      durationMinutes: Number(duration),
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      steps: steps ? parseInt(steps, 10) : undefined,
      intensity,
      notes: notes || undefined,
    });

    if (totalMins + Number(duration) >= targetMins && totalMins < targetMins) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10b981', '#f59e0b', '#06b6d4'],
        });
      } catch (e) {
        // ignore
      }
    }

    setShowLogModal(false);
    setDistanceKm('');
    setSteps('');
    setNotes('');
  };

  const handleFinishLive = () => {
    if (liveMinutes > 0) {
      logWorkout({
        activityType: liveActivity,
        activityName: liveDef.name,
        durationMinutes: liveMinutes,
        intensity: 'sedang',
        notes: `Sesi live workout selesai (${liveMinutes} menit)`,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#ec4899'],
        });
      } catch (e) {
        // ignore
      }
    }
    setIsLiveActive(false);
    setLiveSeconds(0);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Banner: Today's Workout Summary */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900/50 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              Aktivitas Fisik & Olahraga
            </span>
            <h2 className="text-lg font-bold text-white">Latihan Hari Ini</h2>
          </div>

          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              targetAchieved
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {targetAchieved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target Tercapai!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Sisa {targetMins - totalMins} Menit</span>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">{totalMins}</span>
            <span className="text-[10px] text-slate-400">Menit Latihan</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">{totalCals}</span>
            <span className="text-[10px] text-slate-400">Kalori Terbakar</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-xl font-extrabold text-white block">
              {todayRecord.workoutLogs.length}
            </span>
            <span className="text-[10px] text-slate-400">Sesi Olahraga</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Catat Olahraga
          </button>
        </div>
      </div>

      {/* Live Workout Interactive Stopwatch Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sesi Olahraga Langsung</h3>
              <p className="text-[11px] text-slate-400">Nyalakan stopwatch sambil berolahraga sekarang</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col items-center">
          {/* Activity selector for live session */}
          {!isLiveActive && (
            <div className="w-full mb-3">
              <label className="text-[11px] text-slate-400 block mb-1">Pilih Jenis Olahraga:</label>
              <select
                value={liveActivity}
                onChange={(e) => setLiveActivity(e.target.value as ActivityCategory)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none"
              >
                {ACTIVITIES.map((act) => (
                  <option key={act.type} value={act.type}>
                    {act.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time Display */}
          <div className="text-4xl font-extrabold tracking-wider font-mono text-cyan-300 my-2">
            {formatTimer(liveSeconds)}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              {liveCalories} kcal
            </span>
            <span>·</span>
            <span className="text-slate-300 font-medium">{liveDef.name}</span>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isLiveActive ? (
              <button
                onClick={() => setIsLiveActive(true)}
                className="py-2 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 active:scale-95 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Mulai Sesi Olahraga
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsLiveActive(false)}
                  className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs active:scale-95 border border-amber-500/40 transition-all"
                >
                  Jeda (Pause)
                </button>
                <button
                  onClick={handleFinishLive}
                  className="py-2 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-slate-950" />
                  Selesai & Simpan
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Popular Sports & Physical Activities Catalog */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Pilihan Cabang Olahraga & Manfaatnya
          </h3>
          <span className="text-[11px] text-slate-400">Ketuk untuk catat cepat</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ACTIVITIES.map((item) => {
            const isSelected = selectedActivity === item.type;
            const calBurn = calculateCalories(item.type, 30, profile.weight, 'sedang');

            return (
              <button
                key={item.type}
                onClick={() => {
                  setSelectedActivity(item.type);
                  setShowLogModal(true);
                }}
                className={`p-3 rounded-xl border text-left transition-all group active:scale-95 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                  <span className="text-slate-500">30 menit:</span>
                  <span className="font-bold text-rose-400 flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    ~{calBurn} kcal
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Workout Logs List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Riwayat Olahraga Hari Ini</h3>
          </div>
          <span className="text-xs text-slate-400">
            {todayRecord.workoutLogs.length} aktivitas ({totalMins} menit)
          </span>
        </div>

        {todayRecord.workoutLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Belum ada olahraga yang dicatat hari ini. Yuk mulai dengan jalan santai atau senam ringan!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto pr-1">
            {todayRecord.workoutLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs flex-shrink-0">
                    🏃
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{log.activityName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 font-medium">
                        {log.durationMinutes} menit
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="text-rose-400 font-semibold">{log.caloriesBurned} kcal</span>
                      {log.distanceKm && <span>· {log.distanceKm} km</span>}
                      {log.steps && <span>· {(log.steps ?? 0).toLocaleString()} langkah</span>}
                      <span>· Jam {log.time}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteWorkoutLog(log.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Hapus aktivitas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Workout Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              Catat Sesi Olahraga
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pilih aktivitas dan durasi yang telah Anda selesaikan.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Jenis Olahraga
                </label>
                <select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value as ActivityCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {ACTIVITIES.map((act) => (
                    <option key={act.type} value={act.type}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">Durasi (Menit)</label>
                  <span className="text-xs font-bold text-emerald-400">{duration} menit</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[15, 30, 45, 60].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setDuration(preset)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border ${
                        duration === preset
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Intensitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ringan', 'sedang', 'berat'] as const).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setIntensity(lvl)}
                      className={`py-1.5 rounded-lg text-xs capitalize border transition-all ${
                        intensity === lvl
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Jarak (km) <span className="text-[10px] text-slate-500">opsional</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Contoh: 2.5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Langkah <span className="text-[10px] text-slate-500">opsional</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 3500"
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Calorie Preview Card */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs text-slate-300">Estimasi Pembakaran:</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-rose-400" />
                  ~{estimatedCalories} kcal
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Simpan Olahraga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
