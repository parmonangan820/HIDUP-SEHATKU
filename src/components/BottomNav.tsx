import React from 'react';
import { Home, Droplets, Dumbbell, BarChart3, BookOpen, Calendar, Navigation } from 'lucide-react';

export type NavTab = 'home' | 'water' | 'workout' | 'smart_route' | 'notes' | 'stats' | 'education';

interface BottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: 'Beranda',
      icon: Home,
      badge: null,
    },
    {
      id: 'water' as NavTab,
      label: 'Minum',
      icon: Droplets,
      badge: null,
    },
    {
      id: 'workout' as NavTab,
      label: 'Olahraga',
      icon: Dumbbell,
      badge: null,
    },
    {
      id: 'smart_route' as NavTab,
      label: 'Rute AI',
      icon: Navigation,
      badge: 'PRO',
    },
    {
      id: 'notes' as NavTab,
      label: 'Catatan',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'education' as NavTab,
      label: 'Edukasi',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="max-w-lg mx-auto grid grid-cols-6 py-2.5 px-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-0.5 transition-all duration-200 group active:scale-95 cursor-pointer"
            >
              <div
                className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 -translate-y-0.5 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1 py-0.5 rounded-full font-black text-[8px] leading-tight tracking-wider shadow-sm ${
                      tab.badge === 'PRO'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-amber-500/40 ring-1 ring-amber-300'
                        : 'bg-cyan-400 text-slate-950'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11.5px] mt-1 font-semibold transition-colors duration-200 line-clamp-1 ${
                  isActive ? 'text-cyan-400 font-black' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-7 sm:w-9 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
