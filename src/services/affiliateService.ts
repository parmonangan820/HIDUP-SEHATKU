export interface AffiliateReferral {
  id: string;
  referredName: string;
  referredPhone?: string;
  joinedAt: string;
  isPro: boolean;
  proUpgradedAt?: string;
  planPurchased?: 'monthly' | 'annual';
  commissionEarned: number;
  source: 'qr_code' | 'direct_link' | 'social_share';
}

export interface AffiliateStats {
  userId: string;
  userName: string;
  affiliateCode: string;
  totalClicks: number;
  totalReferrals: number;
  proReferrals: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  referrals: AffiliateReferral[];
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  payoutHistory?: Array<{
    id: string;
    amount: number;
    date: string;
    status: 'sukses' | 'diproses';
    destination: string;
  }>;
}

export const COMMISSION_RATES = {
  monthly: {
    price: 15000,
    ratePercent: 20,
    commissionAmount: 3000,
    label: 'Paket Bulanan (Rp 15.000)',
  },
  annual: {
    price: 100000,
    ratePercent: 25,
    commissionAmount: 25000,
    label: 'Paket Tahunan (Rp 100.000)',
  },
};

const STORAGE_KEY_AFFILIATE = 'hidup_sehatku_affiliate_data';
const STORAGE_KEY_CODE_INDEX = 'hidup_sehatku_affiliate_code_index';
export const STORAGE_KEY_REFERRER = 'hidupsehat_referrer_code';

// Helper to get or set mapping from affiliateCode -> userId
function getCodeIndex(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CODE_INDEX);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {};
}

function registerCode(code: string, userId: string) {
  try {
    const index = getCodeIndex();
    index[code.toUpperCase()] = userId;
    localStorage.setItem(STORAGE_KEY_CODE_INDEX, JSON.stringify(index));
  } catch (e) {
    // ignore
  }
}

export function getAffiliateStats(userId: string, userName: string): AffiliateStats {
  const safeId = userId || 'default-user';
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AFFILIATE}_${safeId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure code is indexed
      if (parsed.affiliateCode) {
        registerCode(parsed.affiliateCode, safeId);
      }
      return parsed;
    }
  } catch (e) {
    // fallback
  }

  // Generate clean, memorable code
  const cleanName = (userName || 'MEMBER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'SEHAT';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const code = `HSK-${cleanName}-${randomSuffix}`;

  const initialStats: AffiliateStats = {
    userId: safeId,
    userName: userName || 'Sahabat Sehat',
    affiliateCode: code,
    totalClicks: 218,
    totalReferrals: 16,
    proReferrals: 5,
    totalEarnings: 34000, // e.g. 1 annual (25k) + 3 monthly (3x3k=9k) = 34k
    paidEarnings: 15000,
    pendingEarnings: 19000,
    referrals: [
      {
        id: 'ref-1',
        referredName: 'dr. Siti Rahmawati',
        referredPhone: '0812-9988-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        isPro: true,
        proUpgradedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        planPurchased: 'annual',
        commissionEarned: 25000,
        source: 'qr_code',
      },
      {
        id: 'ref-2',
        referredName: 'Budi Santoso (Kantor)',
        referredPhone: '0813-1122-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        isPro: true,
        proUpgradedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        planPurchased: 'monthly',
        commissionEarned: 3000,
        source: 'qr_code',
      },
      {
        id: 'ref-3',
        referredName: 'Dewi Lestari',
        referredPhone: '0857-4433-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isPro: true,
        proUpgradedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        planPurchased: 'monthly',
        commissionEarned: 3000,
        source: 'direct_link',
      },
      {
        id: 'ref-4',
        referredName: 'Kevin Wijaya',
        referredPhone: '0821-7788-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        isPro: true,
        proUpgradedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        planPurchased: 'monthly',
        commissionEarned: 3000,
        source: 'qr_code',
      },
      {
        id: 'ref-5',
        referredName: 'Ahmad Fauzi',
        referredPhone: '0878-5566-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
        isPro: false,
        commissionEarned: 0,
        source: 'qr_code',
      },
      {
        id: 'ref-6',
        referredName: 'Rina Anggraini',
        referredPhone: '0896-1234-xxxx',
        joinedAt: new Date(Date.now() - 86400000 * 11).toISOString(),
        isPro: false,
        commissionEarned: 0,
        source: 'social_share',
      },
    ],
    bankDetails: {
      bankName: 'BCA',
      accountNumber: '8820192831',
      accountHolder: userName || 'Sahabat Sehat',
    },
    payoutHistory: [
      {
        id: 'pay-1',
        amount: 15000,
        date: new Date(Date.now() - 86400000 * 14).toISOString(),
        status: 'sukses',
        destination: 'BCA •••• 2831',
      },
    ],
  };

  saveAffiliateStats(safeId, initialStats);
  registerCode(code, safeId);
  return initialStats;
}

export function saveAffiliateStats(userId: string, stats: AffiliateStats) {
  const safeId = userId || stats.userId || 'default-user';
  try {
    localStorage.setItem(`${STORAGE_KEY_AFFILIATE}_${safeId}`, JSON.stringify(stats));
    if (stats.affiliateCode) {
      registerCode(stats.affiliateCode, safeId);
    }
  } catch (e) {
    // ignore
  }
}

export function findAffiliateByCode(code: string): { userId: string; stats: AffiliateStats } | null {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const index = getCodeIndex();
  let userId = index[cleanCode];

  // If not found in index, scan localStorage keys
  if (!userId) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_AFFILIATE)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            if (data.affiliateCode && data.affiliateCode.toUpperCase() === cleanCode) {
              userId = data.userId || key.replace(`${STORAGE_KEY_AFFILIATE}_`, '');
              registerCode(cleanCode, userId);
              return { userId, stats: data };
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  if (userId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_AFFILIATE}_${userId}`);
      if (raw) {
        return { userId, stats: JSON.parse(raw) };
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback: create mock affiliate stats for this code so commission tracking never fails
  const fallbackUser = 'affiliate_' + cleanCode.toLowerCase();
  const fallbackStats = getAffiliateStats(fallbackUser, cleanCode);
  fallbackStats.affiliateCode = cleanCode;
  saveAffiliateStats(fallbackUser, fallbackStats);
  registerCode(cleanCode, fallbackUser);
  return { userId: fallbackUser, stats: fallbackStats };
}

/**
 * Called when a visitor arrives via QR code scan or referral link (e.g., ?ref=CODE or ?aff=CODE)
 */
export function recordAffiliateScanOrClick(
  refCode: string,
  user?: { name?: string; phone?: string; id?: string }
): { success: boolean; affiliateCode: string; isNewReferral: boolean } {
  if (!refCode) return { success: false, affiliateCode: '', isNewReferral: false };
  const cleanCode = refCode.trim().toUpperCase();

  // Save in client localStorage permanently
  localStorage.setItem(STORAGE_KEY_REFERRER, cleanCode);
  localStorage.setItem('hidupsehat_referrer_time', new Date().toISOString());

  const affData = findAffiliateByCode(cleanCode);
  if (!affData) {
    return { success: true, affiliateCode: cleanCode, isNewReferral: false };
  }

  const { userId, stats } = affData;
  const userName = user?.name || 'Calon User (Scan QR)';
  const userPhone = user?.phone || '';

  // Check if visitor was already recorded
  const alreadyExists = stats.referrals.some(
    (r) => (user?.id && r.id === user.id) || (userPhone && r.referredPhone === userPhone)
  );

  let isNew = false;
  const updatedStats = { ...stats };
  updatedStats.totalClicks = (updatedStats.totalClicks || 0) + 1;

  if (!alreadyExists) {
    const newRef: AffiliateReferral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      referredName: userName,
      referredPhone: userPhone,
      joinedAt: new Date().toISOString(),
      isPro: false,
      source: 'qr_code',
      commissionEarned: 0,
    };
    updatedStats.referrals = [newRef, ...updatedStats.referrals];
    updatedStats.totalReferrals = updatedStats.referrals.length;
    isNew = true;
  }

  saveAffiliateStats(userId, updatedStats);
  return { success: true, affiliateCode: cleanCode, isNewReferral: isNew };
}

/**
 * Called whenever a user upgrades to PRO (monthly or annual), ANYTIME they purchase!
 */
export function processAffiliateProPurchase(
  plan: 'monthly' | 'annual',
  user?: { name?: string; phone?: string; id?: string }
): { success: boolean; commissionEarned: number; affiliateCode?: string } {
  const refCode = localStorage.getItem(STORAGE_KEY_REFERRER);
  if (!refCode) {
    return { success: false, commissionEarned: 0 };
  }

  const cleanCode = refCode.trim().toUpperCase();
  const affData = findAffiliateByCode(cleanCode);
  if (!affData) {
    return { success: false, commissionEarned: 0 };
  }

  const { userId, stats } = affData;
  const planInfo = COMMISSION_RATES[plan] || COMMISSION_RATES.monthly;
  const commission = planInfo.commissionAmount;

  const userName = user?.name || 'Calon User (Scan QR)';
  const userPhone = user?.phone || '';

  // Find existing referral or add new one
  let matchedIndex = stats.referrals.findIndex(
    (r) => (user?.id && r.id === user.id) || (userPhone && r.referredPhone === userPhone) || r.referredName === userName
  );

  const updatedReferrals = [...stats.referrals];

  if (matchedIndex >= 0) {
    // If not already pro, record commission
    const existing = updatedReferrals[matchedIndex];
    if (!existing.isPro || existing.planPurchased !== plan) {
      updatedReferrals[matchedIndex] = {
        ...existing,
        isPro: true,
        proUpgradedAt: new Date().toISOString(),
        planPurchased: plan,
        commissionEarned: existing.commissionEarned + commission,
      };
    }
  } else {
    // New PRO referral entry
    const newRef: AffiliateReferral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      referredName: userName,
      referredPhone: userPhone,
      joinedAt: new Date().toISOString(),
      isPro: true,
      proUpgradedAt: new Date().toISOString(),
      planPurchased: plan,
      commissionEarned: commission,
      source: 'qr_code',
    };
    updatedReferrals.unshift(newRef);
  }

  const proCount = updatedReferrals.filter((r) => r.isPro).length;
  const totalComm = updatedReferrals.reduce((sum, r) => sum + (r.commissionEarned || 0), 0);

  const updatedStats: AffiliateStats = {
    ...stats,
    referrals: updatedReferrals,
    totalReferrals: updatedReferrals.length,
    proReferrals: proCount,
    totalEarnings: totalComm,
    pendingEarnings: Math.max(0, totalComm - (stats.paidEarnings || 0)),
  };

  saveAffiliateStats(userId, updatedStats);

  return {
    success: true,
    commissionEarned: commission,
    affiliateCode: cleanCode,
  };
}

/**
 * Simulation helper for testing real-time reactivity in the dashboard
 */
export function simulateAffiliateReferral(
  userId: string,
  type: 'free_join' | 'pro_monthly' | 'pro_annual'
): { updatedStats: AffiliateStats; message: string } {
  const currentStats = getAffiliateStats(userId, 'Member');
  const indonesianNames = [
    'Anisa Maharani',
    'Bambang Pamungkas',
    'Citra Kirana',
    'Dimas Anggara',
    'Eka Prasetya',
    'Fauzan Rahman',
    'Gita Savitri',
    'Hendra Gunawan',
    'Indah Permatasari',
    'Joko Susilo',
  ];
  const randomName = indonesianNames[Math.floor(Math.random() * indonesianNames.length)];
  const randomPhone = `0812-${Math.floor(1000 + Math.random() * 9000)}-xxxx`;

  let commission = 0;
  let isPro = false;
  let plan: 'monthly' | 'annual' | undefined = undefined;

  if (type === 'pro_monthly') {
    isPro = true;
    plan = 'monthly';
    commission = COMMISSION_RATES.monthly.commissionAmount;
  } else if (type === 'pro_annual') {
    isPro = true;
    plan = 'annual';
    commission = COMMISSION_RATES.annual.commissionAmount;
  }

  const newReferral: AffiliateReferral = {
    id: `ref-sim-${Date.now()}`,
    referredName: `${randomName} (Scan QR)`,
    referredPhone: randomPhone,
    joinedAt: new Date().toISOString(),
    isPro,
    proUpgradedAt: isPro ? new Date().toISOString() : undefined,
    planPurchased: plan,
    commissionEarned: commission,
    source: 'qr_code',
  };

  const updatedReferrals = [newReferral, ...currentStats.referrals];
  const newProCount = updatedReferrals.filter((r) => r.isPro).length;
  const newTotalEarnings = currentStats.totalEarnings + commission;
  const newPendingEarnings = currentStats.pendingEarnings + commission;

  const updatedStats: AffiliateStats = {
    ...currentStats,
    totalClicks: currentStats.totalClicks + 1,
    totalReferrals: updatedReferrals.length,
    proReferrals: newProCount,
    totalEarnings: newTotalEarnings,
    pendingEarnings: newPendingEarnings,
    referrals: updatedReferrals,
  };

  saveAffiliateStats(userId, updatedStats);

  const message =
    type === 'free_join'
      ? `🎉 Simulasi Berhasil: ${randomName} berhasil scan QR Code & terdaftar sebagai Calon User Anda! Kapan pun ia beli versi PRO, komisi otomatis masuk ke Anda.`
      : `💰 KAS MASUK! ${randomName} berhasil membeli ${plan === 'annual' ? 'PRO Tahunan (Komisi +Rp 25.000)' : 'PRO Bulanan (Komisi +Rp 3.000)'}! Saldo komisi Anda langsung bertambah!`;

  return { updatedStats, message };
}

export const PROMO_TEMPLATES = [
  {
    title: '💬 WhatsApp / Telegram (Japri Teman & Grup Kerja)',
    category: 'WhatsApp',
    badge: 'Paling Banyak Konversi',
    text: `Halo teman-teman! 👋 Mau punya tubuh lebih bugar, gak gampang lelah di kantor, dan terhidrasi optimal setiap hari? 💧💪\n\nYuk cobain aplikasi *Hidup Sehatku*! Keren banget ada pengingat minum cerdas, pencatat olahraga, scan kalori makanan via kamera, dan asisten Dokter AI pribadi 🤖✨.\n\nSpesial lewat link / QR Code aku ini, kamu bisa langsung coba versi PRO Gratis 3 Hari lho!\n\n👉 Daftar di sini: [AFF_LINK]\n\nAtau scan QR Code di poster ini ya! Semangat hidup sehat bersama! 🌿❤️`,
  },
  {
    title: '📸 Instagram / TikTok Story & Caption',
    category: 'Social Media',
    badge: 'Viral & Catchy',
    text: `Rahasia tetap segar, fokus kerja, dan anti dehidrasi seharian: Aplikasi *Hidup Sehatku*! 💧✨\n\nAda fitur Tombol Minum Suara AI, GPS Rute Sehat bebas stres, dan panduan diet nusantara.\n\nKlaim Akun & PRO Trial 3 Hari GRATIS sekarang:\n🔗 Link di bio / klik: [AFF_LINK]\n\n#HidupSehatku #PolaHidupSehat #MinumAir #AIFitness #KantorSehat`,
  },
  {
    title: '🚴 Grup Komunitas Olahraga, Gowes & Gym',
    category: 'Komunitas',
    badge: 'Target Olahragawan',
    text: `Salam sehat teman-teman pejuang bugar! 🏃‍♂️🚴‍♀️\n\nBuat yang mau tracking kalori olahraga, langkah harian, dan asupan cairan tubuh secara presisi, aplikasi *Hidup Sehatku* recomended banget!\n\nGratis untuk semua teman-teman di grup ini, langsung gabung lewat link eksklusif aku ya:\n👉 [AFF_LINK]\n\nYuk saling pantau skor kesehatan kita hari ini! 🔥`,
  },
  {
    title: '💼 LinkedIn & Rekan Kerja Kantor',
    category: 'Profesional',
    badge: 'Formal & Elegan',
    text: `Bekerja produktif di depan layar seharian membutuhkan energi prima dan hidrasi yang teratur. Saya menggunakan aplikasi *Hidup Sehatku* untuk mengontrol kebiasaan minum air dan aktivitas fisik ringan di sela-sela jam kerja.\n\nBagi rekan-rekan yang ingin mencoba asisten kesehatan digital ini secara gratis:\n👉 Akses di sini: [AFF_LINK]`,
  },
];
