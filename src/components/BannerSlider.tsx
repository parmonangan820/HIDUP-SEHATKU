import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export const BannerSlider: React.FC = () => {
  const { bannerSlides } = useHealth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = bannerSlides && bannerSlides.length > 0 ? bannerSlides : [
    { id: 1, badge: '1/3', imageUrl: '' },
    { id: 2, badge: '2/3', imageUrl: '' },
    { id: 3, badge: '3/3', imageUrl: '' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="w-full max-w-[1772px] mx-auto px-3 sm:px-4 my-4">
      {/* 8 cm x 1 cm proportion -> aspect-[8/1] with explicit inline fallback for universal cross-browser consistency */}
      <div 
        className="relative w-full aspect-[8/1] min-h-[70px] max-h-[180px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-slate-950 flex items-center justify-center"
        style={{ aspectRatio: '8 / 1' }}
      >
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={`Banner Slide ${currentSlide + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-1 text-cyan-500 opacity-60" />
            <p className="text-[11px] sm:text-xs font-bold text-slate-300">Slide #{currentSlide + 1} - Belum ada gambar banner</p>
            <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Upload gambar melalui Panel Admin (Rasio 8:1)</p>
          </div>
        )}

        {/* Top Badge Overlay */}
        <div className="absolute top-2.5 left-2.5 z-20">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md text-[9px] sm:text-xs font-bold text-cyan-300 border border-white/10">
            {slide.badge || `${currentSlide + 1}/${slides.length}`}
          </span>
        </div>

        {/* Bottom Navigation Indicators & Controls (Always visible on mobile touchscreens, hover on desktop) */}
        <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-5 sm:w-6 bg-cyan-400 shadow-md shadow-cyan-400/50' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={prevSlide}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
