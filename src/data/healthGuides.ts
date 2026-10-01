export interface HealthArticle {
  id: string;
  category: 'air_minum' | 'olahraga' | 'gaya_hidup';
  title: string;
  subtitle: string;
  readTime: string;
  summary: string;
  keyBenefits: string[];
  detailedContent: {
    heading: string;
    text: string;
  }[];
  scheduleTip?: {
    time: string;
    period: string;
    amount: string;
    reason: string;
  }[];
}

export const HEALTH_ARTICLES: HealthArticle[] = [
  {
    id: 'manfaat-air-putih-lengkap',
    category: 'air_minum',
    title: 'Mengapa Air Putih adalah Fondasi Utama Kehidupan?',
    subtitle: 'Ketahui Khasiat Luar Biasa Hidrasi Teratur bagi Organ Tubuh & Otak',
    readTime: '3 menit baca',
    summary:
      'Sekitar 60-70% tubuh manusia terdiri atas air. Kekurangan cairan hanya 1-2% saja sudah dapat menurunkan konsentrasi, memicu sakit kepala, dan memperlambat metabolisme pembakaran lemak.',
    keyBenefits: [
      'Menjaga fungsi ginjal dalam membuang racun dan limbah metabolisme.',
      'Melumasi sendi tulang dan mencegah kram otot saat beraktivitas.',
      'Meningkatkan kecerahan dan elastisitas kulit alami dari dalam.',
      'Meningkatkan daya ingat, mood positif, dan konsentrasi kerja.',
      'Mempercepat pembakaran kalori dan menekan rasa lapar palsu.',
    ],
    detailedContent: [
      {
        heading: 'Pentingnya Minum Air Hangat di Pagi Hari',
        text: 'Setelah 6-8 jam tidur tanpa asupan cairan, tubuh mengalami dehidrasi ringan. Minum 1-2 gelas air hangat saat bangun tidur segera mengaktifkan gerak peristaltik usus, membersihkan sisa pencernaan, serta melancarkan sirkulasi darah ke otak.',
      },
      {
        heading: 'Distribusi Air: Siang, Sore, hingga Malam',
        text: 'Jangan menunggu haus untuk minum! Di siang hari yang terik atau di ruang ber-AC, penguapan cairan tubuh terjadi tanpa disadari. Minum secara berkala 200-250 ml setiap 2 jam jauh lebih efektif diserap sel tubuh dibandingkan langsung meneguk 1 liter sekaligus.',
      },
      {
        heading: 'Aturan Minum Menjelang Tidur Malam',
        text: 'Minum 1 gelas kecil air putih 45 menit sebelum tidur membantu mencegah kram otot di malam hari dan serangan dehidrasi saat tidur, namun hindari minum berlebihan agar tidak terbangun untuk buang air kecil.',
      },
    ],
    scheduleTip: [
      {
        time: '05:30 - 07:00',
        period: 'Pagi Hari',
        amount: '400 - 500 ml (2 Gelas)',
        reason: 'Mengaktifkan organ dalam dan membuang racun sisa tidur semalaman.',
      },
      {
        time: '09:30 - 11:30',
        period: 'Menjelang Siang',
        amount: '250 - 300 ml (1 Gelas)',
        reason: 'Menjaga fokus kerja, ketajaman mental, dan hidrasi di ruang kerja.',
      },
      {
        time: '12:30 - 14:00',
        period: 'Siang Hari',
        amount: '300 - 400 ml',
        reason: 'Membantu proses pencernaan makan siang dan penyerapan zat gizi.',
      },
      {
        time: '15:30 - 17:30',
        period: 'Sore Hari',
        amount: '350 - 500 ml',
        reason: 'Mengusir rasa lelah sore hari dan persiapan sebelum olahraga sore.',
      },
      {
        time: '19:30 - 21:00',
        period: 'Malam Hari',
        amount: '200 - 250 ml (1 Gelas)',
        reason: 'Mencegah stroke dan dehidrasi nokturnal, tidur lebih nyenyak.',
      },
    ],
  },
  {
    id: 'manfaat-olahraga-harian',
    category: 'olahraga',
    title: 'Kekuatan Gerak: Dari Jalan Kaki, Senam, hingga Badminton',
    subtitle: 'Ragam Olahraga Menyenangkan untuk Tubuh Bugar dan Jiwa Bahagia',
    readTime: '4 menit baca',
    summary:
      'Aktivitas fisik tidak harus berat atau membebani. Gerakan konsisten setiap hari memicu pelepasan hormon endorfin dan dopamin yang menjaga suasana hati tetap ceria serta mencegah penuaan dini sel.',
    keyBenefits: [
      'Menjaga tekanan darah dan kesehatan pompa jantung.',
      'Memperkuat kepadatan tulang dan fleksibilitas persendian.',
      'Menurunkan risiko diabetes dengan meningkatkan sensitivitas insulin.',
      'Membakar lemak visceral di sekitar perut.',
      'Mengurangi kecemasan dan stres mental secara alami.',
    ],
    detailedContent: [
      {
        heading: '1. Jalan Kaki & Jalan di Tempat (Low Impact)',
        text: 'Jalan kaki 30 menit sehari (sekitar 4.000 - 6.000 langkah) terbukti secara medis menurunkan risiko penyakit jantung koroner hingga 30%. Jika cuaca buruk atau sibuk di rumah, lakukan jalan di tempat berirama sambil mengangkat lutut!',
      },
      {
        heading: '2. Jogging Santai & Lari Pagi (Cardio Power)',
        text: 'Jogging santai di pagi hari memanfaatkan udara bersih dengan kadar oksigen optimal. Latihan kardio ini sangat baik untuk melatih kapasitas vital paru-paru dan membakar kalori secara efisien.',
      },
      {
        heading: '3. Senam Aerobik & Zumba (Fleksibilitas & Fun)',
        text: 'Senam dengan musik memicu hormon kebahagiaan. Gerakan dinamis melatih seluruh kelompok otot besar, memperbaiki koordinasi tubuh, serta melatih kelenturan tubuh agar terhindar dari cedera punggung.',
      },
      {
        heading: '4. Badminton / Bulutangkis (Agility & Reflex)',
        text: 'Badminton melibatkan lari sprint pendek, lompatan, dan ayunan raket cepat. Olahraga ini melatih ketajaman koordinasi mata-tangan, kekuatan otot paha, refleks otak, dan membakar kalori hingga 350-450 kcal dalam 45 menit!',
      },
    ],
  },
  {
    id: 'gaya-hidup-sehat-holistik',
    category: 'gaya_hidup',
    title: 'Trisula Pola Hidup Sehat: Air, Olahraga, dan Istirahat',
    subtitle: 'Keseimbangan Menyeluruh untuk Kualitas Hidup yang Panjang Umur',
    readTime: '3 menit baca',
    summary:
      'Gaya hidup sehat bukan sekadar diet ketat sesaat, melainkan serangkaian kebiasaan kecil harian yang dilakukan dengan senang hati dan berkelanjutan.',
    keyBenefits: [
      'Bangun pagi dengan tubuh segar dan bebas rasa pegal.',
      'Daya tahan tubuh terhadap flu dan infeksi bakteri lebih kuat.',
      'Pengendalian berat badan ideal tanpa diet menyiksa.',
      'Kualitas tidur nyenyak yang memulihkan sel-sel tubuh.',
    ],
    detailedContent: [
      {
        heading: 'Rumus Kebutuhan Air Pribadi',
        text: 'Setiap orang memiliki kebutuhan berbeda. Rumus standar medis adalah: Berat Badan (kg) x 35 ml. Contoh: Jika berat 60 kg, maka 60 x 35 = 2.100 ml per hari. Bila Anda berolahraga intens atau berkeringat banyak, tambahkan 400 - 600 ml ekstra.',
      },
      {
        heading: 'Pola Tidur Sirkadian (7 - 8 Jam)',
        text: 'Tidur adalah waktu utama tubuh memperbaiki jaringan otot yang rusak dan memproduksi hormon pertumbuhan. Usahakan tidur sebelum jam 23:00 dan jauhkan gawai minimal 30 menit sebelum berbaring.',
      },
      {
        heading: 'Gizi Seimbang "Isi Piringku"',
        text: 'Bagi piring makan Anda menjadi: 1/2 porsi sayuran dan buah segar, 1/4 porsi karbohidrat kompleks (nasi merah, kentang, oats), dan 1/4 porsi protein berkualitas (ikan, telur, tahu, tempe, dada ayam).',
      },
    ],
  },
];
