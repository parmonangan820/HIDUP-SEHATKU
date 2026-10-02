export interface AffiliateReferral {
  id: string;
  referredName: string;
  joinedAt: string;
  isPro: boolean;
  planPurchased?: 'monthly' | 'annual';
  commissionEarned: number;
}

export interface AffiliateStats {
  affiliateCode: string;
  totalClicks: number;
  totalReferrals: number;
  proReferrals: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  referrals: AffiliateReferral[];
}

const STORAGE_KEY_AFFILIATE = 'hidup_sehatku_affiliate_data';

export function getAffiliateStats(userId: string, userName: string): AffiliateStats {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AFFILIATE}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  // Default initial mock data for rich dashboard experience
  const code = `HSK-${(userName || 'MEMBER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;
  
  const initialStats: AffiliateStats = {
    affiliateCode: code,
    totalClicks: 142,
    totalReferrals: 12,
    proReferrals: 4,
    totalEarnings: 16000, // e.g., 10% of annual (10k) + monthly (2x 1.5k + 3k)
    paidEarnings: 10000,
    pendingEarnings: 6000,
    referrals: [
      {
        id: 'ref-1',
        referredName: 'Siti Rahma',
        joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isPro: true,
        planPurchased: 'annual',
        commissionEarned: 10000,
      },
      {
        id: 'ref-2',
        referredName: 'Budi Santoso',
        joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isPro: true,
        planPurchased: 'monthly',
        commissionEarned: 1500,
      },
      {
        id: 'ref-3',
        referredName: 'Dewi Lestari',
        joinedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        isPro: true,
        planPurchased: 'monthly',
        commissionEarned: 1500,
      },
      {
        id: 'ref-4',
        referredName: 'Ahmad Fauzi',
        joinedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        isPro: true,
        planPurchased: 'monthly',
        commissionEarned: 1500,
      },
      {
        id: 'ref-5',
        referredName: 'Rian Pratama',
        joinedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
        isPro: false,
        commissionEarned: 0,
      },
    ],
  };

  saveAffiliateStats(userId, initialStats);
  return initialStats;
}

export function saveAffiliateStats(userId: string, stats: AffiliateStats) {
  try {
    localStorage.setItem(`${STORAGE_KEY_AFFILIATE}_${userId}`, JSON.stringify(stats));
  } catch (e) {
    // ignore
  }
}

export const PROMO_TEMPLATES = [
  {
    title: 'WhatsApp / Telegram (Personal & Grup)',
    text: `Halo teman-teman! 👋 Mau punya tubuh lebih bugar, terhidrasi dengan baik, dan dipandu AI dokter pribadi? Yuk cobain aplikasi Hidup Sehatku! 💧🤖\n\nBanyak fitur keren mulai dari pencatat air minum, pengingat alarm otomatis, hingga scan kalori AI. Pakai link affiliate-ku di bawah ini ya:\n\n👉 [AFF_LINK]\n\nTerima kasih banyak! Sehat selalu ya! ✨`,
  },
  {
    title: 'Instagram / TikTok Caption',
    text: `Gaya hidup sehat sekarang makin mudah dan canggih dengan aplikasi Hidup Sehatku! 🌿💧 Dilengkapi AI Voice Assistant dan laporan kesehatan lengkap.\n\nYuk install dan gabung sekarang melalui link di bio atau klik di sini:\n🔗 [AFF_LINK]\n\n#HidupSehatku #SehatItuMudah #HealthyLifestyle #AIFitness`,
  },
  {
    title: 'Twitter / X Post',
    text: `Rekomendasi aplikasi kesehatan terbaik tahun ini! Hidup Sehatku bantu ingatkan minum air & olahraga harian dengan asisten AI. 💧✨ Yuk gabung sekarang:\n\n👉 [AFF_LINK]\n\n#HidupSehatku #Kesehatan`,
  },
];
