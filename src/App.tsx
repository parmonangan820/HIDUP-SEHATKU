import React, { useState, useEffect, useRef } from 'react';
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
import { SmartTrafficRouteTab } from './components/SmartTrafficRouteTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProfileModal } from './components/ProfileModal';
import { AIChatModal } from './components/AIChatModal';
import { VoiceDrinkModal } from './components/VoiceDrinkModal';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AccountSwitchModal } from './components/AccountSwitchModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { AffiliateModal } from './components/AffiliateModal';
import { AIDietSuccessModal } from './components/AIDietSuccessModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { RunningBanner } from './components/RunningBanner';
import { BannerSlider } from './components/BannerSlider';
import { Footer } from './components/Footer';
import { Mic, Droplet, Megaphone, X, Crown, Sparkles } from 'lucide-react';

function MainApp() {
  const {
    activeAnnouncement,
    dismissAnnouncement,
    isPro,
    isProTrial,
    isPaidPro,
    isTrialExpired,
    trialTimeRemainingFormatted,
    isProModalOpen,
    setIsProModalOpen,
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    isAccountModalOpen,
    setIsAccountModalOpen,
  } = useHealth();

  const [dismissTrialBanner, setDismissTrialBanner] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [deviceMode, setDeviceMode] = useState<'android' | 'ios' | 'full'>('full');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isVoiceDrinkOpen, setIsVoiceDrinkOpen] = useState(false);
  const [isSupabaseSyncOpen, setIsSupabaseSyncOpen] = useState(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Check if any modal is currently active
  const isAnyModalOpen = Boolean(
    isProfileOpen ||
    isAiChatOpen ||
    isDietModalOpen ||
    isVoiceDrinkOpen ||
    isSupabaseSyncOpen ||
    isAffiliateOpen ||
    isInstallModalOpen ||
    isAdminModalOpen ||
    isAdminLoginModalOpen ||
    isAccountModalOpen ||
    isProModalOpen
  );

  // Ref to hold current state without stale closures in popstate listener
  const modalStateRef = useRef({
    isProfileOpen,
    isAiChatOpen,
    isDietModalOpen,
    isVoiceDrinkOpen,
    isSupabaseSyncOpen,
    isAffiliateOpen,
    isInstallModalOpen,
    isAdminModalOpen,
    isAdminLoginModalOpen,
    isAccountModalOpen,
    isProModalOpen,
    activeTab,
  });

  useEffect(() => {
    modalStateRef.current = {
      isProfileOpen,
      isAiChatOpen,
      isDietModalOpen,
      isVoiceDrinkOpen,
      isSupabaseSyncOpen,
      isAffiliateOpen,
      isInstallModalOpen,
      isAdminModalOpen,
      isAdminLoginModalOpen,
      isAccountModalOpen,
      isProModalOpen,
      activeTab,
    };
  }, [
    isProfileOpen,
    isAiChatOpen,
    isDietModalOpen,
    isVoiceDrinkOpen,
    isSupabaseSyncOpen,
    isAffiliateOpen,
    isInstallModalOpen,
    isAdminModalOpen,
    isAdminLoginModalOpen,
    isAccountModalOpen,
    isProModalOpen,
    activeTab,
  ]);

  // Push history state whenever a modal opens
  const prevModalOpenRef = useRef(false);
  useEffect(() => {
    if (isAnyModalOpen && !prevModalOpenRef.current) {
      window.history.pushState({ isModal: true }, '');
    }
    prevModalOpenRef.current = isAnyModalOpen;
  }, [isAnyModalOpen]);

  // Tab change handler that pushes tab state to browser history
  const handleTabChange = (newTab: NavTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      window.history.pushState({ tab: newTab }, '');
    }
  };

  // Hardware Back Button / Browser Back Button Listener
  useEffect(() => {
    // Replace initial state
    if (!window.history.state) {
      window.history.replaceState({ tab: 'home' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const current = modalStateRef.current;

      // 1. If any modal is open, close the active modal
      if (current.isProfileOpen) {
        setIsProfileOpen(false);
        return;
      }
      if (current.isAffiliateOpen) {
        setIsAffiliateOpen(false);
        return;
      }
      if (current.isAiChatOpen) {
        setIsAiChatOpen(false);
        return;
      }
      if (current.isVoiceDrinkOpen) {
        setIsVoiceDrinkOpen(false);
        return;
      }
      if (current.isSupabaseSyncOpen) {
        setIsSupabaseSyncOpen(false);
        return;
      }
      if (current.isAdminModalOpen) {
        setIsAdminModalOpen(false);
        return;
      }
      if (current.isAdminLoginModalOpen) {
        setIsAdminLoginModalOpen(false);
        return;
      }
      if (current.isAccountModalOpen) {
        setIsAccountModalOpen(false);
        return;
      }
      if (current.isProModalOpen) {
        setIsProModalOpen(false);
        return;
      }
      if (current.isDietModalOpen) {
        setIsDietModalOpen(false);
        return;
      }

      // 2. If state contains a target tab, switch to it
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        return;
      }

      // 3. Otherwise if activeTab is not 'home', revert to 'home'
      if (current.activeTab !== 'home') {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <AppShell deviceMode={deviceMode} setDeviceMode={setDeviceMode}>
      <div className="min-h-full flex flex-col bg-slate-950 text-slate-100 relative">
        {/* Top Header */}
        <TopHeader
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenAiChat={() => setIsAiChatOpen(true)}
          onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)}
          onOpenSupabaseSync={() => setIsSupabaseSyncOpen(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
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

        {/* 3-Day PRO Trial Status Banner (When in trial) */}
        {isProTrial && !dismissTrialBanner && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-teal-500/20 border border-amber-500/40 relative shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0">
                <Crown className="w-4 h-4 fill-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
                    PRO TRIAL AKTIF (3 HARI)
                  </span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    ⏳ Sisa {trialTimeRemainingFormatted}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-1">
                  Bebas akses Dokter AI, Scanner Nutrisi, PDF Medis, & Rute AI Bebas Macet!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsProModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 shadow cursor-pointer whitespace-nowrap"
              >
                Kunci Promo 40%
              </button>
              <button
                onClick={() => setDismissTrialBanner(true)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Tutup banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* When 3-Day Trial has Expired and User is on Free tier */}
        {isTrialExpired && !isPaidPro && !dismissTrialBanner && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-purple-500/20 border border-rose-500/40 relative shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-rose-500/30 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-black uppercase tracking-wider">
                    TRIAL 3 HARI BERAKHIR
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    Kini Kembali ke Free
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 mt-0.5 line-clamp-1">
                  Suka kemudahan Dokter AI & Rute Anti-Macet? Hanya Rp 500/hari (Rp 15rb/bln)!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsProModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 shadow cursor-pointer whitespace-nowrap"
              >
                Beli PRO Rp 15rb
              </button>
              <button
                onClick={() => setDismissTrialBanner(true)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Tutup banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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
              setActiveTab={handleTabChange}
              onOpenAiChat={() => setIsAiChatOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)}
              onOpenDietTips={() => setIsDietModalOpen(true)}
            />
          )}

          {activeTab === 'water' && (
            <WaterTab onOpenVoiceDrink={() => setIsVoiceDrinkOpen(true)} />
          )}

          {activeTab === 'workout' && <WorkoutTab />}

          {activeTab === 'smart_route' && (
            <ErrorBoundary fallbackTitle="Peta & Rute AI">
              <SmartTrafficRouteTab />
            </ErrorBoundary>
          )}

          {activeTab === 'notes' && <NotesTab />}

          {activeTab === 'stats' && (
            <AIStatsTab onOpenAiChat={() => setIsAiChatOpen(true)} />
          )}

          {activeTab === 'education' && (
            <EducationTab
              onOpenAiChat={() => setIsAiChatOpen(true)}
              onOpenDietTips={() => setIsDietModalOpen(true)}
            />
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
            className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
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
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Modals */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onOpenAffiliate={() => setIsAffiliateOpen(true)}
        />
        <AIChatModal
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          onOpenDietTips={() => setIsDietModalOpen(true)}
        />
        <VoiceDrinkModal
          isOpen={isVoiceDrinkOpen}
          onClose={() => setIsVoiceDrinkOpen(false)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        <AlarmRingingModal />
        <SupabaseSyncModal
          isOpen={isSupabaseSyncOpen}
          onClose={() => setIsSupabaseSyncOpen(false)}
        />
        <AdminPanelModal />
        <AdminLoginModal />
        <AccountSwitchModal onOpenRegister={() => setIsProfileOpen(true)} />
        <ProUpgradeModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
        <AIDietSuccessModal isOpen={isDietModalOpen} onClose={() => setIsDietModalOpen(false)} />
        <AffiliateModal isOpen={isAffiliateOpen} onClose={() => setIsAffiliateOpen(false)} />
        <PwaInstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
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
