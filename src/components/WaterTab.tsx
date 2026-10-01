import React, { useState } from 'react';
import { useHealth, getPeriodLabel, getCurrentPeriod } from '../context/HealthContext';
import { WaterVisualizer } from './WaterVisualizer';
import { TimePeriod } from '../types';
import {
  Droplet,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Info,
} from 'lucide-react';

interface WaterTabProps {
  onOpenVoiceDrink?: () => void;
}

export const WaterTab: React.FC<WaterTabProps> = ({ onOpenVoiceDrink }) => {
  const {
    todayRecord,
    profile,
    logWater,
    deleteWaterLog,
    todayWaterByPeriod,
    aiAnalysis,
    runAiAnalysis,
    isAiAnalyzing,
  } = useHealth();

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customMl, setCustomMl] = useState<number>(300);
  const [customPeriod, setCustomPeriod] = useState<TimePeriod>(getCurrentPeriod());
  const [customTime, setCustomTime] = useState<string>(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(
      2,
      '0'
    )}`
  );
  const [customContainer, setCustomContainer] = useState<
    'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom'
  >('gelas');

  const totalMl = todayRecord.totalWaterMl;
  const targetMl = profile.targetWaterMl;
  const isHealthyWater = totalMl >= targetMl * 0.8;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMl <= 0) return;
    logWater(customMl, customContainer, customPeriod, customTime);
    setIsCustomModalOpen(false);
  };

  const periodStats = [
    {
      period: 'morning' as TimePeriod,
      title: 'Pagi Hari',
      hours: '05:00 - 11:00',
      icon: Sunrise,
      iconColor: 'text-amber-400',
      bgColor: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20',
      currentMl: todayWaterByPeriod.morning,
      recommended: '500 - 800 ml',
      benefit: 'Membangunkan organ tubuh & melancarkan pencernaan sisa malam.',
    },
    {
      period: 'afternoon' as TimePeriod,
      title: 'Siang Hari',
      hours: '11:00 - 15:00',
      icon: Sun,
      iconColor: 'text-yellow-400',
      bgColor: 'from-yellow-500/10 to-amber-500/5',
      borderColor: 'border-yellow-500/20',
      currentMl: todayWaterByPeriod.afternoon,
      recommended: '600 - 900 ml',
      benefit: 'Mencegah kantuk siang, menjaga fokus kerja & hidrasi di ruangan AC.',
    },
    {
      period: 'evening' as TimePeriod,
      title: 'Sore Hari',
      hours: '15:00 - 18:30',
      icon: Sunset,
      iconColor: 'text-orange-400',
      bgColor: 'from-orange-500/10 to-rose-500/5',
      borderColor: 'border-orange-500/20',
      currentMl: todayWaterByPeriod.evening,
      recommended: '500 - 700 ml',
      benefit: 'Mengganti cairan tubuh yang keluar saat berolahraga atau beraktivitas sore.',
    },
    {
      period: 'night' as TimePeriod,
      title: 'Malam Hari',
      hours: '18:30 - 23:00',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgColor: 'from-indigo-500/10 to-blue-500/5',
      borderColor: 'border-indigo-500/20',
      currentMl: todayWaterByPeriod.night,
      recommended: '250 - 450 ml',
      benefit: 'Mencegah dehidrasi saat tidur dan kram malam tanpa membebani kandung kemih.',
    },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Visual Water Reservoir */}
      <WaterVisualizer
        onOpenCustomLog={() => setIsCustomModalOpen(true)}
        onOpenVoiceDrink={onOpenVoiceDrink}
      />

      {/* AI Hydration Health Assessment */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Penilaian AI Pola Minum</h3>
              <p className="text-[11px] text-slate-400">Analisis sebaran jam minum & kecukupan cairan</p>
            </div>
          </div>

          <button
            onClick={() => runAiAnalysis()}
            disabled={isAiAnalyzing}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {isAiAnalyzing ? 'Menganalisis...' : 'Analisis AI'}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
          <div className="flex items-center gap-2">
            {isHealthyWater ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span
              className={`text-xs font-bold ${
                isHealthyWater ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              Status: {aiAnalysis?.waterStatus || (isHealthyWater ? 'Sehat & Cukup' : 'Kurang Sehat')}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {aiAnalysis?.waterFeedback ||
              `Asupan minum Anda hari ini tercatat ${totalMl} ml dari target ${targetMl} ml. Pastikan minum teratur di setiap periode waktu agar fungsi metabolisme tetap prima.`}
          </p>
        </div>
      </div>

      {/* Breakdown per 4 Waktu (Pagi, Siang, Sore, Malam) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Kontrol Minum Berdasarkan Waktu
          </h3>
          <span className="text-[11px] text-slate-400">Pagi, Siang, Sore, Malam</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {periodStats.map((item) => {
            const Icon = item.icon;
            const periodLogs = todayRecord.waterLogs.filter((l) => l.period === item.period);

            return (
              <div
                key={item.period}
                className={`rounded-xl p-3.5 bg-gradient-to-br ${item.bgColor} border ${item.borderColor} backdrop-blur-sm relative overflow-hidden`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                      <Icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <span className="text-[10px] text-slate-400">{item.hours}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white block">
                      {item.currentMl} <span className="text-[10px] font-normal text-slate-400">ml</span>
                    </span>
                    <span className="text-[9px] text-slate-400">Target: {item.recommended}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 mt-2.5 leading-snug">
                  {item.benefit}
                </p>

                {/* Sub-logs for this period */}
                {periodLogs.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                    {periodLogs.map((l) => (
                      <span
                        key={l.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300 flex items-center gap-1"
                      >
                        <Clock className="w-2.5 h-2.5 text-cyan-400" />
                        {l.time} ({l.amountMl}ml)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Water Log Timeline */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Riwayat Minum Hari Ini</h3>
          </div>
          <span className="text-xs text-slate-400">
            {todayRecord.waterLogs.length} kali minum ({totalMl} ml)
          </span>
        </div>

        {todayRecord.waterLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Belum ada catatan minum hari ini. Ketuk tombol preset di atas untuk mencatat!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto pr-1">
            {todayRecord.waterLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs flex-shrink-0">
                    💧
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{log.amountMl} ml</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-medium capitalize">
                        {log.containerType}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Jam {log.time} · {getPeriodLabel(log.period).split('(')[0].trim()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteWaterLog(log.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Hapus catatan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Log Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              Catat Minum Khusus
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tentukan jumlah air dan jam Anda minum secara tepat.
            </p>

            <form onSubmit={handleAddCustom} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Jumlah Air (ml)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    step="10"
                    value={customMl}
                    onChange={(e) => setCustomMl(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-base focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                    ml
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Waktu Minum
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Periode
                  </label>
                  <select
                    value={customPeriod}
                    onChange={(e) => setCustomPeriod(e.target.value as TimePeriod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="morning">🌅 Pagi</option>
                    <option value="afternoon">☀️ Siang</option>
                    <option value="evening">🌇 Sore</option>
                    <option value="night">🌙 Malam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Wadah Minum
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['gelas', 'cangkir', 'botol', 'tumbler', 'galon', 'custom'] as const).map(
                    (type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setCustomContainer(type)}
                        className={`py-1.5 px-2 rounded-lg text-xs capitalize border transition-all ${
                          customContainer === type
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
