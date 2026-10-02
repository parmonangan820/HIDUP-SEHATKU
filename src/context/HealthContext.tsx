import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../services/adminService';
import {
  AccountSummary,
  fetchRegisteredAccounts,
  loginToAccount,
} from '../services/accountService';

interface HealthContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  bannerSlides: BannerSlide[];
  updateBannerSlide: (index: number, updated: Partial<BannerSlide>) => void;
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
  isProModalOpen: boolean;
  setIsProModalOpen: (open: boolean) => void;
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
  name: 'Canggih Marbun',
  phone: '085760525942',
  age: 26,
  gender: 'pria',
  weight: 64,
  height: 170,
  targetWaterMl: 2500, // 64kg * 35ml ~ 2240 + activity ~ 2500ml
  dailyWorkoutMinutesTarget: 30,
  isRegistered: true,
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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BANNER_SLIDES;
  });

  const updateBannerSlide = (index: number, updated: Partial<BannerSlide>) => {
    setBannerSlides((prev) => {
      const newSlides = [...prev];
      newSlides[index] = { ...newSlides[index], ...updated };
      localStorage.setItem('hidupsehat_custom_banners', JSON.stringify(newSlides));
      return newSlides;
    });
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

  // Admin Panel State (Langsung Aktif Tanpa Autentikasi / PIN)
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
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
    setIsAdmin(true);
    setIsAdminLoginModalOpen(false);
    setIsAdminModalOpen(true);
    return { success: true, message: 'Selamat datang di Panel Administrator!' };
  };

  const logoutAdmin = () => {
    setIsAdminModalOpen(false);
  };

  // Account Switching & Multi-User Login State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hidupsehat_is_pro');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return false;
  });
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

  const upgradeToPro = (plan: 'monthly' | 'annual') => {
    setIsPro(true);
    localStorage.setItem('hidupsehat_is_pro', JSON.stringify(true));
  };

  const [registeredAccounts, setRegisteredAccounts] = useState<AccountSummary[]>([]);

  const loadRegisteredAccounts = async () => {
    try {
      const accs = await fetchRegisteredAccounts();
      setRegisteredAccounts(accs);
    } catch (e) {
      console.error('Error fetching accounts:', e);
    }
  };

  useEffect(() => {
    loadRegisteredAccounts();
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

  const pullFromSupabase = async (): Promise<boolean> => {
    setIsSyncingSupabase(true);
    try {
      const data = await pullDataFromSupabase();
      if (data.configured && data.hasData) {
        if (data.profile) setProfile((prev) => ({ ...prev, ...data.profile, isLoggedIn: true }));
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
      return false;
    } catch (err) {
      console.error('Failed to pull from Supabase:', err);
      return false;
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Check Supabase connection on mount
  useEffect(() => {
    checkSupabaseStatus()
      .then((status) => {
        setSupabaseStatus(status);
        if (status.connected) {
          pullFromSupabase();
        }
      })
      .catch((e) => console.error('Supabase check error:', e));
  }, []);

  const syncWithSupabase = async (): Promise<boolean> => {
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

  // Real-time background auto-sync to Supabase PostgreSQL when data changes
  useEffect(() => {
    if (!supabaseStatus?.connected) return;
    const timer = setTimeout(() => {
      syncWithSupabase().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [history, profile, notes, alarms, aiAnalysis, supabaseStatus?.connected]);

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
      note: `Minum ${amountMl} ml (${containerType})`,
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
        isProModalOpen,
        setIsProModalOpen,
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
