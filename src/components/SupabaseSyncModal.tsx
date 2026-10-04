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
  Link,
  Unlink,
  ExternalLink,
  KeyRound,
  Globe,
  AlertTriangle,
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
    configureSupabaseConnection,
    disconnectSupabaseConnection,
    todayRecord,
    notes,
    alarms,
  } = useHealth();

  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setFeedback({
        type: 'error',
        message: 'Mohon isi Project URL dan Anon Key dari dashboard Supabase Anda.',
      });
      return;
    }

    setIsConfiguring(true);
    setFeedback(null);

    const res = await configureSupabaseConnection(inputUrl.trim(), inputKey.trim());
    setIsConfiguring(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Selamat! Supabase berhasil terhubung dan akun Anda telah tersinkronkan ke PostgreSQL Cloud.',
      });
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6'],
        });
      } catch (err) {
        // ignore
      }
    } else {
      if (res.code === 'TABLES_MISSING') {
        setShowSqlGuide(true);
      }
      setFeedback({
        type: 'error',
        message: res.message || 'Gagal menghubungkan ke Supabase. Periksa kembali URL dan Anon Key Anda.',
      });
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan koneksi dengan Supabase? Data lokal tetap tersimpan di browser.')) {
      setIsConfiguring(true);
      await disconnectSupabaseConnection();
      setIsConfiguring(false);
      setInputUrl('');
      setInputKey('');
      setFeedback({
        type: 'info',
        message: 'Koneksi ke Supabase telah diputus.',
      });
    }
  };

  const handleSyncPush = async () => {
    setFeedback(null);
    const ok = await syncWithSupabase();
    if (ok) {
      setFeedback({
        type: 'success',
        message: 'Data aplikasi berhasil disinkronkan ke Supabase PostgreSQL!',
      });
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
      setFeedback({
        type: 'error',
        message: 'Gagal menyinkronkan data. Pastikan Supabase sudah terhubung dan tabel SQL sudah dibuat.',
      });
    }
  };

  const handleSyncPull = async () => {
    setFeedback(null);
    const ok = await pullFromSupabase();
    if (ok) {
      setFeedback({
        type: 'success',
        message: 'Data terbaru berhasil ditarik dari Supabase ke aplikasi!',
      });
    } else {
      setFeedback({
        type: 'error',
        message: 'Tidak ada data baru di Supabase atau koneksi gagal.',
      });
    }
  };

  const handleCopySql = () => {
    const sqlCode = `-- SQL Skema Hidup Sehatku
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS public.ai_health_analyses CASCADE;
DROP TABLE IF EXISTS public.health_alarms CASCADE;
DROP TABLE IF EXISTS public.health_notes CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.water_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL,
    name VARCHAR(150) NOT NULL DEFAULT 'Pengguna Hidup Sehat',
    phone VARCHAR(30) DEFAULT '',
    age INTEGER DEFAULT 25,
    gender VARCHAR(10) DEFAULT 'pria',
    weight NUMERIC(5,2) DEFAULT 60.0,
    height NUMERIC(5,2) DEFAULT 165.0,
    target_water_ml INTEGER DEFAULT 2100,
    daily_workout_minutes_target INTEGER DEFAULT 30,
    is_registered BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    amount_ml INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'morning',
    container_type VARCHAR(20) NOT NULL DEFAULT 'gelas',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    activity_type VARCHAR(50) NOT NULL DEFAULT 'jalan_kaki',
    activity_name VARCHAR(100) NOT NULL DEFAULT 'Jalan Kaki',
    duration_minutes INTEGER NOT NULL,
    calories_burned NUMERIC(6,1) NOT NULL DEFAULT 0.0,
    distance_km NUMERIC(5,2),
    steps INTEGER,
    intensity VARCHAR(20) DEFAULT 'sedang',
    period VARCHAR(20) DEFAULT 'afternoon',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.health_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    title VARCHAR(200) NOT NULL,
    content TEXT,
    category VARCHAR(30) NOT NULL DEFAULT 'umum',
    mood VARCHAR(20) DEFAULT 'sehat',
    has_alarm BOOLEAN DEFAULT false,
    alarm_time VARCHAR(5) DEFAULT NULL,
    is_alarm_active BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.health_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    label VARCHAR(150) NOT NULL,
    time VARCHAR(5) NOT NULL,
    days TEXT[] NOT NULL DEFAULT ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(30) NOT NULL DEFAULT 'minum',
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_health_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(150) NOT NULL DEFAULT 'Akun Baru - Siap Memulai Hidup Sehat',
    water_status VARCHAR(100) NOT NULL DEFAULT 'Mulai dari 0 ml',
    water_feedback TEXT,
    workout_status VARCHAR(100) NOT NULL DEFAULT 'Mulai dari 0 menit',
    workout_feedback TEXT,
    overall_score INTEGER NOT NULL DEFAULT 100,
    recommendations JSONB DEFAULT '[]'::jsonb,
    health_tips TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FITUR SMART TRAFFIC ROUTE AI
CREATE TABLE IF NOT EXISTS public.smart_routes_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    travel_mode VARCHAR(30) NOT NULL DEFAULT 'DRIVE',
    avoid_tolls BOOLEAN NOT NULL DEFAULT false,
    avoid_highways BOOLEAN NOT NULL DEFAULT false,
    time_saved_minutes INTEGER DEFAULT 0,
    best_route_title TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.smart_routes_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id UUID REFERENCES public.smart_routes_history(id) ON DELETE CASCADE,
    recommendation_title TEXT,
    recommendation_reason TEXT,
    stress_analysis TEXT,
    health_travel_tips JSONB DEFAULT '[]'::jsonb,
    best_departure_window TEXT,
    promo_catchphrase TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_routes_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_routes_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Akses Penuh Profil" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Riwayat Air" ON public.water_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Riwayat Olahraga" ON public.workout_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Catatan" ON public.health_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Alarm" ON public.health_alarms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Analisis AI" ON public.ai_health_analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Riwayat Rute AI" ON public.smart_routes_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses Penuh Evaluasi Rute AI" ON public.smart_routes_evaluations FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
              Sinkronkan akun & riwayat sehat Anda ke database Supabase
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 ${
            supabaseStatus?.connected
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-amber-950/25 border-amber-500/40'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {supabaseStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white block">
                  {supabaseStatus?.connected
                    ? 'Terhubung ke Supabase PostgreSQL'
                    : 'Belum Terhubung ke Supabase'}
                </span>
                {supabaseStatus?.connected && (
                  <button
                    onClick={handleDisconnect}
                    disabled={isConfiguring}
                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Putus</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {supabaseStatus?.message ||
                  'Masukkan Project URL dan Anon Key di bawah ini agar data akun dan log Anda langsung tersimpan ke cloud.'}
              </p>
              {lastSyncedTime && (
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1.5">
                  ✓ Terakhir sinkron: {lastSyncedTime} WIB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs mb-4 flex items-start gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                : feedback.type === 'error'
                ? 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
                : 'bg-slate-950 border border-slate-800 text-slate-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-[11px] leading-relaxed flex-1">{feedback.message}</p>
          </div>
        )}

        {/* Form Hubungkan Supabase (Jika Belum Terhubung) */}
        {!supabaseStatus?.connected && (
          <form onSubmit={handleConnect} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Link className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white">Hubungkan Proyek Supabase Anda</h4>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Project URL <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
                <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Project API Key (Anon / Public) <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                />
                <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ditemukan di Supabase: <em>Project Settings ⚙️ → API → anon public key</em>
              </p>
            </div>

            <button
              type="submit"
              disabled={isConfiguring}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isConfiguring ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi Koneksi...</span>
                </>
              ) : (
                <>
                  <Link className="w-3.5 h-3.5" />
                  <span>Hubungkan & Sinkronkan Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Sync Actions (Jika Sudah Terhubung) */}
        {supabaseStatus?.connected && (
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
        )}

        {/* Database Tables Overview */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-3.5 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Entitas Data yang Disinkronkan:
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

        {/* SQL Schema Copy Button */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Kode Skema SQL Supabase</span>
            </span>
            <button
              onClick={handleCopySql}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                copiedSql
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
              }`}
            >
              {copiedSql ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Jika baru pertama kali, salin kode SQL di atas lalu paste dan jalankan di menu <strong>SQL Editor</strong> dashboard Supabase Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
