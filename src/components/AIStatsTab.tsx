import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { printMedicalReport } from '../utils/generateMedicalPdfReport';
import {
  Sparkles,
  BarChart3,
  TrendingUp,
  Droplets,
  Dumbbell,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Award,
  Flame,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  FileText,
  Crown,
} from 'lucide-react';

interface AIStatsTabProps {
  onOpenAiChat: () => void;
}

export const AIStatsTab: React.FC<AIStatsTabProps> = ({ onOpenAiChat }) => {
  const {
    profile,
    todayRecord,
    aiAnalysis,
    isAiAnalyzing,
    runAiAnalysis,
    weeklySummary,
    monthlySummary,
    todayWaterByPeriod,
    isPro,
    setIsProModalOpen,
  } = useHealth();

  const [activeChartTab, setActiveChartTab] = useState<'water' | 'workout'>('water');
  const [activeRange, setActiveRange] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(6);

  const selectedDay = selectedDayIndex !== null ? weeklySummary.days[selectedDayIndex] : null;

  const handleDownloadPdfReport = () => {
    if (!isPro) {
      setIsProModalOpen(true);
      return;
    }
    printMedicalReport(
      profile,
      todayRecord,
      aiAnalysis,
      todayWaterByPeriod,
      weeklySummary,
      monthlySummary
    );
  };

  return (
    <div className="space-y-5 pb-24">
      {/* AI Health Classification & Assessment Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 p-5 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block">
                Penilaian AI Hidup Sehatku
              </span>
              <h2 className="text-base font-bold text-white">Evaluasi & Golongan Sehat</h2>
            </div>
          </div>

          <button
            onClick={() => runAiAnalysis()}
            disabled={isAiAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
            title="Analisis ulang dengan Gemini AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAiAnalyzing ? 'Memproses...' : 'Analisis AI'}</span>
          </button>
        </div>

        {/* Golongan Badge Hero */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/20 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-medium block mb-0.5">
                Kategori Golongan Pengguna:
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-emerald-300">
                {aiAnalysis?.category || 'Pejuang Hidup Sehat Aktif'}
              </h3>
            </div>

            {/* Score Ring */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center">
                <span className="text-lg font-black text-indigo-300">
                  {aiAnalysis?.overallScore || 85}
                </span>
                <span className="text-[9px] text-slate-400 absolute bottom-1 font-bold">SKOR</span>
              </div>
            </div>
          </div>

          {/* Status Breakdown Pills */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Status Air Minum:</span>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">
                  {aiAnalysis?.waterStatus || 'Sehat & Optimal'}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Status Olahraga:</span>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {aiAnalysis?.workoutStatus || 'Aktif & Teratur'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Prose */}
          <div className="mt-3 text-xs text-slate-300 leading-relaxed space-y-1.5">
            <p>
              <strong className="text-cyan-300">Analisis Hidrasi: </strong>
              {aiAnalysis?.waterFeedback ||
                'Pola minum Anda tersusun baik antara pagi, siang, dan sore hari.'}
            </p>
            <p>
              <strong className="text-emerald-300">Analisis Kebugaran: </strong>
              {aiAnalysis?.workoutFeedback ||
                'Konsistensi olahraga harian Anda efektif memicu pembakaran kalori dan kebugaran jantung.'}
            </p>
          </div>

          {/* AI Recommendations */}
          {aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-indigo-300 block mb-1.5">
                💡 Rekomendasi Pribadi Hari Ini:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aiAnalysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat with AI CTA */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Ingin konsultasi seputar pola sehat Anda?</span>
            <button
              onClick={onOpenAiChat}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Tanya AI
            </button>
          </div>

          {/* Pro Benefit CTA: Unduh Laporan PDF Medis Dokter */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Laporan PDF Medis Dokter</span>
                  {isPro && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-black">
                      PRO UNLOCKED
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Unduh rekam medis & hidrasi siap cetak untuk dokter
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdfReport}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>{isPro ? '📄 Unduh PDF Medis' : '🔒 Buka PDF Medis (Pro)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Range Toggle: Weekly vs Monthly */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          Grafik & Akumulasi Data
        </h3>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveRange('weekly')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeRange === 'weekly'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Hari (Mingguan)
          </button>
          <button
            onClick={() => setActiveRange('monthly')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeRange === 'monthly'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Hari (Bulanan)
          </button>
        </div>
      </div>

      {/* WEEKLY VIEW */}
      {activeRange === 'weekly' && (
        <div className="space-y-4">
          {/* Metric Selector for chart */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveChartTab('water')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeChartTab === 'water'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              Grafik Minum Air (ml)
            </button>
            <button
              onClick={() => setActiveChartTab('workout')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeChartTab === 'workout'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
              Grafik Olahraga (Menit)
            </button>
          </div>

          {/* Interactive Weekly Bar Chart */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-white block">
                  {activeChartTab === 'water' ? 'Asupan Air Harian vs Target' : 'Durasi Olahraga Harian'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Target: {activeChartTab === 'water' ? `${profile.targetWaterMl} ml/hari` : `${profile.dailyWorkoutMinutesTarget} menit/hari`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Ketuk batang untuk detail</span>
            </div>

            {/* Chart Area */}
            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800/80">
              {weeklySummary.days.map((item, idx) => {
                const isSelected = selectedDayIndex === idx;
                const value = activeChartTab === 'water' ? item.waterMl : item.workoutMins;
                const target =
                  activeChartTab === 'water'
                    ? item.waterTarget
                    : profile.dailyWorkoutMinutesTarget;
                const percent = Math.min(100, Math.round((value / target) * 100));
                const targetReached = value >= target;

                return (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDayIndex(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group focus:outline-none"
                  >
                    {/* Value on hover or selected */}
                    <span
                      className={`text-[9px] mb-1 font-bold transition-opacity ${
                        isSelected ? 'text-white opacity-100' : 'text-slate-500 opacity-60'
                      }`}
                    >
                      {activeChartTab === 'water' ? `${Math.round(value / 100) / 10}L` : `${value}m`}
                    </span>

                    {/* Bar track */}
                    <div className="w-full max-w-[28px] h-28 bg-slate-800/60 rounded-t-lg relative flex flex-col justify-end overflow-hidden p-0.5">
                      {/* Bar Fill */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          activeChartTab === 'water'
                            ? targetReached
                              ? 'bg-gradient-to-t from-cyan-500 to-blue-500'
                              : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                            : targetReached
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-t from-amber-600 to-amber-400'
                        } ${isSelected ? 'ring-2 ring-white/60' : ''}`}
                        style={{ height: `${Math.max(10, percent)}%` }}
                      ></div>
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-[10px] mt-2 font-medium ${
                        isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {item.dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Detail Box */}
            {selectedDay && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">
                    {selectedDay.dayLabel} ({selectedDay.date})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Minum: <strong className="text-cyan-300">{selectedDay.waterMl} ml</strong> (
                    {selectedDay.waterPercentage}%) · Olahraga:{' '}
                    <strong className="text-emerald-300">{selectedDay.workoutMins} menit</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Kalori Terbakar</span>
                  <span className="font-extrabold text-rose-400 flex items-center gap-1 justify-end">
                    <Flame className="w-3.5 h-3.5" />
                    {selectedDay.calories} kcal
                  </span>
                </div>
              </div>
            )}

            {/* Weekly Summary Totals */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800">
              <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Total Minum 7 Hari</span>
                <span className="text-sm font-extrabold text-cyan-300">
                  {weeklySummary.totalWaterLiters} Liter
                </span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Total Waktu Latihan</span>
                <span className="text-sm font-extrabold text-emerald-300">
                  {weeklySummary.totalWorkoutMins} Menit
                </span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Target Tercapai</span>
                <span className="text-sm font-extrabold text-amber-300">
                  {weeklySummary.targetMetDaysCount} / 7 Hari
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY VIEW */}
      {activeRange === 'monthly' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Akumulasi Bulan Ini (30 Hari)</h3>
                <p className="text-[11px] text-slate-400">Total pencapaian dan konsistensi gaya hidup sehat</p>
              </div>
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  Total Air Diminum
                </span>
                <span className="text-2xl font-black text-cyan-300 block">
                  {monthlySummary.totalWaterLiters}
                  <span className="text-xs font-normal text-slate-400 ml-1">Liter</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {monthlySummary.waterTargetAchievedDays} hari mencapai target harian
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                  Total Durasi Olahraga
                </span>
                <span className="text-2xl font-black text-emerald-300 block">
                  {monthlySummary.totalWorkoutHours}
                  <span className="text-xs font-normal text-slate-400 ml-1">Jam</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {monthlySummary.activeDays} hari aktif bergerak
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Total Kalori Terbakar
                </span>
                <span className="text-2xl font-black text-rose-400 block">
                  {(monthlySummary?.totalCalories ?? 0).toLocaleString()}
                  <span className="text-xs font-normal text-slate-400 ml-1">kcal</span>
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Setara ~{Math.round((monthlySummary?.totalCalories ?? 0) / 7700 * 10) / 10} kg lemak tubuh
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Olahraga Terfavorit
                </span>
                <span className="text-base font-bold text-white truncate block">
                  {monthlySummary.topActivity}
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  Terbanyak diselesaikan
                </span>
              </div>
            </div>

            {/* Motivational message */}
            <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Pencapaian Menakjubkan!</strong> Anda membuktikan bahwa
                konsistensi hidrasi dan gerak aktif dalam 30 hari telah membangun kebiasaan hidup sehat
                yang berkelanjutan.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
