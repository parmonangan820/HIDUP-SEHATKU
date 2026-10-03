import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Sparkles,
  Crown,
  X,
  Flame,
  Droplet,
  Utensils,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Heart,
  ChevronRight,
  BookOpen,
  ArrowRight,
  BookmarkPlus,
  RefreshCw,
  Salad,
  Zap,
} from 'lucide-react';

interface AIDietSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DietPlanResult {
  dietTitle: string;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  macroSplit: {
    protein: string;
    carbs: string;
    fat: string;
  };
  doctorPrinciples: string[];
  mealPlan: Array<{
    time: string;
    mealType: string;
    menu: string;
    calories: number;
    tips: string;
  }>;
  hydrationProtocol: string;
  commonMistakesToAvoid: string[];
  motivationalQuote: string;
}

export const AIDietSuccessModal: React.FC<AIDietSuccessModalProps> = ({ isOpen, onClose }) => {
  const { profile, isPro, setIsProModalOpen, addNote } = useHealth();
  const [dietGoal, setDietGoal] = useState<'weight_loss' | 'intermittent_fasting' | 'low_carb_sugar' | 'muscle_gain'>('weight_loss');
  const [customPreference, setCustomPreference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlanResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const weight = profile.weight || 64;
  const height = profile.height || 170;
  const age = profile.age || 26;
  const gender = profile.gender || 'pria';

  // BMI Calculation
  const heightM = height / 100;
  const bmi = heightM > 0 ? Math.round((weight / (heightM * heightM)) * 10) / 10 : 22.1;
  const bmiStatus =
    bmi < 18.5
      ? 'Berat Kurang'
      : bmi < 25
      ? 'Berat Normal Ideal'
      : bmi < 30
      ? 'Kelebihan Berat Badan'
      : 'Obesitas';

  // BMR & TDEE Calculation
  const bmr =
    gender === 'wanita'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.375);

  const generateLocalFallbackPlan = (goal: string): DietPlanResult => {
    let targetCal = tdee - 450;
    if (goal === 'muscle_gain') targetCal = tdee + 300;
    if (goal === 'intermittent_fasting') targetCal = tdee - 350;
    if (goal === 'low_carb_sugar') targetCal = tdee - 250;
    targetCal = Math.max(1250, targetCal);

    const waterTarget = Math.max(2200, Math.round(weight * 35));

    return {
      dietTitle:
        goal === 'weight_loss'
          ? `Protokol Diet Defisit Kalori Sehat & Anti Lapar (${profile.name || 'Sahabat'})`
          : goal === 'intermittent_fasting'
          ? `Protokol Intermittent Fasting (16:8) + Hidrasi Optimal (${profile.name || 'Sahabat'})`
          : goal === 'low_carb_sugar'
          ? `Diet Rendah Gula, Bebas Kolesterol & Ramah Lambung (${profile.name || 'Sahabat'})`
          : `Protokol Rekomposisi Tubuh & Pengencangan Otot (${profile.name || 'Sahabat'})`,
      dailyCalorieTarget: targetCal,
      dailyWaterTargetMl: waterTarget,
      macroSplit: {
        protein: `${Math.round(weight * 1.5)}g (25-30%)`,
        carbs: `${Math.round((targetCal * 0.45) / 4)}g (45%)`,
        fat: `${Math.round((targetCal * 0.25) / 9)}g (25%)`,
      },
      doctorPrinciples: [
        'Konsumsi 400-500 ml air hangat 15 menit sebelum setiap kali makan untuk mengaktifkan rasa kenyang alami dan mengurangi porsi berlebih hingga 13%.',
        'Prioritaskan protein tanpa lemak di setiap waktu makan (telur, tahu, tempe, dada ayam, ikan) untuk menjaga otot dan membakar lebih banyak kalori metabolisme.',
        'Ganti karbohidrat sederhana (tepung putih, minuman manis, sirup) dengan karbohidrat kaya serat (nasi merah, kentang rebus, ubi, oatmeal).',
        'Kunyah makanan secara perlahan (20-30 kali kunyah) agar otak menerima sinyal kenyang hormon leptin tepat waktu.',
        'Hentikan makan berat 3 jam sebelum tidur malam agar sistem pencernaan beristirahat dan liver membakar lemak saat tidur nyenyak.',
      ],
      mealPlan: [
        {
          time: '06:30 - 07:00',
          mealType: 'Bangun Pagi & Hidrasi Awal',
          menu: '400 ml air putih hangat + perasan jeruk nipis/lemon segar',
          calories: 10,
          tips: 'Membangunkan peristaltik lambung & usus serta membersihkan sisa racun semalam.',
        },
        {
          time: '07:30 - 08:30',
          mealType: 'Sarapan Padat Nutrisi',
          menu: '2 butir telur rebus + 1 lembar roti gandum utuh + 1 buah pisang/apel',
          calories: Math.round(targetCal * 0.26),
          tips: 'Protein tinggi di pagi hari menahan lapar hingga jam makan siang tanpa perlu ngemil.',
        },
        {
          time: '12:00 - 13:00',
          mealType: 'Makan Siang Berimbang',
          menu: 'Nasi merah 1 kepal (100g) + Dada ayam bakar/Ikan nila + Tumis bayam tempe kukus',
          calories: Math.round(targetCal * 0.38),
          tips: 'Gunakan piring model T: 1/2 piring sayur, 1/4 protein, 1/4 karbohidrat kompleks.',
        },
        {
          time: '15:30 - 16:30',
          mealType: 'Camilan Sehat & Hidrasi Sore',
          menu: '1 mangkok kecil pepaya potong atau segenggam edamame rebus + 300 ml air putih',
          calories: Math.round(targetCal * 0.11),
          tips: 'Kaya serat & enzim papain untuk melancarkan pencernaan.',
        },
        {
          time: '18:30 - 19:30',
          mealType: 'Makan Malam Ringan',
          menu: 'Sup bening sayur wortel, brokoli, bakso ayam atau tahu sutra (tanpa minyak & santan)',
          calories: Math.round(targetCal * 0.25),
          tips: 'Makanan berkuah hangat memberi rasa kenyang yang nyaman pada lambung.',
        },
      ],
      hydrationProtocol: `Sebagai rahasia utama diet sukses ala Dokter AI, minumlah minimal ${waterTarget} ml air putih per hari. Jadwalkan 1 gelas saat bangun tidur, 1 gelas 20 menit sebelum makan pagi/siang/malam, 1 gelas di sela jam kerja (10:00 & 15:00), dan 1 gelas 1 jam sebelum tidur. Hindari minum air dingin bergula saat makan.`,
      commonMistakesToAvoid: [
        'Melewatkan sarapan lalu makan berlebihan di malam hari (rebound eating).',
        'Minum kalori cair (boba, kopi susu manis, soda) yang tidak membuat kenyang tapi menambah timbunan lemak.',
        'Salah mengartikan rasa haus dehidrasi sebagai rasa lapar.',
      ],
      motivationalQuote:
        'Diet sukses bukan tentang menahan lapar berlebihan, melainkan tentang konsistensi memberikan nutrisi bergizi dan hidrasi murni bagi tubuh Anda setiap hari.',
    };
  };

  const handleGenerateDietPlan = async () => {
    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/diet-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          dietGoal,
          preferences: customPreference,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setDietPlan(data.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend diet-tips API unreachable, using client intelligence:', err);
    }

    // Dynamic smart generation fallback
    const fallback = generateLocalFallbackPlan(dietGoal);
    setDietPlan(fallback);
    setIsLoading(false);
  };

  const handleSaveToNotes = () => {
    if (!dietPlan) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const noteContent = `📋 PROGRAM DIET DOKTER AI:
${dietPlan.dietTitle}
Target Kalori: ${dietPlan.dailyCalorieTarget} kcal/hari
Target Air Minum: ${dietPlan.dailyWaterTargetMl} ml/hari
Makronutrien: Protein ${dietPlan.macroSplit.protein}, Karbo ${dietPlan.macroSplit.carbs}, Lemak ${dietPlan.macroSplit.fat}

5 ATURAN EMAS:
${dietPlan.doctorPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}

JADWAL MAKAN:
${dietPlan.mealPlan.map((m) => `• [${m.time}] ${m.mealType}: ${m.menu} (~${m.calories} kcal)`).join('\n')}

HIDRASI:
${dietPlan.hydrationProtocol}`;

    addNote({
      date: dateStr,
      time: timeStr,
      title: `🥗 Tips Diet Sukses Dokter AI - ${dietGoal.toUpperCase()}`,
      content: noteContent,
      category: 'makanan',
      mood: 'hebat',
      hasAlarm: true,
      alarmTime: '07:00',
      isAlarmActive: true,
      completed: false,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Glow ambient backgrounds */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30 cursor-pointer shadow-lg border border-slate-700/60"
          title="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-5 sm:p-7 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>EKSKLUSIF MEMBER PRO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
              Tips Diet Sukses Ala Dokter AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Panduan gizi klinis ilmiah, jadwal jam makan & protokol hidrasi medis yang dipersonalisasi khusus untuk tubuh Anda.
            </p>
          </div>

          {/* IF NOT PRO: Show Attractive Locked Teaser */}
          {!isPro ? (
            <div className="relative rounded-2xl bg-slate-950/80 border border-amber-500/30 p-6 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30">
                <Crown className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Fitur Ini Terkunci Khusus Pengguna PRO
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Dapatkan rencana menu harian lokal, hitungan kalori terukur (TDEE/BMR), dan protokol hidrasi pembakar lemak tanpa diet ekstrem.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Target Kalori & Makro Nutrien BMR</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">5 Aturan Emas Diet Dokter AI</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Menu Harian Bahan Makanan Lokal</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Protokol Hidrasi Pembakar Lemak</span>
                </div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => {
                  onClose();
                  setIsProModalOpen(true);
                }}
                className="w-full max-w-md py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Aktifkan Hidup Sehatku PRO Sekarang</span>
              </button>
            </div>
          ) : (
            /* IF PRO: Full AI Diet Success Engine */
            <div className="space-y-6">
              {/* User Bio Health Metrics Header */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-sm">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{profile.name || 'Sahabat Sehat'}</div>
                    <div className="text-[11px] text-slate-400">
                      {gender === 'wanita' ? 'Wanita' : 'Pria'} · {age} Tahun · {weight} kg · {height} cm
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                    BMI: <strong className="text-cyan-400">{bmi}</strong> ({bmiStatus})
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    BMR: <strong>{Math.round(bmr)} kcal</strong>
                  </span>
                </div>
              </div>

              {/* Diet Goal Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Salad className="w-4 h-4 text-emerald-400" />
                  <span>Pilih Fokus / Target Diet Anda:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'weight_loss',
                      title: '📉 Defisit Kalori & Turun BB Sehat',
                      desc: 'Turunkan lingkar perut dan lemak tubuh tanpa rasa lemas.',
                    },
                    {
                      id: 'intermittent_fasting',
                      title: '⏳ Intermittent Fasting (16:8)',
                      desc: 'Jendela makan 8 jam dengan hidrasi optimal pembakar lemak.',
                    },
                    {
                      id: 'low_carb_sugar',
                      title: '🍏 Rendah Gula & Ramah Lambung',
                      desc: 'Cegah lonjakan insulin, asam lambung dan kolesterol.',
                    },
                    {
                      id: 'muscle_gain',
                      title: '💪 Kencangkan Otot & Body Recomp',
                      desc: 'Tinggi protein untuk membentuk postur padat atletis.',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDietGoal(item.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        dietGoal === item.id
                          ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Preferensi Tambahan / Pantangan (Opsional):
                </label>
                <input
                  type="text"
                  value={customPreference}
                  onChange={(e) => setCustomPreference(e.target.value)}
                  placeholder="Contoh: Kurangi gorengan, suka ikan dan tahu tempe, tidak bisa makan udang"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateDietPlan}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dokter AI Sedang Menganalisis & Menyusun Diet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>{dietPlan ? 'Perbarui Rencana Diet Dokter AI' : 'Buat Rencana Diet Sukses Dokter AI'}</span>
                  </>
                )}
              </button>

              {/* Diet Plan Results Section */}
              {dietPlan && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300 pt-2 border-t border-slate-800">
                  {/* Title & Nutritional Targets */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                        Hasil Analisis Medis
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">{dietPlan.dietTitle}</h3>
                    </div>

                    {/* Calorie & Water Targets */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Target Kalori</div>
                        <div className="text-sm font-black text-amber-300 mt-0.5">
                          {dietPlan.dailyCalorieTarget} <span className="text-[10px]">kcal</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Target Air Minum</div>
                        <div className="text-sm font-black text-cyan-400 mt-0.5">
                          {dietPlan.dailyWaterTargetMl} <span className="text-[10px]">ml</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Rasio Protein</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          {dietPlan.macroSplit.protein}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Karbo / Lemak</div>
                        <div className="text-xs font-bold text-slate-300 mt-0.5">
                          {dietPlan.macroSplit.carbs}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Doctor AI Golden Rules */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>5 Aturan Emas Diet Sukses Dokter AI</span>
                    </h4>
                    <div className="space-y-2">
                      {dietPlan.doctorPrinciples.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal Plan Timeline */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Jadwal Jam Makan & Menu Bergizi Rekomendasi</span>
                    </h4>

                    <div className="space-y-3">
                      {dietPlan.mealPlan.map((meal, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                                {meal.time}
                              </span>
                              <span>{meal.mealType}</span>
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold font-mono">
                              ~{meal.calories} kcal
                            </span>
                          </div>

                          <div className="text-xs text-slate-200 font-medium pl-1">
                            {meal.menu}
                          </div>

                          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                            💡 <em>Tips Dokter:</em> {meal.tips}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hydration Fat Burning Protocol */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-cyan-400" />
                      <span>Protokol Hidrasi Medis Pembakar Lemak</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {dietPlan.hydrationProtocol}
                    </p>
                  </div>

                  {/* Fatal Mistakes to Avoid */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Pantangan Fatal yang Harus Dihindari</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {dietPlan.commonMistakesToAvoid.map((mistake, mIdx) => (
                        <li key={mIdx} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Motivational Quote */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center italic text-xs text-amber-200">
                    "{dietPlan.motivationalQuote}"
                  </div>

                  {/* Save to Notes Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveToNotes}
                      className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4 text-amber-400" />
                      <span>
                        {savedSuccess
                          ? '✓ Berhasil Disimpan ke Catatan Sehat!'
                          : 'Simpan Rencana Diet Ini ke Catatan Sehat Harian'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
