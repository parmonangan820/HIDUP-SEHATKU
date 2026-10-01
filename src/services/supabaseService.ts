export interface SupabaseStatusResult {
  configured: boolean;
  connected: boolean;
  message: string;
  profilesCount?: number;
  timestamp?: string;
}

export interface SupabaseSyncPayload {
  profile: any;
  waterLogs: any[];
  workoutLogs: any[];
  notes: any[];
  alarms: any[];
  aiAnalysis?: any;
}

export async function checkSupabaseStatus(): Promise<SupabaseStatusResult> {
  try {
    const res = await fetch('/api/supabase/status');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      message: err?.message || 'Gagal menghubungi server aplikasi',
    };
  }
}

export async function pushDataToSupabase(payload: SupabaseSyncPayload): Promise<{ success: boolean; message: string; syncedAt?: string }> {
  try {
    const res = await fetch('/api/supabase/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal mengirim data ke Supabase',
    };
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
  try {
    const res = await fetch('/api/supabase/pull');
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      error: err?.message || 'Gagal memuat data dari Supabase',
    };
  }
}
