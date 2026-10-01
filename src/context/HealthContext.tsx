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
  SupabaseStatusResult,
} from '../services/supabaseService';

interface HealthContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
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

const DEFAULT_PROFILE: UserProfile = {
  name: 'Budi Pratama',
  phone: '0812-3456-7890',
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

  const pullFromSupabase = async (): Promise<boolean> => {
    setIsSyncingSupabase(true);
    try {
      const data = await pullDataFromSupabase();
      if (data.configured && data.hasData) {
        if (data.profile) setProfile((prev) => ({ ...prev, ...data.profile }));
        if (data.notes && data.notes.length > 0) setNotes(data.notes);
        if (data.alarms && data.alarms.length > 0) setAlarms(data.alarms);
        if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);

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
        weeklySummary: calculateWeeklySummary(),
        monthlySummary: calculateMonthlySummary(),
        todayWaterByPeriod,
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
