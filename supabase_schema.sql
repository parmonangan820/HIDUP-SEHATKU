-- ==============================================================================
-- SKEMA DATABASE LENGKAP UNTUK SUPABASE
-- APLIKASI: HIDUP SEHATKU (PEMANTAU HIDRASI, OLAHRAGA, CATATAN & ALARM AI)
-- Dibuat oleh: Canggih Marbun
-- Kompatibel dengan: Supabase PostgreSQL (SQL Editor)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: PROFILES (PROFIL PENGGUNA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL DEFAULT 'Budi Pratama',
    phone VARCHAR(30) DEFAULT '0812-3456-7890',
    age INTEGER DEFAULT 26 CHECK (age > 0 AND age <= 120),
    gender VARCHAR(10) DEFAULT 'pria' CHECK (gender IN ('pria', 'wanita')),
    weight NUMERIC(5,2) DEFAULT 64.0 CHECK (weight > 0), -- dalam Kilogram (kg)
    height NUMERIC(5,2) DEFAULT 170.0 CHECK (height > 0), -- dalam Sentimeter (cm)
    target_water_ml INTEGER DEFAULT 2500 CHECK (target_water_ml > 0), -- Target air harian (ml)
    daily_workout_minutes_target INTEGER DEFAULT 30 CHECK (daily_workout_minutes_target >= 0),
    is_registered BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL: WATER_LOGS (RIWAYAT MINUM AIR PUTIH)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    period VARCHAR(20) NOT NULL DEFAULT 'morning' CHECK (period IN ('morning', 'afternoon', 'evening', 'night')),
    container_type VARCHAR(20) NOT NULL DEFAULT 'gelas' CHECK (container_type IN ('gelas', 'cangkir', 'botol', 'tumbler', 'galon', 'custom')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABEL: WORKOUT_LOGS (RIWAYAT AKTIVITAS & OLAHRAGA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    activity_type VARCHAR(50) NOT NULL DEFAULT 'jalan_kaki' CHECK (
        activity_type IN (
            'jalan_kaki',
            'jogging',
            'lari_pagi',
            'jalan_di_tempat',
            'senam_aerobik',
            'badminton',
            'bersepeda',
            'berenang',
            'yoga',
            'gym',
            'lainnya'
        )
    ),
    activity_name VARCHAR(100) NOT NULL DEFAULT 'Jalan Kaki Santai',
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    calories_burned NUMERIC(6,1) NOT NULL DEFAULT 0.0 CHECK (calories_burned >= 0),
    distance_km NUMERIC(5,2) DEFAULT NULL,
    steps INTEGER DEFAULT NULL,
    intensity VARCHAR(20) DEFAULT 'sedang' CHECK (intensity IN ('ringan', 'sedang', 'berat')),
    period VARCHAR(20) DEFAULT 'afternoon' CHECK (period IN ('morning', 'afternoon', 'evening', 'night')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABEL: HEALTH_NOTES (CATATAN KESEHATAN HARI INI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.health_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    title VARCHAR(200) NOT NULL,
    content TEXT,
    category VARCHAR(30) NOT NULL DEFAULT 'hidrasi' CHECK (
        category IN ('hidrasi', 'olahraga', 'makanan', 'mood', 'kesehatan', 'umum')
    ),
    mood VARCHAR(20) DEFAULT 'sehat' CHECK (mood IN ('hebat', 'sehat', 'biasa', 'lelah')),
    has_alarm BOOLEAN DEFAULT false,
    alarm_time VARCHAR(5) DEFAULT NULL,
    is_alarm_active BOOLEAN DEFAULT false,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABEL: HEALTH_ALARMS (SISTEM PENGINGAT & ALARM HIDUP SEHAT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.health_alarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    label VARCHAR(150) NOT NULL,
    time VARCHAR(5) NOT NULL, -- Format '06:30'
    days TEXT[] NOT NULL DEFAULT ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(30) NOT NULL DEFAULT 'minum' CHECK (
        type IN ('minum', 'olahraga', 'istirahat', 'makan', 'catatan')
    ),
    note_id UUID REFERENCES public.health_notes(id) ON DELETE SET NULL,
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABEL: AI_HEALTH_ANALYSES (EVALUASI DOKTER AI GEMINI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_health_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(150) NOT NULL DEFAULT 'Pejuang Hidup Sehat Berpotensi Tinggi',
    water_status VARCHAR(100) NOT NULL DEFAULT 'Cukup Sehat & Menuju Optimal',
    water_feedback TEXT,
    workout_status VARCHAR(100) NOT NULL DEFAULT 'Aktif & Konsisten',
    workout_feedback TEXT,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    recommendations JSONB DEFAULT '[]'::jsonb,
    health_tips TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. INDEX UNTUK PERFORMA QUERY CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_water_logs_profile_date ON public.water_logs(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_profile_date ON public.workout_logs(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_health_notes_profile_date ON public.health_notes(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_health_alarms_profile ON public.health_alarms(profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_health_analyses_profile ON public.ai_health_analyses(profile_id, date);

-- ==============================================================================
-- 9. TRIGGER OTOMATIS: UPDATED_AT TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health_analyses ENABLE ROW LEVEL SECURITY;

-- Kebijakan Public / Anonymouse / Authenticated (Memudahkan development & deployment)
CREATE POLICY "Akses Penuh Profil Sendiri"
ON public.profiles FOR ALL
USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Akses Penuh Catatan Air Minum"
ON public.water_logs FOR ALL
USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL)
);

CREATE POLICY "Akses Penuh Catatan Olahraga"
ON public.workout_logs FOR ALL
USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL)
);

CREATE POLICY "Akses Penuh Catatan Kesehatan Harian"
ON public.health_notes FOR ALL
USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL)
);

CREATE POLICY "Akses Penuh Pengingat & Alarm"
ON public.health_alarms FOR ALL
USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL)
);

CREATE POLICY "Akses Penuh Hasil Analisis AI"
ON public.ai_health_analyses FOR ALL
USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() OR auth.uid() IS NULL)
);

-- ==============================================================================
-- 11. DATA SEEDING AWAL (CONTOH DATA DEMO UNTUK PENGUJIAN LANGSUNG)
-- ==============================================================================
DO $$
DECLARE
    demo_profile_id UUID;
BEGIN
    -- Masukkan atau gunakan profil default
    INSERT INTO public.profiles (name, phone, age, gender, weight, height, target_water_ml, daily_workout_minutes_target)
    VALUES ('Budi Pratama', '0812-3456-7890', 26, 'pria', 64.0, 170.0, 2500, 30)
    RETURNING id INTO demo_profile_id;

    -- 1. Seed Log Minum Air Hari Ini
    INSERT INTO public.water_logs (profile_id, date, time, amount_ml, period, container_type, note)
    VALUES 
        (demo_profile_id, CURRENT_DATE, '06:30', 400, 'morning', 'gelas', 'Segelas besar air hangat setelah bangun tidur'),
        (demo_profile_id, CURRENT_DATE, '09:15', 250, 'morning', 'cangkir', '1 cangkir air saat mulai jam kerja kantor'),
        (demo_profile_id, CURRENT_DATE, '11:45', 600, 'afternoon', 'botol', '1 botol air mineral sebelum jam makan siang'),
        (demo_profile_id, CURRENT_DATE, '14:30', 250, 'afternoon', 'gelas', 'Minum air putih saat jeda istirahat sore');

    -- 2. Seed Log Olahraga Hari Ini
    INSERT INTO public.workout_logs (profile_id, date, time, activity_type, activity_name, duration_minutes, calories_burned, distance_km, steps, intensity, period, notes)
    VALUES 
        (demo_profile_id, CURRENT_DATE, '06:45', 'jalan_kaki', 'Jalan Kaki Santai Pagi', 25, 95.0, 1.8, 2500, 'ringan', 'morning', 'Jalan santai menghirup udara segar pagi hari sebelum berangkat kerja');

    -- 3. Seed Catatan Hari Ini
    INSERT INTO public.health_notes (profile_id, date, time, title, content, category, mood, has_alarm, alarm_time, is_alarm_active, completed)
    VALUES 
        (demo_profile_id, CURRENT_DATE, '07:00', 'Minum Air Hangat Pagi & Sarapan Sehat', 'Pagi ini minum 400 ml air hangat segera setelah bangun tidur. Perut terasa sangat nyaman dan tubuh langsung bugar.', 'hidrasi', 'hebat', false, NULL, false, true),
        (demo_profile_id, CURRENT_DATE, '12:15', 'Jalan Santai Keliling Kantor 15 Menit', 'Saat jeda siang meluangkan waktu jalan kaki santai 15 menit agar tidak terlalu lama duduk di meja kerja ber-AC.', 'olahraga', 'sehat', true, '12:30', true, false);

    -- 4. Seed Daftar Alarm Rutin Sehat
    INSERT INTO public.health_alarms (profile_id, label, time, days, is_active, type, sound_enabled)
    VALUES 
        (demo_profile_id, 'Minum Air Hangat Pagi', '06:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], true, 'minum', true),
        (demo_profile_id, 'Hidrasi Jam Kantor Pagi', '09:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'minum', true),
        (demo_profile_id, 'Minum Air & Istirahat Siang', '12:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'minum', true),
        (demo_profile_id, 'Peregangan & Hidrasi Sore', '15:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'istirahat', true),
        (demo_profile_id, 'Waktunya Olahraga Sore', '17:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], true, 'olahraga', true),
        (demo_profile_id, 'Minum 1 Gelas Sebelum Tidur', '21:00', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], true, 'minum', true);

    -- 5. Seed Evaluasi AI
    INSERT INTO public.ai_health_analyses (profile_id, date, category, water_status, water_feedback, workout_status, workout_feedback, overall_score, recommendations, health_tips)
    VALUES (
        demo_profile_id,
        CURRENT_DATE,
        'Pejuang Hidup Sehat Berpotensi Tinggi',
        'Cukup Sehat & Menuju Optimal',
        'Asupan minum Anda di pagi dan siang hari cukup teratur. Pastikan menjaga kontinuitas asupan air di sore hari sebelum berolahraga.',
        'Aktif & Konsisten',
        'Aktivitas jalan kaki dan olahraga pagi Anda sudah sangat baik mengaktifkan metabolisme harian.',
        88,
        '["Tetap pertahankan minum 1-2 gelas air hangat setiap bangun pagi sebelum sarapan.", "Minum 200 ml air 15 menit sebelum memulai sesi olahraga dan 250 ml setelahnya.", "Kombinasikan jalan kaki dengan olahraga raket seperti badminton atau senam aerobik di akhir pekan."]'::jsonb,
        'Penelitian menunjukkan bahwa hidrasi optimal di pagi dan siang hari meningkatkan fungsi kognitif otak hingga 25% dan mencegah kelelahan dini di sore hari.'
    );
END $$;

-- Selesai! Skema database siap digunakan pada Supabase.
