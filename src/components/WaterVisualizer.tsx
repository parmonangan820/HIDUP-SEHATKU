import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { Droplet, Plus, Sparkles, CheckCircle2, AlertCircle, Clock, Mic } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WaterVisualizerProps {
  onOpenCustomLog?: () => void;
  onOpenVoiceDrink?: () => void;
}

export const WaterVisualizer: React.FC<WaterVisualizerProps> = ({
  onOpenCustomLog,
  onOpenVoiceDrink,
}) => {
  const { todayRecord, profile, logWater, todayWaterByPeriod } = useHealth();
  const [selectedQuickPeriod, setSelectedQuickPeriod] = useState<'auto' | 'morning' | 'afternoon' | 'evening' | 'night'>('auto');
  const [addedPopup, setAddedPopup] = useState<string | null>(null);

  const totalMl = todayRecord.totalWaterMl;
  const targetMl = profile.targetWaterMl;
  const percentage = Math.min(100, Math.round((totalMl / targetMl) * 100));

  const handleQuickAdd = (ml: number, container: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon') => {
    const period = selectedQuickPeriod === 'auto' ? undefined : selectedQuickPeriod;
    logWater(ml, container, period);

    // Show temporary feedback
    setAddedPopup(`+${ml} ml tercatat!`);
    setTimeout(() => setAddedPopup(null), 2000);

    // Trigger celebratory confetti if target reached
    if (totalMl + ml >= targetMl && totalMl < targetMl) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const getStatusInfo = () => {
    if (percentage >= 100) {
      return {
        label: 'Target Tercapai! Luar Biasa',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        desc: 'Tubuh Anda terhidrasi dengan sangat optimal hari ini.',
        icon: CheckCircle2,
      };
    }
    if (percentage >= 70) {
      return {
        label: 'Status Sehat & Terjaga',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        desc: 'Tinggal sedikit lagi untuk mencapai hidrasi sempurna.',
        icon: Sparkles,
      };
    }
    if (percentage >= 40) {
      return {
        label: 'Perlu Tambah Air',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        desc: 'Segera minum 1-2 gelas lagi untuk menjaga konsentrasi.',
        icon: AlertCircle,
      };
    }
    return {
      label: 'Dehidrasi Ringan',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      desc: 'Tubuh Anda sangat membutuhkan asupan air putih sekarang!',
      icon: Droplet,
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-xl">
      {/* Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 fill-cyan-400" />
            Kontrol Minum Harian
          </span>
          <h2 className="text-lg font-bold text-white">Hidrasi Hari Ini</h2>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${status.badgeColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* Central Interactive Flask / Wave Bottle */}
      <div className="relative my-4 flex flex-col items-center">
        {/* The Water Flask Container */}
        <div className="relative w-44 h-56 rounded-3xl border-4 border-slate-700/80 bg-slate-950/80 overflow-hidden shadow-2xl backdrop-blur-sm flex flex-col justify-end">
          {/* Glass measurement marks */}
          <div className="absolute top-0 bottom-0 right-2 w-4 flex flex-col justify-between py-4 text-[9px] text-slate-500 select-none z-20 pointer-events-none">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
          </div>

          {/* Animated Water Fill */}
          <div
            className="w-full relative transition-all duration-700 ease-out"
            style={{ height: `${Math.max(8, percentage)}%` }}
          >
            {/* Wave 1 */}
            <div className="absolute -top-4 left-0 right-0 h-6 overflow-hidden">
              <div className="w-[200%] h-full bg-gradient-to-r from-cyan-400/80 to-blue-500/80 rounded-[40%] animate-wave-1"></div>
            </div>
            {/* Wave 2 */}
            <div className="absolute -top-3 left-0 right-0 h-5 overflow-hidden">
              <div className="w-[200%] h-full bg-gradient-to-r from-sky-300/60 to-cyan-500/60 rounded-[45%] animate-wave-2"></div>
            </div>
            {/* Liquid Body */}
            <div className="w-full h-full bg-gradient-to-b from-cyan-500 to-blue-600 shadow-inner flex items-center justify-center">
              {/* Subtle rising bubble effects */}
              <div className="absolute bottom-2 left-6 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
              <div className="absolute bottom-6 right-8 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Center Info Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <span className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {percentage}%
            </span>
            <span className="text-xs font-semibold text-cyan-200 drop-shadow">
              {totalMl.toLocaleString()} / {targetMl.toLocaleString()} ml
            </span>
            <span className="text-[10px] text-slate-300 mt-1 drop-shadow">
              {totalMl >= targetMl ? 'Tercapai 100%!' : `Sisa ${(targetMl - totalMl).toLocaleString()} ml`}
            </span>
          </div>
        </div>

        {/* Temporary Added popup notification */}
        {addedPopup && (
          <div className="absolute top-2 animate-bounce bg-cyan-500 text-slate-950 font-bold text-xs px-3 py-1 rounded-full shadow-lg">
            {addedPopup}
          </div>
        )}
      </div>

      {/* Voice Drink AI Hero Button */}
      {onOpenVoiceDrink && (
        <div className="mt-3">
          <button
            onClick={onOpenVoiceDrink}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg shadow-cyan-500/25 transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-950/80 flex items-center justify-center text-cyan-400">
                <Mic className="w-4 h-4 stroke-[2.5] animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block text-white text-xs font-bold leading-tight">
                  Tombol Minum & Suara AI
                </span>
                <span className="block text-cyan-200 text-[10px] font-normal">
                  Bisa Ucapkan: "Minum 100 ml", "Minum dua gelas", dll.
                </span>
              </div>
            </div>

            <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold group-hover:bg-white/30 transition-colors">
              Bicara / Pilih ➔
            </span>
          </button>
        </div>
      )}

      {/* Quick Add Presets */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Pilihan Cepat Minum:</span>
          {onOpenCustomLog && (
            <button
              onClick={onOpenCustomLog}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Sesuaikan Jumlah / Jam
            </button>
          )}
        </div>

        <div className="grid grid-cols-6 gap-1">
          <button
            onClick={() => handleQuickAdd(50, 'cangkir')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              50
            </span>
            <span className="text-[9px] text-slate-400">Teguk</span>
          </button>

          <button
            onClick={() => handleQuickAdd(100, 'cangkir')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              100
            </span>
            <span className="text-[9px] text-slate-400">Kecil</span>
          </button>

          <button
            onClick={() => handleQuickAdd(200, 'gelas')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              200
            </span>
            <span className="text-[9px] text-slate-400">Gelas</span>
          </button>

          <button
            onClick={() => handleQuickAdd(250, 'cangkir')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              250
            </span>
            <span className="text-[9px] text-slate-400">1 Cangkir</span>
          </button>

          <button
            onClick={() => handleQuickAdd(500, 'botol')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              500
            </span>
            <span className="text-[9px] text-slate-400">2 Gelas</span>
          </button>

          <button
            onClick={() => handleQuickAdd(1000, 'galon')}
            className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-gradient-to-b from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/40 active:scale-95 transition-all text-center group"
          >
            <span className="text-xs font-bold text-cyan-300 group-hover:scale-110 transition-transform">
              1000
            </span>
            <span className="text-[9px] text-cyan-200">1 Liter</span>
          </button>
        </div>
      </div>

      {/* Breakdown per period mini strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">🌅 Pagi</span>
          <span className="text-xs font-bold text-white">{todayWaterByPeriod.morning} ml</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">☀️ Siang</span>
          <span className="text-xs font-bold text-white">{todayWaterByPeriod.afternoon} ml</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">🌇 Sore</span>
          <span className="text-xs font-bold text-white">{todayWaterByPeriod.evening} ml</span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block">🌙 Malam</span>
          <span className="text-xs font-bold text-white">{todayWaterByPeriod.night} ml</span>
        </div>
      </div>
    </div>
  );
};
