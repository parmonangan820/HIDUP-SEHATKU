import { ActivityDefinition, ActivityCategory } from '../types';

export const ACTIVITIES: ActivityDefinition[] = [
  {
    type: 'jalan_kaki',
    name: 'Jalan Kaki',
    iconName: 'Footprints',
    met: 3.5,
    description: 'Aktivitas kardio ringan terbaik untuk melancarkan sirkulasi darah tanpa membebani sendi.',
    caloriePerHourPerKg: 3.5,
    defaultMinutes: 30,
    color: '#10b981', // emerald
  },
  {
    type: 'jogging',
    name: 'Jogging Santai',
    iconName: 'Activity',
    met: 7.0,
    description: 'Lari santai berirama untuk meningkatkan stamina, kapasitas paru-paru, dan imunitas.',
    caloriePerHourPerKg: 7.0,
    defaultMinutes: 25,
    color: '#06b6d4', // cyan
  },
  {
    type: 'lari_pagi',
    name: 'Lari Pagi',
    iconName: 'Zap',
    met: 9.5,
    description: 'Lari pagi dengan intensitas tinggi, membakar kalori maksimal dan menghirup udara segar pagi hari.',
    caloriePerHourPerKg: 9.5,
    defaultMinutes: 20,
    color: '#f59e0b', // amber
  },
  {
    type: 'jalan_di_tempat',
    name: 'Jalan di Tempat',
    iconName: 'Repeat',
    met: 3.8,
    description: 'Olahraga praktis tanpa perlu keluar rumah. Sangat cocok saat hujan atau jeda kerja!',
    caloriePerHourPerKg: 3.8,
    defaultMinutes: 15,
    color: '#8b5cf6', // purple
  },
  {
    type: 'senam_aerobik',
    name: 'Senam & Zumba',
    iconName: 'Sparkles',
    met: 6.8,
    description: 'Gerakan dinamis mengikuti irama musik, melatih kelenturan otot dan koordinasi motorik.',
    caloriePerHourPerKg: 6.8,
    defaultMinutes: 30,
    color: '#ec4899', // pink
  },
  {
    type: 'badminton',
    name: 'Badminton / Bulutangkis',
    iconName: 'Flame',
    met: 7.5,
    description: 'Olahraga raket cepat melatih refleks, kelincahan, kekuatan kaki, dan ketangkasan tubuh.',
    caloriePerHourPerKg: 7.5,
    defaultMinutes: 45,
    color: '#3b82f6', // blue
  },
  {
    type: 'bersepeda',
    name: 'Bersepeda',
    iconName: 'Bike',
    met: 6.0,
    description: 'Mengayuh sepeda di luar atau statis melatih otot paha, betis, serta kesehatan kardiovaskular.',
    caloriePerHourPerKg: 6.0,
    defaultMinutes: 40,
    color: '#14b8a6', // teal
  },
  {
    type: 'berenang',
    name: 'Berenang',
    iconName: 'Waves',
    met: 8.0,
    description: 'Olahraga air menyeluruh (full-body workout) yang membakar banyak kalori tanpa tekanan pada sendi.',
    caloriePerHourPerKg: 8.0,
    defaultMinutes: 30,
    color: '#0284c7', // sky
  },
  {
    type: 'yoga',
    name: 'Yoga & Peregangan',
    iconName: 'HeartHandshake',
    met: 3.0,
    description: 'Melatih pernapasan, postur tubuh, fleksibilitas sendi, dan meredakan stres mental.',
    caloriePerHourPerKg: 3.0,
    defaultMinutes: 25,
    color: '#6366f1', // indigo
  },
  {
    type: 'gym',
    name: 'Latihan Beban / Gym',
    iconName: 'Dumbbell',
    met: 5.5,
    description: 'Membangun massa otot, memperkuat kepadatan tulang, dan meningkatkan pembakaran kalori basal.',
    caloriePerHourPerKg: 5.5,
    defaultMinutes: 45,
    color: '#ea580c', // orange
  },
  {
    type: 'lainnya',
    name: 'Olahraga Lainnya',
    iconName: 'Trophy',
    met: 5.0,
    description: 'Aktivitas fisik lainnya seperti tenis meja, futsal, basket, atau berkebun aktif.',
    caloriePerHourPerKg: 5.0,
    defaultMinutes: 30,
    color: '#64748b', // slate
  },
];

export function calculateCalories(
  activityType: ActivityCategory,
  durationMinutes: number,
  weightKg: number,
  intensity: 'ringan' | 'sedang' | 'berat' = 'sedang'
): number {
  const act = ACTIVITIES.find((a) => a.type === activityType) || ACTIVITIES[0];
  let multiplier = 1.0;
  if (intensity === 'ringan') multiplier = 0.85;
  if (intensity === 'berat') multiplier = 1.25;

  // Formula: (MET * 3.5 * weightKg / 200) * durationMinutes
  // Or standard: MET * weightKg * (durationMinutes / 60) * multiplier
  const burned = act.met * weightKg * (durationMinutes / 60) * multiplier;
  return Math.max(5, Math.round(burned));
}
