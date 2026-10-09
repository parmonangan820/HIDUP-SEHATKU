import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  WaterLog,
  WorkoutLog,
  AIHealthAnalysis,
  DayRecord,
  TimePeriod,
  ActivityCategory,
  HealthNote,
  HealthAlarm,
} from '../types';
import { calculateCalories } from '../data/activities';
import { playAlarmChime, stopAlarmChime, playNotificationBlip } from '../utils/sound';
import {
  checkSupabaseStatus,
  pushDataToSupabase,
  pullDataFromSupabase,
  resetSupabaseData,
  configureSupabase,
  disconnectSupabase,
  SupabaseStatusResult,
} from '../services/supabaseService';
import {
  AnnouncementItem,
  verifyAdminPin,
  fetchActiveAnnouncement,
  fetchGlobalBanners,
  saveGlobalBanners,
  saveGlobalBannerSlide,
} from '../services/adminService';
import { DEFAULT_GLOBAL_BANNERS } from '../utils/defaultBanners';
import { optimizeBannerImage } from '../utils/imageOptimizer';
import {
  AccountSummary,
  fetchRegisteredAccounts,
  loginToAccount,
} from '../services/accountService';
import {
  recordAffiliateScanOrClick,
  processAffiliateProPurchase,
  STORAGE_KEY_REFERRER,
} from '../services/affiliateService';

interface HealthContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  bannerSlides: BannerSlide[];
  updateBannerSlide: (index: number, updated: Partial<BannerSlide>) => Promise<void> | void;
  saveAllBannerSlides: (slides: BannerSlide[]) => Promise<{ success: boolean; message: string }>;
  refreshBannersFromServer: () => Promise<void>;
  createNewAccount: (newProfile: Omit<UserProfile, 'isRegistered'>) => Promise<void>;
  resetAllDataToZero: () => Promise<void>;
  configureSupabaseConnection: (
    url: string,
    key: string
  ) => Promise<{ success: boolean; message: string; code?: string; url?: string }>;
  disconnectSupabaseConnection: () => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  loginAsAdmin: (pin: string) => Promise<{ success: boolean; message: string }>;
  logoutAdmin: () => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  isAccountModalOpen: boolean;
  setIsAccountModalOpen: (open: boolean) => void;
  isPro: boolean;
  isProTrial: boolean;
  isPaidPro: boolean;
  isTrialExpired: boolean;
  trialExpiresAt: Date | null;
  trialTimeRemainingFormatted: string;
  activateProTrial: () => { success: boolean; message: string };
  isProModalOpen: boolean;
  setIsProModalOpen: (open: boolean) => void;
  isPaymentHistoryOpen: boolean;
  setIsPaymentHistoryOpen: (open: boolean) => void;
  isTumblerModalOpen: boolean;
  setIsTumblerModalOpen: (open: boolean) => void;
  isAffiliateOpen: boolean;
  setIsAffiliateOpen: (open: boolean) => void;
  userProPlan: 'monthly' | 'annual' | null;
  upgradeToPro: (plan: 'monthly' | 'annual') => void;
  registeredAccounts: AccountSummary[];
  loadRegisteredAccounts: () => Promise<void>;
  loginWithAccount: (params: {
    profileId?: string;
    identifier?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logoutAccount: () => void;
  switchAccount: (account: AccountSummary) => Promise<{ success: boolean; message: string }>;
  activeAnnouncement: AnnouncementItem | null;
  dismissAnnouncement: () => void;
  refreshAnnouncement: () => Promise<void>;
  todayRecord: DayRecord;
  history: Record<string, DayRecord>;
  logWater: (
    amountMl: number,
    containerType?: WaterLog['containerType'],
    period?: TimePeriod,
    customTime?: string
  ) => void;
  undoLastWaterLog: () => number;
  deleteWaterLog: (id: string) => void;
  logWorkout: (workout: {
    activityType: ActivityCategory;
    activityName: string;
    durationMinutes: number;
    distanceKm?: number;
    steps?: number;
    intensity: 'ringan' | 'sedang' | 'berat';
    period?: TimePeriod;
    notes?: string;
  }) => void;
  deleteWorkoutLog: (id: string) => void;
  aiAnalysis: AIHealthAnalysis | null;
  isAiAnalyzing: boolean;
  runAiAnalysis: () => Promise<AIHealthAnalysis | null>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  notes: HealthNote[];
  addNote: (note: Omit<HealthNote, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, updated: Partial<HealthNote>) => void;
  deleteNote: (id: string) => void;
  alarms: HealthAlarm[];
  addAlarm: (alarm: Omit<HealthAlarm, 'id'>) => void;
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;
  activeRingingAlarm: { alarm: HealthAlarm; note?: HealthNote } | null;
  dismissRingingAlarm: () => void;
  testAlarmSound: () => void;
  supabaseStatus: SupabaseStatusResult | null;
  isSyncingSupabase: boolean;
  lastSyncedTime: string | null;
  syncWithSupabase: () => Promise<boolean>;
  pullFromSupabase: () => Promise<boolean>;
  weeklySummary: {
    dates: string[];
    days: {
      date: string;
      dayLabel: string;
      waterMl: number;
      waterTarget: number;
      workoutMins: number;
      calories: number;
      waterPercentage: number;
    }[];
    totalWaterLiters: number;
    totalWorkoutMins: number;
    totalCalories: number;
    avgWaterMl: number;
    targetMetDaysCount: number;
  };
  monthlySummary: {
    totalWaterLiters: number;
    totalWorkoutHours: number;
    totalCalories: number;
    activeDays: number;
    waterTargetAchievedDays: number;
    topActivity: string;
  };
  todayWaterByPeriod: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentPeriod(): TimePeriod {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 18.5) return 'evening';
  return 'night';
}

export function getPeriodFromTime(timeStr: string): TimePeriod {
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10) || 12;
  if (hour >= 4 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 19) return 'evening';
  return 'night';
}

export function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'morning':
      return 'Pagi Hari (05:00 - 11:00)';
    case 'afternoon':
      return 'Siang Hari (11:00 - 15:00)';
    case 'evening':
      return 'Sore Hari (15:00 - 18:30)';
    case 'night':
      return 'Malam Hari (18:30 - 23:00)';
  }
}

// Generate realistic seeded history for demo
function generateInitialHistory(todayStr: string, profile: UserProfile): Record<string, DayRecord> {
  const history: Record<string, DayRecord> = {};
  const today = new Date();

  // Create last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

    if (dateStr === todayStr) {
      // Today initial logs
      const initialWaterLogs: WaterLog[] = [
        {
          id: 'w-init-1',
          timestamp: new Date(d.setHours(6, 30)).toISOString(),
          time: '06:30',
          amountMl: 400,
          period: 'morning',
          containerType: 'gelas',
          note: 'Segelas besar air hangat setelah bangun tidur',
        },
        {
          id: 'w-init-2',
          timestamp: new Date(d.setHours(9, 15)).toISOString(),
          time: '09:15',
          amountMl: 300,
          period: 'morning',
          containerType: 'tumbler',
          note: 'Saat mulai kerja pagi',
        },
        {
          id: 'w-init-3',
          timestamp: new Date(d.setHours(12, 45)).toISOString(),
          time: '12:45',
          amountMl: 450,
          period: 'afternoon',
          containerType: 'botol',
          note: 'Selesai makan siang',
        },
      ];

      const initialWorkoutLogs: WorkoutLog[] = [
        {
          id: 'wk-init-1',
          timestamp: new Date(d.setHours(6, 45)).toISOString(),
          time: '06:45',
          activityType: 'jalan_kaki',
          activityName: 'Jalan Kaki',
          durationMinutes: 25,
          distanceKm: 2.1,
          steps: 3200,
          intensity: 'sedang',
          caloriesBurned: calculateCalories('jalan_kaki', 25, profile.weight, 'sedang'),
          period: 'morning',
          notes: 'Jalan santai mengelilingi perumahan pagi hari',
        },
      ];

      const totalWater = initialWaterLogs.reduce((sum, item) => sum + item.amountMl, 0);
      const totalMins = initialWorkoutLogs.reduce((sum, item) => sum + item.durationMinutes, 0);
      const totalCal = initialWorkoutLogs.reduce((sum, item) => sum + item.caloriesBurned, 0);

      history[dateStr] = {
        date: dateStr,
        waterLogs: initialWaterLogs,
        workoutLogs: initialWorkoutLogs,
        totalWaterMl: totalWater,
        totalWorkoutMinutes: totalMins,
        totalCalories: totalCal,
      };
    } else {
      // Past days realistic data
      const randomSeed = (i * 17) % 10;
      const waterAmounts = [2200, 2600, 1950, 2750, 2400, 2800, 2100, 2550, 2300, 2650];
      const water = waterAmounts[randomSeed];

      const workoutTypes: ActivityCategory[] = [
        'jogging',
        'jalan_kaki',
        'badminton',
        'senam_aerobik',
        'jalan_di_tempat',
        'bersepeda',
        'lari_pagi',
      ];
      const actType = workoutTypes[randomSeed % workoutTypes.length];
      const duration = [20, 30, 45, 25, 40, 35, 15][randomSeed % 7];
      const cal = calculateCalories(actType, duration, profile.weight, 'sedang');

      history[dateStr] = {
        date: dateStr,
        waterLogs: [
          {
            id: `past-w1-${dateStr}`,
            timestamp: new Date(d.setHours(7, 0)).toISOString(),
            time: '07:00',
            amountMl: Math.round(water * 0.3),
            period: 'morning',
            containerType: 'gelas',
          },
          {
            id: `past-w2-${dateStr}`,
            timestamp: new Date(d.setHours(13, 0)).toISOString(),
            time: '13:00',
            amountMl: Math.round(water * 0.35),
            period: 'afternoon',
            containerType: 'botol',
          },
          {
            id: `past-w3-${dateStr}`,
            timestamp: new Date(d.setHours(17, 30)).toISOString(),
            time: '17:30',
            amountMl: Math.round(water * 0.2),
            period: 'evening',
            containerType: 'tumbler',
          },
          {
            id: `past-w4-${dateStr}`,
            timestamp: new Date(d.setHours(20, 15)).toISOString(),
            time: '20:15',
            amountMl: Math.round(water * 0.15),
            period: 'night',
            containerType: 'cangkir',
          },
        ],
        workoutLogs: [
          {
            id: `past-wk-${dateStr}`,
            timestamp: new Date(d.setHours(17, 0)).toISOString(),
            time: '17:00',
            activityType: actType,
            activityName: actType.replace('_', ' ').toUpperCase(),
            durationMinutes: duration,
            caloriesBurned: cal,
            intensity: 'sedang',
            period: 'evening',
          },
        ],
        totalWaterMl: water,
        totalWorkoutMinutes: duration,
        totalCalories: cal,
      };
    }
  }

  return history;
}

export interface BannerSlide {
  id: number;
  imageUrl?: string;
  badge: string;
}

const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 1,
    badge: '1/3',
    imageUrl: '',
  },
  {
    id: 2,
    badge: '2/3',
    imageUrl: '',
  },
  {
    id: 3,
    badge: '3/3',
    imageUrl: '',
  },
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Pengunjung',
  phone: '',
  email: '',
  age: 25,
  gender: 'pria',
  weight: 60,
  height: 165,
  targetWaterMl: 2100,
  dailyWorkoutMinutesTarget: 30,
  isRegistered: false,
  isLoggedIn: false,
};

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('hidup_sehatku_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROFILE;
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(() => {
    try {
      const saved = localStorage.getItem('hidupsehat_custom_banners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_GLOBAL_BANNERS;
  });

  // Global banner synchronization with server
  const refreshBannersFromServer = async () => {
    try {
      const globalBanners = await fetchGlobalBanners();
      if (Array.isArray(globalBanners) && globalBanners.length > 0) {
        const localSaved = localStorage.getItem('hidupsehat_custom_banners');
        let localSlides: BannerSlide[] = [];
        try {
          if (localSaved) localSlides = JSON.parse(localSaved);
        } catch {}

        const serverHasCustomImages = globalBanners.some((b) => Boolean(b.imageUrl && b.imageUrl.trim()));
        const localHasCustomImages = localSlides.some((b) => Boolean(b.imageUrl && b.imageUrl.trim()));

        // If this browser (e.g. Admin) already has custom images that server doesn't have yet, auto-push to server!
        if (localHasCustomImages && !serverHasCustomImages) {
          try {
            const optimized = await Promise.all(
              localSlides.map(async (s) => {
                if (s.imageUrl && s.imageUrl.startsWith('data:image/')) {
                  const opt = await optimizeBannerImage(s.imageUrl);
                  return { ...s, imageUrl: opt };
                }
                return s;
              })
            );
            await saveGlobalBanners(optimized);
            setBannerSlides(optimized);
            localStorage.setItem('hidupsehat_custom_banners', JSON.stringify(optimized));
          } catch (err) {
            console.warn('Auto sync banners error:', err);
          }
          return;
        }

        // Otherwise adopt global server banners
        if (serverHasCustomImages || !localHasCustomImages) {
          setBannerSlides(globalBanners);
          localStorage.setItem('hidupsehat_custom_banners', JSON.stringify(globalBanners));
        }
      }
    } catch (err) {
      console.error('Error refreshing banners from server:', err);
    }
  };

  useEffect(() => {
    refreshBannersFromServer();
    // Re-check periodically so other browsers see new banners automatically
    const interval = setInterval(refreshBannersFromServer, 25000);
    return () => clearInterval(interval);
  }, []);

  const updateBannerSlide = async (index: number, updated: Partial<BannerSlide>) => {
    let slideToSave = { ...bannerSlides[index], ...updated };
    if (slideToSave.imageUrl && slideToSave.imageUrl.startsWith('data:image/')) {
      try {
        const opt = await optimizeBannerImage(slideToSave.imageUrl);
        slideToSave = { ...slideToSave, imageUrl: opt };
      } catch (e) {
        console.warn('Optimization fallback in updateBannerSlide:', e);
      }
    }

    const newSlides = [...bannerSlides];
    newSlides[index] = slideToSave;
    setBannerSlides(newSlides);
    localStorage.setItem('hidupsehat_custom_banners', JSON.stringify(newSlides));

    try {
      await saveGlobalBannerSlide(index, slideToSave);
    } catch (e) {
      console.error('Error saving banner slide to server:', e);
    }
  };

  const saveAllBannerSlides = async (slidesToSave: BannerSlide[]) => {
    let preparedSlides = slidesToSave;
    try {
      preparedSlides = await Promise.all(
        slidesToSave.map(async (s) => {
          if (s.imageUrl && s.imageUrl.startsWith('data:image/')) {
            const opt = await optimizeBannerImage(s.imageUrl);
            return { ...s, imageUrl: opt };
          }
          return s;
        })
      );
    } catch (e) {
      console.warn('Failed to pre-optimize slides:', e);
    }

    setBannerSlides(preparedSlides);
    localStorage.setItem('hidupsehat_custom_banners', JSON.stringify(preparedSlides));
    try {
      const res = await saveGlobalBanners(preparedSlides);
      return res;
    } catch (e: any) {
      console.error('Error saving all banners to server:', e);
      return { success: false, message: e?.message || 'Gagal menyimpan banner ke server' };
    }
  };

  const [history, setHistory] = useState<Record<string, DayRecord>>(() => {
    try {
      const saved = localStorage.getItem('hidup_sehatku_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return generateInitialHistory(getTodayDateString(), DEFAULT_PROFILE);
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIHealthAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('hidup_sehatku_ai_analysis');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      category: 'Pejuang Hidup Sehat Berpotensi Tinggi',
      waterStatus: 'Cukup Sehat & Menuju Optimal',
      waterFeedback:
        'Asupan minum Anda di pagi dan siang hari cukup teratur. Pastikan menjaga kontinuitas asupan air di sore hari sebelum berolahraga.',
      workoutStatus: 'Aktif & Konsisten',
      workoutFeedback:
        'Aktivitas jalan kaki dan olahraga pagi Anda sudah sangat baik mengaktifkan metabolisme harian.',
      overallScore: 88,
      recommendations: [
        'Tetap pertahankan minum 1-2 gelas air hangat setiap bangun pagi sebelum sarapan.',
        'Minum 200 ml air 15 menit sebelum memulai sesi olahraga dan 250 ml setelahnya.',
        'Kombinasikan jalan kaki dengan olahraga raket seperti badminton atau senam aerobik di akhir pekan.',
      ],
      healthTips:
        'Penelitian menunjukkan bahwa hidrasi optimal di pagi dan siang hari meningkatkan fungsi kognitif otak hingga 25% dan mencegah kelelahan dini di sore hari.',
      analyzedAt: new Date().toISOString(),
    };
  });

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Health Notes state
  const [notes, setNotes] = useState<HealthNote[]>(() => {
    try {
      const saved = localStorage.getItem('hidup_sehatku_notes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'note-init-1',
        date: getTodayDateString(),
        time: '07:00',
        title: 'Minum Air Hangat Pagi & Sarapan Sehat',
        content:
          'Pagi ini minum 400 ml air hangat segera setelah bangun tidur. Perut terasa sangat nyaman dan tubuh langsung terasa berenergi sepanjang pagi.',
        category: 'hidrasi',
        mood: 'hebat',
        completed: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'note-init-2',
        date: getTodayDateString(),
        time: '12:15',
        title: 'Jalan Santai Keliling Kantor 15 Menit',
        content:
          'Saat jeda siang meluangkan waktu jalan kaki santai 15 menit agar tidak terlalu lama duduk di meja kerja ber-AC. Otot kaki lebih rileks!',
        category: 'olahraga',
        mood: 'sehat',
        hasAlarm: true,
        alarmTime: '12:30',
        isAlarmActive: true,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Health Alarms state
  const [alarms, setAlarms] = useState<HealthAlarm[]>(() => {
    try {
      const saved = localStorage.getItem('hidup_sehatku_alarms');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'alarm-1',
        label: 'Minum Air Hangat Pagi',
        time: '06:30',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        isActive: true,
        type: 'minum',
        soundEnabled: true,
      },
      {
        id: 'alarm-2',
        label: 'Hidrasi Jam Kantor Pagi',
        time: '09:30',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
        isActive: true,
        type: 'minum',
        soundEnabled: true,
      },
      {
        id: 'alarm-3',
        label: 'Minum Air & Istirahat Siang',
        time: '12:30',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
        isActive: true,
        type: 'minum',
        soundEnabled: true,
      },
      {
        id: 'alarm-4',
        label: 'Peregangan & Hidrasi Sore',
        time: '15:30',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
        isActive: true,
        type: 'istirahat',
        soundEnabled: true,
      },
      {
        id: 'alarm-5',
        label: 'Waktunya Olahraga Sore',
        time: '17:30',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        isActive: true,
        type: 'olahraga',
        soundEnabled: true,
      },
      {
        id: 'alarm-6',
        label: 'Minum 1 Gelas Sebelum Tidur',
        time: '21:00',
        days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        isActive: true,
        type: 'minum',
        soundEnabled: true,
      },
    ];
  });

  const [activeRingingAlarm, setActiveRingingAlarm] = useState<{
    alarm: HealthAlarm;
    note?: HealthNote;
  } | null>(null);
  const [lastTriggeredMinute, setLastTriggeredMinute] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('hidup_sehatku_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('hidup_sehatku_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (aiAnalysis) {
      localStorage.setItem('hidup_sehatku_ai_analysis', JSON.stringify(aiAnalysis));
    }
  }, [aiAnalysis]);

  useEffect(() => {
    localStorage.setItem('hidup_sehatku_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('hidup_sehatku_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Request browser notification permission once if possible
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          Notification.requestPermission().catch(() => {});
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  // Live Alarm Runner (runs every 4 seconds)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const currentDay = dayNames[now.getDay()];

      if (currentTimeStr === lastTriggeredMinute) return;

      // 1. Check custom note alarms for today
      const todayDate = getTodayDateString();
      const matchingNote = notes.find(
        (n) =>
          n.hasAlarm &&
          n.isAlarmActive &&
          n.alarmTime === currentTimeStr &&
          n.date === todayDate &&
          !n.completed
      );

      // 2. Check system recurring alarms
      const matchingAlarm = alarms.find(
        (a) =>
          a.isActive &&
          a.time === currentTimeStr &&
          (!a.days || a.days.length === 0 || a.days.includes(currentDay))
      );

      if (matchingNote || matchingAlarm) {
        setLastTriggeredMinute(currentTimeStr);

        const ringAlarm: HealthAlarm = matchingAlarm || {
          id: matchingNote!.id,
          label: matchingNote!.title,
          time: matchingNote!.alarmTime || currentTimeStr,
          days: [currentDay],
          isActive: true,
          type: 'catatan',
          soundEnabled: true,
        };

        setActiveRingingAlarm({ alarm: ringAlarm, note: matchingNote });
        playAlarmChime(true);

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`⏰ Alarm: ${ringAlarm.label}`, {
              body: `Waktu: ${currentTimeStr} - Tetap jaga pola hidup sehat Anda!`,
            });
          } catch (e) {
            // ignore
          }
        }
      }
    };

    const timer = setInterval(checkAlarms, 4000);
    return () => clearInterval(timer);
  }, [alarms, notes, lastTriggeredMinute]);

  const dismissRingingAlarm = () => {
    stopAlarmChime();
    setActiveRingingAlarm(null);
  };

  const testAlarmSound = () => {
    playAlarmChime(false);
  };

  const addNote = (newNote: Omit<HealthNote, 'id' | 'createdAt'>) => {
    const noteObj: HealthNote = {
      ...newNote,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [noteObj, ...prev]);
    playNotificationBlip();
  };

  const updateNote = (id: string, updated: Partial<HealthNote>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const addAlarm = (newAlarm: Omit<HealthAlarm, 'id'>) => {
    const alarmObj: HealthAlarm = {
      ...newAlarm,
      id: `alarm-${Date.now()}`,
    };
    setAlarms((prev) => [...prev, alarmObj]);
    playNotificationBlip();
  };

  const toggleAlarm = (id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  // Supabase Cloud Synchronization State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatusResult | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return localStorage.getItem('hidup_sehatku_last_synced') || null;
  });

  // Admin Panel State (EKSKLUSIF HANYA UNTUK AKUN canggihmarbun DENGAN EMAIL canggihmarbun14@gmail.com)
  const isAdmin = useMemo(() => {
    if (!profile) return false;
    const email = (profile.email || '').trim().toLowerCase();
    const name = (profile.name || '').trim().toLowerCase();

    // Diizinkan jika email adalah canggihmarbun14@gmail.com atau canggihemarbun14@gmail.com,
    // atau jika nama Canggih Marbun dan email belum diisi
    const allowedEmails = ['canggihmarbun14@gmail.com', 'canggihemarbun14@gmail.com'];
    const isEmailAdmin = allowedEmails.includes(email);
    const isNameAdmin = name === 'canggih marbun' || name === 'canggihmarbun';

    return isEmailAdmin || (isNameAdmin && (email === '' || allowedEmails.includes(email)));
  }, [profile]);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<AnnouncementItem | null>(null);

  const refreshAnnouncement = async () => {
    try {
      const ann = await fetchActiveAnnouncement();
      setActiveAnnouncement(ann);
    } catch (e) {
      // ignore
    }
  };

  const dismissAnnouncement = () => {
    setActiveAnnouncement(null);
  };

  useEffect(() => {
    refreshAnnouncement();
  }, []);

  const loginAsAdmin = async (_pin?: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin) {
      return {
        success: false,
        message: 'Akses Ditolak: Tombol & halaman Admin Panel hanya dapat diakses oleh akun canggihmarbun (canggihmarbun14@gmail.com).',
      };
    }
    setIsAdminLoginModalOpen(false);
    setIsAdminModalOpen(true);
    return { success: true, message: 'Selamat datang di Panel Administrator!' };
  };

  const logoutAdmin = () => {
    setIsAdminModalOpen(false);
  };

  // Account Switching & Multi-User Login State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState<boolean>(false);
  const [isTumblerModalOpen, setIsTumblerModalOpen] = useState<boolean>(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState<boolean>(false);
  const [userProPlan, setUserProPlan] = useState<'monthly' | 'annual' | null>(() => {
    try {
      const saved = localStorage.getItem('hidupsehat_pro_plan');
      if (saved) return saved as 'monthly' | 'annual';
    } catch {}
    return null;
  });

  // 3-Day PRO Trial Settings: 72 Hours from activation
  const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

  const getAccountKey = (p: UserProfile) => {
    const raw = p.phone || p.id || p.email || 'guest_user';
    return raw.replace(/[^a-zA-Z0-9]/g, '_');
  };

  // State for permanent paid PRO
  const [isPaidPro, setIsPaidPro] = useState<boolean>(() => {
    try {
      const savedPaid = localStorage.getItem('hidupsehat_is_paid_pro');
      if (savedPaid) return JSON.parse(savedPaid);
      // Legacy check
      const legacyPro = localStorage.getItem('hidupsehat_is_pro');
      if (legacyPro) return JSON.parse(legacyPro);
    } catch {}
    return false;
  });

  // State for Trial tracking
  const [trialState, setTrialState] = useState<{
    activated: boolean;
    startedAt: number;
    expiresAt: number;
  }>(() => {
    try {
      const savedProfile = localStorage.getItem('hidup_sehatku_profile');
      let accKey = 'guest_user';
      if (savedProfile) {
        try {
          const p = JSON.parse(savedProfile);
          accKey = (p.phone || p.id || p.email || 'guest_user').replace(/[^a-zA-Z0-9]/g, '_');
        } catch {}
      }
      const savedTrial = localStorage.getItem(`hidupsehat_trial_${accKey}`);
      if (savedTrial) {
        return JSON.parse(savedTrial);
      }
      // If no trial record exists yet, automatically grant 3-day trial to user!
      const now = Date.now();
      const initTrial = {
        activated: true,
        startedAt: now,
        expiresAt: now + TRIAL_DURATION_MS,
      };
      localStorage.setItem(`hidupsehat_trial_${accKey}`, JSON.stringify(initTrial));
      return initTrial;
    } catch {
      const now = Date.now();
      return {
        activated: true,
        startedAt: now,
        expiresAt: now + TRIAL_DURATION_MS,
      };
    }
  });

  // Dynamic timestamp for countdown calculations
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000); // Check every 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Sync trial and paid state when account changes
  useEffect(() => {
    const accKey = getAccountKey(profile);
    try {
      const accPaid = localStorage.getItem(`hidupsehat_paid_${accKey}`);
      if (accPaid) {
        setIsPaidPro(JSON.parse(accPaid));
      } else {
        const globalPaid = localStorage.getItem('hidupsehat_is_paid_pro');
        setIsPaidPro(globalPaid ? JSON.parse(globalPaid) : false);
      }

      const savedTrial = localStorage.getItem(`hidupsehat_trial_${accKey}`);
      if (savedTrial) {
        setTrialState(JSON.parse(savedTrial));
      } else {
        // Auto-grant 3-day trial to this account
        const now = Date.now();
        const newTrial = {
          activated: true,
          startedAt: now,
          expiresAt: now + TRIAL_DURATION_MS,
        };
        localStorage.setItem(`hidupsehat_trial_${accKey}`, JSON.stringify(newTrial));
        setTrialState(newTrial);
      }

      const accPlan = localStorage.getItem(`hidupsehat_plan_${accKey}`);
      if (accPlan) {
        setUserProPlan(accPlan as any);
      } else {
        const globalPlan = localStorage.getItem('hidupsehat_pro_plan');
        setUserProPlan(globalPlan ? (globalPlan as any) : null);
      }
    } catch {}
  }, [profile.phone, profile.id, profile.email]);

  const isProTrial = useMemo(() => {
    if (isPaidPro) return false;
    return trialState.activated && currentTime < trialState.expiresAt;
  }, [isPaidPro, trialState, currentTime]);

  const isTrialExpired = useMemo(() => {
    if (isPaidPro) return false;
    return trialState.activated && currentTime >= trialState.expiresAt;
  }, [isPaidPro, trialState, currentTime]);

  // Overall isPro is true if user has paid PRO OR has an active 3-day trial
  const isPro = useMemo(() => {
    return isPaidPro || isProTrial;
  }, [isPaidPro, isProTrial]);

  const trialExpiresAt = useMemo(() => {
    return trialState.expiresAt ? new Date(trialState.expiresAt) : null;
  }, [trialState.expiresAt]);

  const trialTimeRemainingFormatted = useMemo(() => {
    if (isPaidPro) return 'Member Permanen';
    if (!trialState.activated) return 'Belum Aktif';
    const remainingMs = Math.max(0, trialState.expiresAt - currentTime);
    if (remainingMs <= 0) return 'Trial Berakhir';

    const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} Hari ${hours} Jam`;
    }
    if (hours > 0) {
      return `${hours} Jam ${minutes} Mnt`;
    }
    return `${minutes} Menit`;
  }, [isPaidPro, trialState, currentTime]);

  const activateProTrial = () => {
    const accKey = getAccountKey(profile);
    const now = Date.now();
    const newTrial = {
      activated: true,
      startedAt: now,
      expiresAt: now + TRIAL_DURATION_MS,
    };
    setTrialState(newTrial);
    localStorage.setItem(`hidupsehat_trial_${accKey}`, JSON.stringify(newTrial));
    return { success: true, message: 'Selamat! Trial PRO 3 Hari berhasil diaktifkan.' };
  };

  const upgradeToPro = (plan: 'monthly' | 'annual') => {
    setIsPaidPro(true);
    setUserProPlan(plan);
    const accKey = getAccountKey(profile);
    localStorage.setItem('hidupsehat_is_paid_pro', JSON.stringify(true));
    localStorage.setItem(`hidupsehat_paid_${accKey}`, JSON.stringify(true));
    localStorage.setItem('hidupsehat_is_pro', JSON.stringify(true));
    localStorage.setItem('hidupsehat_pro_plan', plan);
    localStorage.setItem(`hidupsehat_plan_${accKey}`, plan);

    // Attribute commission to affiliate whenever user buys PRO (now, tomorrow, or anytime in the future!)
    try {
      processAffiliateProPurchase(plan, {
        name: profile.name,
        phone: profile.phone,
        id: profile.id,
      });
    } catch (e) {
      console.error('Affiliate commission attribution error:', e);
    }
  };

  // Automatically record QR scan or referral link if user opens via ?ref= or ?aff=
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('aff');
      if (refParam) {
        recordAffiliateScanOrClick(refParam, {
          name: profile.name || 'Calon User (Scan QR)',
          phone: profile.phone || '',
          id: profile.id,
        });
      }
    } catch (e) {
      // ignore
    }
  }, [profile.name, profile.phone]);

  // Pro Auto Cloud Sync Effect to Supabase
  useEffect(() => {
    if (profile.isRegistered && isPro && supabaseStatus?.connected) {
      const syncDebounce = setTimeout(() => {
        pushDataToSupabase({
          profile,
          waterLogs: todayRecord.waterLogs,
          workoutLogs: todayRecord.workoutLogs,
          notes,
          alarms,
          aiAnalysis,
        }).catch((e) => console.error('Pro Auto-sync error:', e));
      }, 1500);
      return () => clearTimeout(syncDebounce);
    }
  }, [isPro, profile, history, notes, alarms, supabaseStatus]);

  const [registeredAccounts, setRegisteredAccounts] = useState<AccountSummary[]>([]);

  const loadRegisteredAccounts = async () => {
    // Akun tersimpan aman di database Supabase dan tidak dimunculkan sebagai daftar publik di aplikasi
    setRegisteredAccounts([]);
  };

  useEffect(() => {
    // Tidak memuat daftar akun ke frontend demi privasi dan keamanan pengguna
  }, []);

  const loginWithAccount = async (params: { profileId?: string; identifier?: string }) => {
    setIsSyncingSupabase(true);
    try {
      const res = await loginToAccount(params);
      if (res.success && res.profile) {
        setProfile(res.profile);
        localStorage.setItem('hidup_sehatku_profile', JSON.stringify(res.profile));

        // Format history with waterLogs and workoutLogs
        const todayDate = getTodayDateString();
        const cleanHistory: Record<string, DayRecord> = {
          [todayDate]: {
            date: todayDate,
            waterLogs: res.waterLogs || [],
            workoutLogs: res.workoutLogs || [],
            totalWaterMl: (res.waterLogs || []).reduce(
              (acc: number, curr: any) => acc + (curr.amountMl || 0),
              0
            ),
            totalWorkoutMinutes: (res.workoutLogs || []).reduce(
              (acc: number, curr: any) => acc + (curr.durationMinutes || 0),
              0
            ),
            totalCalories: (res.workoutLogs || []).reduce(
              (acc: number, curr: any) => acc + (curr.caloriesBurned || 0),
              0
            ),
          },
        };
        setHistory(cleanHistory);
        localStorage.setItem('hidup_sehatku_history', JSON.stringify(cleanHistory));

        if (res.notes) {
          setNotes(res.notes);
          localStorage.setItem('hidup_sehatku_notes', JSON.stringify(res.notes));
        }

        if (res.alarms && res.alarms.length > 0) {
          setAlarms(res.alarms);
          localStorage.setItem('hidup_sehatku_alarms', JSON.stringify(res.alarms));
        }

        if (res.aiAnalysis) {
          setAiAnalysis(res.aiAnalysis);
          localStorage.setItem('hidup_sehatku_ai_analysis', JSON.stringify(res.aiAnalysis));
        }

        setIsAccountModalOpen(false);
        loadRegisteredAccounts();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Akun tidak ditemukan' };
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const logoutAccount = () => {
    const guestProfile: UserProfile = {
      name: 'Pengunjung',
      phone: '',
      age: 25,
      gender: 'pria',
      weight: 60,
      height: 165,
      targetWaterMl: 2100,
      dailyWorkoutMinutesTarget: 30,
      isRegistered: false,
      isLoggedIn: false,
    };
    setProfile(guestProfile);
    localStorage.setItem('hidup_sehatku_profile', JSON.stringify(guestProfile));

    // Clear session history
    const todayDate = getTodayDateString();
    const guestHistory: Record<string, DayRecord> = {
      [todayDate]: {
        date: todayDate,
        waterLogs: [],
        workoutLogs: [],
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      },
    };
    setHistory(guestHistory);
    setNotes([]);
    setAiAnalysis(null);
    localStorage.removeItem('hidup_sehatku_history');
    localStorage.removeItem('hidup_sehatku_notes');
    localStorage.removeItem('hidup_sehatku_ai_analysis');

    logoutAdmin();
  };

  const switchAccount = async (account: AccountSummary) => {
    return await loginWithAccount({ profileId: account.id });
  };

  const pullFromSupabase = async (overrideProfile?: UserProfile): Promise<boolean> => {
    const activeProf = overrideProfile || profile;
    if (!activeProf || (!activeProf.id && !activeProf.phone && !activeProf.email)) {
      return false;
    }
    setIsSyncingSupabase(true);
    try {
      const data = await pullDataFromSupabase({
        profileId: activeProf.id,
        phone: activeProf.phone,
        email: activeProf.email,
      });
      if (data.configured && data.hasData && data.profile) {
        // Ensure the pulled profile belongs to the CURRENT user and never overwrites with another account
        const isSameUser =
          (activeProf.id && data.profile.id === activeProf.id) ||
          (activeProf.phone && data.profile.phone === activeProf.phone) ||
          (activeProf.email && data.profile.email === activeProf.email) ||
          (!activeProf.id && !activeProf.phone && !activeProf.email);

        if (isSameUser) {
          setProfile((prev) => {
            const merged = { ...prev, ...data.profile, isLoggedIn: true };
            localStorage.setItem('hidup_sehatku_profile', JSON.stringify(merged));
            return merged;
          });
          if (data.notes && data.notes.length > 0) setNotes(data.notes);
          if (data.alarms && data.alarms.length > 0) setAlarms(data.alarms);
          if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);

          const todayDate = getTodayDateString();
          const waterLogs = (data.waterLogs || []).map((w: any) => ({
            id: w.id,
            amountMl: w.amount_ml,
            timestamp: w.created_at || w.timestamp,
            time: w.time,
            period: w.period,
            containerType: w.container_type || 'gelas',
            note: w.note,
          }));
          const workoutLogs = (data.workoutLogs || []).map((wk: any) => ({
            id: wk.id,
            timestamp: wk.created_at || wk.timestamp,
            time: wk.time,
            activityType: wk.activity_type,
            activityName: wk.activity_name,
            durationMinutes: wk.duration_minutes,
            caloriesBurned: wk.calories_burned,
            distanceKm: wk.distance_km,
            steps: wk.steps,
            intensity: wk.intensity || 'sedang',
            period: wk.period,
            notes: wk.notes,
          }));

          if (waterLogs.length > 0 || workoutLogs.length > 0) {
            setHistory((prev) => {
              const existingToday = prev[todayDate] || {
                date: todayDate,
                waterLogs: [],
                workoutLogs: [],
                totalWaterMl: 0,
                totalWorkoutMinutes: 0,
                totalCalories: 0,
              };
              const totalWaterMl = waterLogs.reduce((acc: number, curr: any) => acc + (curr.amountMl || 0), 0);
              const totalWorkoutMinutes = workoutLogs.reduce((acc: number, curr: any) => acc + (curr.durationMinutes || 0), 0);
              const totalCalories = workoutLogs.reduce((acc: number, curr: any) => acc + (curr.caloriesBurned || 0), 0);

              return {
                ...prev,
                [todayDate]: {
                  ...existingToday,
                  waterLogs: waterLogs.length > 0 ? waterLogs : existingToday.waterLogs,
                  workoutLogs: workoutLogs.length > 0 ? workoutLogs : existingToday.workoutLogs,
                  totalWaterMl: waterLogs.length > 0 ? totalWaterMl : existingToday.totalWaterMl,
                  totalWorkoutMinutes: workoutLogs.length > 0 ? totalWorkoutMinutes : existingToday.totalWorkoutMinutes,
                  totalCalories: workoutLogs.length > 0 ? totalCalories : existingToday.totalCalories,
                },
              };
            });
          }

          const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          setLastSyncedTime(timeNow);
          localStorage.setItem('hidup_sehatku_last_synced', timeNow);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to pull from Supabase:', err);
      return false;
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Check Supabase connection on mount (Registered users only)
  useEffect(() => {
    checkSupabaseStatus()
      .then((status) => {
        setSupabaseStatus(status);
        if (status.connected && profile.isRegistered) {
          // Sync current profile's data from server
          pullFromSupabase();
        }
      })
      .catch((e) => console.error('Supabase check error:', e));
  }, []);

  const syncWithSupabase = async (): Promise<boolean> => {
    if (!profile.isRegistered) return false;
    setIsSyncingSupabase(true);
    try {
      const allWaterLogs = todayRecord?.waterLogs || [];
      const allWorkoutLogs = todayRecord?.workoutLogs || [];

      const res = await pushDataToSupabase({
        profile,
        waterLogs: allWaterLogs,
        workoutLogs: allWorkoutLogs,
        notes,
        alarms,
        aiAnalysis,
      });

      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(timeNow);
        localStorage.setItem('hidup_sehatku_last_synced', timeNow);
        setSupabaseStatus((prev) =>
          prev ? { ...prev, connected: true, message: 'Sinkronisasi Supabase Aktif' } : null
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to sync to Supabase:', err);
      return false;
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Real-time background auto-sync to Supabase PostgreSQL when data changes (Registered users only)
  useEffect(() => {
    if (!profile.isRegistered || !supabaseStatus?.connected) return;
    const timer = setTimeout(() => {
      syncWithSupabase().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [history, profile.isRegistered, profile, notes, alarms, aiAnalysis, supabaseStatus?.connected]);

  // Ensure selected date exists in history
  const todayRecord: DayRecord = history[selectedDate] || {
    date: selectedDate,
    waterLogs: [],
    workoutLogs: [],
    totalWaterMl: 0,
    totalWorkoutMinutes: 0,
    totalCalories: 0,
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      // Recalculate default water target if weight changed
      if (newProfile.weight && !newProfile.targetWaterMl) {
        updated.targetWaterMl = Math.round((newProfile.weight * 35) / 100) * 100;
      }
      return updated;
    });
  };

  const resetAllDataToZero = async () => {
    const todayDate = getTodayDateString();
    const cleanHistory: Record<string, DayRecord> = {
      [todayDate]: {
        date: todayDate,
        waterLogs: [],
        workoutLogs: [],
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      },
    };

    setHistory(cleanHistory);
    setNotes([]);
    localStorage.setItem('hidup_sehatku_history', JSON.stringify(cleanHistory));
    localStorage.setItem('hidup_sehatku_notes', JSON.stringify([]));

    const cleanAnalysis: AIHealthAnalysis = {
      category: 'Pendaftar Baru - Siap Memulai Hidup Sehat',
      waterStatus: 'Mulai dari 0 ml',
      waterFeedback: `Selamat datang, ${profile.name || 'Sahabat Sehat'}! Semua riwayat Anda telah direset ke 0. Mari mulai perjalanan sehat Anda dengan minum segelas air hangat pertama hari ini.`,
      workoutStatus: 'Mulai dari 0 menit',
      workoutFeedback: 'Setiap perjalanan kebugaran dimulai dari langkah pertama. Yuk jadwalkan jalan santai 15-20 menit hari ini!',
      overallScore: 100,
      recommendations: [
        'Awali dengan minum 1 gelas air putih (250 ml) sekarang.',
        'Catat setiap gelas air yang Anda minum agar mencapai target harian.',
        'Lakukan peregangan ringan di sela-sela aktivitas Anda.',
      ],
      healthTips: 'Memulai dari nol adalah kesempatan terbaik untuk membangun konsistensi baru yang lebih disiplin.',
      analyzedAt: new Date().toISOString(),
    };

    setAiAnalysis(cleanAnalysis);
    localStorage.setItem('hidup_sehatku_ai_analysis', JSON.stringify(cleanAnalysis));

    // Reset in Supabase if connected
    try {
      await resetSupabaseData(profile);
    } catch (e) {
      console.error('Supabase reset error:', e);
    }
  };

  const createNewAccount = async (newProfile: Omit<UserProfile, 'isRegistered'>) => {
    const calculatedTarget =
      newProfile.targetWaterMl || Math.round((newProfile.weight * 35) / 100) * 100;

    const fullProfile: UserProfile = {
      ...newProfile,
      targetWaterMl: calculatedTarget,
      isRegistered: true,
    };

    setProfile(fullProfile);
    localStorage.setItem('hidup_sehatku_profile', JSON.stringify(fullProfile));

    // Reset everything to 0
    const todayDate = getTodayDateString();
    const cleanHistory: Record<string, DayRecord> = {
      [todayDate]: {
        date: todayDate,
        waterLogs: [],
        workoutLogs: [],
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      },
    };

    setHistory(cleanHistory);
    setNotes([]);
    localStorage.setItem('hidup_sehatku_history', JSON.stringify(cleanHistory));
    localStorage.setItem('hidup_sehatku_notes', JSON.stringify([]));

    const welcomeAnalysis: AIHealthAnalysis = {
      category: 'Akun Baru - Siap Memulai Hidup Sehat',
      waterStatus: 'Mulai dari 0 ml',
      waterFeedback: `Selamat datang, ${fullProfile.name}! Akun baru Anda telah aktif dan semua riwayat dimulai dari nol (0 ml & 0 menit). Cukupi target ${calculatedTarget} ml air putih Anda hari ini.`,
      workoutStatus: 'Mulai dari 0 menit',
      workoutFeedback: `Target kebugaran harian Anda adalah ${fullProfile.dailyWorkoutMinutesTarget || 30} menit. Awali dengan jalan kaki santai atau senam ringan!`,
      overallScore: 100,
      recommendations: [
        `Minum 1 gelas air (250 ml) pertama Anda hari ini.`,
        `Gunakan tombol 'Bicara Minum' atau tombol cepat untuk mencatat setiap kali minum.`,
        `Pasang alarm pengingat di jam kantor agar tidak lupa minum.`,
      ],
      healthTips: 'Membangun kebiasaan sejak hari pertama pendaftaran sangat efektif membentuk metabolisme tubuh yang prima.',
      analyzedAt: new Date().toISOString(),
    };

    setAiAnalysis(welcomeAnalysis);
    localStorage.setItem('hidup_sehatku_ai_analysis', JSON.stringify(welcomeAnalysis));

    // Sync reset to Supabase if connected
    try {
      const resetRes = await resetSupabaseData(fullProfile);
      const newId = (resetRes as any)?.profileId;
      if (newId) {
        fullProfile.id = newId;
        setProfile(fullProfile);
        localStorage.setItem('hidup_sehatku_profile', JSON.stringify(fullProfile));
      }
      await pushDataToSupabase({
        profile: fullProfile,
        waterLogs: [],
        workoutLogs: [],
        notes: [],
        alarms,
        aiAnalysis: welcomeAnalysis,
      });
      const st = await checkSupabaseStatus();
      setSupabaseStatus(st);
      loadRegisteredAccounts();
    } catch (e) {
      console.error('Supabase reset error:', e);
    }
  };

  const configureSupabaseConnection = async (url: string, key: string) => {
    setIsSyncingSupabase(true);
    try {
      const res = await configureSupabase(url, key);
      if (res.success) {
        const st = await checkSupabaseStatus();
        setSupabaseStatus(st);
        // Automatically sync existing account data to Supabase
        await pushDataToSupabase({
          profile,
          waterLogs: todayRecord.waterLogs,
          workoutLogs: todayRecord.workoutLogs,
          notes,
          alarms,
          aiAnalysis,
        });
        const timeNow = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSyncedTime(timeNow);
        localStorage.setItem('hidup_sehatku_last_synced', timeNow);
      }
      return res;
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const disconnectSupabaseConnection = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await disconnectSupabase();
      if (res.success) {
        setSupabaseStatus({
          configured: false,
          connected: false,
          message: 'Koneksi Supabase telah diputus.',
        });
      }
      return res;
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const logWater = (
    amountMl: number,
    containerType: WaterLog['containerType'] = 'gelas',
    period?: TimePeriod,
    customTime?: string
  ) => {
    const now = new Date();
    const timeStr =
      customTime ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const actualPeriod = period || getPeriodFromTime(timeStr);

    const newLog: WaterLog = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      time: timeStr,
      amountMl,
      period: actualPeriod,
      containerType,
      note:
        containerType === 'tumbler'
          ? `Minum ${amountMl} ml via Smart Tumbler IoT (Auto-Sync)`
          : `Minum ${amountMl} ml (${containerType})`,
    };

    setHistory((prev) => {
      const current = prev[selectedDate] || {
        date: selectedDate,
        waterLogs: [],
        workoutLogs: [],
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      };

      const newLogs = [newLog, ...current.waterLogs];
      const newTotal = newLogs.reduce((acc, curr) => acc + curr.amountMl, 0);

      return {
        ...prev,
        [selectedDate]: {
          ...current,
          waterLogs: newLogs,
          totalWaterMl: newTotal,
        },
      };
    });
  };

  const undoLastWaterLog = (): number => {
    let removedAmount = 0;
    setHistory((prev) => {
      const current = prev[selectedDate];
      if (!current || !current.waterLogs || current.waterLogs.length === 0) {
        return prev;
      }
      const lastLog = current.waterLogs[0];
      removedAmount = lastLog.amountMl;
      const newLogs = current.waterLogs.slice(1);
      const newTotal = newLogs.reduce((acc, curr) => acc + curr.amountMl, 0);

      return {
        ...prev,
        [selectedDate]: {
          ...current,
          waterLogs: newLogs,
          totalWaterMl: newTotal,
        },
      };
    });
    return removedAmount;
  };

  const deleteWaterLog = (id: string) => {
    setHistory((prev) => {
      const current = prev[selectedDate];
      if (!current) return prev;
      const newLogs = current.waterLogs.filter((w) => w.id !== id);
      const newTotal = newLogs.reduce((acc, curr) => acc + curr.amountMl, 0);
      return {
        ...prev,
        [selectedDate]: {
          ...current,
          waterLogs: newLogs,
          totalWaterMl: newTotal,
        },
      };
    });
  };

  const logWorkout = (workout: {
    activityType: ActivityCategory;
    activityName: string;
    durationMinutes: number;
    distanceKm?: number;
    steps?: number;
    intensity: 'ringan' | 'sedang' | 'berat';
    period?: TimePeriod;
    notes?: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;
    const actualPeriod = workout.period || getCurrentPeriod();
    const calories = calculateCalories(
      workout.activityType,
      workout.durationMinutes,
      profile.weight,
      workout.intensity
    );

    const newLog: WorkoutLog = {
      id: `wk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      time: timeStr,
      activityType: workout.activityType,
      activityName: workout.activityName,
      durationMinutes: workout.durationMinutes,
      distanceKm: workout.distanceKm,
      steps: workout.steps,
      intensity: workout.intensity,
      caloriesBurned: calories,
      period: actualPeriod,
      notes: workout.notes,
    };

    setHistory((prev) => {
      const current = prev[selectedDate] || {
        date: selectedDate,
        waterLogs: [],
        workoutLogs: [],
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      };

      const newLogs = [newLog, ...current.workoutLogs];
      const newMins = newLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      const newCals = newLogs.reduce((acc, curr) => acc + curr.caloriesBurned, 0);

      return {
        ...prev,
        [selectedDate]: {
          ...current,
          workoutLogs: newLogs,
          totalWorkoutMinutes: newMins,
          totalCalories: newCals,
        },
      };
    });
  };

  const deleteWorkoutLog = (id: string) => {
    setHistory((prev) => {
      const current = prev[selectedDate];
      if (!current) return prev;
      const newLogs = current.workoutLogs.filter((w) => w.id !== id);
      const newMins = newLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      const newCals = newLogs.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
      return {
        ...prev,
        [selectedDate]: {
          ...current,
          workoutLogs: newLogs,
          totalWorkoutMinutes: newMins,
          totalCalories: newCals,
        },
      };
    });
  };

  // Period breakdown for today
  const todayWaterByPeriod = {
    morning: todayRecord.waterLogs
      .filter((l) => l.period === 'morning')
      .reduce((sum, l) => sum + l.amountMl, 0),
    afternoon: todayRecord.waterLogs
      .filter((l) => l.period === 'afternoon')
      .reduce((sum, l) => sum + l.amountMl, 0),
    evening: todayRecord.waterLogs
      .filter((l) => l.period === 'evening')
      .reduce((sum, l) => sum + l.amountMl, 0),
    night: todayRecord.waterLogs
      .filter((l) => l.period === 'night')
      .reduce((sum, l) => sum + l.amountMl, 0),
  };

  // Weekly & Monthly calculations
  const calculateWeeklySummary = () => {
    const today = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dates: string[] = [];
    const days: any[] = [];

    let totalWater = 0;
    let totalWorkoutMins = 0;
    let totalCalories = 0;
    let targetMetDaysCount = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      dates.push(dateStr);

      const record = history[dateStr] || {
        date: dateStr,
        totalWaterMl: 0,
        totalWorkoutMinutes: 0,
        totalCalories: 0,
      };

      const dayLabel = i === 0 ? 'Hari Ini' : dayNames[d.getDay()];
      const waterPercentage = Math.min(
        150,
        Math.round((record.totalWaterMl / profile.targetWaterMl) * 100)
      );

      totalWater += record.totalWaterMl;
      totalWorkoutMins += record.totalWorkoutMinutes;
      totalCalories += record.totalCalories;

      if (record.totalWaterMl >= profile.targetWaterMl) {
        targetMetDaysCount++;
      }

      days.push({
        date: dateStr,
        dayLabel,
        waterMl: record.totalWaterMl,
        waterTarget: profile.targetWaterMl,
        workoutMins: record.totalWorkoutMinutes,
        calories: record.totalCalories,
        waterPercentage,
      });
    }

    return {
      dates,
      days,
      totalWaterLiters: Math.round((totalWater / 1000) * 10) / 10,
      totalWorkoutMins,
      totalCalories,
      avgWaterMl: Math.round(totalWater / 7),
      targetMetDaysCount,
    };
  };

  const calculateMonthlySummary = () => {
    let totalWater = 0;
    let totalMins = 0;
    let totalCalories = 0;
    let activeDays = 0;
    let waterTargetAchievedDays = 0;
    const activityCounts: Record<string, number> = {};

    Object.values(history).forEach((rec) => {
      totalWater += rec.totalWaterMl;
      totalMins += rec.totalWorkoutMinutes;
      totalCalories += rec.totalCalories;
      if (rec.totalWorkoutMinutes > 0) activeDays++;
      if (rec.totalWaterMl >= profile.targetWaterMl) waterTargetAchievedDays++;

      rec.workoutLogs?.forEach((w) => {
        activityCounts[w.activityName] = (activityCounts[w.activityName] || 0) + 1;
      });
    });

    let topActivity = 'Jalan Kaki';
    let maxCount = 0;
    Object.entries(activityCounts).forEach(([act, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topActivity = act;
      }
    });

    return {
      totalWaterLiters: Math.round((totalWater / 1000) * 10) / 10,
      totalWorkoutHours: Math.round((totalMins / 60) * 10) / 10,
      totalCalories,
      activeDays,
      waterTargetAchievedDays,
      topActivity,
    };
  };

  const runAiAnalysis = async (): Promise<AIHealthAnalysis | null> => {
    setIsAiAnalyzing(true);
    try {
      const payload = {
        profile,
        todayWater: {
          totalMl: todayRecord.totalWaterMl,
          byPeriod: todayWaterByPeriod,
          logsCount: todayRecord.waterLogs.length,
        },
        todayWorkouts: todayRecord.workoutLogs,
        historySummary: {
          weeklyWaterAvg: calculateWeeklySummary().avgWaterMl,
          weeklyWorkoutMins: calculateWeeklySummary().totalWorkoutMins,
          daysMetTarget: calculateWeeklySummary().targetMetDaysCount,
        },
      };

      const res = await fetch('/api/gemini/analyze-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('AI analysis network error');
      }

      const data = await res.json();
      const analysis: AIHealthAnalysis = {
        category: data.category || 'Pejuang Hidup Sehat',
        waterStatus: data.waterStatus || 'Cukup Sehat',
        waterFeedback: data.waterFeedback || '',
        workoutStatus: data.workoutStatus || 'Aktif',
        workoutFeedback: data.workoutFeedback || '',
        overallScore: Number(data.overallScore) || 85,
        recommendations: data.recommendations || [],
        healthTips: data.healthTips || '',
        analyzedAt: new Date().toISOString(),
      };

      setAiAnalysis(analysis);
      return analysis;
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
      return null;
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <HealthContext.Provider
      value={{
        profile,
        updateProfile,
        createNewAccount,
        resetAllDataToZero,
        todayRecord,
        history,
        logWater,
        undoLastWaterLog,
        deleteWaterLog,
        logWorkout,
        deleteWorkoutLog,
        aiAnalysis,
        isAiAnalyzing,
        runAiAnalysis,
        selectedDate,
        setSelectedDate,
        notes,
        addNote,
        updateNote,
        deleteNote,
        alarms,
        addAlarm,
        toggleAlarm,
        deleteAlarm,
        activeRingingAlarm,
        dismissRingingAlarm,
        testAlarmSound,
        supabaseStatus,
        isSyncingSupabase,
        lastSyncedTime,
        syncWithSupabase,
        pullFromSupabase,
        configureSupabaseConnection,
        disconnectSupabaseConnection,
        isAdmin,
        loginAsAdmin,
        logoutAdmin,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isPro,
        isProTrial,
        isPaidPro,
        isTrialExpired,
        trialExpiresAt,
        trialTimeRemainingFormatted,
        activateProTrial,
        isProModalOpen,
        setIsProModalOpen,
        isPaymentHistoryOpen,
        setIsPaymentHistoryOpen,
        isTumblerModalOpen,
        setIsTumblerModalOpen,
        isAffiliateOpen,
        setIsAffiliateOpen,
        userProPlan,
        upgradeToPro,
        registeredAccounts,
        loadRegisteredAccounts,
        loginWithAccount,
        logoutAccount,
        switchAccount,
        activeAnnouncement,
        dismissAnnouncement,
        refreshAnnouncement,
        weeklySummary: calculateWeeklySummary(),
        monthlySummary: calculateMonthlySummary(),
        todayWaterByPeriod,
        bannerSlides,
        updateBannerSlide,
        saveAllBannerSlides,
        refreshBannersFromServer,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export function useHealth() {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
}
