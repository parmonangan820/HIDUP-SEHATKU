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
