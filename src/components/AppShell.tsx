import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Smartphone, Monitor } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  deviceMode: 'android' | 'ios' | 'full';
  setDeviceMode: (mode: 'android' | 'ios' | 'full') => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  deviceMode,
  setDeviceMode,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start lg:justify-center p-0 lg:p-6 selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glows for desktop view */}
      <div className="hidden lg:block fixed -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="hidden lg:block fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Desktop Mode Switcher Bar */}
      <div className="hidden lg:flex items-center gap-3 mb-4 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800 text-xs shadow-xl z-20">
        <span className="text-slate-400 font-medium">Mode Tampilan:</span>
        <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setDeviceMode('android')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              deviceMode === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android (Material)</span>
          </button>

          <button
            onClick={() => setDeviceMode('ios')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              deviceMode === 'ios'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone (iOS)</span>
          </button>

          <button
            onClick={() => setDeviceMode('full')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              deviceMode === 'full'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Responsif</span>
          </button>
        </div>
      </div>

      {/* Main Container Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          deviceMode === 'full'
            ? 'max-w-3xl w-full min-h-screen lg:min-h-[92vh] lg:rounded-3xl lg:border lg:border-slate-800 lg:shadow-2xl overflow-hidden'
            : 'max-w-md min-h-screen lg:min-h-[860px] lg:max-h-[94vh] lg:rounded-[44px] lg:border-[8px] lg:border-slate-800 lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col bg-slate-950'
        } relative`}
      >
        {/* Scrollable App Body */}
        <div className="flex-1 overflow-y-auto scroll-smooth">{children}</div>

        {/* Device Bottom Gesture Indicator Bar */}
        {deviceMode !== 'full' && (
          <div className="hidden lg:flex w-full py-1.5 justify-center bg-slate-900 border-t border-slate-800/40 select-none">
            <div
              className={`h-1 rounded-full ${
                deviceMode === 'android' ? 'w-24 bg-slate-600' : 'w-32 bg-slate-400'
              }`}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};
