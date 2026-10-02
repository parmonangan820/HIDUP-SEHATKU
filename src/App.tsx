import React, { useState } from 'react';
import { HealthProvider, useHealth } from './context/HealthContext';
import { AppShell } from './components/AppShell';
import { TopHeader } from './components/TopHeader';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { WaterTab } from './components/WaterTab';
import { WorkoutTab } from './components/WorkoutTab';
import { NotesTab } from './components/NotesTab';
import { AIStatsTab } from './components/AIStatsTab';
import { EducationTab } from './components/EducationTab';
import { ProfileModal } from './components/ProfileModal';
import { AIChatModal } from './components/AIChatModal';
import { VoiceDrinkModal } from './components/VoiceDrinkModal';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AccountSwitchModal } from './components/AccountSwitchModal';
import { RunningBanner } from './components/RunningBanner';
import { BannerSlider } from './components/BannerSlider';
import { Footer } from './components/Footer';
import { Mic, Droplet, Megaphone, X } from 'lucide-react';

function MainApp() {
  const { activeAnnouncement, dismissAnnouncement } = useHealth();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [deviceMode, setDeviceMode] = useState<'android' | 'ios' | 'full'>('android');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isVoiceDrinkOpen, setIsVoiceDrinkOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);

  return (
    <AppShell deviceMode={deviceMode} setDeviceMode={setDeviceMode}>
      <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 relative">
        {/* Top Header */}
        <TopHeader
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAiChat={() => setIsAiChatOpen(true)}
          onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)}
          onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
        />

        {/* Broadcast Announcement from Administrator (if any) */}
        {activeAnnouncement && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/40 relative animate-in slide-in-from-top-2">
            <button
              onClick={dismissAnnouncement}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-slate-400 hover:text-white"
              title="Tutup Pengumuman"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-start gap-2.5 pr-6">
              <div className="w-7 h-7 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300 flex-shrink-0 mt-0.5">
                <Megaphone className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold uppercase tracking-wider">
                    Pemberitahuan Admin
                  </span>
                  <span className="text-xs font-bold text-white">{activeAnnouncement.title}</span>
                </div>
                <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
                  {activeAnnouncement.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Running Text Ticker */}
        <RunningBanner />

        {/* 3-Slide Banner (1772px x 262px proportion) */}
        <BannerSlider />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          {activeTab === 'home' && (
            <HomeTab
              setActiveTab={setActiveTab}
              onOpenAiChat={() => setIsAiChatOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)}
            />
          )}

          {activeTab === 'water' && (
            <WaterTab onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)} />
          )}

          {activeTab === 'workout' && <WorkoutTab />}

          {activeTab === 'notes' && <NotesTab />}

          {activeTab === 'stats' && (
            <AIStatsTab onOpenAiChat={() => setIsAiChatOpen(true)} />
          )}

          {activeTab === 'education' && (
            <EducationTab onOpenAiChat={() => setIsAiChatOpen(true)} />
          )}

          {/* Aesthetic Footer with Creator Attribution & Copyright */}
          <Footer
            onOpenAiChat={() => setIsAiChatOpen(true)}
            onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)}
          />
        </main>

        {/* Floating Quick Action Voice Drink Button */}
        <div className="fixed bottom-20 right-4 sm:right-6 lg:right-8 z-30 pointer-events-auto">
          <button
            onClick={() => setIsVoiceDrinkOpen(true)}
            className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group"
            title="Tombol Minum Suara AI (Katakan 'Minum 100 ml', 'Minum satu gelas', dll)"
          >
            <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Mic className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-slate-950 tracking-tight font-extrabold flex items-center gap-1">
              <span>Bicara Minum</span>
              <Droplet className="w-3 h-3 fill-slate-950" />
            </span>
          </button>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Modals */}
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        <AIChatModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
        <VoiceDrinkModal
          isOpen={isVoiceDrinkOpen}
          onClose={() => setIsVoiceDrinkOpen(false)}
        />
        <AlarmRingingModal />
        <SupabaseSyncModal
          isOpen={isSupabaseSyncOpen}
          onClose={() => setIsSupabaseSyncOpen(false)}
        />
        <AdminPanelModal />
        <AdminLoginModal />
        <AccountSwitchModal onOpenRegister={() => setIsProfileOpen(true)} />
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <HealthProvider>
      <MainApp />
    </HealthProvider>
  );
}
