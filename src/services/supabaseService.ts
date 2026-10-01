import { createClient } from '@supabase/supabase-js';

export interface SupabaseStatusResult {
  configured: boolean;
  connected: boolean;
  message: string;
  profilesCount?: number;
  timestamp?: string;
  url?: string;
}

export interface SupabaseSyncPayload {
  profile: any;
  waterLogs: any[];
  workoutLogs: any[];
  notes: any[];
  alarms: any[];
  aiAnalysis?: any;
}

function getDirectClient() {
  const url = localStorage.getItem('hidup_sehatku_supabase_url') || '';
  const key = localStorage.getItem('hidup_sehatku_supabase_key') || '';
  if (url && key) {
    try {
      return createClient(url.trim(), key.trim());
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function checkSupabaseStatus(): Promise<SupabaseStatusResult> {
  // 1. Try backend server API first
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      const data = await res.json();
      if (data.configured && data.connected) {
        return data;
      }
    }
  } catch (err) {
    // ignore backend error, try direct client fallback
  }

  // 2. Fallback to direct client-side Supabase check (for static hosting like Vercel)
  const client = getDirectClient();
  if (!client) {
    return {
      configured: false,
      connected: false,
      message: 'Supabase belum dikonfigurasi. Masukkan Project URL dan Anon Key untuk menghubungkan.',
    };
  }

  try {
    const { data, error } = await client.from('profiles').select('id, name').limit(1);
    if (error) {
      return {
        configured: true,
        connected: false,
        message: `Terhubung ke Supabase, namun query gagal: ${error.message}. Pastikan tabel SQL sudah dibuat di Supabase SQL Editor.`,
      };
    }
    const url = localStorage.getItem('hidup_sehatku_supabase_url') || '';
    return {
      configured: true,
      connected: true,
      url: url.replace(/(https:\/\/[^.]+).*/, '$1...'),
      message: 'Sinkronisasi Supabase Aktif (Client-Side Direct Mode)!',
      profilesCount: data ? data.length : 0,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: err?.message || 'Gagal terhubung ke Supabase secara langsung.',
    };
  }
}

export async function pushDataToSupabase(payload: SupabaseSyncPayload): Promise<{ success: boolean; message: string; syncedAt?: string }> {
  // 1. Try backend server API first
  try {
    const res = await fetch('/api/supabase/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    // try direct client fallback
  }

  // 2. Direct client-side push fallback
  const client = getDirectClient();
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const { profile, waterLogs, workoutLogs, notes, alarms, aiAnalysis } = payload;
    let profileId = profile?.id;

    if (!profileId && profile?.phone) {
      const { data: existing } = await client.from('profiles').select('id').eq('phone', profile.phone).limit(1);
      if (existing && existing.length > 0) profileId = existing[0].id;
    }

    if (profileId) {
      await client.from('profiles').update({
        name: profile.name,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        target_water_ml: profile.targetWaterMl,
        daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget,
      }).eq('id', profileId);
    } else {
      const { data: newP } = await client.from('profiles').insert({
        name: profile.name || 'Pengguna Baru',
        phone: profile.phone || '',
        age: profile.age || 25,
        gender: profile.gender || 'pria',
        weight: profile.weight || 60,
        height: profile.height || 165,
        target_water_ml: profile.targetWaterMl || 2100,
        daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget || 30,
        is_registered: true,
      }).select('id').single();
      if (newP) profileId = newP.id;
    }

    if (profileId && waterLogs && waterLogs.length > 0) {
      for (const w of waterLogs) {
        await client.from('water_logs').upsert({
          id: w.id,
          profile_id: profileId,
          amount_ml: w.amountMl,
          time: w.time,
          period: w.period,
          container_type: w.containerType,
          note: w.note,
        }, { onConflict: 'id' });
      }
    }

    if (profileId && workoutLogs && workoutLogs.length > 0) {
      for (const wk of workoutLogs) {
        await client.from('workout_logs').upsert({
          id: wk.id,
          profile_id: profileId,
          activity_type: wk.activityType,
          activity_name: wk.activityName,
          duration_minutes: wk.durationMinutes,
          calories_burned: wk.caloriesBurned,
          distance_km: wk.distanceKm,
          steps: wk.steps,
          intensity: wk.intensity,
          period: wk.period,
          notes: wk.notes,
        }, { onConflict: 'id' });
      }
    }

    return {
      success: true,
      message: 'Data berhasil disinkronkan ke Supabase (Client-Side Mode)!',
      syncedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mengirim data ke Supabase' };
  }
}

export async function pullDataFromSupabase(): Promise<{
  configured: boolean;
  hasData?: boolean;
  profile?: any;
  waterLogs?: any[];
  workoutLogs?: any[];
  notes?: any[];
  alarms?: any[];
  aiAnalysis?: any;
  message?: string;
  error?: string;
}> {
  // 1. Try backend server API first
  try {
    const res = await fetch('/api/supabase/pull');
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data;
    }
  } catch (err) {
    // try direct client fallback
  }

  // 2. Direct client-side pull fallback
  const client = getDirectClient();
  if (!client) {
    return { configured: false, hasData: false, message: 'Supabase belum dikonfigurasi' };
  }

  try {
    const { data: profiles, error: pErr } = await client.from('profiles').select('*').order('created_at', { ascending: false }).limit(1);
    if (pErr) throw pErr;
    const profile = profiles && profiles[0] ? profiles[0] : null;
    if (!profile) {
      return { configured: true, hasData: false, message: 'Belum ada profil di Supabase' };
    }

    const [wRes, wkRes, nRes, aRes, aiRes] = await Promise.all([
      client.from('water_logs').select('*').eq('profile_id', profile.id).limit(50),
      client.from('workout_logs').select('*').eq('profile_id', profile.id).limit(50),
      client.from('health_notes').select('*').eq('profile_id', profile.id).limit(50),
      client.from('health_alarms').select('*').eq('profile_id', profile.id),
      client.from('ai_health_analyses').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(1),
    ]);

    return {
      configured: true,
      hasData: true,
      profile: {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        targetWaterMl: profile.target_water_ml,
        dailyWorkoutMinutesTarget: profile.daily_workout_minutes_target,
        isRegistered: true,
        isLoggedIn: true,
      },
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
    return { configured: false, error: err?.message };
  }
}

export async function resetSupabaseData(profile?: any): Promise<{ success: boolean; message: string; profileId?: string }> {
  try {
    const res = await fetch('/api/supabase/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    // fallback
  }

  const client = getDirectClient();
  if (!client) {
    return { success: false, message: 'Supabase belum dikonfigurasi' };
  }

  try {
    let profileId = profile?.id;
    if (profile) {
      const { data: newP, error } = await client.from('profiles').insert({
        name: profile.name || 'Pengguna Baru',
        phone: profile.phone || '',
        age: profile.age || 25,
        gender: profile.gender || 'pria',
        weight: profile.weight || 60,
        height: profile.height || 165,
        target_water_ml: profile.targetWaterMl || 2100,
        daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget || 30,
        is_registered: true,
      }).select('id').single();
      if (error) throw error;
      if (newP) profileId = newP.id;
    }
    return { success: true, message: 'Berhasil mereset/membuat akun di Supabase', profileId };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal reset data' };
  }
}

export async function configureSupabase(
  url: string,
  key: string
): Promise<{ success: boolean; message: string; code?: string; url?: string }> {
  // Save to localStorage so client-side direct mode works on static hosting like Vercel
  localStorage.setItem('hidup_sehatku_supabase_url', url.trim());
  localStorage.setItem('hidup_sehatku_supabase_key', key.trim());

  // 1. Try backend server API first
  try {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data;
    }
  } catch (err) {
    // ignore
  }

  // 2. Validate via direct client test
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('profiles').select('id').limit(1);
    if (error) {
      return {
        success: false,
        code: 'TABLES_MISSING',
        message: `Koneksi URL berhasil, namun tabel database belum ditemukan: ${error.message}. Jalankan SQL Editor di Supabase.`,
      };
    }
    return {
      success: true,
      message: 'Supabase berhasil terhubung langsung dari browser (Client-Side Mode)!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menyambungkan ke Supabase.',
    };
  }
}

export async function disconnectSupabase(): Promise<{ success: boolean; message: string }> {
  localStorage.removeItem('hidup_sehatku_supabase_url');
  localStorage.removeItem('hidup_sehatku_supabase_key');

  try {
    await fetch('/api/supabase/config', { method: 'DELETE' });
  } catch (e) {
    // ignore
  }

  return { success: true, message: 'Koneksi Supabase berhasil diputus.' };
}
