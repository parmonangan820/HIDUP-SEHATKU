-- ==============================================================================
-- SKEMA DATABASE LENGKAP & MIGRASI SUPABASE (ANTI ERROR)
-- APLIKASI: HIDUP SEHATKU (PEMANTAU HIDRASI, OLAHRAGA, CATATAN, ALARM AI & BANNER)
-- Admin Utama: Canggih Marbun (085760525942)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: PROFILES (DENGAN AUTO-MIGRATION KOLOM BARU SEPERTI ROLE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL DEFAULT 'Canggih Marbun',
    phone VARCHAR(30) DEFAULT '085760525942',
    age INTEGER DEFAULT 26,
    gender VARCHAR(10) DEFAULT 'pria',
    weight NUMERIC(5,2) DEFAULT 64.0,
    height NUMERIC(5,2) DEFAULT 170.0,
    target_water_ml INTEGER DEFAULT 2500,
    daily_workout_minutes_target INTEGER DEFAULT 30,
    is_registered BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom baru otomatis ditambahkan jika tabel profiles sudah ada sebelumnya
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT '085760525942';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name VARCHAR(150) DEFAULT 'Canggih Marbun';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_water_ml INTEGER DEFAULT 2500;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_workout_minutes_target INTEGER DEFAULT 30;

-- ==============================================================================
-- 3. TABEL: WATER_LOGS (RIWAYAT MINUM AIR PUTIH)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT '08:00',
    amount_ml INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'morning',
    container_type VARCHAR(20) NOT NULL DEFAULT 'gelas',
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
    activity_type VARCHAR(50) NOT NULL DEFAULT 'jalan_kaki',
    activity_name VARCHAR(100) NOT NULL DEFAULT 'Jalan Kaki Santai',
    duration_minutes INTEGER NOT NULL,
    calories_burned NUMERIC(6,1) NOT NULL DEFAULT 0.0,
    distance_km NUMERIC(5,2) DEFAULT NULL,
    steps INTEGER DEFAULT NULL,
    intensity VARCHAR(20) DEFAULT 'sedang',
    period VARCHAR(20) DEFAULT 'afternoon',
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
    category VARCHAR(30) NOT NULL DEFAULT 'hidrasi',
    mood VARCHAR(20) DEFAULT 'sehat',
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
    time VARCHAR(5) NOT NULL,
    days TEXT[] NOT NULL DEFAULT ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    is_active BOOLEAN DEFAULT true,
    type VARCHAR(30) NOT NULL DEFAULT 'minum',
    note_id UUID REFERENCES public.health_notes(id) ON DELETE SET NULL,
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TABEL: AI_HEALTH_ANALYSES (EVALUASI DOKTER AI)
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
    overall_score INTEGER NOT NULL DEFAULT 85,
    recommendations JSONB DEFAULT '[]'::jsonb,
    health_tips TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABEL: APP_ANNOUNCEMENTS (PENGUMUMAN BROADCAST ADMIN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'info',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. TABEL: APP_BANNERS (PENGATURAN BANNER 3 SLIDE RASIO 8:3)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_banners (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NOT NULL,
    badge VARCHAR(50) DEFAULT '1/3',
    image_url TEXT,
    bg_gradient VARCHAR(100) DEFAULT 'from-cyan-600 via-sky-600 to-blue-700',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. INDEX UNTUK PERFORMA QUERY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_water_logs_profile_date ON public.water_logs(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_profile_date ON public.workout_logs(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_health_notes_profile_date ON public.health_notes(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_health_alarms_profile ON public.health_alarms(profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_health_analyses_profile ON public.ai_health_analyses(profile_id, date);

-- ==============================================================================
-- 11. TRIGGER UPDATED_AT
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
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_health_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Penuh Profil" ON public.profiles;
CREATE POLICY "Akses Penuh Profil" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Catatan Air Minum" ON public.water_logs;
CREATE POLICY "Akses Penuh Catatan Air Minum" ON public.water_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Catatan Olahraga" ON public.workout_logs;
CREATE POLICY "Akses Penuh Catatan Olahraga" ON public.workout_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Catatan Kesehatan" ON public.health_notes;
CREATE POLICY "Akses Penuh Catatan Kesehatan" ON public.health_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Pengingat & Alarm" ON public.health_alarms;
CREATE POLICY "Akses Penuh Pengingat & Alarm" ON public.health_alarms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Hasil Analisis AI" ON public.ai_health_analyses;
CREATE POLICY "Akses Penuh Hasil Analisis AI" ON public.ai_health_analyses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Pengumuman" ON public.app_announcements;
CREATE POLICY "Akses Penuh Pengumuman" ON public.app_announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses Penuh Banner" ON public.app_banners;
CREATE POLICY "Akses Penuh Banner" ON public.app_banners FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 13. SEEDING / PEMBARUAN AKUN ADMIN & DATA AWAL
-- ==============================================================================
DO $$
DECLARE
    admin_profile_id UUID;
BEGIN
    -- Cari profil dengan nomor telepon 085760525942 atau buat baru
    SELECT id INTO admin_profile_id FROM public.profiles WHERE phone = '085760525942' LIMIT 1;
    
    IF admin_profile_id IS NULL THEN
        INSERT INTO public.profiles (
            name,
            phone,
            age,
            gender,
            weight,
            height,
            target_water_ml,
            daily_workout_minutes_target,
            role,
            is_registered
        )
        VALUES (
            'Canggih Marbun',
            '085760525942',
            26,
            'pria',
            64.0,
            170.0,
            2500,
            30,
            'admin',
            true
        )
        RETURNING id INTO admin_profile_id;
    ELSE
        UPDATE public.profiles
        SET name = 'Canggih Marbun',
            role = 'admin',
            is_registered = true
        WHERE id = admin_profile_id;
    END IF;

    -- Seed Banner 3 Slide (Rasio 8:3)
    INSERT INTO public.app_banners (id, title, subtitle, badge, bg_gradient)
    VALUES 
        (1, 'Selamat Datang di Aplikasi Hidup Sehatku', 'Langkah kecil hari ini, untuk hidup yang lebih sehat esok hari.', '1/3', 'from-cyan-600 via-sky-600 to-blue-700'),
        (2, 'Minum Air Putih Secara Teratur', 'Jaga cairan tubuh, tingkatkan energi, dan dukung kesehatanmu setiap hari.', '2/3', 'from-blue-700 via-sky-600 to-cyan-600'),
        (3, 'Olahraga Teratur', 'Jaga kebugaran, kuatkan tubuh, dan tingkatkan kualitas hidup.', '3/3', 'from-emerald-700 via-green-600 to-teal-700')
    ON CONFLICT (id) DO UPDATE 
    SET title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        badge = EXCLUDED.badge;

    -- Seed Log Minum Air Hari Ini
    DELETE FROM public.water_logs WHERE profile_id = admin_profile_id AND date = CURRENT_DATE;
    INSERT INTO public.water_logs (profile_id, date, time, amount_ml, period, container_type, note)
    VALUES 
        (admin_profile_id, CURRENT_DATE, '06:30', 400, 'morning', 'gelas', 'Segelas besar air hangat setelah bangun tidur'),
        (admin_profile_id, CURRENT_DATE, '09:15', 250, 'morning', 'cangkir', '1 cangkir air saat mulai jam kerja kantor'),
        (admin_profile_id, CURRENT_DATE, '11:45', 600, 'afternoon', 'botol', '1 botol air mineral sebelum jam makan siang'),
        (admin_profile_id, CURRENT_DATE, '14:30', 250, 'afternoon', 'gelas', 'Minum air putih saat jeda istirahat sore');

    -- Seed Log Olahraga Hari Ini
    DELETE FROM public.workout_logs WHERE profile_id = admin_profile_id AND date = CURRENT_DATE;
    INSERT INTO public.workout_logs (profile_id, date, time, activity_type, activity_name, duration_minutes, calories_burned, distance_km, steps, intensity, period, notes)
    VALUES 
        (admin_profile_id, CURRENT_DATE, '06:45', 'jalan_kaki', 'Jalan Kaki Santai Pagi', 25, 95.0, 1.8, 2500, 'ringan', 'morning', 'Jalan santai menghirup udara segar pagi hari');

    -- Seed Catatan Hari Ini
    DELETE FROM public.health_notes WHERE profile_id = admin_profile_id AND date = CURRENT_DATE;
    INSERT INTO public.health_notes (profile_id, date, time, title, content, category, mood, has_alarm, alarm_time, is_alarm_active, completed)
    VALUES 
        (admin_profile_id, CURRENT_DATE, '07:00', 'Minum Air Hangat Pagi & Sarapan Sehat', 'Pagi ini minum 400 ml air hangat setelah bangun tidur. Tubuh terasa bugar.', 'hidrasi', 'hebat', false, NULL, false, true),
        (admin_profile_id, CURRENT_DATE, '12:15', 'Jalan Santai 15 Menit', 'Jalan santai saat jeda istirahat siang.', 'olahraga', 'sehat', true, '12:30', true, false);

    -- Seed Daftar Alarm Rutin
    DELETE FROM public.health_alarms WHERE profile_id = admin_profile_id;
    INSERT INTO public.health_alarms (profile_id, label, time, days, is_active, type, sound_enabled)
    VALUES 
        (admin_profile_id, 'Minum Air Hangat Pagi', '06:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], true, 'minum', true),
        (admin_profile_id, 'Hidrasi Jam Kantor Pagi', '09:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'minum', true),
        (admin_profile_id, 'Minum Air & Istirahat Siang', '12:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'minum', true),
        (admin_profile_id, 'Peregangan & Hidrasi Sore', '15:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], true, 'istirahat', true),
        (admin_profile_id, 'Waktunya Olahraga Sore', '17:30', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], true, 'olahraga', true),
        (admin_profile_id, 'Minum 1 Gelas Sebelum Tidur', '21:00', ARRAY['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'], true, 'minum', true);

    -- Seed Evaluasi AI
    DELETE FROM public.ai_health_analyses WHERE profile_id = admin_profile_id AND date = CURRENT_DATE;
    INSERT INTO public.ai_health_analyses (profile_id, date, category, water_status, water_feedback, workout_status, workout_feedback, overall_score, recommendations, health_tips)
    VALUES (
        admin_profile_id,
        CURRENT_DATE,
        'Pejuang Hidup Sehat Berpotensi Tinggi',
        'Cukup Sehat & Menuju Optimal',
        'Asupan minum Anda di pagi dan siang hari cukup teratur. Pastikan menjaga hidrasi sebelum dan sesudah berolahraga.',
        'Aktif & Konsisten',
        'Aktivitas fisik Anda sudah sangat baik mengaktifkan metabolisme harian.',
        88,
        '["Tetap pertahankan minum 1-2 gelas air hangat setiap bangun pagi.", "Minum 200 ml air 15 menit sebelum olahraga.", "Kombinasikan dengan jalan kaki rutin."]'::jsonb,
        'Hidrasi optimal meningkatkan fokus hingga 25% dan menjaga kebugaran tubuh sepanjang hari.'
    );
END $$;
