import React, { useState } from 'react';
import { HEALTH_ARTICLES, HealthArticle } from '../data/healthGuides';
import { useHealth } from '../context/HealthContext';
import {
  BookOpen,
  Droplets,
  Dumbbell,
  Heart,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calculator,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface EducationTabProps {
  onOpenAiChat: () => void;
}

export const EducationTab: React.FC<EducationTabProps> = ({ onOpenAiChat }) => {
  const { profile } = useHealth();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'air_minum' | 'olahraga' | 'gaya_hidup'>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>('manfaat-air-putih-lengkap');

  // Calculator Tool State
  const [calcWeight, setCalcWeight] = useState<number>(profile.weight || 65);
  const [calcHeight, setCalcHeight] = useState<number>(profile.height || 170);

  // BMI = weight / (height/100)^2
  const heightM = calcHeight / 100;
  const bmi = heightM > 0 ? Math.round((calcWeight / (heightM * heightM)) * 10) / 10 : 22;
  const recommendedWater = Math.round(calcWeight * 35);

  const getBmiStatus = (val: number) => {
    if (val < 18.5) return { label: 'Berat Kurang', color: 'text-amber-400' };
    if (val < 25) return { label: 'Berat Ideal / Normal', color: 'text-emerald-400' };
    if (val < 30) return { label: 'Kelebihan Berat Badan', color: 'text-orange-400' };
    return { label: 'Obesitas', color: 'text-rose-400' };
  };

  const bmiStatus = getBmiStatus(bmi);

  const filteredArticles =
    selectedCategory === 'all'
      ? HEALTH_ARTICLES
      : HEALTH_ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-5 pb-24">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Edukasi & Panduan Medis</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Manfaat Hidup Sehat & Hidrasi</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Ketahui dasar ilmiah mengapa minum air di jam-jam tertentu dan berolahraga secara konsisten
          dapat melipatgandakan energi, fokus, dan daya tahan tubuh Anda.
        </p>

        <button
          onClick={onOpenAiChat}
          className="mt-4 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tanya Dokter AI Seputar Kesehatan
        </button>
      </div>

      {/* Interactive Water & BMI Health Calculator */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Kalkulator Kebutuhan Air & BMI</h3>
          </div>
          <span className="text-[10px] text-slate-400">Rumus: BB × 35 ml</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Berat Badan (kg)</label>
            <input
              type="number"
              min="30"
              max="200"
              value={calcWeight}
              onChange={(e) => setCalcWeight(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Tinggi Badan (cm)</label>
            <input
              type="number"
              min="100"
              max="240"
              value={calcHeight}
              onChange={(e) => setCalcHeight(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-center">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
            <span className="text-[10px] text-cyan-300 block mb-0.5">Kebutuhan Air Harian:</span>
            <span className="text-lg font-extrabold text-white">
              {recommendedWater.toLocaleString()} <span className="text-xs font-normal">ml</span>
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              ~{Math.round(recommendedWater / 250)} gelas per hari
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
            <span className="text-[10px] text-indigo-300 block mb-0.5">Indeks Massa Tubuh (BMI):</span>
            <span className="text-lg font-extrabold text-white">{bmi}</span>
            <span className={`text-[10px] font-bold block mt-0.5 ${bmiStatus.color}`}>
              {bmiStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Semua Panduan
        </button>
        <button
          onClick={() => setSelectedCategory('air_minum')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'air_minum'
              ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          💧 Manfaat Minum
        </button>
        <button
          onClick={() => setSelectedCategory('olahraga')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'olahraga'
              ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🏃 Manfaat Olahraga
        </button>
        <button
          onClick={() => setSelectedCategory('gaya_hidup')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'gaya_hidup'
              ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🌿 Pola Hidup Sehat
        </button>
      </div>

      {/* Articles Accordion List */}
      <div className="space-y-3.5">
        {filteredArticles.map((article) => {
          const isExpanded = expandedArticleId === article.id;

          return (
            <div
              key={article.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg transition-all"
            >
              {/* Accordion Header */}
              <button
                onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                    <span className="text-cyan-400 font-semibold capitalize">
                      {article.category.replace('_', ' ')}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{article.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{article.subtitle}</p>
                </div>

                <div className="p-1 rounded-lg bg-slate-800 text-slate-400 flex-shrink-0 mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Accordion Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-800/70 space-y-4 animate-in fade-in">
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    "{article.summary}"
                  </p>

                  {/* Key Benefits List */}
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Khasiat & Manfaat Utama:
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {article.keyBenefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Content Paragraphs */}
                  <div className="space-y-3">
                    {article.detailedContent.map((sec, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <h5 className="text-xs font-bold text-white mb-1">{sec.heading}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{sec.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Optional Schedule Table (for water article) */}
                  {article.scheduleTip && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Jadwal Waktu Ideal Minum 8 Gelas Sehari:
                      </h4>

                      <div className="space-y-2">
                        {article.scheduleTip.map((s, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-white block">
                                {s.period} ({s.time})
                              </span>
                              <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                                {s.reason}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 whitespace-nowrap">
                              {s.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
