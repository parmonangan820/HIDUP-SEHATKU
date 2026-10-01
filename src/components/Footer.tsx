import React from 'react';
import { Heart, Sparkles, ShieldCheck, Droplet, Dumbbell } from 'lucide-react';

interface FooterProps {
  onOpenAiChat?: () => void;
  onOpenVoiceDrink?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAiChat, onOpenVoiceDrink }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 pt-6 pb-28 border-t border-slate-800/80 text-center select-none">
      {/* Brand & Creator Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-3 shadow-sm">
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hidup Sehatku</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400 flex items-center gap-1">
          Dibuat dengan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> oleh
        </span>
        <strong className="text-white font-extrabold hover:text-cyan-300 transition-colors">
          Canggih Marbun
        </strong>
      </div>

      {/* AI Attribution Prose */}
      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-3">
        Aplikasi web pengontrol hidrasi air minum harian dan kebugaran jasmani yang{' '}
        <span className="text-cyan-300 font-semibold">dibuat oleh Canggih Marbun dengan berbasis AI</span>{' '}
        untuk mendukung gaya hidup sehat karyawan dan masyarakat.
      </p>

      {/* Feature highlights pill cluster */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 mb-4">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <Droplet className="w-3 h-3 text-cyan-400" />
          Kontrol Air Minum
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <Dumbbell className="w-3 h-3 text-emerald-400" />
          Olahraga Teratur
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          Evaluasi AI Medis
        </span>
      </div>

      {/* Copyright Notice */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-col items-center gap-1 text-[11px] text-slate-500">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-400">
          <span>&copy; {currentYear}</span>
          <span className="font-semibold text-slate-300">Hidup Sehatku</span>
          <span>·</span>
          <span>Canggih Marbun</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Hak Cipta Dilindungi Undang-Undang. All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  );
};
