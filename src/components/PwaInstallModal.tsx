import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, X, Share2, PlusSquare } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('Untuk menginstal, gunakan menu browser Anda (Titik tiga di kanan atas Chrome) lalu pilih "Tambahkan ke Layar Utama" atau "Install App".');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-bold">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Install Aplikasi Hidup Sehatku</h3>
              <p className="text-xs text-slate-400">Akses cepat di layar utama HP tanpa browser.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {installed ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="font-bold text-base">Berhasil Diinstal!</h4>
              <p className="text-xs text-slate-400">Aplikasi Hidup Sehatku kini sudah terpasang di perangkat Anda.</p>
            </div>
          ) : (
            <>
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Install Otomatis Sekarang</span>
                </button>
              )}

              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Panduan Instalasi Manual di Ponsel:</h4>
                
                {/* Android / Chrome */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    🤖
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="font-bold text-white">Pengguna Android (Chrome):</p>
                    <p>1. Ketuk ikon titik tiga <span className="text-cyan-400 font-semibold">(⋮)</span> di pojok kanan atas browser.</p>
                    <p>2. Pilih <span className="text-cyan-400 font-semibold">"Tambahkan ke Layar Utama"</span> atau <span className="text-cyan-400 font-semibold">"Install Aplikasi"</span>.</p>
                  </div>
                </div>

                {/* iOS / Safari */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    🍎
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="font-bold text-white">Pengguna iPhone / iPad (Safari):</p>
                    <p>1. Ketuk tombol Bagikan <span className="text-blue-400 font-semibold">(<Share2 className="w-3 h-3 inline" />)</span> di bagian bawah Safari.</p>
                    <p>2. Gulir ke bawah lalu pilih <span className="text-blue-400 font-semibold">"Tambahkan ke Layar Utama" (<PlusSquare className="w-3 h-3 inline" />)</span>.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
