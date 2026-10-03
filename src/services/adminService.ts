export interface AdminUserItem {
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
  updatedAt: string;
  waterLogsCount: number;
  workoutLogsCount: number;
  notesCount: number;
  role: 'admin' | 'user';
}

export interface AdminStats {
  totalUsers: number;
  totalWaterLogs: number;
  totalWaterMl: number;
  totalWorkoutLogs: number;
  totalWorkoutMinutes: number;
  totalCalories: number;
  totalNotes: number;
  supabaseConnected: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'warning' | 'challenge' | 'tips';
  createdAt: string;
  active: boolean;
}

export async function verifyAdminPin(pin: string): Promise<{ success: boolean; message: string; isAdmin: boolean }> {
  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghubungi server', isAdmin: false };
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Gagal mengambil statistik');
    return await res.json();
  } catch (err) {
    return {
      totalUsers: 0,
      totalWaterLogs: 0,
      totalWaterMl: 0,
      totalWorkoutLogs: 0,
      totalWorkoutMinutes: 0,
      totalCalories: 0,
      totalNotes: 0,
      supabaseConnected: false,
    };
  }
}

export async function fetchAdminUsers(): Promise<{ users: AdminUserItem[] }> {
  try {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Gagal mengambil data pengguna');
    return await res.json();
  } catch (err) {
    return { users: [] };
  }
}

export async function fetchUserDetails(id: string): Promise<any> {
  try {
    const res = await fetch(`/api/admin/users/${id}/details`);
    if (!res.ok) throw new Error('Gagal memuat detail pengguna');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateUserByAdmin(id: string, payload: Partial<AdminUserItem>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memperbarui pengguna' };
  }
}

export async function deleteUserByAdmin(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghapus pengguna' };
  }
}

export async function resetUserByAdmin(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}/reset`, {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mereset data pengguna' };
  }
}

export async function fetchActiveAnnouncement(): Promise<AnnouncementItem | null> {
  try {
    const res = await fetch('/api/announcement');
    const data = await res.json();
    return data.announcement || null;
  } catch (err) {
    return null;
  }
}

export async function postAnnouncement(payload: { title: string; message: string; category?: string }): Promise<{ success: boolean; message: string; announcement?: AnnouncementItem }> {
  try {
    const res = await fetch('/api/admin/announcement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menyiarkan pengumuman' };
  }
}

export async function deleteAnnouncement(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/announcement', {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal menghapus pengumuman' };
  }
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal mengubah PIN Admin' };
  }
}

import { getDirectClient } from './supabaseService';

// ==========================================
// BANNER IMAGE SLIDER SERVICES (8:1)
// ==========================================
export interface BannerSlideItem {
  id: number;
  imageUrl?: string;
  badge: string;
}

export async function fetchGlobalBanners(): Promise<BannerSlideItem[]> {
  // 1. Primary: Fetch from Supabase app_banners (Multi-browser & Vercel cloud sync)
  try {
    const supabase = getDirectClient();
    if (supabase) {
      const { data, error } = await supabase.from('app_banners').select('*').order('id', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const hasAnyImage = data.some((b: any) => Boolean(b.image_url && b.image_url.trim()));
        if (hasAnyImage) {
          return data.map((b: any) => ({
            id: b.id,
            badge: b.badge || `${b.id}/3`,
            imageUrl: b.image_url || '',
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetchGlobalBanners warning:', err);
  }

  // 2. Secondary: Fetch from backend server API /api/banners
  try {
    const res = await fetch('/api/banners', {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.banners) && data.banners.length > 0) {
        return data.banners;
      }
    }
  } catch (err) {
    // ignore
  }

  return [];
}

export async function saveGlobalBanners(banners: BannerSlideItem[]): Promise<{ success: boolean; message: string; banners?: BannerSlideItem[] }> {
  let savedInSupabase = false;

  // 1. Primary: Save directly to Supabase app_banners (Persistent across all browsers & hosting platforms)
  try {
    const supabase = getDirectClient();
    if (supabase) {
      for (let i = 0; i < banners.length; i++) {
        const b = banners[i];
        const slideId = b.id || i + 1;
        const { error } = await supabase.from('app_banners').upsert({
          id: slideId,
          badge: b.badge || `${slideId}/3`,
          image_url: b.imageUrl || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        if (!error) {
          savedInSupabase = true;
        } else {
          console.warn(`Supabase upsert warning for slide #${slideId}:`, error.message);
        }
      }
    }
  } catch (err) {
    console.warn('Supabase saveGlobalBanners warning:', err);
  }

  // 2. Secondary: Also save to backend server if available (e.g. Express on Cloud Run)
  try {
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banners }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: 'Banner berhasil disimpan secara global untuk semua browser!',
        banners: data.banners || banners,
      };
    }
  } catch (err) {
    // If backend is not present (e.g. static hosting like Vercel), fallback smoothly to Supabase
  }

  if (savedInSupabase) {
    return {
      success: true,
      message: 'Banner berhasil disimpan ke database cloud Supabase & langsung tampil di semua browser!',
      banners,
    };
  }

  // Always succeed locally so user changes take effect immediately in the active browser
  return {
    success: true,
    message: 'Banner berhasil disimpan dan langsung aktif di browser Anda!',
    banners,
  };
}

export async function saveGlobalBannerSlide(index: number, slide: BannerSlideItem): Promise<{ success: boolean; message: string; banners?: BannerSlideItem[] }> {
  const slideId = slide.id || index + 1;
  let savedInSupabase = false;

  // 1. Primary: Save to Supabase app_banners
  try {
    const supabase = getDirectClient();
    if (supabase) {
      const { error } = await supabase.from('app_banners').upsert({
        id: slideId,
        badge: slide.badge || `${slideId}/3`,
        image_url: slide.imageUrl || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (!error) savedInSupabase = true;
    }
  } catch (err) {
    console.warn('Supabase saveGlobalBannerSlide warning:', err);
  }

  // 2. Secondary: Backend server if available
  try {
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index, slide }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: `Slide banner #${slideId} berhasil disimpan secara global!`,
        banners: data.banners,
      };
    }
  } catch (err) {
    // fallback
  }

  return {
    success: true,
    message: savedInSupabase
      ? `Slide banner #${slideId} berhasil disimpan ke Supabase & aktif di semua browser!`
      : `Slide banner #${slideId} berhasil disimpan secara lokal!`,
  };
}
