import React, { useState, useMemo } from 'react';
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
  Calendar,
  ListChecks,
  Activity,
  Scale,
  Target,
  Copy,
  Check,
} from 'lucide-react';

interface AIDietSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProgramPhase {
  phaseNumber: number;
  title: string;
  duration: string;
  focus: string;
  doctorGuidance: string;
}

export interface DayMealItem {
  menu: string;
  calories: number;
  protein?: string;
}

export interface WeeklyMenuItem {
  day: number;
  dayName: string;
  breakfast: DayMealItem;
  lunch: DayMealItem;
  snack: DayMealItem;
  dinner: DayMealItem;
  dayTips: string;
}

export interface DailyRoutineItem {
  time: string;
  activity: string;
  guideline: string;
  calories: number;
}

export interface DietPlanResult {
  programTitle: string;
  programSubtitle?: string;
  dietTitle?: string;
  durationDays: number;
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  projectedLossWeeklyKg?: number;
  projectedCompletionWeeks?: number;
  macroSplit: {
    protein: string;
    carbs: string;
    fat: string;
  };
  programPhases?: ProgramPhase[];
  doctorPrinciples: string[];
  dailyRoutineTimeline?: DailyRoutineItem[];
  weeklyMenuPlan?: WeeklyMenuItem[];
  mealPlan?: Array<{
    time: string;
    mealType: string;
    menu: string;
    calories: number;
    tips: string;
  }>;
  hydrationProtocol: string;
  dailyChecklist?: string[];
  commonMistakesToAvoid: string[];
  motivationalQuote: string;
}

export const AIDietSuccessModal: React.FC<AIDietSuccessModalProps> = ({ isOpen, onClose }) => {
  const { profile, isPro, setIsProModalOpen, addNote } = useHealth();

  // Program Configuration State
  const [dietGoal, setDietGoal] = useState<'weight_loss' | 'intermittent_fasting' | 'low_carb_sugar' | 'muscle_gain' | 'cholesterol_heart'>('weight_loss');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active'>('moderate');
  const [medicalCondition, setMedicalCondition] = useState<'umum' | 'maag_gerd' | 'diabetes_gula' | 'kolesterol' | 'vegetarian'>('umum');
  const [customPreference, setCustomPreference] = useState('');

  // Results State
  const [isLoading, setIsLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'jadwal' | 'checklist' | 'fase'>('menu');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [checkedHabits, setCheckedHabits] = useState<Record<number, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Suggested Target Weight
  const defaultTargetWeight = useMemo(() => {
    if (bmi > 24.9) {
      // Aim for upper normal BMI ~ 23.5
      return Math.round(23.5 * heightM * heightM);
    }
    return weight;
  }, [bmi, heightM, weight]);

  // BMR & TDEE Calculation
  const bmr =
    gender === 'wanita'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  };
  const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.375));

  const generateLocalFallbackPlan = (): DietPlanResult => {
    let targetCal = tdee - 450;
    let projLoss = 0.5;
    if (dietGoal === 'muscle_gain') {
      targetCal = tdee + 300;
      projLoss = -0.2;
    } else if (dietGoal === 'intermittent_fasting') {
      targetCal = tdee - 380;
      projLoss = 0.45;
    } else if (dietGoal === 'low_carb_sugar') {
      targetCal = tdee - 300;
      projLoss = 0.4;
    }
    targetCal = Math.max(gender === 'wanita' ? 1200 : 1400, targetCal);

    const waterTarget = Math.max(2200, Math.round(weight * 35));
    const targetW = targetWeight ? Number(targetWeight) : defaultTargetWeight;
    const diff = Math.abs(weight - targetW);
    const estWeeks = Math.max(1, Math.round(diff / (projLoss > 0 ? projLoss : 0.5)));

    const title =
      dietGoal === 'weight_loss'
        ? `Program Diet Sukses Dokter AI: Defisit Kalori & Fat Loss (${profile.name || 'Sahabat Sehat'})`
        : dietGoal === 'intermittent_fasting'
        ? `Program Diet Sukses Dokter AI: Intermittent Fasting 16:8 (${profile.name || 'Sahabat Sehat'})`
        : dietGoal === 'low_carb_sugar'
        ? `Program Diet Sukses Dokter AI: Rendah Gula & Ramah Lambung (${profile.name || 'Sahabat Sehat'})`
        : `Program Diet Sukses Dokter AI: Body Recomposition & Otot (${profile.name || 'Sahabat Sehat'})`;

    return {
      programTitle: title,
      programSubtitle: `Program terstruktur ${durationDays} hari berbasis sains gizi klinis untuk mencapai target berat ideal ${targetW} kg secara bertahap dan aman.`,
      dietTitle: title,
      durationDays,
      dailyCalorieTarget: targetCal,
      dailyWaterTargetMl: waterTarget,
      projectedLossWeeklyKg: projLoss,
      projectedCompletionWeeks: estWeeks,
      macroSplit: {
        protein: `${Math.round(weight * 1.6)}g (25-30%)`,
        carbs: `${Math.round((targetCal * 0.45) / 4)}g (45%)`,
        fat: `${Math.round((targetCal * 0.25) / 9)}g (25%)`,
      },
      programPhases: [
        {
          phaseNumber: 1,
          title: 'Fase 1: Detoksifikasi & Adaptasi Glukosa (Hari 1-3)',
          duration: 'Hari 1 - 3',
          focus: 'Mereduksi retensi cairan tubuh, menstabilkan lonjakan insulin, dan membiasakan hidrasi pre-meal 400ml.',
          doctorGuidance: 'Jangan kaget jika buang air kecil lebih sering; ini adalah proses pelepasan natrium dan glikogen berlebih.',
        },
        {
          phaseNumber: 2,
          title: 'Fase 2: Akselerasi Pembakaran Lemak (Hari 4-10)',
          duration: 'Hari 4 - 10',
          focus: 'Mengoptimalkan defisit kalori bersih, memicu lipolisis lemak visceral cadangan tubuh tanpa rasa lemas.',
          doctorGuidance: 'Pertahankan asupan protein minimal 1.5-1.6g per kg berat badan agar massa otot terjaga dan laju metabolisme basal tetap tinggi.',
        },
        {
          phaseNumber: 3,
          title: `Fase 3: Stabilisasi & Ketahanan Metabolisme (Hari 11-${durationDays})`,
          duration: `Hari 11 - ${durationDays}`,
          focus: 'Mencegah adaptasi metabolik melambat, mengunci kebiasaan pola makan sadar (mindful eating), dan mencegah efek yoyo.',
          doctorGuidance: 'Fokus pada konsistensi jam makan dan hidrasi yang teratur, bukan pada pembatasan ekstrem.',
        },
      ],
      doctorPrinciples: [
        'Konsumsi 400-500 ml air hangat 15 menit sebelum setiap kali makan untuk mengaktifkan peregangan lambung dan menurunkan asupan kalori makan hingga 13%.',
        'Terapkan Prinsip Piring T: 1/2 piring sayuran tinggi serat, 1/4 protein tanpa lemak, 1/4 karbohidrat kompleks (nasi merah/ubi/kentang rebus).',
        'Prioritaskan sumber protein lokal berkualitas (telur rebus, tempe bacem panggang, tahu kukus, dada ayam, ikan kembung kaya Omega-3).',
        'Kunyah makanan secara perlahan (25-30 kali kunyah) agar hormon leptin memiliki waktu 15 menit mengirimkan sinyal kenyang penuh ke otak.',
        'Kunci jam makan malam: selesaikan makan berat maksimal 3 jam sebelum tidur malam (pukul 19:30) agar liver leluasa membakar lemak saat tidur nyenyak.',
      ],
      dailyRoutineTimeline: [
        {
          time: '06:00 - 06:45',
          activity: 'Bangun Tidur & Hidrasi Awal',
          guideline: 'Minum 400 ml air putih hangat dengan perasan jeruk nipis/lemon segar untuk merangsang peristaltik usus.',
          calories: 10,
        },
        {
          time: '07:30 - 08:30',
          activity: 'Sarapan Padat Nutrisi & Protein',
          guideline: '2 butir telur rebus + 1 lembar roti gandum utuh + irisan timun dan tomat segar.',
          calories: Math.round(targetCal * 0.25),
        },
        {
          time: '10:00 - 10:30',
          activity: 'Hidrasi Kerja Sela Pagi',
          guideline: 'Minum 1-2 gelas (300-400 ml) air putih untuk menjaga sirkulasi darah dan mencegah sinyal lapar palsu.',
          calories: 0,
        },
        {
          time: '12:00 - 13:00',
          activity: 'Makan Siang Berimbang Piring T',
          guideline: 'Nasi merah 1 kepal (100g) + Dada ayam bakar bumbu kunyit + Sayur bening bayam jagung + Tahu kukus.',
          calories: Math.round(targetCal * 0.38),
        },
        {
          time: '15:30 - 16:00',
          activity: 'Camilan Sore Sehat & Hidrasi',
          guideline: '1 mangkok kecil pepaya potong atau segenggam edamame rebus + 300 ml air putih dingin segar.',
          calories: Math.round(targetCal * 0.12),
        },
        {
          time: '18:30 - 19:30',
          activity: 'Makan Malam Ringan (Cut-off Time)',
          guideline: 'Sup bening ikan nila/tahu sutra dengan wortel, buncis, brokoli (tanpa santan & tanpa minyak jenuh).',
          calories: Math.round(targetCal * 0.25),
        },
        {
          time: '21:30 - 22:00',
          activity: 'Hidrasi Relaksasi Malam & Istirahat',
          guideline: 'Segelas air putih hangat 1 jam sebelum tidur; istirahat tidur malam 7-8 jam untuk optimasi pembakaran lemak.',
          calories: 0,
        },
      ],
      weeklyMenuPlan: [
        {
          day: 1,
          dayName: 'Hari 1 - Adaptasi Metabolisme',
          breakfast: { menu: '2 butir telur rebus + 1 lembar roti gandum + irisan tomat', calories: 280, protein: '18g' },
          lunch: { menu: 'Nasi merah 100g + Dada ayam bakar kunyit + Sayur bening bayam jagung', calories: 480, protein: '35g' },
          snack: { menu: '1 mangkok kecil pepaya potong + 300 ml air putih', calories: 90, protein: '2g' },
          dinner: { menu: 'Sup tahu sutra brokoli wortel kuah kaldu jamur bening', calories: 260, protein: '16g' },
          dayTips: 'Patuhi jadwal minum air 400ml sebelum makan siang untuk menekan porsi berlebih.',
        },
        {
          day: 2,
          dayName: 'Hari 2 - Akselerasi Hidrasi',
          breakfast: { menu: 'Oatmeal seduh susu kedelai tanpa gula + 1 buah pisang ambon + 1 telur rebus', calories: 290, protein: '16g' },
          lunch: { menu: 'Kentang rebus 150g + Ikan kembung bumbu kuning kukus + Tumis buncis tempe', calories: 495, protein: '34g' },
          snack: { menu: 'Segenggam kacang edamame rebus + 300 ml air putih', calories: 110, protein: '7g' },
          dinner: { menu: 'Tumis tauge tahu dada ayam cincang tanpa minyak berlebih + kuah sayur', calories: 270, protein: '22g' },
          dayTips: 'Ikan kembung kaya asam lemak Omega-3 yang membantu membakar lemak perut.',
        },
        {
          day: 3,
          dayName: 'Hari 3 - Optimasi Serat Usus',
          breakfast: { menu: 'Omelet 2 telur isi bayam jamur + 1 potong ubi cilembu rebus kecil', calories: 285, protein: '19g' },
          lunch: { menu: 'Nasi merah 100g + Pepes ikan nila daun kemangi + Sayur asem bening labu siam', calories: 475, protein: '33g' },
          snack: { menu: '1 buah apel malang segar potong + 300 ml air putih hangat', calories: 85, protein: '1g' },
          dinner: { menu: 'Sup ayam kampung tanpa kulit dengan wortel & kembang kol', calories: 260, protein: '24g' },
          dayTips: 'Serat dari labu siam dan apel menjaga rasa kenyang lebih lama tanpa kembung.',
        },
        {
          day: 4,
          dayName: 'Hari 4 - Pembakaran Lemak Aktif',
          breakfast: { menu: '2 butir telur orak-arik (sedikit minyak kelapa) + 1 buah pisang + 350ml air', calories: 280, protein: '18g' },
          lunch: { menu: 'Nasi merah 100g + Ayam ungkep panggang tanpa kulit + Sayur lodeh bening tempe', calories: 500, protein: '36g' },
          snack: { menu: 'Puding chia seed / agar-agar tawar dengan perasan jeruk murni', calories: 80, protein: '3g' },
          dinner: { menu: 'Capcay kuah bening aneka sayur (brokoli, sawi, wortel) dengan bakso ikan', calories: 265, protein: '18g' },
          dayTips: 'Jangan lewatkan jalan kaki ringan 20 menit di pagi atau sore hari.',
        },
        {
          day: 5,
          dayName: 'Hari 5 - Kekuatan Otot & Stamina',
          breakfast: { menu: 'Sandwich gandum isi telur rebus dan daun selada + 1 gelas air lemon', calories: 295, protein: '17g' },
          lunch: { menu: 'Kentang panggang 150g + Steak tempe bumbu lada hitam + Tumis pokcoy', calories: 485, protein: '28g' },
          snack: { menu: 'Potongan melon manis segar + 300 ml air putih', calories: 90, protein: '2g' },
          dinner: { menu: 'Sup bening tahu sutra & fillet ikan dori rebus dengan perasan jeruk nipis', calories: 250, protein: '23g' },
          dayTips: 'Steak tempe adalah sumber protein nabati terbaik bebas kolesterol.',
        },
        {
          day: 6,
          dayName: 'Hari 6 - Pembersihan & Detoks Ringan',
          breakfast: { menu: 'Bubur oatmeal gurih kaldu ayam + suwiran dada ayam + daun bawang', calories: 275, protein: '20g' },
          lunch: { menu: 'Nasi merah 100g + Ikan tongkol balado kukus (cabai segar) + Sayur katuk/bayam', calories: 490, protein: '35g' },
          snack: { menu: '1 mangkok pepaya potong + perasan jeruk nipis + 300 ml air', calories: 85, protein: '2g' },
          dinner: { menu: 'Sup bening jamur tiram, jagung manis muda, dan tahu putih', calories: 240, protein: '15g' },
          dayTips: 'Pepaya dan jeruk nipis kaya enzim pencernaan untuk melancarkan BAB esok pagi.',
        },
        {
          day: 7,
          dayName: 'Hari 7 - Evaluasi & Reward Sehat',
          breakfast: { menu: '2 butir telur rebus + 1 roti gandum + alpukat 1/4 buah tabur garam lada', calories: 310, protein: '18g' },
          lunch: { menu: 'Nasi merah 100g + Sate ayam fillet dada (tanpa kulit & sedikit bumbu kacang) + lalapan timun', calories: 510, protein: '38g' },
          snack: { menu: 'Segenggam edamame rebus hangat + 300 ml air putih', calories: 100, protein: '6g' },
          dinner: { menu: 'Sup rolade tahu ayam sayuran kuah bening kaldu jamur', calories: 270, protein: '21g' },
          dayTips: 'Selamat telah menyelesaikan 7 hari pertama! Timbang berat badan di pagi hari saat perut kosong.',
        },
      ],
      hydrationProtocol: `Sebagai rahasia sukses utama Program Diet Dokter AI, penuhi minimal ${waterTarget} ml air putih per hari. Jadwalkan: 1 gelas (400 ml) saat bangun tidur, 1 gelas 20 menit sebelum makan pagi/siang/malam, 1 gelas pukul 10:00 dan 15:00 di sela aktivitas kerja, dan 1 gelas 1 jam sebelum tidur. Hidrasi optimal mencegah tubuh keliru mendeteksi rasa haus sebagai rasa lapar.`,
      dailyChecklist: [
        'Minum 400 ml air hangat saat bangun pagi',
        'Sarapan tinggi protein sebelum pukul 08:30',
        'Minum 400 ml air 15 menit sebelum makan siang',
        'Makan siang porsi piring T (1/2 sayur, 1/4 protein, 1/4 karbo)',
        'Penuhi camilan sore sehat bebas gorengan',
        'Selesaikan makan malam sebelum pukul 19:30',
        `Total target air minum harian ${waterTarget} ml tercapai`,
        'Jalan kaki atau aktivitas fisik aktif minimal 20-30 menit',
      ],
      commonMistakesToAvoid: [
        'Makan terlalu sedikit atau melewatkan sarapan lalu makan berlebihan di malam hari (rebound eating).',
        'Minum kalori cair (es teh manis, boba, kopi susu kental manis) yang menyumbang 300-500 kalori tersembunyi tanpa rasa kenyang.',
        'Mengabaikan asupan air putih sehingga laju pembakaran lemak (lipolisis) di organ hati melambat drastis.',
      ],
      motivationalQuote:
        'Program diet yang sukses bukanlah tentang menahan lapar berlebihan, melainkan tentang komitmen memberikan nutrisi seimbang terbaik dan hidrasi murni bagi tubuh Anda setiap hari.',
    };
  };

  const handleGenerateProgram = async () => {
    setIsLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/diet-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          dietGoal,
          targetWeight: targetWeight ? Number(targetWeight) : defaultTargetWeight,
          durationDays,
          activityLevel,
          medicalCondition,
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
      console.warn('Backend diet-program API unreachable, using client clinical engine:', err);
    }

    // Dynamic smart generation fallback
    const fallback = generateLocalFallbackPlan();
    setDietPlan(fallback);
    setIsLoading(false);
  };

  const handleSaveToNotes = () => {
    if (!dietPlan) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const noteContent = `📋 PROGRAM DIET SUKSES DOKTER AI:
${dietPlan.programTitle || dietPlan.dietTitle}
Durasi Program: ${dietPlan.durationDays} Hari
Target Kalori: ${dietPlan.dailyCalorieTarget} kcal/hari
Target Hidrasi: ${dietPlan.dailyWaterTargetMl} ml/hari
Makronutrien: Protein ${dietPlan.macroSplit.protein}, Karbo ${dietPlan.macroSplit.carbs}, Lemak ${dietPlan.macroSplit.fat}
Estimasi Penurunan: ${dietPlan.projectedLossWeeklyKg ? `${dietPlan.projectedLossWeeklyKg} kg/minggu` : 'Bertahap'}

5 ATURAN EMAS DOKTER AI:
${dietPlan.doctorPrinciples.map((p, i) => `${i + 1}. ${p}`).join('\n')}

PROTOKOL HIDRASI:
${dietPlan.hydrationProtocol}

MOTIVASI DOKTER:
"${dietPlan.motivationalQuote}"`;

    addNote({
      date: dateStr,
      time: timeStr,
      title: `🥗 ${dietPlan.programTitle || 'Program Diet Sukses Dokter AI'}`,
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

  const handleCopySummary = () => {
    if (!dietPlan) return;
    const summary = `${dietPlan.programTitle || 'Program Diet Sukses Dokter AI'}
Target Kalori: ${dietPlan.dailyCalorieTarget} kcal/hari
Target Air Minum: ${dietPlan.dailyWaterTargetMl} ml/hari
Makro: Protein ${dietPlan.macroSplit.protein}, Karbo ${dietPlan.macroSplit.carbs}, Lemak ${dietPlan.macroSplit.fat}
Aturan Utama:
${dietPlan.doctorPrinciples.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleHabit = (idx: number) => {
    setCheckedHabits((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checklistItems = dietPlan?.dailyChecklist || [
    'Minum 400 ml air hangat saat bangun pagi',
    'Sarapan tinggi protein sebelum pukul 08:30',
    'Minum 400 ml air 15 menit sebelum makan siang',
    'Makan siang porsi piring T (1/2 sayur, 1/4 protein, 1/4 karbo)',
    'Penuhi camilan sore sehat bebas gorengan',
    'Selesaikan makan malam sebelum pukul 19:30',
    `Total target air minum harian ${dietPlan?.dailyWaterTargetMl || 2400} ml tercapai`,
    'Jalan kaki atau aktivitas fisik aktif minimal 20-30 menit',
  ];

  const completedCount = checklistItems.filter((_, idx) => checkedHabits[idx]).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Glow ambient backgrounds */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-500/10">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>PROGRAM MEDIS EKSKLUSIF PRO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Program Diet Sukses Dokter AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Sistem program gizi klinis komprehensif, menu harian bahan lokal Nusantara, jadwal jam makan medis, dan evaluasi kepatuhan harian.
            </p>
          </div>

          {/* IF NOT PRO: Show Attractive Locked Teaser */}
          {!isPro ? (
            <div className="relative rounded-2xl bg-slate-950/80 border border-emerald-500/30 p-6 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30">
                <Crown className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Program Diet Dokter AI Terkunci Khusus PRO
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Dapatkan rancangan program diet bertahap (Fase 1-3), rotasi menu 7 hari bahan lokal, target kalori BMR/TDEE presisi, dan checklist kepatuhan harian.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Rencana Program 7, 14, & 30 Hari</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Menu Harian Nusantara (7 Hari)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Jadwal Makan & Hidrasi Medis</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300">Pelacak Checklist Kepatuhan Harian</span>
                </div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => {
                  onClose();
                  setIsProModalOpen(true);
                }}
                className="w-full max-w-md py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Buka Program Diet Dokter AI (PRO)</span>
              </button>
            </div>
          ) : (
            /* IF PRO: Full AI Diet Program Engine */
            <div className="space-y-6">
              {/* User Bio Health Metrics Header */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{profile.name || 'Sahabat Sehat'}</div>
                    <div className="text-[11px] text-slate-400">
                      {gender === 'wanita' ? 'Wanita' : 'Pria'} · {age} Thn · {weight} kg · {height} cm
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
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                    TDEE: <strong>{tdee} kcal</strong>
                  </span>
                </div>
              </div>

              {/* SYSTEM CONFIGURATION FORM */}
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>Konfigurasi & Parameter Program Pasien</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Sistem Personalisasi AI</span>
                </div>

                {/* Diet Goal Options */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Salad className="w-4 h-4 text-emerald-400" />
                    <span>1. Pilih Fokus Utama Program Diet:</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'weight_loss',
                        title: '📉 Defisit Kalori & Fat Loss Sehat',
                        desc: 'Turunkan lingkar perut dan lemak tubuh tanpa rasa lemas.',
                      },
                      {
                        id: 'intermittent_fasting',
                        title: '⏳ Intermittent Fasting (16:8)',
                        desc: 'Jendela makan 8 jam dengan hidrasi optimal pembakar lemak.',
                      },
                      {
                        id: 'low_carb_sugar',
                        title: '🍏 Rendah Gula & Ramah Lambung/GERD',
                        desc: 'Cegah lonjakan insulin, aman untuk lambung dan asam urat.',
                      },
                      {
                        id: 'muscle_gain',
                        title: '💪 Kencangkan Otot & Body Recomp',
                        desc: 'Tinggi protein lokal untuk bentuk postur padat atletis.',
                      },
                      {
                        id: 'cholesterol_heart',
                        title: '❤️ Bebas Kolesterol & Detoks Jantung',
                        desc: 'Kaya Omega-3, sayuran hijau rebus, dan bebas lemak jenuh.',
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDietGoal(item.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          dietGoal === item.id
                            ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Target Weight Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Duration Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span>Durasi Program:</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { days: 7, label: '7 Hari' },
                        { days: 14, label: '14 Hari' },
                        { days: 30, label: '30 Hari' },
                      ].map((d) => (
                        <button
                          key={d.days}
                          type="button"
                          onClick={() => setDurationDays(d.days)}
                          className={`py-2 px-2 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            durationDays === d.days
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Target Berat Badan (kg):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        placeholder={`Saran: ${defaultTargetWeight} kg`}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">kg</span>
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aktivitas Harian:</span>
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="sedentary">Sedentary (Jarang gerak / Meja)</option>
                      <option value="light">Ringan (Olahraga 1-2x/minggu)</option>
                      <option value="moderate">Sedang (Olahraga 3-5x/minggu)</option>
                      <option value="active">Aktif (Pekerja fisik / Intens)</option>
                    </select>
                  </div>
                </div>

                {/* Medical Condition & Preferences Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kondisi Khusus / Riwayat Pasien:</span>
                    </label>
                    <select
                      value={medicalCondition}
                      onChange={(e) => setMedicalCondition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="umum">Umum (Tanpa riwayat khusus)</option>
                      <option value="maag_gerd">Ramah Lambung / Bebas Asam Lambung & GERD</option>
                      <option value="diabetes_gula">Bebas Gula / Kontrol Lonjakan Insulin</option>
                      <option value="kolesterol">Rendah Lemak Jenuh / Kolesterol & Asam Urat</option>
                      <option value="vegetarian">Vegetarian / Dominan Protein Nabati</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Preferensi / Pantangan Pribadi (Opsional):
                    </label>
                    <input
                      type="text"
                      value={customPreference}
                      onChange={(e) => setCustomPreference(e.target.value)}
                      placeholder="Contoh: Suka ikan dan tahu tempe, kurangi minyak goreng"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateProgram}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dokter AI Sedang Menganalisis & Menyusun Program...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>{dietPlan ? 'Perbarui Program Diet Sukses Dokter AI' : 'Susun Program Diet Sukses Dokter AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* PROGRAM RESULTS SYSTEM */}
              {dietPlan && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300 pt-2 border-t border-slate-800">
                  {/* Program Title Banner & Vital Targets */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 border border-emerald-500/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                          Program Resmi Medis
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 text-[10px] font-bold">
                          {dietPlan.durationDays} Hari
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopySummary}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Salin ringkasan"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Tersalin' : 'Salin Ringkasan'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">{dietPlan.programTitle || dietPlan.dietTitle}</h3>
                      {dietPlan.programSubtitle && (
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{dietPlan.programSubtitle}</p>
                      )}
                    </div>

                    {/* Calorie, Hydration, Macro & Projection Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Target Kalori Harian</div>
                        <div className="text-sm font-black text-amber-300 mt-0.5">
                          {dietPlan.dailyCalorieTarget} <span className="text-[10px]">kcal</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Target Air Minum Medis</div>
                        <div className="text-sm font-black text-cyan-400 mt-0.5">
                          {dietPlan.dailyWaterTargetMl} <span className="text-[10px]">ml</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Rasio Makro (Protein)</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                          {dietPlan.macroSplit.protein}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400">Proyeksi Penurunan</div>
                        <div className="text-xs font-bold text-teal-300 mt-0.5">
                          {dietPlan.projectedLossWeeklyKg ? `~${dietPlan.projectedLossWeeklyKg} kg/mgg` : 'Bertahap'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUB-TABS NAVIGATION */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
                    {[
                      { id: 'menu', label: 'Rotasi Menu 7 Hari', icon: Salad },
                      { id: 'jadwal', label: 'Jadwal Makan & Hidrasi', icon: Clock },
                      { id: 'checklist', label: 'Checklist Kepatuhan Harian', icon: ListChecks },
                      { id: 'fase', label: 'Fase & Aturan Emas', icon: BookOpen },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB 1: MENU HARIAN (HARI 1 - 7 SWITCHER) */}
                  {activeTab === 'menu' && (
                    <div className="space-y-4">
                      {/* Day Pill Buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {(dietPlan.weeklyMenuPlan || []).map((dayItem) => (
                          <button
                            key={dayItem.day}
                            type="button"
                            onClick={() => setSelectedDay(dayItem.day)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                              selectedDay === dayItem.day
                                ? 'bg-emerald-400 text-slate-950 shadow-md'
                                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            Hari {dayItem.day}
                          </button>
                        ))}
                      </div>

                      {/* Selected Day Menu Details */}
                      {(() => {
                        const currentDay =
                          dietPlan.weeklyMenuPlan?.find((m) => m.day === selectedDay) ||
                          dietPlan.weeklyMenuPlan?.[0] || {
                            day: 1,
                            dayName: 'Hari 1 - Adaptasi Metabolisme',
                            breakfast: { menu: '2 telur rebus + 1 roti gandum + irisan tomat', calories: 280, protein: '18g' },
                            lunch: { menu: 'Nasi merah 100g + Dada ayam bakar kunyit + Sayur bening bayam', calories: 480, protein: '35g' },
                            snack: { menu: '1 mangkok kecil pepaya potong + 300 ml air putih', calories: 90, protein: '2g' },
                            dinner: { menu: 'Sup tahu sutra brokoli wortel kuah bening', calories: 260, protein: '16g' },
                            dayTips: 'Patuhi jadwal minum air 400ml sebelum makan siang untuk menekan porsi berlebih.',
                          };

                        return (
                          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-emerald-400" />
                                <span>{currentDay.dayName}</span>
                              </h4>
                              <span className="text-[11px] text-amber-400 font-mono">
                                Total: ~{currentDay.breakfast.calories + currentDay.lunch.calories + currentDay.snack.calories + currentDay.dinner.calories} kcal
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {/* Sarapan */}
                              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-amber-300 flex items-center gap-1">
                                    <span>🌅 Sarapan Pagi</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{currentDay.breakfast.calories} kcal
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium">{currentDay.breakfast.menu}</div>
                                {currentDay.breakfast.protein && (
                                  <div className="text-[10px] text-emerald-400">Protein: {currentDay.breakfast.protein}</div>
                                )}
                              </div>

                              {/* Makan Siang */}
                              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                                    <span>☀️ Makan Siang (Piring T)</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{currentDay.lunch.calories} kcal
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium">{currentDay.lunch.menu}</div>
                                {currentDay.lunch.protein && (
                                  <div className="text-[10px] text-emerald-400">Protein: {currentDay.lunch.protein}</div>
                                )}
                              </div>

                              {/* Camilan Sore */}
                              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-teal-300 flex items-center gap-1">
                                    <span>🍵 Camilan Sore Sehat</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{currentDay.snack.calories} kcal
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium">{currentDay.snack.menu}</div>
                                {currentDay.snack.protein && (
                                  <div className="text-[10px] text-emerald-400">Protein: {currentDay.snack.protein}</div>
                                )}
                              </div>

                              {/* Makan Malam */}
                              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                                    <span>🌙 Makan Malam Ringan</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ~{currentDay.dinner.calories} kcal
                                  </span>
                                </div>
                                <div className="text-xs text-white font-medium">{currentDay.dinner.menu}</div>
                                {currentDay.dinner.protein && (
                                  <div className="text-[10px] text-emerald-400">Protein: {currentDay.dinner.protein}</div>
                                )}
                              </div>
                            </div>

                            {/* Day Doctor Tips */}
                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                              💡 <strong>Tips Dokter Hari Ini:</strong> {currentDay.dayTips}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB 2: JADWAL JAM MAKAN & PROTOKOL HIDRASI */}
                  {activeTab === 'jadwal' && (
                    <div className="space-y-4">
                      {/* Daily Routine Timeline */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span>Jadwal Harian Jam Makan & Rutinitas Sehat</span>
                        </h4>

                        <div className="space-y-2.5">
                          {(dietPlan.dailyRoutineTimeline || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                                    {item.time}
                                  </span>
                                  <span>{item.activity}</span>
                                </span>
                                {item.calories > 0 && (
                                  <span className="text-[11px] text-amber-400 font-mono font-semibold">
                                    ~{item.calories} kcal
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-300 pl-1">{item.guideline}</div>
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
                    </div>
                  )}

                  {/* TAB 3: CHECKLIST KEPATUHAN HARIAN (INTERACTIVE HABIT TRACKER) */}
                  {activeTab === 'checklist' && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-emerald-400" />
                            <span>Checklist Kepatuhan Program Hari Ini</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Centang setiap kebiasaan yang telah Anda selesaikan hari ini
                          </p>
                        </div>
                        <span className="text-xs font-black text-emerald-400">
                          {completedCount} / {checklistItems.length} ({progressPercent}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-2">
                        {checklistItems.map((item, idx) => {
                          const isDone = !!checkedHabits[idx];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleHabit(idx)}
                              className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-200'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                    : 'border-slate-700 bg-slate-800'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                {item}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {progressPercent === 100 && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold">
                          🎉 Luar biasa! Seluruh checklist program diet hari ini berhasil Anda penuhi secara sempurna!
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: FASE PROGRAM & ATURAN EMAS */}
                  {activeTab === 'fase' && (
                    <div className="space-y-4">
                      {/* Program Phases Roadmap */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span>Tahapan & Fase Program Diet Medis</span>
                        </h4>

                        <div className="space-y-2.5">
                          {(dietPlan.programPhases || []).map((phase, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                                    {phase.phaseNumber}
                                  </span>
                                  <span>{phase.title}</span>
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold">
                                  {phase.duration}
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 pl-6">{phase.focus}</div>
                              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 ml-6">
                                👨‍⚕️ <em>Arahan Dokter:</em> {phase.doctorGuidance}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5 Doctor AI Golden Rules */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>5 Aturan Emas Program Diet Dokter AI</span>
                        </h4>
                        <div className="space-y-2">
                          {dietPlan.doctorPrinciples.map((rule, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
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
                    </div>
                  )}

                  {/* Motivational Quote */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center italic text-xs text-emerald-200">
                    "{dietPlan.motivationalQuote}"
                  </div>

                  {/* Save to Notes Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveToNotes}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4 text-slate-950" />
                      <span>
                        {savedSuccess
                          ? '✓ Berhasil Disimpan ke Catatan Sehat!'
                          : 'Simpan Program Diet Ini ke Catatan Sehat Harian'}
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
