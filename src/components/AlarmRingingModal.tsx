import React from 'react';
import { useHealth } from '../context/HealthContext';
import { Bell, Droplets, CheckCircle2, X, Clock, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AlarmRingingModal: React.FC = () => {
  const { activeRingingAlarm, dismissRingingAlarm, logWater, selectedDate } = useHealth();

  if (!activeRingingAlarm) return null;

  const { alarm, note } = activeRingingAlarm;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleDismissAndDrink = () => {
    // Automatically log 250ml water
    logWater(250, 'gelas');
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      // ignore
    }
    dismissRingingAlarm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Close Button X */}
        <button
          onClick={dismissRingingAlarm}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-20"
          aria-label="Tutup Alarm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing ring background */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

        {/* Ringing Bell Icon Animation */}
        <div className="relative mx-auto my-3 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-[3px] shadow-xl shadow-amber-500/30 flex items-center justify-center animate-bounce">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400">
            <Bell className="w-10 h-10 animate-[spin_1s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Alarm Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Waktu Alarm Tiba: {alarm.time}</span>
        </div>

        <h3 className="text-xl font-black text-white tracking-tight mb-0.5">
          {alarm.label}
        </h3>

        <p className="text-[11px] text-amber-300/80 font-medium mb-2">
          Pengingat Jadwal Rutin Hidup Sehat
        </p>

        {/* Date Display */}
        <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-4">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Note Content Preview if triggered by a note */}
        {note && (
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs text-slate-300 mb-5 leading-relaxed">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Catatan Terkait:
            </span>
            <p className="line-clamp-3">{note.content}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {alarm.type === 'minum' || !alarm.type ? (
            <button
              onClick={handleDismissAndDrink}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all"
            >
              <Droplets className="w-4 h-4 fill-slate-950" />
              <span>Matikan & Catat Minum (+250 ml)</span>
            </button>
          ) : (
            <button
              onClick={dismissRingingAlarm}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai & Matikan Alarm</span>
            </button>
          )}

          <button
            onClick={dismissRingingAlarm}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Matikan Alarm
          </button>
        </div>
      </div>
    </div>
  );
};
