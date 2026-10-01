import React, { useState } from 'react';
import { Megaphone, Play, Pause, ChevronRight, X, Sparkles, Building2, Droplets, Dumbbell, ShieldCheck } from 'lucide-react';

export const RunningBanner: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mainMessage =
    'Selamat datang di aplikasi Hidup Sehatku. Aplikasi ini sangat cocok untuk karyawan yang bekerja di kantor yang mana harus tetap menjaga hidup sehat, yaitu minum yang banyak dan konsisten dan olahraga yang teratur dan konsisten. Gunakan aplikasi ini untuk mengontrol pola hidup sehat dan konsisten untuk hidup sehat.';

  return (
    <>
      {/* Ticker Bar */}
      <div className="w-full relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-b border-cyan-500/20 py-2 px-3 group shadow-md select-none backdrop-blur-md">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

        <div className="flex items-center gap-2 max-w-md mx-auto">
          {/* Left badge */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold z-20 hover:scale-105 active:scale-95 transition-transform"
            title="Klik untuk membaca pesan lengkap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <Megaphone className="w-3 h-3 text-cyan-400" />
            <span className="tracking-wide uppercase hidden xs:inline">Info Kantor</span>
          </button>

          {/* Scrolling text track */}
          <div
            className="flex-1 overflow-hidden cursor-pointer"
            onClick={() => setIsPaused((prev) => !prev)}
            title="Ketuk untuk jeda / lanjutkan gerakan teks"
          >
            <div
              className={`animate-marquee ${isPaused ? 'pause-marquee' : ''}`}
            >
              {/* Repeated twice for seamless infinite scrolling loop */}
              <div className="flex items-center gap-8 whitespace-nowrap text-xs text-slate-200 pr-8">
                <span>
                  <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold">
                    Selamat datang di aplikasi Hidup Sehatku.
                  </strong>{' '}
                  Aplikasi ini sangat cocok untuk{' '}
                  <span className="text-cyan-300 font-semibold underline decoration-cyan-500/40 underline-offset-2">
                    karyawan yang bekerja di kantor
                  </span>{' '}
                  yang mana harus tetap menjaga hidup sehat, yaitu{' '}
                  <span className="text-emerald-300 font-bold">
                    minum yang banyak dan konsisten
                  </span>{' '}
                  dan{' '}
                  <span className="text-indigo-300 font-bold">
                    olahraga yang teratur dan konsisten
                  </span>
                  . Gunakan aplikasi ini untuk mengontrol pola hidup sehat dan konsisten untuk hidup sehat.
                </span>

                <span className="text-cyan-500 font-bold text-sm select-none">✦</span>
              </div>

              <div className="flex items-center gap-8 whitespace-nowrap text-xs text-slate-200 pr-8" aria-hidden="true">
                <span>
                  <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-extrabold">
                    Selamat datang di aplikasi Hidup Sehatku.
                  </strong>{' '}
                  Aplikasi ini sangat cocok untuk{' '}
                  <span className="text-cyan-300 font-semibold underline decoration-cyan-500/40 underline-offset-2">
                    karyawan yang bekerja di kantor
                  </span>{' '}
                  yang mana harus tetap menjaga hidup sehat, yaitu{' '}
                  <span className="text-emerald-300 font-bold">
                    minum yang banyak dan konsisten
                  </span>{' '}
                  dan{' '}
                  <span className="text-indigo-300 font-bold">
                    olahraga yang teratur dan konsisten
                  </span>
                  . Gunakan aplikasi ini untuk mengontrol pola hidup sehat dan konsisten untuk hidup sehat.
                </span>

                <span className="text-cyan-500 font-bold text-sm select-none">✦</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 z-20 flex-shrink-0">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={isPaused ? 'Lanjutkan Teks' : 'Jeda Teks'}
            >
              {isPaused ? <Play className="w-3 h-3 text-cyan-400" /> : <Pause className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors hidden sm:block"
              title="Buka pesan lengkap"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Expand Modal / Full Message Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                  Panduan Kesehatan Kerja
                </span>
                <h3 className="text-base font-bold text-white">
                  Pesan Untuk Karyawan Kantor
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed mb-4">
              <p className="mb-2.5 font-medium">
                <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 font-bold">
                  Selamat datang di aplikasi Hidup Sehatku.
                </strong>{' '}
                Aplikasi ini sangat cocok untuk karyawan yang bekerja di kantor yang mana harus tetap menjaga hidup sehat, yaitu minum yang banyak dan konsisten dan olahraga yang teratur dan konsisten. Gunakan aplikasi ini untuk mengontrol pola hidup sehat dan konsisten untuk hidup sehat.
              </p>
            </div>

            {/* Quick 3 Pillar Highlights for Office Workers */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hidrasi Ruang AC</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Cegah dehidrasi tanpa sadar di ruang pendingin kerja dengan minum 200 ml setiap 2 jam.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gerak Aktif</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Lawan gaya hidup sedenter dengan jalan santai atau jalan di tempat 20-30 menit per hari.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              Saya Siap Menjaga Pola Hidup Sehat
            </button>
          </div>
        </div>
      )}
    </>
  );
};
