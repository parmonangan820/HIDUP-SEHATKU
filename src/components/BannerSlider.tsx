import React, { useState, useEffect } from 'react';
import { Droplet, Activity, Heart, CheckCircle2, ChevronLeft, ChevronRight, Smile } from 'lucide-react';

export const BannerSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      theme: 'blue-cyan',
      bgGradient: 'from-cyan-600 via-sky-600 to-blue-700',
      badge: '1/3',
      title: 'Selamat Datang di Aplikasi Hidup Sehatku',
      subtitle: 'Langkah kecil hari ini, untuk hidup yang lebih sehat esok hari.',
      features: [
        { icon: Droplet, text: 'Minum Air Putih Teratur' },
        { icon: Activity, text: 'Olahraga Teratur' },
        { icon: Heart, text: 'Hidup Lebih Sehat dan Bahagia' },
      ],
      tagline: 'Sehat Itu Mudah,\nMulai dari Diri Sendiri',
      imageType: 'woman-drinking',
    },
    {
      id: 2,
      theme: 'blue-splash',
      bgGradient: 'from-blue-700 via-sky-600 to-cyan-600',
      badge: '2/3',
      title: 'Minum Air Putih Secara Teratur',
      subtitle: 'Jaga cairan tubuh, tingkatkan energi, dan dukung kesehatanmu setiap hari.',
      checklist: [
        'Meningkatkan konsentrasi',
        'Menjaga fungsi organ tubuh',
        'Melancarkan metabolisme',
        'Menjaga kulit tetap sehat',
      ],
      imageType: 'water-glass',
    },
    {
      id: 3,
      theme: 'green-nature',
      bgGradient: 'from-emerald-700 via-green-600 to-teal-700',
      badge: '3/3',
      title: 'Olahraga Teratur',
      subtitle: 'Jaga kebugaran, kuatkan tubuh, dan tingkatkan kualitas hidup.',
      checklist: [
        'Meningkatkan daya tahan tubuh',
        'Menjaga berat badan ideal',
        'Mengurangi stres',
        'Membuat tubuh lebih bugar',
      ],
      tagline: 'Sehat Aktif Bahagia',
      imageType: 'running-couple',
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
      <div className="relative w-full h-[220px] sm:h-[262px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-slate-950">
        {/* Background Gradients & Effects */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-95 transition-all duration-700`}></div>

        {/* Decorative background shapes */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-10 top-10 w-64 h-64 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none"></div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6 text-white">
          {/* Top Row: Slide Counter */}
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] sm:text-xs font-bold text-cyan-300 border border-white/10">
              {slide.badge}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-cyan-200/80">
              hidupsehatku.my.id
            </span>
          </div>

          {/* Middle Row: Main Slide Content */}
          <div className="flex items-center justify-between my-auto">
            {/* Slide 1 Content */}
            {slide.id === 1 && (
              <div className="flex-1 pr-4">
                <h2 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md text-white">
                  {slide.title}
                </h2>
                <p className="text-xs sm:text-sm text-cyan-100 mt-1 drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
                  {slide.features?.map((f, idx) => {
                    const IconComp = f.icon;
                    return (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 backdrop-blur-sm border border-white/15 text-[11px] sm:text-xs font-semibold">
                        <IconComp className="w-3.5 h-3.5 text-cyan-300" />
                        <span>{f.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slide 2 Content */}
            {slide.id === 2 && (
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Droplet className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md text-white">
                    {slide.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-cyan-100 mt-1 drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 max-w-xl">
                  {slide.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-cyan-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slide 3 Content */}
            {slide.id === 3 && (
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-200" />
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md text-white">
                    {slide.title}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1 drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 max-w-xl">
                  {slide.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-emerald-50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Side Visual Graphic Tagline */}
            <div className="hidden md:flex flex-col items-end justify-center text-right pl-4">
              <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 shadow-lg max-w-[240px]">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300 block mb-1">
                  Hidup Sehatku
                </span>
                <p className="text-xs font-bold text-white leading-relaxed">
                  {slide.tagline || 'Sehat Setiap Hari Bersama AI'}
                </p>
              </div>
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
