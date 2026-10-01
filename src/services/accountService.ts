import { UserProfile } from '../types';

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

export async function fetchRegisteredAccounts(): Promise<AccountSummary[]> {
  try {
    const res = await fetch('/api/accounts');
    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error('Error fetching registered accounts:', err);
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
  try {
    const res = await fetch('/api/accounts/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi server untuk login akun',
    };
  }
}
