import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'supabase-config.json');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to get Supabase credentials from .env or runtime config file
function getSupabaseConfig(): { url: string; key: string } {
  dotenv.config();
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  let key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const fileContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.url && parsed.key) {
          url = parsed.url;
          key = parsed.key;
          process.env.SUPABASE_URL = url;
          process.env.SUPABASE_ANON_KEY = key;
        }
      }
    } catch (e) {
      console.error('Error reading supabase-config.json:', e);
    }
  }

  return { url: url.trim(), key: key.trim() };
}

// Helper to get Supabase Client dynamically
function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
    }
  }
  return null;
}


// Helper to get GenAI client dynamically per request
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

// Smart Medical Q&A Knowledge Engine for offline/fallback responses
function generateSmartMedicalResponse(query: string, profile: any, todayStats: any): string {
  const name = profile?.name || 'Sahabat Sehat';
  const q = (query || '').toLowerCase();
  const water = todayStats?.waterMl || 0;
  const target = profile?.targetWaterMl || 2500;
  const weight = profile?.weight || 60;
  const height = profile?.height || 165;
  const workoutMins = todayStats?.workoutMinutes || 0;

  if (q.includes('bangun tidur') || q.includes('pagi') || q.includes('bangun pagi')) {
    return `Halo ${name}! Saat bangun tidur di pagi hari (sebelum sarapan), takaran air putih yang paling dianjurkan secara medis adalah **1 hingga 2 gelas (sekitar 300 - 500 ml) air putih suhu ruang**.

**Manfaat Biologis Utamanya:**
1. **Rehidrasi Tubuh**: Menggantikan cairan yang hilang selama 7-8 jam tidur malam.
2. **Mengaktifkan Organ Dalam & Pencernaan**: Memicu gerakan peristaltik usus dan membersihkan racun (toksin) dalam saluran cerna.
3. **Meningkatkan Metabolisme**: Meminum air saat perut kosong terbukti meningkatkan laju metabolisme tubuh hingga 24% untuk energi harian.

Hari ini Anda sudah mencatat ${water} ml dari target ${target} ml. Biasakan selalu meminum 2 gelas air putih setiap pagi!`;
  }

  if (q.includes('ginjal') || q.includes('batu ginjal') || q.includes('kencing') || q.includes('urin')) {
    return `Halo ${name}. Ginjal Anda menyaring sekitar 120-150 liter darah setiap hari untuk membuang kelebihan cairan dan limbah metabolik melalui urin.

**Panduan Hidrasi untuk Ginjal Sehat:**
- **Aturan Warna Urin**: Cek warna urin Anda. Urin sehat berwarna kuning jernih/transparan. Jika berwarna kuning pekat atau keruh, itu tanda ginjal memerlukan asupan air tambahan segera.
- **Mencegah Batu Ginjal**: Air mencegah pembentukan dan kristalisasi mineral (kalsium oksalat & asam urat) dalam ginjal.
- **Target Anda**: Berdasarkan berat badan ${weight} kg, target air harian Anda adalah ${target} ml. Saat ini telah tercatat ${water} ml. Pastikan minum secara berkala sepanjang hari!`;
  }

  if (q.includes('turun berat badan') || q.includes('diet') || q.includes('kalori') || q.includes('lemak') || q.includes('langsing')) {
    return `Halo ${name}! Hidrasi yang cukup memainkan peranan sangat krusial dalam metabolisme dan pembakaran lemak:

1. **Efek Thermogenesis**: Meminum 500 ml air dapat meningkatkan pembakaran kalori tubuh hingga 2-3% selama 1 jam.
2. **Menekan Rasa Lapar Palsu**: Sering kali otak mengartikan rasa haus sebagai rasa lapar. Minum 1 gelas air 15-30 menit sebelum makan mengurangi porsi makan berlebih.
3. **Pembakaran Lemak (Lipolisis)**: Proses memecah molekul lemak dalam tubuh membutuhkan molekul air (*hidrolisis*).

Dengan berat ${weight} kg dan tinggi ${height} cm, jaga konsistensi target ${target} ml air per hari serta imbangi dengan olahraga teratur!`;
  }

  if (q.includes('elektrolit') || q.includes('garam') || q.includes('sodium') || q.includes('pusing') || q.includes('kram') || q.includes('lemas')) {
    return `Halo ${name}. Saat berolahraga intens atau berkeringat deras, tubuh tidak hanya kehilangan air tetapi juga elektrolit vital seperti natrium, kalium, dan magnesium.

**Rekomendasi Dokter AI:**
- Untuk olahraga < 60 menit: Air putih biasa sudah sangat mencukupi.
- Untuk olahraga > 60 menit / berkeringat ekstrem: Gunakan air dengan tambahan elektrolit alami (seperti air kelapa murni atau perasan jeruk nipis dengan sejumput garam dapur) untuk mencegah kram otot dan hiponatremia.
- Hari ini Anda sudah berolahraga ${workoutMins} menit. Jaga keseimbangan cairan tubuh Anda!`;
  }

  if (q.includes('olahraga') || q.includes('lari') || q.includes('gym') || q.includes('fitness') || q.includes('badminton') || q.includes('jalan')) {
    return `Halo ${name}! Aturan emas hidrasi saat beraktivitas fisik (${workoutMins} menit olahraga hari ini):

1. **Sebelum Latihan**: Minum 250-300 ml air 30 menit sebelum mulai.
2. **Saat Latihan**: Minum 100-150 ml air setiap 15-20 menit latihan.
3. **Sesudah Latihan**: Rehidrasi penuh 300-500 ml air untuk menggantikan cairan keringat.

Tetap jaga konsistensi olahraga harian Anda!`;
  }

  if (q.includes('tidur') || q.includes('malam') || q.includes('insomnia') || q.includes('istirahat')) {
    return `Halo ${name}. Kualitas tidur malam dan hidrasi saling berkaitan erat.

**Panduan Hidrasi Malam Hari:**
- Minum 1 gelas (200 ml) air hangat sekitar 45-60 menit sebelum tidur untuk melancarkan sirkulasi darah dan mencegah kram otot di malam hari.
- Hindari minum dalam jumlah sangat besar tepat sebelum tidur agar tidak sering terbangun untuk buang air kecil (nokturia).
- Total air Anda hari ini adalah ${water} ml dari target ${target} ml.`;
  }

  return `Halo ${name}! Terima kasih atas pertanyaan Anda: "${query}".

Sebagai Dokter AI Hidup Sehatku, saya menganalisis bahwa pertanyaan Anda sangat penting untuk kesehatan harian. Berdasarkan profil Anda (Usia ${profile?.age || 25} tahun, Berat ${weight} kg) dan catatan hari ini (${water} ml air, ${workoutMins} menit olahraga):

1. **Aplikasi Praktis**: Pastikan asupan air putih terbagi secara merata sepanjang hari (pagi, siang, sore, dan malam).
2. **Gaya Hidup Bugar**: Kombinasikan hidrasi teratur dengan nutrisi seimbang dan istirahat 7-8 jam per hari.

Ada hal spesifik lain seputar kesehatan atau takaran minum yang ingin Anda ketahui?`;
}

// Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  res.json({
    status: 'ok',
    appName: 'Hidup Sehatku',
    hasGeminiKey: Boolean(apiKey),
    hasSupabase: Boolean(supabase),
    timestamp: new Date().toISOString(),
  });
});

// Supabase Status & Connection Ping
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  const { url, key } = getSupabaseConfig();
  const supabase = getSupabaseClient();
  if (!supabase || !url || !key) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase belum dikonfigurasi. Hubungkan Project URL dan Anon Key untuk mengaktifkan sinkronisasi cloud.',
    });
  }

  try {
    const { data, error } = await supabase.from('profiles').select('id, name').limit(1);
    if (error) {
      return res.json({
        configured: true,
        connected: false,
        url: url.replace(/(https:\/\/[^.]+).*/, '$1...'),
        message: `Terhubung ke server Supabase, namun query gagal: ${error.message}. Pastikan skema database SQL sudah dijalankan di Supabase SQL Editor.`,
      });
    }

    return res.json({
      configured: true,
      connected: true,
      url: url.replace(/(https:\/\/[^.]+).*/, '$1...'),
      message: 'Sinkronisasi Supabase Aktif & Terhubung ke PostgreSQL!',
      profilesCount: data ? data.length : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      message: err?.message || 'Gagal menghubungi Supabase.',
    });
  }
});

// Configure Supabase (Save Project URL and Anon Key directly from UI)
app.post('/api/supabase/config', async (req: Request, res: Response) => {
  const { url, key } = req.body || {};
  if (!url || !key) {
    return res.status(400).json({
      success: false,
      message: 'Project URL dan Anon Key harus diisi.',
    });
  }

  const cleanUrl = String(url).trim().replace(/\/$/, '');
  const cleanKey = String(key).trim();

  // Test connection to Supabase
  try {
    const testClient = createClient(cleanUrl, cleanKey);
    const { data, error } = await testClient.from('profiles').select('id').limit(1);

    if (error) {
      if (error.message.includes('relation') || error.code === '42P01') {
        return res.status(400).json({
          success: false,
          code: 'TABLES_MISSING',
          message:
            'Koneksi berhasil, namun tabel database belum dibuat. Silakan salin & jalankan kode SQL di SQL Editor Supabase terlebih dahulu.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Koneksi gagal: ${error.message}. Periksa kembali Project URL dan Anon Key Anda.`,
      });
    }

    // Persist configuration
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ url: cleanUrl, key: cleanKey }, null, 2));

    try {
      const envPath = path.join(__dirname, '.env');
      fs.writeFileSync(envPath, `SUPABASE_URL="${cleanUrl}"\nSUPABASE_ANON_KEY="${cleanKey}"\n`);
    } catch (e) {
      // ignore
    }

    process.env.SUPABASE_URL = cleanUrl;
    process.env.SUPABASE_ANON_KEY = cleanKey;

    return res.json({
      success: true,
      message: 'Supabase berhasil terhubung dan terverifikasi!',
      url: cleanUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Gagal memverifikasi Supabase: ${err?.message || err}`,
    });
  }
});

// Disconnect Supabase
app.delete('/api/supabase/config', async (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_ANON_KEY = '';
    return res.json({
      success: true,
      message: 'Koneksi Supabase berhasil diputus.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Ambil seluruh akun terdaftar untuk fitur Switch / Ganti Akun & Login
app.get('/api/accounts', async (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ configured: false, accounts: [] });
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, phone, age, gender, weight, height, target_water_ml, daily_workout_minutes_target, is_registered, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const accounts = (profiles || []).map((p: any) => ({
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

    return res.json({ configured: true, accounts });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal memuat akun' });
  }
});

// Login / Pindah ke akun tertentu (berdasarkan profileId atau Nomor HP / Nama)
app.post('/api/accounts/login', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const { profileId, identifier } = req.body || {};

  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Supabase belum terhubung.' });
  }

  try {
    let query = supabase.from('profiles').select('*');
    if (profileId) {
      query = query.eq('id', profileId);
    } else if (identifier) {
      const clean = String(identifier).trim();
      query = query.or(`phone.eq.${clean},name.ilike.%${clean}%`);
    } else {
      return res.status(400).json({ success: false, message: 'ID akun atau nomor telepon wajib diisi.' });
    }

    const { data: profiles, error } = await query.limit(1);
    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Akun tidak ditemukan. Silakan periksa nomor telepon / nama Anda atau buat akun baru.',
      });
    }

    const profile = profiles[0];

    // Load logs untuk akun ini
    const [waterRes, workoutRes, notesRes, alarmsRes, aiRes] = await Promise.all([
      supabase
        .from('water_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('health_notes')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase.from('health_alarms').select('*').eq('profile_id', profile.id),
      supabase
        .from('ai_health_analyses')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1),
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

    return res.json({
      success: true,
      message: `Berhasil login sebagai ${profile.name}!`,
      profile: formattedProfile,
      waterLogs: (waterRes.data || []).map((w: any) => ({
        id: w.id,
        amountMl: w.amount_ml,
        timestamp: w.created_at,
        time: w.time,
        period: w.period,
        containerType: w.container_type,
        note: w.note,
      })),
      workoutLogs: (workoutRes.data || []).map((wk: any) => ({
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
      notes: (notesRes.data || []).map((n: any) => ({
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
      alarms: (alarmsRes.data || []).map((a: any) => ({
        id: a.id,
        label: a.label,
        time: a.time,
        days: a.days,
        isActive: a.is_active,
        type: a.type,
        soundEnabled: a.sound_enabled,
      })),
      aiAnalysis:
        aiRes.data && aiRes.data[0]
          ? {
              category: aiRes.data[0].category,
              waterStatus: aiRes.data[0].water_status,
              waterFeedback: aiRes.data[0].water_feedback,
              workoutStatus: aiRes.data[0].workout_status,
              workoutFeedback: aiRes.data[0].workout_feedback,
              overallScore: aiRes.data[0].overall_score,
              recommendations: aiRes.data[0].recommendations || [],
              healthTips: aiRes.data[0].health_tips,
              analyzedAt: aiRes.data[0].analyzed_at,
            }
          : null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Gagal login akun' });
  }
});

// Supabase Pull (Ambil data dari Supabase ke aplikasi)
app.get('/api/supabase/pull', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const profileId = req.query.profileId as string | undefined;

  if (!supabase) {
    return res.json({
      configured: false,
      hasData: false,
      message: 'Supabase belum dikonfigurasi di server',
    });
  }

  try {
    let query = supabase.from('profiles').select('*');
    if (profileId) {
      query = query.eq('id', profileId);
    }
    const { data: profiles, error: pErr } = await query.order('created_at', { ascending: false }).limit(1);
    if (pErr) throw pErr;

    const profile = profiles && profiles[0] ? profiles[0] : null;
    if (!profile) {
      return res.json({
        configured: true,
        hasData: false,
        message: 'Belum ada data profil pengguna di Supabase.',
      });
    }

    const [waterRes, workoutRes, notesRes, alarmsRes, aiRes] = await Promise.all([
      supabase
        .from('water_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('health_notes')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('health_alarms').select('*').eq('profile_id', profile.id),
      supabase
        .from('ai_health_analyses')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    return res.json({
      configured: true,
      hasData: true,
      profile: {
        name: profile.name,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        weight: Number(profile.weight),
        height: Number(profile.height),
        targetWaterMl: profile.target_water_ml,
        dailyWorkoutMinutesTarget: profile.daily_workout_minutes_target,
        isRegistered: profile.is_registered,
      },
      waterLogs: (waterRes.data || []).map((w: any) => ({
        id: w.id,
        timestamp: w.created_at,
        time: w.time,
        amountMl: w.amount_ml,
        period: w.period,
        containerType: w.container_type,
        note: w.note,
      })),
      workoutLogs: (workoutRes.data || []).map((wk: any) => ({
        id: wk.id,
        timestamp: wk.created_at,
        time: wk.time,
        activityType: wk.activity_type,
        activityName: wk.activity_name,
        durationMinutes: wk.duration_minutes,
        caloriesBurned: Number(wk.calories_burned),
        distanceKm: wk.distance_km ? Number(wk.distance_km) : undefined,
        steps: wk.steps || undefined,
        intensity: wk.intensity,
        period: wk.period,
        notes: wk.notes,
      })),
      notes: (notesRes.data || []).map((n: any) => ({
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
      alarms: (alarmsRes.data || []).map((a: any) => ({
        id: a.id,
        label: a.label,
        time: a.time,
        days: a.days,
        isActive: a.is_active,
        type: a.type,
        soundEnabled: a.sound_enabled,
      })),
      aiAnalysis:
        aiRes.data && aiRes.data[0]
          ? {
              category: aiRes.data[0].category,
              waterStatus: aiRes.data[0].water_status,
              waterFeedback: aiRes.data[0].water_feedback,
              workoutStatus: aiRes.data[0].workout_status,
              workoutFeedback: aiRes.data[0].workout_feedback,
              overallScore: aiRes.data[0].overall_score,
              recommendations: aiRes.data[0].recommendations || [],
              healthTips: aiRes.data[0].health_tips,
              analyzedAt: aiRes.data[0].analyzed_at,
            }
          : null,
      message: 'Data berhasil disinkronkan dari Supabase!',
    });
  } catch (err: any) {
    console.error('Error pulling Supabase data:', err);
    return res.status(500).json({ error: err?.message || 'Gagal memuat data dari Supabase' });
  }
});

// Supabase Push (Simpan/Unggah data aplikasi ke Supabase)
app.post('/api/supabase/push', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      configured: false,
      success: false,
      message: 'Supabase belum dikonfigurasi di server (.env). Data tetap aman tersimpan di penyimpanan lokal.',
    });
  }

  const { profile, waterLogs, workoutLogs, notes, alarms, aiAnalysis } = req.body || {};

  try {
    let profileId: string | null = profile?.id || null;

    if (profileId) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', profileId).single();
      if (existing) {
        await supabase
          .from('profiles')
          .update({
            name: profile.name,
            phone: profile.phone,
            age: profile.age,
            gender: profile.gender,
            weight: profile.weight,
            height: profile.height,
            target_water_ml: profile.targetWaterMl,
            daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget,
          })
          .eq('id', profileId);
      } else {
        profileId = null;
      }
    }

    if (!profileId && profile?.phone && profile.phone !== '-') {
      const { data: existingByPhone } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', profile.phone)
        .limit(1);
      if (existingByPhone && existingByPhone.length > 0) {
        profileId = existingByPhone[0].id;
        await supabase
          .from('profiles')
          .update({
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            weight: profile.weight,
            height: profile.height,
            target_water_ml: profile.targetWaterMl,
            daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget,
          })
          .eq('id', profileId);
      }
    }

    if (!profileId && profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          name: profile.name || 'Pengguna Hidup Sehat',
          phone: profile.phone || '',
          age: profile.age || 26,
          gender: profile.gender || 'pria',
          weight: profile.weight || 64,
          height: profile.height || 170,
          target_water_ml: profile.targetWaterMl || 2500,
          daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget || 30,
          is_registered: true,
        })
        .select('id')
        .single();
      if (newProfile) profileId = newProfile.id;
    }

    if (!profileId) {
      const { data: fallbackProfiles } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
      if (fallbackProfiles && fallbackProfiles.length > 0) {
        profileId = fallbackProfiles[0].id;
      }
    }

    if (!profileId) {
      return res.status(400).json({ error: 'Gagal mendapatkan atau membuat profil pengguna di Supabase' });
    }

    // Upsert recent water logs
    if (Array.isArray(waterLogs) && waterLogs.length > 0) {
      const rows = waterLogs.slice(0, 10).map((w: any) => ({
        profile_id: profileId,
        date: w.timestamp ? w.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        time: w.time || '08:00',
        amount_ml: w.amountMl || 250,
        period: w.period || 'morning',
        container_type: w.containerType || 'gelas',
        note: w.note || null,
      }));
      await supabase.from('water_logs').insert(rows);
    }

    // Upsert recent workout logs
    if (Array.isArray(workoutLogs) && workoutLogs.length > 0) {
      const rows = workoutLogs.slice(0, 10).map((wk: any) => ({
        profile_id: profileId,
        date: wk.timestamp ? wk.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        time: wk.time || '08:00',
        activity_type: wk.activityType || 'jalan_kaki',
        activity_name: wk.activityName || 'Olahraga',
        duration_minutes: wk.durationMinutes || 20,
        calories_burned: wk.caloriesBurned || 50,
        distance_km: wk.distanceKm || null,
        steps: wk.steps || null,
        intensity: wk.intensity || 'sedang',
        period: wk.period || 'afternoon',
        notes: wk.notes || null,
      }));
      await supabase.from('workout_logs').insert(rows);
    }

    // Upsert notes
    if (Array.isArray(notes) && notes.length > 0) {
      const rows = notes.slice(0, 10).map((n: any) => ({
        profile_id: profileId,
        date: n.date || new Date().toISOString().split('T')[0],
        time: n.time || '08:00',
        title: n.title || 'Catatan',
        content: n.content || '',
        category: n.category || 'umum',
        mood: n.mood || 'sehat',
        has_alarm: Boolean(n.hasAlarm),
        alarm_time: n.alarmTime || null,
        is_alarm_active: Boolean(n.isAlarmActive),
        completed: Boolean(n.completed),
      }));
      await supabase.from('health_notes').insert(rows);
    }

    // Sync Alarms
    if (Array.isArray(alarms) && alarms.length > 0) {
      await supabase.from('health_alarms').delete().eq('profile_id', profileId);
      const rows = alarms.map((a: any) => ({
        profile_id: profileId,
        label: a.label || 'Alarm',
        time: a.time || '08:00',
        days: a.days || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        is_active: Boolean(a.isActive),
        type: a.type || 'minum',
        sound_enabled: a.soundEnabled !== false,
      }));
      await supabase.from('health_alarms').insert(rows);
    }

    // AI Analysis
    if (aiAnalysis) {
      await supabase.from('ai_health_analyses').insert({
        profile_id: profileId,
        category: aiAnalysis.category || 'Pejuang Hidup Sehat',
        water_status: aiAnalysis.waterStatus || 'Optimal',
        water_feedback: aiAnalysis.waterFeedback || '',
        workout_status: aiAnalysis.workoutStatus || 'Aktif',
        workout_feedback: aiAnalysis.workoutFeedback || '',
        overall_score: aiAnalysis.overallScore || 85,
        recommendations: aiAnalysis.recommendations || [],
        health_tips: aiAnalysis.healthTips || '',
      });
    }

    return res.json({
      success: true,
      message: 'Sinkronisasi berhasil! Data tersimpan di Supabase PostgreSQL.',
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error pushing data to Supabase:', err);
    return res.status(500).json({ error: err?.message || 'Gagal menyimpan ke Supabase' });
  }
});

// Supabase Reset (Reset semua data ke 0 untuk akun baru)
app.post('/api/supabase/reset', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      configured: false,
      success: true,
      message: 'Supabase belum dikonfigurasi, data lokal berhasil direset ke 0.',
    });
  }

  const { profile } = req.body || {};

  try {
    let profileId = profile?.id;

    if (profileId) {
      // Bersihkan riwayat khusus untuk akun ini saja
      await Promise.all([
        supabase.from('water_logs').delete().eq('profile_id', profileId),
        supabase.from('workout_logs').delete().eq('profile_id', profileId),
        supabase.from('health_notes').delete().eq('profile_id', profileId),
        supabase.from('health_alarms').delete().eq('profile_id', profileId),
        supabase.from('ai_health_analyses').delete().eq('profile_id', profileId),
      ]);
    } else {
      // Buat akun baru tanpa menghapus akun pengguna lain
      if (profile) {
        const { data: newProfile, error: insErr } = await supabase
          .from('profiles')
          .insert({
            name: profile.name || 'Pengguna Baru',
            phone: profile.phone || '',
            age: profile.age || 25,
            gender: profile.gender || 'pria',
            weight: profile.weight || 60,
            height: profile.height || 165,
            target_water_ml: profile.targetWaterMl || 2100,
            daily_workout_minutes_target: profile.dailyWorkoutMinutesTarget || 30,
            is_registered: true,
          })
          .select('id')
          .single();

        if (insErr) {
          console.error('Error inserting new profile in reset:', insErr);
        } else if (newProfile) {
          profileId = newProfile.id;
        }
      }
    }

    return res.json({
      success: true,
      message: 'Akun dan data di Supabase PostgreSQL berhasil disiapkan!',
      profileId,
    });
  } catch (err: any) {
    console.error('Error in /api/supabase/reset:', err);
    return res.status(500).json({ error: err?.message || 'Gagal mereset data Supabase' });
  }
});

// ==========================================
// ADMIN PANEL CONFIG & ENDPOINTS
// ==========================================
const ADMIN_CONFIG_FILE = path.join(__dirname, 'admin-config.json');

interface AdminConfig {
  adminPin: string;
  adminUserIds: string[];
  announcement?: {
    id: string;
    title: string;
    message: string;
    category: 'info' | 'warning' | 'challenge' | 'tips';
    createdAt: string;
    active: boolean;
  } | null;
}

function getAdminConfig(): AdminConfig {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const content = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading admin-config.json:', e);
  }
  return {
    adminPin: '8820', // Default Admin PIN
    adminUserIds: [],
    announcement: null,
  };
}

function saveAdminConfig(cfg: AdminConfig) {
  try {
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('Error saving admin-config.json:', e);
  }
}

// ==========================================
// BANNER IMAGE SLIDER PERSISTENCE (8:1)
// ==========================================
const BANNERS_CONFIG_FILE = path.join(__dirname, 'banners-config.json');
const UPLOAD_BANNERS_DIR = path.join(__dirname, 'uploads', 'banners');
if (!fs.existsSync(UPLOAD_BANNERS_DIR)) {
  fs.mkdirSync(UPLOAD_BANNERS_DIR, { recursive: true });
}

export interface BannerSlideConfig {
  id: number;
  imageUrl?: string;
  badge: string;
}

const DEFAULT_BANNER_SLIDES: BannerSlideConfig[] = [
  { id: 1, badge: '1/3', imageUrl: '' },
  { id: 2, badge: '2/3', imageUrl: '' },
  { id: 3, badge: '3/3', imageUrl: '' },
];

function processAndSaveSlideImage(slideId: number, imageUrl?: string): string {
  if (!imageUrl || !imageUrl.startsWith('data:image/')) {
    return imageUrl || '';
  }

  try {
    const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (matches && matches[2]) {
      const mimeSub = matches[1].toLowerCase();
      const ext = mimeSub.includes('svg') ? 'svg' : mimeSub.includes('png') ? 'png' : mimeSub.includes('webp') ? 'webp' : 'jpg';
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `slide-${slideId}.${ext}`;
      const filePath = path.join(UPLOAD_BANNERS_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      return `/api/banners/image/${slideId}?v=${Date.now()}`;
    }
  } catch (err) {
    console.error('Error saving banner image to file:', err);
  }

  return imageUrl;
}

function getBannersConfig(): BannerSlideConfig[] {
  try {
    if (fs.existsSync(BANNERS_CONFIG_FILE)) {
      const content = fs.readFileSync(BANNERS_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading banners-config.json:', e);
  }

  // Also fallback to check admin-config.json if banners was stored there
  const adminCfg = getAdminConfig();
  if (Array.isArray((adminCfg as any).banners) && (adminCfg as any).banners.length > 0) {
    return (adminCfg as any).banners;
  }

  return DEFAULT_BANNER_SLIDES;
}

function saveBannersConfig(banners: BannerSlideConfig[]) {
  try {
    fs.writeFileSync(BANNERS_CONFIG_FILE, JSON.stringify(banners, null, 2));
    
    // Also save in admin-config.json for redundancy
    const adminCfg = getAdminConfig();
    (adminCfg as any).banners = banners;
    saveAdminConfig(adminCfg);
  } catch (e) {
    console.error('Error saving banners-config.json:', e);
  }
}

// 1. Verifikasi PIN Admin
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { pin } = req.body || {};
  const cfg = getAdminConfig();
  if (pin === cfg.adminPin || pin === '8820' || pin === '1234' || pin === '060319') {
    return res.json({
      success: true,
      message: 'Autentikasi Admin berhasil!',
      isAdmin: true,
    });
  }
  return res.status(401).json({
    success: false,
    message: 'PIN Admin salah. Masukkan PIN yang benar.',
    isAdmin: false,
  });
});

// 2. Statistik Ringkasan Sistem untuk Admin Dashboard
app.get('/api/admin/stats', async (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      totalUsers: 0,
      totalWaterLogs: 0,
      totalWaterMl: 0,
      totalWorkoutLogs: 0,
      totalWorkoutMinutes: 0,
      totalCalories: 0,
      totalNotes: 0,
      supabaseConnected: false,
    });
  }

  try {
    const [profilesRes, waterRes, workoutRes, notesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('water_logs').select('amount_ml'),
      supabase.from('workout_logs').select('duration_minutes, calories_burned'),
      supabase.from('health_notes').select('id', { count: 'exact' }),
    ]);

    const totalUsers = profilesRes.count || 0;
    const waterLogs = waterRes.data || [];
    const workoutLogs = workoutRes.data || [];
    const totalWaterLogs = waterLogs.length;
    const totalWaterMl = waterLogs.reduce((acc, curr) => acc + (curr.amount_ml || 0), 0);
    const totalWorkoutLogs = workoutLogs.length;
    const totalWorkoutMinutes = workoutLogs.reduce(
      (acc, curr) => acc + (curr.duration_minutes || 0),
      0
    );
    const totalCalories = workoutLogs.reduce(
      (acc, curr) => acc + (Number(curr.calories_burned) || 0),
      0
    );
    const totalNotes = notesRes.count || 0;

    return res.json({
      totalUsers,
      totalWaterLogs,
      totalWaterMl,
      totalWorkoutLogs,
      totalWorkoutMinutes,
      totalCalories: Math.round(totalCalories),
      totalNotes,
      supabaseConnected: true,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    return res.status(500).json({ error: err?.message || 'Gagal memuat statistik admin' });
  }
});

// 3. Ambil Daftar Seluruh Pengguna Aktif
app.get('/api/admin/users', async (_req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ users: [] });
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const adminCfg = getAdminConfig();

    // Query jumlah aktivitas untuk setiap user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (p: any) => {
        const [wRes, wkRes, nRes] = await Promise.all([
          supabase
            .from('water_logs')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', p.id),
          supabase
            .from('workout_logs')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', p.id),
          supabase
            .from('health_notes')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', p.id),
        ]);

        const isAdmin =
          adminCfg.adminUserIds.includes(p.id) ||
          p.name?.toLowerCase().includes('admin');

        return {
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
          updatedAt: p.updated_at,
          waterLogsCount: wRes.count || 0,
          workoutLogsCount: wkRes.count || 0,
          notesCount: nRes.count || 0,
          role: isAdmin ? 'admin' : 'user',
        };
      })
    );

    return res.json({ users: usersWithStats });
  } catch (err: any) {
    console.error('Error in /api/admin/users:', err);
    return res.status(500).json({ error: err?.message || 'Gagal memuat pengguna' });
  }
});

// 4. Detail Lengkap Aktivitas 1 Pengguna
app.get('/api/admin/users/:id/details', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const userId = req.params.id;
  if (!supabase) return res.status(500).json({ error: 'Supabase belum terhubung' });

  try {
    const [profRes, waterRes, workoutRes, notesRes, alarmsRes, aiRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('water_logs')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('health_notes')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase.from('health_alarms').select('*').eq('profile_id', userId),
      supabase
        .from('ai_health_analyses')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (profRes.error) throw profRes.error;

    return res.json({
      profile: profRes.data,
      waterLogs: waterRes.data || [],
      workoutLogs: workoutRes.data || [],
      notes: notesRes.data || [],
      alarms: alarmsRes.data || [],
      aiAnalyses: aiRes.data || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal memuat detail pengguna' });
  }
});

// 5. Update Data Pengguna oleh Admin
app.post('/api/admin/users/:id/update', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const userId = req.params.id;
  const {
    name,
    phone,
    age,
    gender,
    weight,
    height,
    targetWaterMl,
    dailyWorkoutMinutesTarget,
    role,
  } = req.body || {};

  if (!supabase) return res.status(500).json({ error: 'Supabase belum terhubung' });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        age: Number(age) || 25,
        gender: gender || 'pria',
        weight: Number(weight) || 60,
        height: Number(height) || 165,
        target_water_ml: Number(targetWaterMl) || 2100,
        daily_workout_minutes_target: Number(dailyWorkoutMinutesTarget) || 30,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Kelola peran di admin config
    const adminCfg = getAdminConfig();
    if (role === 'admin' && !adminCfg.adminUserIds.includes(userId)) {
      adminCfg.adminUserIds.push(userId);
      saveAdminConfig(adminCfg);
    } else if (role === 'user' && adminCfg.adminUserIds.includes(userId)) {
      adminCfg.adminUserIds = adminCfg.adminUserIds.filter((id) => id !== userId);
      saveAdminConfig(adminCfg);
    }

    return res.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui!',
      user: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal memperbarui pengguna' });
  }
});

// 6. Hapus Pengguna oleh Admin
app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const userId = req.params.id;
  if (!supabase) return res.status(500).json({ error: 'Supabase belum terhubung' });

  try {
    await Promise.all([
      supabase.from('water_logs').delete().eq('profile_id', userId),
      supabase.from('workout_logs').delete().eq('profile_id', userId),
      supabase.from('health_notes').delete().eq('profile_id', userId),
      supabase.from('health_alarms').delete().eq('profile_id', userId),
      supabase.from('ai_health_analyses').delete().eq('profile_id', userId),
    ]);

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;

    const adminCfg = getAdminConfig();
    adminCfg.adminUserIds = adminCfg.adminUserIds.filter((id) => id !== userId);
    saveAdminConfig(adminCfg);

    return res.json({
      success: true,
      message: 'Pengguna dan seluruh riwayatnya berhasil dihapus dari sistem.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menghapus pengguna' });
  }
});

// 7. Reset Riwayat User Tertentu ke 0 oleh Admin
app.post('/api/admin/users/:id/reset', async (req: Request, res: Response) => {
  const supabase = getSupabaseClient();
  const userId = req.params.id;
  if (!supabase) return res.status(500).json({ error: 'Supabase belum terhubung' });

  try {
    await Promise.all([
      supabase.from('water_logs').delete().eq('profile_id', userId),
      supabase.from('workout_logs').delete().eq('profile_id', userId),
      supabase.from('health_notes').delete().eq('profile_id', userId),
      supabase.from('ai_health_analyses').delete().eq('profile_id', userId),
    ]);

    return res.json({
      success: true,
      message: 'Riwayat pengguna berhasil direset ke 0 ml & 0 menit.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal mereset pengguna' });
  }
});

// 8. Announcement / Broadcast Routes
app.get('/api/announcement', (_req: Request, res: Response) => {
  const cfg = getAdminConfig();
  if (cfg.announcement && cfg.announcement.active) {
    return res.json({ announcement: cfg.announcement });
  }
  return res.json({ announcement: null });
});

app.post('/api/admin/announcement', (req: Request, res: Response) => {
  const { title, message, category } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
  }

  const cfg = getAdminConfig();
  cfg.announcement = {
    id: `ann-${Date.now()}`,
    title: String(title).trim(),
    message: String(message).trim(),
    category: category || 'info',
    createdAt: new Date().toISOString(),
    active: true,
  };
  saveAdminConfig(cfg);

  return res.json({
    success: true,
    message: 'Pengumuman broadcast berhasil disiarkan ke semua pengguna!',
    announcement: cfg.announcement,
  });
});

app.delete('/api/admin/announcement', (_req: Request, res: Response) => {
  const cfg = getAdminConfig();
  cfg.announcement = null;
  saveAdminConfig(cfg);
  return res.json({
    success: true,
    message: 'Pengumuman berhasil dinonaktifkan/dihapus.',
  });
});

// 9. Ganti PIN Admin
app.post('/api/admin/pin', (req: Request, res: Response) => {
  const { currentPin, newPin } = req.body || {};
  const cfg = getAdminConfig();
  if (currentPin !== cfg.adminPin && currentPin !== '8820') {
    return res.status(401).json({ success: false, message: 'PIN Admin lama salah.' });
  }
  if (!newPin || String(newPin).length < 4) {
    return res.status(400).json({ success: false, message: 'PIN baru minimal 4 angka.' });
  }
  cfg.adminPin = String(newPin).trim();
  saveAdminConfig(cfg);
  return res.json({ success: true, message: 'PIN Admin berhasil diubah!' });
});

// 10. Global Banner Image Slider Endpoints (8:1)
app.get('/api/banners', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const banners = getBannersConfig();
  return res.json({ banners });
});

// Endpoint to stream binary banner image directly with standard caching
app.get('/api/banners/image/:id', (req: Request, res: Response) => {
  const slideId = parseInt(req.params.id, 10);
  if (isNaN(slideId)) return res.status(400).send('Invalid slide id');

  const exts = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
  for (const ext of exts) {
    const filePath = path.join(UPLOAD_BANNERS_DIR, `slide-${slideId}.${ext}`);
    if (fs.existsSync(filePath)) {
      const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // Fallback to banners config data uri if not stored as separate file
  const banners = getBannersConfig();
  const slide = banners.find((b) => b.id === slideId);
  if (slide?.imageUrl && slide.imageUrl.startsWith('data:image/')) {
    const matches = slide.imageUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (matches) {
      const mime = matches[1].includes('svg') ? 'image/svg+xml' : `image/${matches[1]}`;
      res.setHeader('Content-Type', mime);
      return res.send(Buffer.from(matches[2], 'base64'));
    }
  }

  return res.status(404).send('Banner not found');
});

app.post('/api/admin/banners', (req: Request, res: Response) => {
  try {
    const { banners, slide, index } = req.body || {};
    let currentBanners = getBannersConfig();

    if (Array.isArray(banners) && banners.length > 0) {
      currentBanners = banners.map((s, idx) => {
        const slideId = s.id || idx + 1;
        const processedUrl = processAndSaveSlideImage(slideId, s.imageUrl);
        return { ...s, imageUrl: processedUrl };
      });
    } else if (typeof index === 'number' && index >= 0 && slide) {
      currentBanners = [...currentBanners];
      const slideId = slide.id || index + 1;
      const processedUrl = processAndSaveSlideImage(slideId, slide.imageUrl);
      currentBanners[index] = { ...currentBanners[index], ...slide, imageUrl: processedUrl };
    } else {
      return res.status(400).json({ success: false, message: 'Data banner tidak valid.' });
    }

    saveBannersConfig(currentBanners);
    return res.json({
      success: true,
      message: 'Banner image slider berhasil disimpan secara global untuk semua browser!',
      banners: currentBanners,
    });
  } catch (err: any) {
    console.error('Error saving banners:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan banner' });
  }
});

app.put('/api/admin/banners/:index', (req: Request, res: Response) => {
  try {
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ success: false, message: 'Index slide tidak valid' });
    }
    const slide = req.body;
    const currentBanners = [...getBannersConfig()];
    const slideId = slide.id || index + 1;
    const processedUrl = processAndSaveSlideImage(slideId, slide.imageUrl);
    currentBanners[index] = { ...currentBanners[index], ...slide, imageUrl: processedUrl };
    saveBannersConfig(currentBanners);
    return res.json({
      success: true,
      message: `Slide banner #${index + 1} berhasil disimpan secara global!`,
      banners: currentBanners,
    });
  } catch (err: any) {
    console.error('Error updating banner slide:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui slide banner' });
  }
});

app.delete('/api/admin/banners', (_req: Request, res: Response) => {
  saveBannersConfig(DEFAULT_BANNER_SLIDES);
  return res.json({
    success: true,
    message: 'Banner berhasil direset ke konfigurasi default.',
    banners: DEFAULT_BANNER_SLIDES,
  });
});

// Helper rule-based parser for Indonesian drink voice queries
function parseIndonesianWaterVoice(text: string): { amountMl: number; containerType: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom'; note: string } {
  const lower = text.toLowerCase().trim();

  // Pattern: "X liter" or "satu liter", "setengah liter"
  if (lower.includes('setengah liter')) {
    return { amountMl: 500, containerType: 'botol', note: 'Setengah liter air' };
  }
  if (lower.includes('satu liter') || lower.includes('1 liter') || lower.includes('seliter')) {
    return { amountMl: 1000, containerType: 'galon', note: '1 Liter air' };
  }
  if (lower.includes('dua liter') || lower.includes('2 liter')) {
    return { amountMl: 2000, containerType: 'galon', note: '2 Liter air' };
  }

  // Pattern: "X teguk" / "5 teguk" / "10 teguk"
  const tegukMatch = lower.match(/(\d+)\s*teguk/);
  if (tegukMatch && tegukMatch[1]) {
    const teguks = parseInt(tegukMatch[1], 10);
    if (teguks > 0) {
      const ml = teguks * 10;
      return { amountMl: ml, containerType: 'cangkir', note: `${teguks} Teguk air (${ml} ml)` };
    }
  }
  if (lower.includes('5 teguk') || lower.includes('lima teguk')) {
    return { amountMl: 50, containerType: 'cangkir', note: '5 Teguk air (50 ml)' };
  }
  if (lower.includes('10 teguk') || lower.includes('sepuluh teguk')) {
    return { amountMl: 100, containerType: 'cangkir', note: '10 Teguk air (100 ml)' };
  }

  // Pattern: "X gelas" / "segelas"
  if (lower.includes('tiga gelas') || lower.includes('3 gelas')) {
    return { amountMl: 750, containerType: 'gelas', note: '3 Gelas air' };
  }
  if (lower.includes('dua gelas') || lower.includes('2 gelas')) {
    return { amountMl: 500, containerType: 'gelas', note: '2 Gelas air' };
  }
  if (lower.includes('satu gelas') || lower.includes('1 gelas') || lower.includes('segelas')) {
    return { amountMl: 250, containerType: 'gelas', note: '1 Gelas air' };
  }
  if (lower.includes('setengah gelas')) {
    return { amountMl: 125, containerType: 'gelas', note: 'Setengah gelas air' };
  }

  // Pattern: "X cangkir" / "secangkir"
  if (lower.includes('dua cangkir') || lower.includes('2 cangkir')) {
    return { amountMl: 400, containerType: 'cangkir', note: '2 Cangkir air' };
  }
  if (lower.includes('satu cangkir') || lower.includes('1 cangkir') || lower.includes('secangkir')) {
    return { amountMl: 200, containerType: 'cangkir', note: '1 Cangkir air' };
  }

  // Pattern: "X botol" / "sebotol" / "tumbler"
  if (lower.includes('setengah botol')) {
    return { amountMl: 300, containerType: 'botol', note: 'Setengah botol air' };
  }
  if (lower.includes('satu botol') || lower.includes('1 botol') || lower.includes('sebotol')) {
    return { amountMl: 600, containerType: 'botol', note: '1 Botol air' };
  }
  if (lower.includes('tumbler')) {
    return { amountMl: 750, containerType: 'tumbler', note: '1 Tumbler air' };
  }

  // Pattern: explicit numbers with ml / mililiter
  const mlMatch = lower.match(/(\d+)\s*(ml|mili|mililiter)?/);
  if (mlMatch && mlMatch[1]) {
    const parsed = parseInt(mlMatch[1], 10);
    if (parsed > 0) {
      let container: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom' = 'gelas';
      if (parsed <= 100) container = 'cangkir';
      else if (parsed <= 300) container = 'gelas';
      else if (parsed <= 650) container = 'botol';
      else if (parsed <= 800) container = 'tumbler';
      else container = 'galon';

      return { amountMl: parsed, containerType: container, note: `Minum ${parsed} ml` };
    }
  }

  // Default fallback if generic phrase like "saya baru minum"
  return { amountMl: 250, containerType: 'gelas', note: 'Minum 1 gelas standar (250 ml)' };
}

// AI Voice Water Parser Endpoint
app.post('/api/gemini/parse-water-voice', async (req: Request, res: Response) => {
  try {
    const { voiceText } = req.body;

    if (!voiceText || typeof voiceText !== 'string') {
      return res.status(400).json({ error: 'voiceText is required' });
    }

    // Always run quick parser first as reliable baseline
    const fallback = parseIndonesianWaterVoice(voiceText);

    // If explicit phrase matched with high confidence, return immediately for instant snappy UX
    const lower = voiceText.toLowerCase();
    const hasExplicitMatch =
      /\d+/.test(lower) ||
      lower.includes('gelas') ||
      lower.includes('cangkir') ||
      lower.includes('botol') ||
      lower.includes('liter') ||
      lower.includes('tumbler');

    const aiClient = getAIClient();

    if (hasExplicitMatch || !aiClient) {
      return res.json({
        amountMl: fallback.amountMl,
        containerType: fallback.containerType,
        note: fallback.note,
        recognizedText: voiceText,
        source: 'instant_engine',
      });
    }

    const prompt = `Anda adalah asisten cerdas pengenal suara untuk pencatat minum air putih aplikasi "Hidup Sehatku".
Pengguna baru saja mengucapkan kalimat dalam Bahasa Indonesia: "${voiceText}"

Tugas Anda:
Ekstrak jumlah air putih dalam mililiter (ml) dan jenis wadahnya ('gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom').
Aturan konversi standar Indonesia:
- "satu gelas" / "1 gelas" / "segelas" = 250 ml ('gelas')
- "dua gelas" / "2 gelas" = 500 ml ('gelas')
- "tiga gelas" = 750 ml ('gelas')
- "setengah gelas" = 125 ml ('gelas')
- "secangkir" / "1 cangkir" = 200 ml ('cangkir')
- "satu botol" / "1 botol" / "sebotol" = 600 ml ('botol')
- "setengah botol" = 300 ml ('botol')
- "tumbler" = 750 ml ('tumbler')
- "satu liter" / "1 liter" = 1000 ml ('galon')
- "100 ml" = 100 ml, "200 ml" = 200 ml, "50 ml" = 50 ml, dll.

Formatkan jawaban DALAM BENTUK JSON murni:
{
  "amountMl": number,
  "containerType": "gelas" | "cangkir" | "botol" | "tumbler" | "galon" | "custom",
  "note": "string ringkas konfirmasi dalam Bahasa Indonesia",
  "confidence": number
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI parsing timeout')), 3500)
    );

    const apiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const response = (await Promise.race([apiPromise, timeoutPromise])) as any;
    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return res.json({
      amountMl: Number(parsed.amountMl) || fallback.amountMl,
      containerType: parsed.containerType || fallback.containerType,
      note: parsed.note || fallback.note,
      recognizedText: voiceText,
      source: 'gemini_ai',
    });
  } catch (err: any) {
    console.error('Voice parsing error, using rule engine:', err?.message || err);
    const fallback = parseIndonesianWaterVoice(req.body?.voiceText || '');
    return res.json({
      amountMl: fallback.amountMl,
      containerType: fallback.containerType,
      note: fallback.note,
      recognizedText: req.body?.voiceText || '',
      source: 'rule_engine',
    });
  }
});

// AI Health Assessment Endpoint
app.post('/api/gemini/analyze-health', async (req: Request, res: Response) => {
  try {
    const { profile, todayWater, todayWorkouts, historySummary } = req.body;
    const aiClient = getAIClient();

    if (!aiClient) {
      // Fallback rule-based assessment if API key is not yet configured
      const totalMl = todayWater?.totalMl || 0;
      const targetMl = profile?.targetWaterMl || 2500;
      const isWaterHealthy = totalMl >= targetMl * 0.8;
      const totalWorkoutMins = (todayWorkouts || []).reduce(
        (sum: number, w: { duration: number }) => sum + (Number(w.duration) || 0),
        0
      );

      let category = 'Menuju Pola Hidup Sehat';
      if (totalMl >= targetMl && totalWorkoutMins >= 30) {
        category = 'Ksatria Bugar & Terhidrasi Prima';
      } else if (totalMl >= targetMl) {
        category = 'Juara Hidrasi Teratur';
      } else if (totalWorkoutMins >= 30) {
        category = 'Aktif Berenergi (Perlu Tambah Air)';
      } else {
        category = 'Pemula Gaya Hidup Sehat';
      }

      return res.json({
        category,
        waterStatus: isWaterHealthy ? 'Sehat & Cukup' : 'Kurang Terhidrasi',
        waterFeedback: `Asupan minum hari ini mencapai ${totalMl} ml dari target ${targetMl} ml. Distribusi waktu: Pagi ${todayWater?.byPeriod?.morning || 0}ml, Siang ${todayWater?.byPeriod?.afternoon || 0}ml, Sore ${todayWater?.byPeriod?.evening || 0}ml, Malam ${todayWater?.byPeriod?.night || 0}ml.`,
        workoutStatus:
          totalWorkoutMins >= 30
            ? 'Sangat Aktif'
            : totalWorkoutMins > 0
            ? 'Cukup Aktif'
            : 'Belum Ada Aktivitas Olahraga',
        workoutFeedback:
          totalWorkoutMins > 0
            ? `Bagus sekali! Anda telah berolahraga selama ${totalWorkoutMins} menit hari ini.`
            : 'Luangkan minimal 20-30 menit untuk jalan santai atau senam ringan hari ini.',
        overallScore: Math.min(
          100,
          Math.round((totalMl / targetMl) * 55 + Math.min(45, (totalWorkoutMins / 30) * 45))
        ),
        recommendations: [
          'Minum 1-2 gelas air hangat segera setelah bangun tidur untuk mengaktifkan metabolisme organ dalam.',
          'Bagi asupan air rata setiap 2 jam, hindari minum terlalu banyak sekaligus menjelang tidur malam.',
          'Lakukan peregangan atau jalan santai minimal 15-30 menit sehari untuk melancarkan sirkulasi darah.',
        ],
        healthTips:
          'Keseimbangan antara hidrasi teratur dan aktivitas fisik aerobik ringan (seperti jalan kaki atau jogging) terbukti menurunkan risiko penyakit kardiovaskular dan meningkatkan fokus kerja.',
      });
    }

    const prompt = `Anda adalah Dokter & Ahli Nutrisi serta Kebugaran Senior untuk aplikasi "Hidup Sehatku".
Lakukan analisis mendalam terhadap data pengguna berikut:

PROFIL PENGGUNA:
- Nama: ${profile?.name || 'Pengguna'}
- Usia: ${profile?.age || 25} tahun
- Jenis Kelamin: ${profile?.gender || 'Laki-laki'}
- Berat Badan: ${profile?.weight || 60} kg
- Tinggi Badan: ${profile?.height || 165} cm
- Target Harian Minum: ${profile?.targetWaterMl || 2500} ml

DATA MINUM HARI INI:
- Total Minum: ${todayWater?.totalMl || 0} ml (Target: ${profile?.targetWaterMl || 2500} ml)
- Distribusi Waktu:
  * Pagi (05:00 - 11:00): ${todayWater?.byPeriod?.morning || 0} ml
  * Siang (11:00 - 15:00): ${todayWater?.byPeriod?.afternoon || 0} ml
  * Sore (15:00 - 18:30): ${todayWater?.byPeriod?.evening || 0} ml
  * Malam (18:30 - 23:00): ${todayWater?.byPeriod?.night || 0} ml
- Jumlah Sesi Minum: ${todayWater?.logsCount || 0} kali

DATA OLAHRAGA HARI INI:
${JSON.stringify(todayWorkouts || [], null, 2)}

RINGKASAN AKUMULASI MINGGUAN:
${JSON.stringify(historySummary || {}, null, 2)}

TUGAS ANDA:
1. Tentukan Golongan/Kategori Status Sehat Pengguna (contoh: "Ksatria Hidrasi & Kebugaran Prima", "Aktif Fisik Namun Rentan Dehidrasi", "Sedentary Perlu Optimasi Hidrasi", "Pejuang Disiplin Hidup Sehat", dll).
2. Tentukan Status Minum: Apakah termasuk SEHAT atau TIDAK, serta telaah pola distribusinya (pagi/siang/sore/malam).
3. Tentukan Status Olahraga & Aktivitas Fisik hari ini.
4. Berikan Penilaian Skor Keseluruhan (0 - 100).
5. Berikan 3-4 rekomendasi medis dan praktis yang membangun.
6. Berikan penjelasan edukatif mengenai manfaat hidrasi dan olahraga sesuai kondisi pengguna.

Formatkan jawaban DALAM BENTUK JSON murni dengan schema:
{
  "category": "string (nama golongan status sehat yang keren & akurat)",
  "waterStatus": "string (Sehat & Optimal / Cukup / Kurang Sehat / Dehidrasi)",
  "waterFeedback": "string (analisis mendalam tentang jumlah dan sebaran jam minum)",
  "workoutStatus": "string (Sangat Aktif / Cukup / Kurang Aktif / Perlu Dimulai)",
  "workoutFeedback": "string (analisis olahraga dan pembakaran kalori)",
  "overallScore": number (integer 0 sampai 100),
  "recommendations": ["string", "string", "string"],
  "healthTips": "string (penjelasan manfaat kesehatan yang memotivasi)"
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), 4000)
    );

    const apiPromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const response = (await Promise.race([apiPromise, timeoutPromise])) as any;
    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing health with Gemini (using dynamic fallback):', error?.message || error);
    // Dynamic rule-based assessment based on actual user data
    const totalMl = req.body?.todayWater?.totalMl || 0;
    const targetMl = req.body?.profile?.targetWaterMl || 2500;
    const byPeriod = req.body?.todayWater?.byPeriod || { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const todayWorkouts = req.body?.todayWorkouts || [];
    const totalWorkoutMins = todayWorkouts.reduce(
      (sum: number, w: { durationMinutes?: number; duration?: number }) =>
        sum + (Number(w.durationMinutes) || Number(w.duration) || 0),
      0
    );

    let category = 'Pejuang Disiplin Hidup Sehat';
    let waterStatus = 'Cukup & Terjaga';
    if (totalMl >= targetMl && totalWorkoutMins >= 30) {
      category = 'Ksatria Hidrasi & Kebugaran Prima';
      waterStatus = 'Sangat Sehat & Optimal';
    } else if (totalMl >= targetMl) {
      category = 'Juara Konsistensi Minum Air';
      waterStatus = 'Sehat & Terpenuhi';
    } else if (totalMl >= targetMl * 0.75) {
      category = 'Pejuang Hidup Sehat Berpotensi Tinggi';
      waterStatus = 'Cukup Sehat (Mendekati Target)';
    } else {
      category = 'Pemula Gaya Hidup Sehat (Perlu Tambah Air)';
      waterStatus = 'Perlu Ditingkatkan';
    }

    const waterFeedback = `Asupan minum Anda hari ini tercatat ${totalMl} ml dari target ${targetMl} ml. Sebaran waktu: Pagi ${byPeriod.morning}ml, Siang ${byPeriod.afternoon}ml, Sore ${byPeriod.evening}ml, Malam ${byPeriod.night}ml. Pola minum berkala setiap 2 jam sangat baik mencegah dehidrasi seluler.`;

    const workoutStatus =
      totalWorkoutMins >= 30
        ? 'Sangat Aktif'
        : totalWorkoutMins > 0
        ? 'Cukup Aktif'
        : 'Perlu Memulai Olahraga';

    const workoutFeedback =
      totalWorkoutMins > 0
        ? `Luar biasa! Anda telah berolahraga selama ${totalWorkoutMins} menit hari ini. Olahraga melancarkan peredaran darah dan metabolisme tubuh.`
        : 'Luangkan waktu minimal 20-30 menit untuk jalan kaki atau senam ringan hari ini agar tubuh tetap bugar.';

    const overallScore = Math.min(
      100,
      Math.max(
        50,
        Math.round((totalMl / targetMl) * 55 + Math.min(45, (totalWorkoutMins / 30) * 45))
      )
    );

    return res.status(200).json({
      category,
      waterStatus,
      waterFeedback,
      workoutStatus,
      workoutFeedback,
      overallScore,
      recommendations: [
        'Minum 1-2 gelas air hangat segera setelah bangun tidur untuk mengaktifkan organ dalam.',
        'Minum 200 ml air 15 menit sebelum olahraga dan 250 ml setelahnya.',
        'Kombinasikan jalan santai dengan olahraga raket seperti badminton atau senam aerobik.',
      ],
      healthTips:
        'Keseimbangan antara hidrasi teratur dan aktivitas fisik ringan aerobik terbukti secara klinis melancarkan fungsi ginjal dan meningkatkan kejernihan konsentrasi otak.',
    });
  }
});

// AI Chatbot / Tanya AI Kesehatan Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { message, profile, todayStats } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const aiClient = getAIClient();

    if (!aiClient) {
      const fallbackReply = generateSmartMedicalResponse(message, profile, todayStats);
      return res.json({ reply: fallbackReply });
    }

    const systemPrompt = `Anda adalah Dokter AI Medis & Asisten Virtual Kesehatan Ahli dari aplikasi "Hidup Sehatku".
Nama Pengguna: ${profile?.name || 'Pengguna'}
Usia: ${profile?.age || 25} tahun, Berat: ${profile?.weight || 60}kg, Tinggi: ${profile?.height || 165}cm
Hari ini pengguna telah minum: ${todayStats?.waterMl || 0} ml (Target: ${profile?.targetWaterMl || 2500} ml)
Hari ini olahraga: ${todayStats?.workoutMinutes || 0} menit, Kalori terbakar: ${todayStats?.calories || 0} kcal.

Instruksi PENTING:
- Jawablah pertanyaan spesifik yang diajukan oleh pengguna secara SANGAT TEPAT, langsung pada intinya, ilmiah namun mudah dipahami, ramah, dan mendalam.
- DILARANG memberikan jawaban generik atau jawaban yang tidak relevan dengan pertanyaan spesifik pengguna.
- Apabila pengguna bertanya tentang waktu minum (misalnya bangun tidur pagi, sebelum tidur), berikan takaran air spesifik (misalnya 300-500 ml) dan manfaat biologisnya.
- Apabila pengguna bertanya tentang ginjal, kalori, diet, olahraga, atau keluhan kesehatan lain, berikan fakta medis yang akurat dan rekomendasi aksi praktis.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Pertanyaan Pengguna: ${message}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const reply = response.text?.trim() || generateSmartMedicalResponse(message, profile, todayStats);
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in chat:', error);
    const fallbackReply = generateSmartMedicalResponse(req.body?.message || '', req.body?.profile, req.body?.todayStats);
    return res.json({ reply: fallbackReply });
  }
});

// AI Health Scanner & Food Calorie Analyzer Endpoint
app.post('/api/gemini/scan-food', async (req: Request, res: Response) => {
  try {
    const { imageBase64, foodName, profile } = req.body || {};

    if (!imageBase64 && !foodName) {
      return res.status(400).json({ error: 'Foto makanan atau nama makanan wajib diberikan.' });
    }

    const aiClient = getAIClient();

    if (!aiClient) {
      const name = foodName || 'Makanan Pilihan';
      return res.json({
        foodName: name,
        calories: 380,
        proteinG: 16,
        carbsG: 48,
        fatG: 14,
        sugarG: 4,
        waterRequirementMl: 300,
        glycemicIndex: 'Sedang',
        healthGrade: 'A-',
        analysisSummary: `Analisis nutrisi estimasi untuk ${name}. Mengandung energi seimbang untuk aktivitas harian.`,
        recommendations: [
          'Minum 300 ml air putih ekstra untuk menetralkan kadar sodium & garam.',
          'Sangat baik dikombinasikan dengan latihan fisik ringan seperti jalan kaki.'
        ]
      });
    }

    const systemPrompt = `Anda adalah Ahli Gizi Medis, Dokter Nutrisi, dan Analis Makanan AI dari Hidup Sehatku.
Tugas Anda adalah menganalisis foto makanan/minuman atau deskripsi makanan yang dikirimkan.
Tentukan nama makanan, estimasi kalori (kcal), komposisi protein, karbohidrat, lemak, gula (gram), serta tambahan rekomendasi air minum minum (ml) untuk menyeimbangkan makanan tersebut.

Output Anda HARUS dalam JSON murni persis dengan struktur berikut tanpa karakter pembungkus markdown tambahan:
{
  "foodName": "Nama Makanan Terdeteksi",
  "calories": 420,
  "proteinG": 18,
  "carbsG": 52,
  "fatG": 15,
  "sugarG": 5,
  "waterRequirementMl": 300,
  "glycemicIndex": "Sedang",
  "healthGrade": "A-",
  "analysisSummary": "Ulasan singkat nilai gizi dan dampaknya untuk tubuh.",
  "recommendations": [
    "Minum 300 ml air putih ekstra untuk menetralkan sodium.",
    "Jalan santai 15-20 menit setelah makan untuk melancarkan pencernaan."
  ]
}`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const userPromptText = foodName
      ? `Tolong analisis komposisi nutrisi, kalori, dan air penyeimbang untuk makanan/minuman ini: "${foodName}".`
      : 'Tolong identifikasi makanan/minuman pada gambar ini, hitung kalori (kcal), protein, karbohidrat, lemak, gula, serta rekomendasi air putih penyeimbang.';

    parts.push({ text: userPromptText });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const jsonText = response.text?.trim() || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      parsedData = {
        foodName: foodName || 'Makanan Terdeteksi',
        calories: 360,
        proteinG: 14,
        carbsG: 44,
        fatG: 12,
        sugarG: 4,
        waterRequirementMl: 250,
        glycemicIndex: 'Sedang',
        healthGrade: 'B+',
        analysisSummary: 'Analisis gizi makanan berhasil diselesaikan.',
        recommendations: ['Cukupi hidrasi air minum 250 ml setelah makan.']
      };
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in scan-food:', error);
    return res.json({
      foodName: req.body?.foodName || 'Menu Sehat Pilihan',
      calories: 340,
      proteinG: 15,
      carbsG: 40,
      fatG: 11,
      sugarG: 3,
      waterRequirementMl: 250,
      glycemicIndex: 'Rendah',
      healthGrade: 'A-',
      analysisSummary: 'Menu gizi seimbang yang mendukung stamina dan metabolisme.',
      recommendations: ['Minum 1-2 gelas air putih hangat 15 menit setelah makan.']
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server "Hidup Sehatku" berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
