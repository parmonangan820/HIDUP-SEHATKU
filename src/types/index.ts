export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export type ActivityCategory =
  | 'jalan_kaki'
  | 'jogging'
  | 'lari_pagi'
  | 'jalan_di_tempat'
  | 'senam_aerobik'
  | 'badminton'
  | 'bersepeda'
  | 'berenang'
  | 'yoga'
  | 'gym'
  | 'lainnya';

export interface UserProfile {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'pria' | 'wanita';
  weight: number; // in kg
  height: number; // in cm
  targetWaterMl: number; // default calculated as weight * 35ml
  dailyWorkoutMinutesTarget: number;
  isRegistered: boolean;
  isLoggedIn?: boolean;
  role?: 'admin' | 'user';
  proStatus?: 'free' | 'trial' | 'active' | 'expired';
  trialStartedAt?: string;
  trialExpiresAt?: string;
  isPaidPro?: boolean;
}

export interface WaterLog {
  id: string;
  timestamp: string; // ISO
  time: string; // HH:mm
  amountMl: number;
  period: TimePeriod;
  containerType: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom';
  note?: string;
}

export interface WorkoutLog {
  id: string;
  timestamp: string; // ISO
  time: string; // HH:mm
  activityType: ActivityCategory;
  activityName: string;
  durationMinutes: number;
  caloriesBurned: number;
  distanceKm?: number;
  steps?: number;
  intensity: 'ringan' | 'sedang' | 'berat';
  period: TimePeriod;
  notes?: string;
}

export interface AIHealthAnalysis {
  category: string; // Golongan status sehat (e.g. "Ksatria Hidrasi & Kebugaran Prima")
  waterStatus: string; // e.g. "Sangat Sehat & Optimal" or "Dehidrasi Ringan"
  waterFeedback: string;
  workoutStatus: string;
  workoutFeedback: string;
  overallScore: number; // 0 - 100
  recommendations: string[];
  healthTips: string;
  analyzedAt: string;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  waterLogs: WaterLog[];
  workoutLogs: WorkoutLog[];
  totalWaterMl: number;
  totalWorkoutMinutes: number;
  totalCalories: number;
  aiAnalysis?: AIHealthAnalysis;
}

export interface ActivityDefinition {
  type: ActivityCategory;
  name: string;
  iconName: string;
  met: number; // Metabolic Equivalent of Task
  description: string;
  caloriePerHourPerKg: number;
  defaultMinutes: number;
  color: string;
}

export type NoteCategory = 'hidrasi' | 'olahraga' | 'makanan' | 'mood' | 'kesehatan' | 'umum';

export interface HealthNote {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  content: string;
  category: NoteCategory;
  mood?: 'hebat' | 'sehat' | 'biasa' | 'lelah';
  hasAlarm?: boolean;
  alarmTime?: string; // HH:mm
  isAlarmActive?: boolean;
  completed?: boolean;
  createdAt: string;
}

export interface HealthAlarm {
  id: string;
  label: string;
  time: string; // HH:mm
  days: string[]; // ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  isActive: boolean;
  type: 'minum' | 'olahraga' | 'istirahat' | 'makan' | 'catatan';
  noteId?: string;
  soundEnabled: boolean;
}

