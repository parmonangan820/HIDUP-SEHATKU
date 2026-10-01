import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Database,
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  DownloadCloud,
  Server,
  Sparkles,
  ShieldCheck,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    supabaseStatus,
    isSyncingSupabase,
    lastSyncedTime,
    syncWithSupabase,
    pullFromSupabase,
    todayRecord,
    notes,
    alarms,
  } = useHealth();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSyncPush = async () => {
    setFeedback(null);
    const ok = await syncWithSupabase();
    if (ok) {
      setFeedback('Data aplikasi berhasil disinkronkan ke Supabase PostgreSQL!');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6'],
        });
      } catch (e) {
        // ignore
      }
    } else {
      setFeedback('Gagal menyinkronkan. Pastikan konfigurasi SUPABASE_URL di .env sudah aktif.');
    }
  };

  const handleSyncPull = async () => {
    setFeedback(null);
    const ok = await pullFromSupabase();
    if (ok) {
      setFeedback('Data terbaru berhasil ditarik dari Supabase ke aplikasi!');
    } else {
      setFeedback('Tidak ada data baru atau belum terhubung ke Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Sinkronisasi Supabase</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                PostgreSQL Cloud
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Sinkronisasi data riwayat minum, olahraga, dan catatan kesehatan
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 ${
            supabaseStatus?.connected
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-amber-950/20 border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {supabaseStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block">
                {supabaseStatus?.connected
                  ? 'Terhubung ke Supabase PostgreSQL'
                  : 'Status: Menunggu Konfigurasi Supabase'}
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {supabaseStatus?.message ||
                  'Masukkan SUPABASE_URL dan SUPABASE_ANON_KEY di environment (.env) aplikasi untuk menghubungkan database cloud.'}
              </p>
              {lastSyncedTime && (
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                  Terakhir sinkron: {lastSyncedTime} WIB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleSyncPush}
            disabled={isSyncingSupabase}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
          >
            {isSyncingSupabase ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>Unggah ke Cloud</span>
          </button>

          <button
            onClick={handleSyncPull}
            disabled={isSyncingSupabase}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-all"
          >
            {isSyncingSupabase ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <DownloadCloud className="w-3.5 h-3.5" />
            )}
            <span>Tarik dari Cloud</span>
          </button>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 text-center mb-4 animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Database Tables Overview */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3.5 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Entitas yang Disinkronkan:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between">
              <span>💧 Air Minum</span>
              <strong className="text-cyan-400 font-mono">
                {todayRecord.waterLogs.length} data
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between">
              <span>🏃 Olahraga</span>
              <strong className="text-emerald-400 font-mono">
                {todayRecord.workoutLogs.length} data
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between">
              <span>📝 Catatan Hari Ini</span>
              <strong className="text-purple-400 font-mono">
                {notes.length} data
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-between">
              <span>⏰ Jadwal Alarm</span>
              <strong className="text-amber-400 font-mono">
                {alarms.length} data
              </strong>
            </div>
          </div>
        </div>

        {/* How to configure guide */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <span className="font-bold text-slate-200 block">
            Langkah Menghubungkan Supabase:
          </span>
          <p className="text-[11px] leading-relaxed">
            1. Buka dashboard proyek Supabase Anda dan jalankan skema SQL di <strong>SQL Editor</strong>.
          </p>
          <p className="text-[11px] leading-relaxed">
            2. Masukkan URL dan Anon Key di file <code>.env</code> aplikasi:
          </p>
          <pre className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 font-mono overflow-x-auto">
            SUPABASE_URL="https://xxx.supabase.co"&#10;SUPABASE_ANON_KEY="eyJhbGci..."
          </pre>
        </div>
      </div>
    </div>
  );
};
