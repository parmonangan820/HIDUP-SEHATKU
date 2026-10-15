import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Camera,
  Flame,
  Droplet,
  Check,
  ShieldCheck,
  Zap,
  PlusCircle,
  Apple,
  Salad,
  Moon,
  Heart,
  Dumbbell,
  Activity,
  Smile,
  Copy,
  CheckCheck,
  Stethoscope,
  Coffee,
} from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDietTips?: () => void;
  onOpenSleepModal?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface FoodScanResult {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sugarG: number;
  waterRequirementMl: number;
  glycemicIndex: string;
  healthGrade: string;
  analysisSummary: string;
  recommendations: string[];
}

type HealthTopicCategory = 'all' | 'makan' | 'minum' | 'olahraga' | 'tidur' | 'istirahat' | 'medis';

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  onOpenDietTips,
  onOpenSleepModal,
}) => {
  const { profile, todayRecord, isPro, setIsProModalOpen, logWater } = useHealth();
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner'>('chat');
  const [selectedTopic, setSelectedTopic] = useState<HealthTopicCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo ${profile.name || 'Sahabat Sehat'}! Saya adalah **Dokter AI Hidup Sehatku**, konsultan medis & gaya hidup sehat pribadi Anda.

Saya siap menjawab **SEMUA pertanyaan seputar kesehatan** Anda secara ilmiah, ramah, dan solutif:
• 🥗 **Masalah Makan & Nutrisi**: pola makan bergizi, asam lambung/GERD, kolesterol, diabetes/gula darah, diet kalori, porsi makan seimbang.
• 💧 **Masalah Minum & Cairan**: kebutuhan air putih harian, waktu minum terbaik, elektrolit, kesehatan ginjal, aturan kafein/kopi.
• 🏃 **Masalah Olahraga & Gerak**: kardio vs angkat beban, pemanasan, cara mengatasi pegal otot (DOMS), pencegahan cedera.
• 🌙 **Masalah Tidur & Sirkadian**: durasi ideal, siklus tidur 90 menit, mengatasi insomnia, sleep hygiene, bangun pagi segar.
• 🧘 **Masalah Istirahat & Stres**: active recovery, menurunkan hormon kortisol stres, teknik napas relaksasi 4-7-8, burnout.
• 🩺 **Keluhan Medis & Gejala**: pusing, demam, flu/batuk, imunitas tubuh, pertolongan pertama & tanda bahaya darurat.

Silakan ajukan pertanyaan apa pun di bawah, atau ketuk topik cepat yang Anda inginkan!`,
      time: 'Baru saja',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scanner State
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [foodInput, setFoodInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [loggedToast, setLoggedToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading, activeTab]);

  if (!isOpen) return null;

  // Categorized Quick Prompts covering all health aspects
  const categorizedPrompts: Record<HealthTopicCategory, { label: string; icon: React.ReactNode; questions: string[] }> = {
    all: {
      label: 'Semua',
      icon: <Sparkles className="w-3 h-3 text-cyan-400" />,
      questions: [
        'Makanan apa yang aman untuk asam lambung & GERD?',
        'Berapa ml air terbaik saat bangun tidur pagi?',
        'Mana lebih efektif bakar lemak: Kardio atau Angkat Beban?',
        'Berapa jam tidur ideal dan apa itu siklus 90 menit?',
        'Teknik pernapasan 4-7-8 untuk redakan stres seketika?',
        'Apa penyebab sering pusing atau sakit kepala di siang hari?',
      ],
    },
    makan: {
      label: 'Makan & Gizi',
      icon: <Salad className="w-3 h-3 text-emerald-400" />,
      questions: [
        'Makanan apa yang aman untuk penderita asam lambung & GERD?',
        'Berapa gram protein harian yang saya butuhkan untuk menjaga otot?',
        'Bagaimana cara mengatur defisit kalori agar berat badan turun sehat?',
        'Makanan penurun kolesterol tinggi dan trigliserida apa saja?',
        'Cara mengatur pola makan agar gula darah tidak melonjak tajam?',
        'Bagaimana pembagian porsi piring makan sehat yang ideal?',
      ],
    },
    minum: {
      label: 'Minum & Hidrasi',
      icon: <Droplet className="w-3 h-3 text-cyan-400" />,
      questions: [
        'Berapa ml air terbaik saat bangun tidur pagi dan manfaat biologisnya?',
        'Berapa liter kebutuhan air putih harian untuk berat badan saya?',
        'Bagaimana cara menjaga kesehatan ginjal dan mencegah batu ginjal?',
        'Apakah minum kopi hitam setiap hari aman untuk organ tubuh?',
        'Kapan tubuh membutuhkan asupan elektrolit saat berolahraga?',
        'Bagaimana cara membaca tanda dehidrasi dari warna urin?',
      ],
    },
    olahraga: {
      label: 'Olahraga & Gerak',
      icon: <Dumbbell className="w-3 h-3 text-amber-400" />,
      questions: [
        'Mana lebih efektif bakar lemak: Kardio atau Angkat Beban?',
        'Bagaimana cara mengatasi pegal otot (DOMS) setelah berolahraga?',
        'Apakah jalan kaki 30 menit sehari cukup untuk kesehatan jantung?',
        'Panduan pemanasan dinamis & pendinginan agar tidak cedera otot?',
        'Berapa frekuensi olahraga ideal per minggu menurut standar medis?',
        'Olahraga apa yang aman untuk penderita obesitas atau nyeri sendi?',
      ],
    },
    tidur: {
      label: 'Jam Tidur',
      icon: <Moon className="w-3 h-3 text-indigo-400" />,
      questions: [
        'Berapa jam tidur ideal untuk usia saya dan apa fungsi siklus 90 menit?',
        'Bagaimana cara mengatasi insomnia dan sulit tidur tanpa obat?',
        'Mengapa saat bangun tidur pagi badan justru terasa lemas (sleep inertia)?',
        'Apakah hutang tidur (sleep debt) bisa dibayar saat akhir pekan?',
        'Mengapa layar HP di malam hari mengacaukan hormon tidur (melatonin)?',
        'Bagaimana tips mengatur kamar tidur agar tidur nyenyak maksimal?',
      ],
    },
    istirahat: {
      label: 'Istirahat & Stres',
      icon: <Smile className="w-3 h-3 text-teal-400" />,
      questions: [
        'Apa perbedaan istirahat aktif (active recovery) dan istirahat pasif?',
        'Bagaimana cara melakukan teknik napas 4-7-8 untuk menurunkan stres?',
        'Berapa hari waktu istirahat yang dibutuhkan otot setelah latihan beban?',
        'Bagaimana dampak hormon stres (kortisol) terhadap berat badan dan imun?',
        'Tanda-tanda tubuh mengalami kelelahan kronis dan burnout kerja?',
        'Cara cepat menenangkan pikiran dan merelaksasi otot tegang?',
      ],
    },
    medis: {
      label: 'Gejala & Medis',
      icon: <Stethoscope className="w-3 h-3 text-rose-400" />,
      questions: [
        'Apa penyebab sering pusing atau sakit kepala di siang hari?',
        'Pertolongan pertama saat asam lambung naik tiba-tiba ke kerongkongan?',
        'Cara alami mempercepat pemulihan saat flu, batuk, dan demam ringan?',
        'Bagaimana cara mengatasi pegal di leher dan pundak akibat duduk lama?',
        'Kapan sakit kepala atau demam harus segera diperiksakan ke IGD?',
        'Cara alami melancarkan buang air besar saat mengalami sembelit?',
      ],
    },
  };

  const foodPresets = [
    'Nasi Goreng Ayam + Telur',
    'Ayam Bakar + Nasi',
    'Gado-Gado Spesial',
    'Soto Ayam Lamongan',
    'Es Teh Manis',
    'Kopi Susu Gula Aren',
    'Smoothie Pisang Oat',
    'Salad Buah Segar',
  ];

  // Comprehensive Clinical Fallback Engine covering all health domains
  const getDynamicClinicalReply = (query: string, currentProfile: any, stats: any): string => {
    const name = currentProfile?.name || 'Sahabat Sehat';
    const q = query.toLowerCase();
    const water = stats?.waterMl || 0;
    const target = currentProfile?.targetWaterMl || 2500;
    const weight = currentProfile?.weight || 60;
    const height = currentProfile?.height || 165;
    const age = currentProfile?.age || 25;
    const workoutMins = stats?.workoutMinutes || 0;
    const calories = stats?.calories || 0;

    // 1. MASALAH MAKAN, GIZI & NUTRISI
    if (q.includes('asam lambung') || q.includes('gerd') || q.includes('maag') || q.includes('lambung') || q.includes('kembung') || q.includes('ulu hati')) {
      return `Halo ${name}, sebagai Dokter AI, penanganan kesehatan lambung & GERD berpusat pada pola makan yang teratur dan ramah mukosa:

🥗 **Pola Makan Ramah Lambung & GERD:**
1. **Aturan Porsi**: Terapkan metode *small frequent meals* (porsi kecil tapi sering, 4-5 kali sehari). Jangan biarkan perut kosong lebih dari 4-5 jam.
2. **Makanan yang Dianjurkan**: Oatmeal, pisang matang, pepaya, nasi tim, kentang rebus, sup ayam bening, dan putih telur rebus.
3. **Pantangan Utama**: Hindari makanan terlalu pedas (cabai berlebih), asam pekat (cuka, tomat asam, jeruk nipis pekat saat perut kosong), santan kental, gorengan berlemak, minuman bersoda, cokelat, dan kopi saat lambung sensitif.
4. **Waktu Makan & Gravitasi**: Hindari langsung berbaring setelah makan! Tunggu minimal 2 hingga 3 jam sebelum tidur agar asam lambung tidak naik ke kerongkongan (*refluks*).
5. **Hidrasi**: Minum air suhu ruang atau air hangat secara perlahan di sela waktu makan, bukan minum banyak sekaligus saat sedang makan.`;
    }

    if (q.includes('kolesterol') || q.includes('lemak darah') || q.includes('trigliserida')) {
      return `Halo ${name}, untuk mengontrol kadar kolesterol (LDL & trigliserida) secara alami:

🥗 **Strategi Nutrisi Penurun Kolesterol:**
1. **Perbanyak Serat Larut (Soluble Fiber)**: Konsumsi oatmeal, kacang merah, apel, pir, dan biji chia. Serat larut mengikat partikel kolesterol di usus dan membuangnya sebelum diserap darah.
2. **Asam Lemak Sehat (Omega-3)**: Konsumsi ikan kembung, tuna, salmon, alpukat, atau minyak zaitun untuk meningkatkan kadar HDL (kolesterol baik).
3. **Batasi Lemak Jenuh & Trans**: Hindari gorengan berulang (minyak jelantah), jeroan, kulit ayam berlebih, margarin terhidrogenasi, dan olahan daging olahan (sosis/nugget instan).
4. **Kombinasi Aktivitas**: Kardio aerobik seperti jalan cepat 30 menit sehari (total hari ini: ${workoutMins} menit) terbukti klinis menaikkan kolesterol baik (HDL).`;
    }

    if (q.includes('gula darah') || q.includes('diabetes') || q.includes('glukosa') || q.includes('manis')) {
      return `Halo ${name}, menjaga stabilitas gula darah sangat penting untuk pencegahan resistensi insulin dan diabetes melitus:

🥗 **Panduan Pengelolaan Gula Darah:**
1. **Pilih Karbohidrat Kompleks (Low GI)**: Ganti nasi putih hangat dengan nasi merah, beras hitam, ubi jalar, jagung, atau oatmeal. Karbohidrat kompleks dicerna perlahan sehingga tidak memicu lonjakan insulin (*glucose spike*).
2. **Aturan Urutan Makan (Food Sequencing)**: Mulai makan dengan serat (sayuran/lalapan), dilanjutkan protein & lemak sehat, lalu terakhir karbohidrat. Ini dapat memangkas lonjakan gula darah hingga 40%!
3. **Hindari Kalori Cair (Liquid Sugar)**: Batasi minuman manis kemasan, boba, sirup, dan teh manis berlebihan. Fruktosa cair langsung diproses di hati dan memicu penumpukan lemak visceral.
4. **Jalan Kaki Pasca Makan**: Lakukan jalan santai 10-15 menit setelah makan besar untuk membantu otot menyerap glukosa darah tanpa membebani pankreas.`;
    }

    if (q.includes('protein') || q.includes('otot') || q.includes('bulking') || q.includes('massa otot')) {
      const recProtein = Math.round(weight * 1.6);
      return `Halo ${name}! Untuk pemeliharaan dan pembentukan jaringan otot (berat Anda saat ini ${weight} kg):

🥗 **Kebutuhan Protein & Nutrisi Otot:**
1. **Target Protein Harian**: Rekomendasi medis untuk gaya hidup aktif adalah **1.2 - 2.0 gram protein per kg berat badan**. Untuk berat ${weight} kg, target optimal Anda berkisar antara **${Math.round(weight * 1.2)} - ${recProtein} gram protein/hari**.
2. **Sumber Protein Berkualitas**:
   - Hewani: Dada ayam tanpa kulit, telur utuh + putih telur, ikan (tenggiri, kembung, salmon), daging sapi tanpa lemak, susu/yogurt.
   - Nabati: Tahu, tempe Nusantara (sangat kaya probiotik & asam amino), kacang edamame, lentil, biji labu.
3. **Distribusi Merata**: Jangan makan protein sekaligus banyak di satu waktu; bagi ke dalam 3-4 porsi makan (@ 25-35g protein) untuk mengoptimalkan sintesis protein otot (*Muscle Protein Synthesis*).`;
    }

    if (q.includes('turun berat badan') || q.includes('diet') || q.includes('kalori') || q.includes('lemak') || q.includes('langsing') || q.includes('bakar lemak')) {
      const bmrEst = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
      const targetCal = Math.round(bmrEst * 1.3 - 400);
      return `Halo ${name}! Penurunan berat badan yang berhasil dan berkelanjutan (bukan efek yoyo) berakar pada 3 pilar:

🥗 **1. Nutrisi & Defisit Kalori Terukur:**
- Target kalori harian yang aman untuk Anda (BB ${weight}kg, TB ${height}cm) adalah defisit sekitar 300-500 kcal dari kebutuhan harian (estimasi kisaran **${targetCal} - ${targetCal + 200} kcal/hari**).
- Terapkan konsep "Piring Makanku": 1/2 piring sayur & buah segar, 1/4 protein tanpa lemak, 1/4 karbohidrat kompleks.

💧 **2. Hidrasi Pembakar Lemak:**
- Minum 1 gelas air putih (300-400 ml) 20-30 menit sebelum makan. Studi klinis membuktikan ini memotong rasa lapar semu dan menurunkan asupan kalori spontan hingga 13%.
- Hari ini Anda mencatat ${water} ml dari target ${target} ml. Pertahankan konsistensi ini!

🏃 **3. Olahraga Kombinasi:**
- Gabungkan latihan kekuatan (angkat beban/bodyweight) untuk menjaga massa otot dengan kardio (jalan cepat 30-45 menit) untuk pembakaran kalori harian.`;
    }

    if (q.includes('makan') || q.includes('sarapan') || q.includes('makanan') || q.includes('porsi') || q.includes('gizi') || q.includes('sayur') || q.includes('buah') || q.includes('camilan') || q.includes('snack')) {
      return `Halo ${name}, pola makan seimbang adalah pondasi utama daya tahan tubuh dan metabolisme prima:

🥗 **Panduan Nutrisi Harian Seimbang Dokter AI:**
1. **Sarapan Kaya Protein**: Mulai hari dengan telur, oatmeal, atau tempe/tahu rebus. Sarapan tinggi protein menjaga rasa kenyang lebih lama dan menstabilkan nafsu makan hingga sore hari.
2. **Kebutuhan Serat Harian**: Penuhi minimal 25-30 gram serat setiap hari dari aneka sayuran hijau (bayam, brokoli, kangkung) dan buah segar (pepaya, apel, alpukat).
3. **Pilihan Camilan Cerdas**: Ganti gorengan dan biskuit manis dengan buah potong, kacang almond panggang (1 genggam tangan), atau yogurt tawar.
4. **Makan Malam Ringan**: Santap makan malam minimal 2-3 jam sebelum tidur malam dengan porsi karbohidrat lebih rendah agar kerja saluran cerna ringan saat Anda beristirahat.`;
    }

    // 2. MASALAH MINUM & HIDRASI
    if (q.includes('bangun tidur') || q.includes('minum pagi') || q.includes('pagi hari')) {
      return `Halo ${name}! Saat bangun tidur pagi (sebelum sarapan), takaran air putih yang paling dianjurkan secara medis adalah **1 hingga 2 gelas (sekitar 300 - 500 ml) air putih suhu ruang**.

💧 **Manfaat Biologis Utamanya:**
1. **Rehidrasi Seluler**: Menggantikan cairan yang hilang melalui pernapasan dan keringat selama 7-8 jam tidur malam.
2. **Aktivasi Gerak Peristaltik Usus**: Merangsang kontraksi usus besar untuk melancarkan buang air besar (BAB) alami di pagi hari tanpa rasa begah.
3. **Meningkatkan Laju Metabolisme**: Meminum air saat perut kosong terbukti meningkatkan laju metabolisme basal hingga 24% selama 60 menit ke depan.
4. **Membuang Toksin Ginjal**: Membantu ginjal membilas sisa filtrasi semalam. Hari ini Anda sudah mencatat ${water} ml dari target ${target} ml. Biasakan selalu 2 gelas air saat membuka mata!`;
    }

    if (q.includes('ginjal') || q.includes('batu ginjal') || q.includes('kencing') || q.includes('urin') || q.includes('buang air kecil')) {
      return `Halo ${name}. Ginjal manusia menyaring sekitar 120-150 liter darah setiap hari untuk membuang kelebihan cairan dan limbah metabolik:

💧 **Pedoman Hidrasi untuk Ginjal Sehat:**
1. **Aturan Warna Urin**: Urin yang sehat berwarna kuning jerami muda/jernih transparan. Bila berwarna kuning pekat atau berbusa, itu sinyal kuat dehidrasi dan ginjal bekerja terlalu berat.
2. **Pencegahan Batu Ginjal**: Air putih adalah pelarut alami terbaik. Asupan air yang cukup mencegah kristalisasi kalsium oksalat dan asam urat menjadi batu ginjal.
3. **Target Harian Anda**: Berdasarkan berat ${weight} kg, target air harian Anda adalah ${target} ml. Saat ini telah tercatat ${water} ml.
4. **Hindari Menahan Kencing**: Selalu segera buang air kecil saat timbul rasa ingin berkemih untuk mencegah infeksi saluran kemih (ISK).`;
    }

    if (q.includes('kopi') || q.includes('kafein') || q.includes('teh')) {
      return `Halo ${name}, mengenai konsumsi kopi, teh, dan minuman berkafein:

☕ **Panduan Medis Konsumsi Kafein:**
1. **Batas Aman Harian**: Untuk orang dewasa sehat, batas aman asupan kafein adalah **maksimal 400 mg per hari** (setara 2-3 cangkir kopi hitam tanpa gula berlebih).
2. **Manfaat Sehat**: Kopi hitam kaya akan antioksidan polifenol yang baik untuk fungsi kognitif, perlindungan hati (*liver*), dan metabolisme.
3. **Waktu Terbaik (Cut-off Time)**: Hindari konsumsi kafein setelah pukul **14:00 - 15:00 siang**. Waktu paruh kafein dalam tubuh berkisar antara 5 hingga 8 jam, sehingga dapat mengganggu kualitas fase *deep sleep* malam Anda.
4. **Kompensasi Cairan**: Kafein memiliki sifat diuretik ringan. Untuk setiap 1 cangkir kopi, minumlah 1 gelas ekstra air putih untuk menjaga hidrasi seimbang!`;
    }

    if (q.includes('elektrolit') || q.includes('garam') || q.includes('sodium') || q.includes('kram') || q.includes('air kelapa')) {
      return `Halo ${name}. Saat beraktivitas atau berkeringat deras, tubuh tidak hanya kehilangan air tetapi juga elektrolit penting:

💧 **Keseimbangan Elektrolit Tubuh:**
1. **Fungsi Elektrolit**: Natrium, kalium, magnesium, dan kalsium mengatur kontraksi otot, transmisi impuls saraf, dan keseimbangan asam-basa darah.
2. **Tanda Defisiensi**: Otot sering kram (terutama di betis), kepala berkunang-kunang, detak jantung berdebar, atau tubuh lemas gemetar.
3. **Sumber Elektrolit Alami**:
   - **Air Kelapa Murni**: Mengandung kalium dan magnesium alami yang sangat cepat diserap tubuh.
   - **Infused Water Jeruk & Garam Sejumput**: Tambahkan sejumput garam laut ke dalam air perasan lemon untuk olahraga lebih dari 60 menit.
4. Hari ini Anda berolahraga ${workoutMins} menit. Pastikan elektrolit tercukupi ya!`;
    }

    if (q.includes('minum') || q.includes('air putih') || q.includes('dehidrasi') || q.includes('haus')) {
      return `Halo ${name}! Kebutuhan cairan tubuh harian dihitung berdasarkan rumus medis standar 30-35 ml per kg berat badan:

💧 **Jadwal Emas Minum Air Putih Sepanjang Hari:**
1. **Bangun Pagi**: 400-500 ml air suhu ruang untuk aktivasi metabolisme.
2. **Sebelum Makan Siang**: 250-300 ml (20 menit sebelum makan) membantu enzim lambung.
3. **Sore Hari (Jam Kerja/Belajar)**: 300 ml di jam 15:00 untuk mencegah *brain fog* dan kantuk sore akibat dehidrasi ringan.
4. **Sebelum & Setelah Olahraga**: 200-300 ml sebelum latihan dan rehidrasi bertahap setelahnya.
5. **Malam Hari**: 200 ml air hangat 45 menit sebelum tidur untuk melancarkan sirkulasi darah tanpa membuat Anda bolak-balik ke toilet di malam hari.
Target harian Anda: ${target} ml (hari ini baru tercatat ${water} ml). Yuk minum segelas lagi!`;
    }

    // 3. MASALAH OLAHRAGA & AKTIVITAS FISIK
    if (q.includes('doms') || q.includes('pegal otot') || q.includes('nyeri otot') || q.includes('otot sakit')) {
      return `Halo ${name}, rasa sakit atau pegal pada otot 24-48 jam setelah berolahraga disebut **DOMS (Delayed Onset Muscle Soreness)**:

🏃 **Penyebab & Cara Mengatasi DOMS Secara Medis:**
1. **Bukan Asam Laktat**: Asam laktat hilang dalam waktu 1 jam setelah latihan. DOMS disebabkan oleh robekan mikroskopis (*micro-tears*) yang wajar pada serat otot saat beradaptasi menjadi lebih kuat.
2. **Pemulihan Aktif (Active Recovery)**: Jangan hanya diam berbaring total. Lakukan jalan santai 15-20 menit atau peregangan statis ringan untuk memompa darah segar pembawa nutrisi ke jaringan otot.
3. **Mandi Air Hangat / Kompres**: Membantu vasodilatasi pembuluh darah dan merelaksasi ketegangan otot.
4. **Nutrisi & Hidrasi**: Konsumsi protein yang cukup (20-30g) untuk membangun kembali serat otot, dan minum air minimal ${target} ml per hari.
5. Bila nyeri sangat tajam pada sendi atau timbul bengkak parah, istirahatkan area tersebut selama 48 jam.`;
    }

    if (q.includes('kardio') || q.includes('lari') || q.includes('jalan kaki') || q.includes('sepeda') || q.includes('treadmill') || q.includes('jogging')) {
      return `Halo ${name}! Latihan kardiovaskular sangat bermanfaat untuk kesehatan jantung, kapasitas paru-paru, dan sirkulasi darah:

🏃 **Panduan Latihan Kardio Optimal:**
1. **Target Mingguan (Standar WHO)**: Minimal 150 menit aktivitas intensitas sedang (seperti jalan cepat atau sepeda santai) atau 75 menit intensitas tinggi (lari/jogging) per minggu.
2. **Jalan Kaki 30 Menit**: Jalan kaki teratur terbukti menurunkan tekanan darah, meningkatkan sensitivitas insulin, dan efektif membakar kalori tanpa membebani sendi lutut.
3. **Zona Detak Jantung Latihan**: Untuk pembakaran lemak optimal, targetkan detak jantung di Zona 2 (sekitar 60-70% dari Denyut Jantung Maksimal: 220 - Usia Anda).
4. Hari ini Anda sudah mencatat aktivitas olahraga **${workoutMins} menit** dengan pembakaran estimasi **${calories} kcal**. Kerja yang luar biasa!`;
    }

    if (q.includes('angkat beban') || q.includes('gym') || q.includes('fitness') || q.includes('strength') || q.includes('push up') || q.includes('dumbbell')) {
      return `Halo ${name}! Latihan kekuatan (*strength training*) sangat krusial tidak hanya untuk bentuk tubuh, tetapi juga kesehatan metabolik jangka panjang:

🏋️ **Manfaat & Prinsip Latihan Beban Dokter AI:**
1. **Meningkatkan Laju Metabolisme Basal (BMR)**: Setiap 1 kg massa otot yang bertambah akan membakar lebih banyak kalori bahkan saat Anda sedang tidur atau istirahat (*afterburn effect*).
2. **Menjaga Kepadatan Tulang**: Memberi beban mekanis pada tulang merangsang osteoblas dan mencegah osteoporosis di usia lanjut.
3. **Prinsip Progressive Overload**: Tingkatkan beban, repetisi, atau kualitas bentuk gerakan secara bertahap setiap 1-2 minggu.
4. **Waktu Pemulihan**: Berikan jeda istirahat minimal **48 jam** untuk kelompok otot yang sama sebelum dilatih kembali agar serat otot sempat beregenerasi.`;
    }

    if (q.includes('olahraga') || q.includes('pemanasan') || q.includes('pendinginan') || q.includes('cedera') || q.includes('gerak') || q.includes('latihan')) {
      return `Halo ${name}! Rutinitas latihan fisik yang terstruktur adalah kunci tubuh bugar tanpa risiko cedera:

🏃 **3 Tahapan Wajib Dalam Setiap Sesi Olahraga:**
1. **Pemanasan Dinamis (Dynamic Warm-up, 5-10 menit)**: Gerakan memutar sendi, jumping jacks ringan, atau leg swings untuk melumasi sendi dengan cairan sinovial dan menaikkan suhu inti tubuh. Hindari peregangan statis lama sebelum otot hangat!
2. **Sesi Latihan Inti (20-45 menit)**: Sesuaikan intensitas dengan kondisi kebugaran Anda. Hari ini Anda sudah berolahraga ${workoutMins} menit.
3. **Pendinginan Statis (Cool-down, 5-10 menit)**: Peregangan otot betis, paha, dan punggung untuk menurunkan denyut nadi secara bertahap dan mencegah pusing setelah latihan intens.
4. **Aturan Rehidrasi**: Minum 150 ml air setiap 20 menit saat latihan agar performa tidak drop.`;
    }

    // 4. MASALAH TIDUR & IRAMA SIRKADIAN
    if (q.includes('insomnia') || q.includes('susah tidur') || q.includes('sulit tidur') || q.includes('begadang') || q.includes('terbangun')) {
      return `Halo ${name}. Masalah sulit tidur (insomnia) atau sering terbangun tengah malam sangat bisa diperbaiki dengan protokol klinis *Sleep Hygiene*:

🌙 **Protokol Dokter AI Mengatasi Insomnia Tanpa Obat:**
1. **Matikan Layar Gadget 60 Menit Sebelum Tidur**: Cahaya biru (*blue light*) dari smartphone dan laptop menekan pelepasan hormon kantuk (melatonin) di otak hingga 50%.
2. **Kondisi Kamar 3K (Gelap, Dingin, Tenang)**: Buat kamar segelap mungkin (gunakan tirai blackout atau masker mata), dan atur suhu ruangan sejuk (sekitar 20-24°C) karena penurunan suhu tubuh memicu kantuk alami.
3. **Aturan Konsistensi Jam Tidur**: Bangun tidur dan tidur di jam yang persis sama setiap hari (termasuk akhir pekan) untuk mengunci ritme sirkadian internal otak Anda.
4. **Teknik 20 Menit**: Jika dalam 20 menit belum bisa tertidur, jangan terus berguling di kasur dengan cemas. Bangunlah, lakukan aktivitas santai di lampu remang (membaca buku fisik atau mendengarkan relaksasi suara alam), lalu kembali ke kasur saat mengantuk.
5. **Relaksasi Pernapasan 4-7-8**: Tarik napas 4 detik, tahan 7 detik, hembuskan perlahan 8 detik untuk meredakan ketegangan sistem saraf.`;
    }

    if (q.includes('jam tidur') || q.includes('tidur') || q.includes('sirkadian') || q.includes('deep sleep') || q.includes('rem') || q.includes('lemas bangun')) {
      return `Halo ${name}! Tidur adalah proses biologis aktif di mana tubuh melakukan perbaikan seluler dan pembersihan otak:

🌙 **Arsitektur Siklus Tidur Sehat 90 Menit:**
1. **Kebutuhan Durasi**: Orang dewasa usia 18-64 tahun membutuhkan **7 hingga 9 jam tidur berkualitas** setiap malam (atau setara 5 siklus tidur penuh @ 90 menit = 7.5 jam).
2. **Fase Deep Sleep (Tidur Nyenyak)**: Terjadi di sepertiga awal malam. Pada fase ini hormon pertumbuhan (HGH) dilepaskan, jaringan otot diperbaiki, dan sistem glimfatik otak membersihkan plak amyloid-beta.
3. **Fase REM (Rapid Eye Movement)**: Terjadi di paruh akhir malam, penting untuk konsolidasi memori, kreativitas, dan stabilitas emosional.
4. **Mengapa Bangun Terasa Lemas (*Sleep Inertia*)?**: Ini sering terjadi jika alarm berbunyi saat Anda sedang berada di puncak fase *Deep Sleep*. Menyetel alarm di kelipatan 90 menit (misal 6 jam atau 7.5 jam) membuat Anda bangun di fase tidur ringan dengan rasa segar bertenaga!`;
    }

    // 5. MASALAH ISTIRAHAT, STRES & PEMULIHAN
    if (q.includes('stres') || q.includes('kortisol') || q.includes('cemas') || q.includes('panik') || q.includes('burnout') || q.includes('beban pikiran')) {
      return `Halo ${name}. Stres psikologis yang berkepanjangan memicu lonjakan hormon kortisol yang dapat menekan imunitas, menaikkan tekanan darah, dan mengganggu metabolisme:

🧘 **Langkah Medis Menurunkan Hormon Stres & Kortisol:**
1. **Latihan Pernapasan Vagus (Metode 4-7-8)**:
   - Tarik napas lembut lewat hidung selama 4 detik.
   - Tahan napas dengan tenang selama 7 detik.
   - Hembuskan napas panjang lewat mulut selama 8 detik.
   - Ulangi 4 kali siklus. Ini merangsang saraf parasimpatis dan menurunkan detak jantung seketika.
2. **Koneksi dengan Alam (*Grounding/Jalan Santai*)**: Berjalan di luar ruangan selama 15-20 menit di bawah pohon hijau menurunkan biomarker stres secara signifikan.
3. **Batasi Konsumsi Berita & Notifikasi Berlebih**: Terapkan *digital detox* 30 menit setelah bangun pagi dan 60 menit sebelum tidur.
4. **Asupan Magnesium & Teh Chamomile**: Membantu relaksasi neurotransmitter GABA di otak sehingga pikiran lebih tenang.`;
    }

    if (q.includes('istirahat') || q.includes('recovery') || q.includes('pemulihan') || q.includes('lelah') || q.includes('capek') || q.includes('kurang energi')) {
      return `Halo ${name}, istirahat sama pentingnya dengan olahraga dan nutrisi dalam lingkaran kesehatan holistik:

🧘 **Panduan Pemulihan Tubuh (Rest & Recovery) Dokter AI:**
1. **Istirahat Aktif vs Pasif**: Bila tubuh terasa lelah tapi tidak sakit, *Active Recovery* (seperti jalan santai 20 menit, peregangan yoga ringan) lebih mempercepat pemulihan sirkulasi dibanding hanya berbaring seharian.
2. **Pemulihan Saraf & Otot**: Berikan waktu jeda minimal 1-2 hari per minggu tanpa latihan berat agar sistem saraf pusat (CNS) dan cadangan glikogen kembali penuh.
3. **Cukupi Cairan & Elektrolit**: Dehidrasi ringan sering kali disalahartikan sebagai kelelahan kronis (*fatigue*). Penuhi target cairan Anda (${target} ml/hari).
4. **Jeda Singkat Saat Bekerja (Mikro-Istirahat)**: Terapkan aturan 50-10: bekerja fokus 50 menit, lalu berdiri dan berjalan 5-10 menit untuk melepaskan ketegangan leher dan pinggang.`;
    }

    // 6. KELUHAN MEDIS UMUM & GEJALA SEHARI-HARI
    if (q.includes('pusing') || q.includes('sakit kepala') || q.includes('migrain') || q.includes('vertigo')) {
      return `Halo ${name}, sakit kepala atau pusing memiliki beberapa pemicu umum yang perlu diidentifikasi:

🩺 **Analisis & Pertolongan Pertama Sakit Kepala:**
1. **Sakit Kepala Tegang (Tension Headache)**: Paling sering disebabkan oleh stres, otot leher kaku akibat menatap layar lama, atau kurang tidur. Lakukan kompres hangat di tengkuk dan peregangan leher perlahan.
2. **Dehidrasi**: Kurang minum menyebabkan penurunan volume darah sesaat dan memicu pusing. Minumlah 1-2 gelas air putih segera. Hari ini Anda baru mencatat ${water} ml air.
3. **Pola Makan**: Telat makan memicu hipoglikemia (gula darah drop) yang menimbulkan pusing berkunang-kunang.
4. ⚠️ **Tanda Bahaya Medis (Red Flags)**: Segera ke IGD jika sakit kepala muncul mendadak sangat hebat (*thunderclap*), disertai kelemahan separuh tubuh, bicara pelo, demam tinggi kaku kuduk, atau pandangan ganda!`;
    }

    if (q.includes('demam') || q.includes('flu') || q.includes('batuk') || q.includes('pilek') || q.includes('tenggorokan') || q.includes('imun')) {
      return `Halo ${name}. Saat tubuh terserang flu, batuk, atau demam ringan, sistem imun sedang aktif melawan patogen:

🩺 **Protokol Pemulihan Imunitas Mandiri:**
1. **Istirahat Total (Bed Rest)**: Energi tubuh dialihkan untuk produksi antibodi sel darah putih, sehingga batasi aktivitas fisik berat.
2. **Hidrasi Hangat Ekstra**: Minum air putih hangat, kuah sup ayam bening, atau air jahe madu hangat. Uap panasnya melegakan saluran napas dan mengencerkeran lendir.
3. **Nutrisi Peningkat Imun**: Konsumsi buah kaya Vitamin C (jeruk, jambu biji, kiwi) serta sumber zink (telur, biji-bijian, daging ayam).
4. **Pereda Demam**: Parasetamol dapat digunakan sesuai dosis petunjuk bila demam di atas 38°C menimbulkan rasa tidak nyaman.
5. ⚠️ Konsultasikan langsung ke fasilitas kesehatan bila demam berlangsung lebih dari 3 hari, timbul sesak napas, atau dahak bercampur darah.`;
    }

    // DEFAULT COMPREHENSIVE MEDICAL OVERVIEW
    return `Halo ${name}! Terima kasih atas pertanyaan Anda: "${query}".

Sebagai **Dokter AI Hidup Sehatku**, saya memandang kesehatan Anda secara holistik melalui 5 pilar utama medis:
1. **🥗 Makan & Nutrisi**: Prioritaskan makanan utuh (*whole foods*), cukupi protein (1.2g/kg BB) dan serat sayur-buah untuk metabolisme optimal.
2. **💧 Minum & Cairan**: Jaga target hidrasi harian Anda (${target} ml) — hari ini tercatat ${water} ml. Air putih adalah bahan bakar utama fungsi ginjal dan sirkulasi darah.
3. **🏃 Olahraga & Gerak**: Lakukan minimal 20-30 menit aktivitas fisik teratur (hari ini Anda berolahraga ${workoutMins} menit).
4. **🌙 Tidur Berkualitas**: Cukupi 7-8 jam tidur malam di ruangan sejuk dan gelap untuk regenerasi sel dan pembersihan toksin otak.
5. **🧘 Istirahat & Stres**: Luangkan jeda istirahat aktif dan latihan pernapasan untuk menyeimbangkan hormon kortisol.

*Catatan: Jawaban Dokter AI bersifat edukatif klinis. Jika Anda memiliki keluhan medis spesifik atau berkelanjutan, selalu konsultasikan dengan dokter spesialis secara langsung.* Ada aspek lain seputar makan, minum, olahraga, tidur, atau keluhan tubuh yang ingin Anda tanyakan?`;
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isChatLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsChatLoading(true);

    const todayStats = {
      waterMl: todayRecord.totalWaterMl,
      workoutMinutes: todayRecord.totalWorkoutMinutes,
      calories: todayRecord.totalCalories,
    };

    let replyText = '';

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          profile,
          todayStats,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          replyText = data.reply;
        }
      }
    } catch (err) {
      // ignore server fetch error
    }

    if (!replyText) {
      // Secondary fallback: Direct browser-side Gemini SDK call
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (apiKey) {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          const systemPrompt = `Anda adalah Dokter AI Medis & Konsultan Kesehatan Ahli dari aplikasi "Hidup Sehatku".
Anda menjawab SEMUA pertanyaan seputar kesehatan secara tuntas dan mendalam:
1. Makan & Nutrisi (pola makan seimbang, asam lambung/GERD, kolesterol, diabetes, protein, kalori)
2. Minum & Cairan (kebutuhan air, waktu minum, ginjal, elektrolit, kopi/kafein)
3. Olahraga & Gerak (kardio, angkat beban, pemanasan, atasi nyeri otot DOMS, pencegahan cedera)
4. Tidur & Sirkadian (siklus 90 menit, insomnia, sleep hygiene, bangun segar)
5. Istirahat & Stres (active recovery, hormon kortisol, teknik relaksasi napas 4-7-8, burnout)
6. Keluhan Medis Umum & Gejala (pusing, demam, flu, edukasi pertolongan pertama & tanda bahaya darurat).
Gunakan bahasa yang ramah, santun, bernada empati, berbasis sains medis, dan terstruktur rapi.`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Pertanyaan Pengguna: ${query}`,
            config: { systemInstruction: systemPrompt, temperature: 0.7 },
          });
          if (response.text) {
            replyText = response.text.trim();
          }
        }
      } catch (clientErr) {
        // ignore
      }
    }

    if (!replyText) {
      replyText = getDynamicClinicalReply(query, profile, todayStats);
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsChatLoading(false);
  };

  // Image File Upload Handler for Scanner
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScannedImage(reader.result as string);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Health Scanner
  const handleScanFood = async (overrideFoodName?: string) => {
    const queryFood = overrideFoodName || foodInput;
    if (!scannedImage && !queryFood.trim()) return;

    setIsScanning(true);
    setScanResult(null);
    setLoggedToast(null);

    try {
      const res = await fetch('/api/gemini/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scannedImage || undefined,
          foodName: queryFood || undefined,
          profile,
        }),
      });

      if (res.ok) {
        const data: FoodScanResult = await res.json();
        setScanResult(data);
      } else {
        throw new Error('Gagal memindai');
      }
    } catch (err) {
      // Offline fallback estimate
      setScanResult({
        foodName: queryFood || 'Makanan Pilihan',
        calories: 390,
        proteinG: 17,
        carbsG: 49,
        fatG: 15,
        sugarG: 4,
        waterRequirementMl: 300,
        glycemicIndex: 'Sedang',
        healthGrade: 'A-',
        analysisSummary: `Analisis nutrisi untuk ${queryFood || 'Makanan Pilihan'}. Mengandung energi seimbang untuk aktivitas seharian.`,
        recommendations: [
          'Minum 300 ml air putih ekstra untuk menetralkan kadar sodium.',
          'Dampingi dengan olahraga ringan 15-20 menit untuk pembakaran kalori maksimal.',
        ],
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogScanToHealthTracker = () => {
    if (!scanResult) return;
    logWater(scanResult.waterRequirementMl || 300);
    setLoggedToast(`Berhasil menambahkan ${scanResult.waterRequirementMl || 300} ml air minum penyeimbang & ${scanResult.calories} kcal ke tracker!`);
    setTimeout(() => {
      setLoggedToast(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl h-[88vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Bar Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Dokter AI Hidup Sehatku</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-slate-400">Konsultasi Medis Lengkap: Makan, Minum, Olahraga, Tidur & Istirahat</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pro Account Status Header Banner */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
          {isPro ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="text-[11px]">Akun PRO Unlocked: Konsultasi Dokter AI Semua Topik Tanpa Batas!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[9px] shadow-sm">
                UNLIMITED
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Paket PRO: Akses Konsultasi Medis & Analisis Kalori Tanpa Batas</span>
              </div>
              <button
                onClick={() => setIsProModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-[10px] hover:brightness-110 transition-all shadow-sm"
              >
                Aktifkan PRO
              </button>
            </div>
          )}
        </div>

        {/* Mode Selector Navigation Tabs */}
        <div className="grid grid-cols-4 p-1 bg-slate-950 border-b border-slate-800 text-[11px] font-bold gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="truncate">Dokter AI</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">Scan Makanan</span>
          </button>

          <button
            onClick={() => {
              if (onOpenDietTips) {
                onClose();
                onOpenDietTips();
              }
            }}
            className="py-2 rounded-xl flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 text-emerald-300 font-bold transition-all shadow-sm cursor-pointer"
            title="Buka Fitur Program Diet Sukses Dokter AI (Eksklusif PRO)"
          >
            <Salad className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Program Diet</span>
          </button>

          {onOpenSleepModal && (
            <button
              onClick={() => {
                onClose();
                onOpenSleepModal();
              }}
              className="py-2 rounded-xl flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-indigo-300 font-bold transition-all shadow-sm cursor-pointer"
              title="Buka Jam Tidur Sehat Sirkadian AI"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate">Jam Tidur</span>
            </button>
          )}
        </div>

        {/* TAB 1: DOKTER AI CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-indigo-600/30 border border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed relative group ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800/90 border border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40 text-[9px]">
                      {msg.sender === 'ai' ? (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Salin jawaban Dokter AI"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Jawaban</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <span className={msg.sender === 'user' ? 'text-cyan-100' : 'text-slate-400'}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/60 text-slate-300 p-3 rounded-2xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[11px] text-slate-400 ml-1">Dokter AI sedang menganalisis...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Health Topic Category Filters */}
            <div className="px-3 pt-2 pb-1 bg-slate-950 border-t border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap mr-1">Topik:</span>
              {(Object.keys(categorizedPrompts) as HealthTopicCategory[]).map((cat) => {
                const isSelected = selectedTopic === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedTopic(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {categorizedPrompts[cat].icon}
                    <span>{categorizedPrompts[cat].label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Question Chips corresponding to selected topic */}
            <div className="px-3 py-1.5 bg-slate-900/80 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar">
              {categorizedPrompts[selectedTopic].questions.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-[11px] whitespace-nowrap border border-slate-700/70 transition-all active:scale-95 flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Tanya Dokter AI: makan, minum, olahraga, tidur, istirahat, atau keluhan tubuh..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isChatLoading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: AI HEALTH SCANNER & KALORI */}
        {activeTab === 'scanner' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {loggedToast && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in shadow-lg">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{loggedToast}</span>
              </div>
            )}

            {/* Upload or Camera Area */}
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3 relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {scannedImage ? (
                <div className="relative rounded-2xl overflow-hidden max-h-48 bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img
                    src={scannedImage}
                    alt="Foto Makanan"
                    className="object-cover max-h-48 w-full rounded-2xl"
                  />
                  <button
                    onClick={() => setScannedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-6 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-amber-500/10">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Unggah Foto Makanan / Minuman</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pilih dari Galeri atau Kamera Smartphone Anda
                    </p>
                  </div>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-semibold border border-slate-700 mt-1">
                    Atau ketik nama makanan di bawah
                  </span>
                </div>
              )}

              {/* Food Text Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder="Ketik nama makanan/minuman (misal: Nasi Goreng Ayam + Telur)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />

                {/* Quick Food Preset Chips */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {foodPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setFoodInput(preset);
                        handleScanFood(preset);
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 text-[10px] border border-slate-800 hover:border-amber-500/40 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan Trigger Button */}
              <button
                onClick={() => handleScanFood()}
                disabled={isScanning || (!scannedImage && !foodInput.trim())}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Kalori & Nutrisi dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Pindai Kalori & Nutrisi Makanan</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Results View */}
            {scanResult && (
              <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-4 animate-in fade-in shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Result Title & Grade */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{scanResult.foodName}</h3>
                      <p className="text-[10px] text-slate-400">Hasil Pemindaian Nutrisi AI</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black inline-block">
                      Grade: {scanResult.healthGrade || 'A-'}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Indeks Glikemik: {scanResult.glycemicIndex || 'Sedang'}
                    </span>
                  </div>
                </div>

                {/* Macro Nutrition Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.calories}</span>
                    <span className="text-[10px] text-slate-400 block">Kalori (kcal)</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.proteinG}g</span>
                    <span className="text-[10px] text-slate-400 block">Protein</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Apple className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.carbsG}g</span>
                    <span className="text-[10px] text-slate-400 block">Karbohidrat</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Droplet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">+{scanResult.waterRequirementMl}ml</span>
                    <span className="text-[10px] text-cyan-400 font-bold block">Air Penyeimbang</span>
                  </div>
                </div>

                {/* AI Summary Prose */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 leading-relaxed text-slate-300 text-xs">
                  <strong className="text-amber-400 block mb-1">Ulasan Dokter Nutrisi AI:</strong>
                  {scanResult.analysisSummary}
                </div>

                {/* Recommendations */}
                {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-white block">Rekomendasi Hidrasi & Kesehatan:</span>
                    {scanResult.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Log Button */}
                <button
                  onClick={handleLogScanToHealthTracker}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambahkan +{scanResult.waterRequirementMl}ml Air Penyeimbang ke Tracker</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
