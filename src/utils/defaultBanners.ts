export interface BannerSlideItem {
  id: number;
  imageUrl?: string;
  badge: string;
}

// High-fidelity SVG Banner #1 matching the user's uploaded banner in Screenshot (231)
const BANNER_1_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1772 222" width="1772" height="222">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23f0fdf4" />
      <stop offset="35%" stop-color="%23ecfeff" />
      <stop offset="70%" stop-color="%23ffffff" />
      <stop offset="100%" stop-color="%23e0f2fe" />
    </linearGradient>
    <linearGradient id="cyanTeal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%230284c7" />
      <stop offset="100%" stop-color="%230f766e" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23047857" />
      <stop offset="100%" stop-color="%23065f46" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-10%" width="110%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="%23000000" flood-opacity="0.12" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1772" height="222" fill="url(%23bg1)" />

  <!-- Organic Decorative Waves -->
  <path d="M0,0 L350,0 C280,120 180,180 0,222 Z" fill="%23dcfce7" opacity="0.6" />
  <path d="M1400,0 C1550,80 1680,100 1772,30 L1772,0 Z" fill="%23e0f2fe" opacity="0.7" />
  <path d="M1480,222 C1580,140 1680,150 1772,180 L1772,222 Z" fill="%23ccfbf1" opacity="0.6" />

  <!-- Left Side: Domain Tag Pill -->
  <g transform="translate(60, 26)">
    <rect width="175" height="28" rx="14" fill="%23ffffff" filter="url(%23shadow)" />
    <!-- Leaf/Water Icon -->
    <path d="M15,18 C15,12 21,8 24,6 C27,8 33,12 33,18 C33,22 29,24 24,24 C19,24 15,22 15,18 Z" fill="%230d9488" />
    <path d="M24,9 L24,22" stroke="%23ffffff" stroke-width="1.5" />
    <text x="40" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" fill="%230f766e" letter-spacing="0.5">hidupsehatku.my.id</text>
  </g>

  <!-- Main Headline -->
  <g transform="translate(60, 105)">
    <!-- 'Selamat Datang' script font style -->
    <text x="0" y="0" font-family="'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive, sans-serif" font-size="52" font-weight="bold" fill="%230284c7" letter-spacing="1">Selamat Datang</text>
    <!-- 'di Aplikasi' -->
    <text x="360" y="-3" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="%231e293b">di Aplikasi</text>
    <!-- 'Hidup Sehatku' -->
    <text x="560" y="-3" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="%23047857">Hidup Sehatku</text>
  </g>

  <!-- Subtitle Quote -->
  <g transform="translate(60, 150)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="%23475569">Langkah kecil hari ini, untuk hidup yang lebih sehat esok hari.</text>
  </g>

  <!-- Hydration Status Quick Metric Pill -->
  <g transform="translate(60, 172)">
    <rect width="320" height="26" rx="13" fill="%230284c7" opacity="0.12" />
    <text x="14" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="%230369a1">💧 Target Hidrasi Harian & Olahraga Aktif</text>
  </g>

  <!-- Central Graphic: Person Drinking Water from Bottle Illustration -->
  <g transform="translate(860, 20)">
    <!-- Water Bottle -->
    <g transform="translate(40, 20) rotate(-25)">
      <rect x="0" y="10" width="36" height="110" rx="8" fill="%23bae6fd" stroke="%230284c7" stroke-width="2" />
      <rect x="6" y="2" width="24" height="10" rx="3" fill="%230369a1" />
      <rect x="4" y="30" width="28" height="60" rx="4" fill="%2338bdf8" opacity="0.7" />
      <line x1="8" y1="50" x2="28" y2="50" stroke="%23ffffff" stroke-width="2" opacity="0.8" />
      <line x1="8" y1="70" x2="28" y2="70" stroke="%23ffffff" stroke-width="2" opacity="0.8" />
    </g>
    <!-- Water Drops Flowing -->
    <circle cx="95" cy="50" r="5" fill="%230284c7" />
    <circle cx="110" cy="65" r="7" fill="%2338bdf8" />
    <circle cx="125" cy="85" r="9" fill="%230284c7" />
    <circle cx="140" cy="110" r="6" fill="%2338bdf8" />
    
    <!-- Profile Silhouette of Athletic Person Drinking -->
    <path d="M125,180 C125,130 150,110 165,95 C175,85 185,60 175,45 C165,30 185,15 205,25 C225,35 230,60 215,80 C205,95 210,120 220,180 Z" fill="%23fcd34d" opacity="0.25" />
    <circle cx="195" cy="50" r="28" fill="%23fbbf24" opacity="0.3" />
    <path d="M140,180 L250,180 C240,140 220,110 180,105 C150,100 140,140 140,180 Z" fill="%230284c7" opacity="0.3" />
  </g>

  <!-- Right Side: Distinctive Badge matching screenshot -->
  <g transform="translate(1220, 35)">
    <!-- Speech bubble / Card -->
    <rect width="470" height="150" rx="24" fill="url(%23cardGrad)" filter="url(%23shadow)" />
    
    <!-- Decorative highlight sparkles -->
    <path d="M30,35 L35,20 L40,35 L55,40 L40,45 L35,60 L30,45 L15,40 Z" fill="%23fef08a" />
    <path d="M430,115 L433,105 L436,115 L446,118 L436,121 L433,131 L430,121 L420,118 Z" fill="%23fef08a" />
    
    <!-- Text Inside Card -->
    <text x="65" y="65" font-family="'Brush Script MT', 'Segoe Script', cursive, sans-serif" font-size="34" font-weight="bold" fill="%23ffffff">Sehat itu Mudah,</text>
    <text x="65" y="115" font-family="'Brush Script MT', 'Segoe Script', cursive, sans-serif" font-size="40" font-weight="bold" fill="%23fde047">Mulai dari Diri Sendiri</text>
    
    <!-- Yellow scribble underline -->
    <path d="M65,130 Q180,140 380,128" stroke="%23fde047" stroke-width="4" stroke-linecap="round" fill="none" />
  </g>
</svg>`;

// High-fidelity SVG Banner #2: Panduan & Tips Hidrasi 8 Gelas
const BANNER_2_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1772 222" width="1772" height="222">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23ecfeff" />
      <stop offset="50%" stop-color="%23f0fdf4" />
      <stop offset="100%" stop-color="%23e0e7ff" />
    </linearGradient>
    <linearGradient id="blueCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230284c7" />
      <stop offset="100%" stop-color="%230369a1" />
    </linearGradient>
  </defs>

  <rect width="1772" height="222" fill="url(%23bg2)" />
  <circle cx="1600" cy="40" r="140" fill="%2338bdf8" opacity="0.15" />
  <circle cx="100" cy="180" r="100" fill="%2334d399" opacity="0.15" />

  <!-- Left Side: Brand & Icon -->
  <g transform="translate(60, 30)">
    <rect width="210" height="28" rx="14" fill="%230284c7" />
    <text x="18" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="%23ffffff" letter-spacing="1">💧 PANDUAN HIDRASI MEDIS</text>
  </g>

  <!-- Main Headline -->
  <g transform="translate(60, 105)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="%230f172a">Disiplin 8 Gelas Air Putih Sehari (~2000 - 2500 ml)</text>
    <text x="0" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="%230284c7">Menjaga Fungsi Ginjal Sehat, Konsentrasi Otak Tajam & Kulit Cerah Alami.</text>
  </g>

  <g transform="translate(60, 182)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="%23059669">✓ 2 Gelas Saat Bangun Tidur  •  ✓ 4 Gelas Selang 2 Jam Siang-Sore  •  ✓ 2 Gelas Malam Hari</text>
  </g>

  <!-- Right Highlight Card -->
  <g transform="translate(1220, 35)">
    <rect width="470" height="150" rx="24" fill="url(%23blueCard)" />
    <text x="45" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="%23ffffff">Pencatat Minum AI</text>
    <text x="45" y="95" font-family="'Brush Script MT', 'Segoe Script', cursive, sans-serif" font-size="34" font-weight="bold" fill="%23fde047">Gunakan Tombol Bicara Minum</text>
    <text x="45" y="128" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="%23e0f2fe">Katakan "Minum 1 gelas", AI mencatat otomatis!</text>
  </g>
</svg>`;

// High-fidelity SVG Banner #3: Kebugaran & Olahraga
const BANNER_3_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1772 222" width="1772" height="222">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23fff7ed" />
      <stop offset="50%" stop-color="%23fdf4ff" />
      <stop offset="100%" stop-color="%23f0fdf4" />
    </linearGradient>
    <linearGradient id="purpleCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%237c3aed" />
      <stop offset="100%" stop-color="%234338ca" />
    </linearGradient>
  </defs>

  <rect width="1772" height="222" fill="url(%23bg3)" />

  <g transform="translate(60, 30)">
    <rect width="210" height="28" rx="14" fill="%23ea580c" />
    <text x="18" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" fill="%23ffffff" letter-spacing="1">🏃 AKTIF BERGERAK 30 MENIT</text>
  </g>

  <g transform="translate(60, 105)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="38" font-weight="900" fill="%230f172a">Jalan Kaki, Jogging, Senam & Badminton</text>
    <text x="0" y="42" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="%23d97706">Bakar Kalori, Sehatkan Jantung & Tingkatkan Endorfin Positif Setiap Hari.</text>
  </g>

  <g transform="translate(60, 182)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="%237c3aed">✓ Evaluasi AI Real-time  •  ✓ Rekam Medis PDF Dokter  •  ✓ Komunitas Hidup Sehat</text>
  </g>

  <!-- Right Highlight Card -->
  <g transform="translate(1220, 35)">
    <rect width="470" height="150" rx="24" fill="url(%23purpleCard)" />
    <text x="45" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="%23ffffff">Dokter AI Hidup Sehatku</text>
    <text x="45" y="95" font-family="'Brush Script MT', 'Segoe Script', cursive, sans-serif" font-size="34" font-weight="bold" fill="%23fde047">Konsultasi Kesehatan Cerdas</text>
    <text x="45" y="128" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="%23ede9fe">Tanyakan takaran air, nutrisi makanan & pola olahraga!</text>
  </g>
</svg>`;

export const DEFAULT_GLOBAL_BANNERS: BannerSlideItem[] = [
  {
    id: 1,
    badge: '1/3',
    imageUrl: BANNER_1_SVG,
  },
  {
    id: 2,
    badge: '2/3',
    imageUrl: BANNER_2_SVG,
  },
  {
    id: 3,
    badge: '3/3',
    imageUrl: BANNER_3_SVG,
  },
];
