import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { Droplet, Activity, Heart, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export const BannerSlider: React.FC = () => {
  const { bannerSlides } = useHealth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = bannerSlides && bannerSlides.length > 0 ? bannerSlides : [
    {
      id: 1,
      title: 'Selamat Datang di Aplikasi Hidup Sehatku',
      subtitle: 'Langkah kecil hari ini, untuk hidup yang lebih sehat esok hari.',
      badge: '1/3',
      bgGradient: 'from-cyan-600 via-sky-600 to-blue-700',
    },
    {
      id: 2,
      title: 'Minum Air Putih Secara Teratur',
      subtitle: 'Jaga cairan tubuh, tingkatkan energi, dan dukung kesehatanmu setiap hari.',
      badge: '2/3',
      bgGradient: 'from-blue-700 via-sky-600 to-cyan-600',
    },
    {
      id: 3,
      title: 'Olahraga Teratur',
      subtitle: 'Jaga kebugaran, kuatkan tubuh, dan tingkatkan kualitas hidup.',
      badge: '3/3',
      bgGradient: 'from-emerald-700 via-green-600 to-teal-700',
    },
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
      <div className="relative w-full aspect-[8/3] min-h-[220px] max-h-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-slate-950">
        {/* Custom Image background if provided by admin */}
        {slide.imageUrl ? (
          <div className="absolute inset-0">
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"></div>
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient || 'from-cyan-600 via-sky-600 to-blue-700'} opacity-95 transition-all duration-700`}></div>
        )}

        {/* Decorative background shapes */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6 text-white">
          {/* Top Row: Slide Counter */}
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] sm:text-xs font-bold text-cyan-300 border border-white/10">
              {slide.badge || `${currentSlide + 1}/${slides.length}`}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-cyan-200/80">
              hidupsehatku.my.id
            </span>
          </div>

          {/* Middle Row: Main Slide Content */}
          <div className="flex items-center justify-between my-auto">
            <div className="flex-1 pr-4">
              <h2 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md text-white">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100 mt-1 drop-shadow max-w-2xl">
                {slide.subtitle}
              </p>
            </div>
          </div>

          {/* Bottom Row: Navigation Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={prevSlide}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
