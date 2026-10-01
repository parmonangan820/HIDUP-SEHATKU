import { UserProfile } from '../types';
import { createClient } from '@supabase/supabase-js';

export interface AccountSummary {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'pria' | 'wanita';
  weight: number;
  height: number;
  targetWaterMl: number;
  dailyWorkoutMinutesTarget: number;
  isRegistered: boolean;
  createdAt: string;
}

const DEFAULT_SUPABASE_URL = 'https://pwujyfmejvgrhjvlfvcv.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dWp5Zm1lanZncmhqdmxmdmN2Ikwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzQxMTUsImV4cCI6MjEwNjQxMDExNX0.qr_8_aaegrfaWK10aPZ3J1wM3AJJZf72tORGHM9vkVw';

function getDirectClient() {
  const url = localStorage.getItem('hidup_sehatku_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('hidup_sehatku_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
  if (url && key) {
    try {
      return createClient(url.trim(), key.trim());
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function fetchRegisteredAccounts(): Promise<AccountSummary[]> {
  // 1. Try backend API first
  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (data.configured && data.accounts) {
        return data.accounts;
      }
    }
  } catch (err) {
    // try direct client fallback
  }

  // 2. Direct client fallback (for cross-browser sync & Vercel)
  const client = getDirectClient();
  if (!client) return [];

  try {
    const { data: profiles, error } = await client
      .from('profiles')
      .select('id, name, phone, age, gender, weight, height, target_water_ml, daily_workout_minutes_target, is_registered, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.name || 'Pengguna Hidup Sehat',
      phone: p.phone || '-',
      age: p.age || 25,
      gender: p.gender || 'pria',
      weight: p.weight || 60,
      height: p.height || 165,
      targetWaterMl: p.target_water_ml || 2100,
      dailyWorkoutMinutesTarget: p.daily_workout_minutes_target || 30,
      isRegistered: Boolean(p.is_registered),
      createdAt: p.created_at,
    }));
  } catch (err) {
    console.error('Error fetching accounts direct:', err);
    return [];
  }
}

export async function loginToAccount(params: { profileId?: string; identifier?: string }): Promise<{
  success: boolean;
  message: string;
  profile?: UserProfile;
  waterLogs?: any[];
  workoutLogs?: any[];
  notes?: any[];
  alarms?: any[];
  aiAnalysis?: any;
}> {
  // 1. Try backend API first
  try {
    const res = await fetch('/api/accounts/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    // try direct client fallback
  }

  // 2. Direct client fallback
  const client = getDirectClient();
  if (!client) {
    return { success: false, message: 'Supabase belum terhubung.' };
  }

  try {
    const { profileId, identifier } = params;
    let query = client.from('profiles').select('*');
    if (profileId) {
      query = query.eq('id', profileId);
    } else if (identifier) {
      const clean = String(identifier).trim();
      query = query.or(`phone.eq.${clean},name.ilike.%${clean}%`);
    } else {
      return { success: false, message: 'ID akun atau nomor telepon wajib diisi.' };
    }

    const { data: profiles, error } = await query.limit(1);
    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return {
        success: false,
        message: 'Akun tidak ditemukan. Periksa nomor HP atau nama Anda.',
      };
    }

    const profile = profiles[0];
    const [wRes, wkRes, nRes, aRes, aiRes] = await Promise.all([
      client.from('water_logs').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(60),
      client.from('workout_logs').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(60),
      client.from('health_notes').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(60),
      client.from('health_alarms').select('*').eq('profile_id', profile.id),
      client.from('ai_health_analyses').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(1),
    ]);

    const formattedProfile = {
      id: profile.id,
      name: profile.name,
      phone: profile.phone || '',
      age: profile.age,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      targetWaterMl: profile.target_water_ml,
      dailyWorkoutMinutesTarget: profile.daily_workout_minutes_target,
      isRegistered: true,
      isLoggedIn: true,
    };

    return {
      success: true,
      message: `Berhasil login sebagai ${profile.name}!`,
      profile: formattedProfile,
      waterLogs: (wRes.data || []).map((w: any) => ({
        id: w.id,
        amountMl: w.amount_ml,
        timestamp: w.created_at,
        time: w.time,
        period: w.period,
        containerType: w.container_type,
        note: w.note,
      })),
      workoutLogs: (wkRes.data || []).map((wk: any) => ({
        id: wk.id,
        timestamp: wk.created_at,
        time: wk.time,
        activityType: wk.activity_type,
        activityName: wk.activity_name,
        durationMinutes: wk.duration_minutes,
        caloriesBurned: wk.calories_burned,
        distanceKm: wk.distance_km,
        steps: wk.steps,
        intensity: wk.intensity,
        period: wk.period,
        notes: wk.notes,
      })),
      notes: (nRes.data || []).map((n: any) => ({
        id: n.id,
        date: n.date,
        time: n.time,
        title: n.title,
        content: n.content,
        category: n.category,
        mood: n.mood,
        hasAlarm: n.has_alarm,
        alarmTime: n.alarm_time,
        isAlarmActive: n.is_alarm_active,
        completed: n.completed,
        createdAt: n.created_at,
      })),
      alarms: (aRes.data || []).map((a: any) => ({
        id: a.id,
        label: a.label,
        time: a.time,
        days: a.days,
        isActive: a.is_active,
        type: a.type,
        soundEnabled: a.sound_enabled,
      })),
      aiAnalysis: aiRes.data && aiRes.data[0] ? aiRes.data[0] : null,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal login akun' };
  }
}
