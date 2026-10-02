import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, FileText, Cloud, Crown, X, Star } from 'lucide-react';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ isOpen, onClose }) => {
  const { isPro, upgradeToPro } = useHealth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    upgradeToPro(selectedPlan);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden text-white p-6 sm:p-8">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
              <Crown className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-amber-300">Selamat, Anda Resmi Member PRO!</h2>
            <p className="text-sm text-slate-300 max-w-xs">
              Semua fitur premium Hidup Sehatku PRO kini aktif sepenuhnya untuk Anda. Nikmati hidup lebih sehat & bugar!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
                <Crown className="w-3.5 h-3.5" />
                <span>HIDUP SEHATKU PRO</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                Tingkatkan Kesehatan ke Level Tertinggi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Buka seluruh kekuatan AI, laporan medis PDF dokter, sinkronisasi cloud otomatis, dan bebas iklan selamanya.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Health Scanner & Chat</h4>
                  <p className="text-[11px] text-slate-400">Analisis kalori makanan & konsultasi dokter AI tanpa batas.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Laporan PDF Medis</h4>
                  <p className="text-[11px] text-slate-400">Unduh rekam jejak kesehatan siap cetak untuk dokter.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cloud Sync Otomatis</h4>
                  <p className="text-[11px] text-slate-400">Data sinkron di semua perangkat tanpa takut hilang.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 flex-shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bebas Iklan & Tema Pro</h4>
                  <p className="text-[11px] text-slate-400">Pengalaman bersih, lencana emas & kustomisasi UI.</p>
                </div>
              </div>
            </div>

            {/* Pricing Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedPlan === 'monthly'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] text-slate-400 font-medium">Paket Bulanan</div>
                <div className="text-lg font-black text-white mt-0.5">Rp 15.000</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-1">per bulan</div>
              </button>

              <button
                onClick={() => setSelectedPlan('annual')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedPlan === 'annual'
                    ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                  Hemat 40%
                </span>
                <div className="text-[11px] text-slate-400 font-medium">Paket Tahunan</div>
                <div className="text-lg font-black text-white mt-0.5">Rp 100.000</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-1">per tahun (~Rp 8rb/bln)</div>
              </button>
            </div>

            {/* Subscribe Action Button */}
            <button
              onClick={handleSubscribe}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 fill-slate-950" />
              <span>{isPro ? 'Perpanjang Langganan PRO Sekarang' : 'Aktifkan Hidup Sehatku PRO'}</span>
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Langganan aman & terjangkau. Dapat dibatalkan kapan saja.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
