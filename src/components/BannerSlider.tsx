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
      {/* Width 8cm x Height 3cm proportion -> aspect-[8/3] */}
      <div className="relative w-full aspect-[8/3] min-h-[220px] max-h-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-slate-950 flex items-center justify-center">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={`Banner Slide ${currentSlide + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ImageIcon className="w-12 h-12 mb-2 text-cyan-500 opacity-60" />
            <p className="text-xs font-bold text-slate-300">Slide #{currentSlide + 1} - Belum ada gambar banner</p>
            <p className="text-[10px] text-slate-500 mt-1">Silakan upload gambar melalui Panel Admin</p>
          </div>
        )}

        {/* Top Badge Overlay */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] sm:text-xs font-bold text-cyan-300 border border-white/10">
            {slide.badge || `${currentSlide + 1}/${slides.length}`}
          </span>
        </div>

        {/* Bottom Navigation Indicators & Controls */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-6 bg-cyan-400 shadow-md shadow-cyan-400/50' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={prevSlide}
              className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
