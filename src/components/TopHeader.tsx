import React from 'react';
import { useHealth } from '../context/HealthContext';
import { Droplets, Sparkles, User, Bell, Smartphone, Monitor, Mic, Database, Cloud, Shield, Crown } from 'lucide-react';

interface TopHeaderProps {
  onOpenProfile: () => void;
  onOpenAiChat: () => void;
  onOpenVoiceDrink: () => void;
  onOpenSupabaseSync: () => void;
  deviceMode: 'android' | 'ios' | 'full';
  setDeviceMode: (mode: 'android' | 'ios' | 'full') => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenProfile,
  onOpenAiChat,
  onOpenVoiceDrink,
  onOpenSupabaseSync,
  deviceMode,
  setDeviceMode,
}) => {
  const {
    profile,
    todayRecord,
    todayWaterByPeriod,
    supabaseStatus,
    isSyncingSupabase,
    isAdmin,
    setIsAdminModalOpen,
    isPro,
    setIsProModalOpen,
  } = useHealth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18.5) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const progressPercent = Math.min(
    100,
    Math.round((todayRecord.totalWaterMl / profile.targetWaterMl) * 100)
  );

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: User Avatar & Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onOpenProfile}
            className="relative flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[2px] transition-transform active:scale-95 hover:shadow-lg hover:shadow-cyan-500/20"
            title="Buka Profil & Pengaturan"
          >
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-cyan-300 font-bold text-sm">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>{getGreeting()}</span>
              <span className="text-slate-600">·</span>
              <span className="truncate">{todayFormatted}</span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-white truncate flex items-center gap-1.5">
              <span>{profile.name || 'Sahabat Sehat'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                {progressPercent}% Air
              </span>
            </h1>
          </div>
        </div>

        {/* Right: Quick actions & Device Mockup Switcher */}
        <div className="flex items-center gap-1.5">
          {/* PRO Upgrade Button */}
          <button
            onClick={() => setIsProModalOpen(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
              isPro
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-amber-500/10'
            }`}
            title="Hidup Sehatku PRO Features"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>{isPro ? 'PRO' : '✨ PRO'}</span>
          </button>

          {/* Quick Voice Drink Button */}
          <button
            onClick={onOpenVoiceDrink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:brightness-110 active:scale-95 transition-all text-xs shadow-md shadow-cyan-500/20"
            title="Tombol Minum Suara AI"
          >
            <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="font-extrabold">Minum</span>
          </button>

          {/* Ask AI button */}
          <button
            onClick={onOpenAiChat}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white active:scale-95 transition-all text-xs font-semibold"
            title="Tanya Dokter AI Hidup Sehatku"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tanya AI</span>
          </button>

          {/* Device Frame Viewport Toggle (Desktop only helper) */}
          <div className="hidden lg:flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setDeviceMode('android')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'android'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Android"
            >
              <span className="text-[11px] px-1">Android</span>
            </button>
            <button
              onClick={() => setDeviceMode('ios')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'ios'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan iPhone iOS"
            >
              <span className="text-[11px] px-1">iPhone</span>
            </button>
            <button
              onClick={() => setDeviceMode('full')}
              className={`p-1.5 rounded-md transition-colors ${
                deviceMode === 'full'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Responsif Penuh"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Panel Button - ONLY VISIBLE IF LOGGED IN AS ADMIN */}
          {isAdmin && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 transition-all animate-in fade-in"
              title="Buka Dasbor Panel Admin"
            >
              <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>
          )}

          {/* Supabase Cloud Sync Trigger */}
          <button
            onClick={onOpenSupabaseSync}
            className={`relative p-2 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
              supabaseStatus?.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Status Sinkronisasi Supabase PostgreSQL"
          >
            <Database className="w-4 h-4" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                supabaseStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Profile Trigger */}
          <button
            onClick={onOpenProfile}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
            title="Pengaturan Akun & Profil"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
