import React from 'react';
import { Home, Droplets, Dumbbell, BarChart3, BookOpen } from 'lucide-react';

export type NavTab = 'home' | 'water' | 'workout' | 'stats' | 'education';

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
      label: 'Air Putih',
      icon: Droplets,
      badge: 'Minum',
    },
    {
      id: 'workout' as NavTab,
      label: 'Olahraga',
      icon: Dumbbell,
      badge: null,
    },
    {
      id: 'stats' as NavTab,
      label: 'AI & Grafik',
      icon: BarChart3,
      badge: 'AI',
    },
    {
      id: 'education' as NavTab,
      label: 'Manfaat',
      icon: BookOpen,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-1 transition-all duration-200 group active:scale-95"
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 -translate-y-0.5 shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
