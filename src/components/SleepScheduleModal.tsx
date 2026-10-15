import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Moon,
  Sun,
  AlarmClock,
  Sparkles,
  Brain,
  Heart,
  Activity,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Droplet,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Calendar,
  X,
  BookmarkPlus,
  Plus,
  Trash2,
  BarChart2,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import { sleepAudio } from '../utils/sleepSoundGenerator';

interface SleepScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SleepRecord {
  id: string;
  date: string;
  bedtime: string; // e.g. "23:00"
  wakeTime: string; // e.g. "06:30"
  durationMinutes: number; // e.g. 450
  qualityScore: number; // 0 - 100
  wakeFeeling: 'segar' | 'biasa' | 'lemas';
  notes?: string;
  deepSleepPercent?: number;
  remSleepPercent?: number;
  lightSleepPercent?: number;
}

export interface SleepAIAnalysis {
  sleepScore: number;
  sleepQualityLabel: string;
  circadianAssessment: string;
  sleepEfficiency: number;
  sleepCyclesCompleted: number;
  biologicalImpact: {
    cellularRepair: string;
    brainDetox: string;
    metabolicFatBurn: string;
    heartRecovery: string;
  };
  sleepStagesEstimate: {
    deepSleepPercentage: number;
    remSleepPercentage: number;
    lightSleepPercentage: number;
    awakePercentage: number;
  };
  doctorRecommendations: string[];
  idealScheduleAdvice: {
    recommendedBedtime: string;
    recommendedWakeTime: string;
    windDownStartTime: string;
    waterCutoffTime: string;
  };
  motivationalDoctorQuote: string;
}

const STORAGE_KEY_SLEEP_LOGS = 'hidup_sehatku_sleep_logs_v1';
const STORAGE_KEY_ACTIVE_SLEEP = 'hidup_sehatku_active_sleep_v1';
const STORAGE_KEY_SLEEP_ALARM = 'hidup_sehatku_sleep_alarm_v1';

export const SleepScheduleModal: React.FC<SleepScheduleModalProps> = ({ isOpen, onClose }) => {
  const { profile, addNote } = useHealth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'grafik' | 'atur' | 'relaksasi' | 'riwayat'>('grafik');

  // Sleep Logs State
  const [sleepLogs, setSleepLogs] = useState<SleepRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLEEP_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading sleep logs from storage', e);
    }
    // Default initial 7-day realistic data
    const today = new Date();
    const defaults: SleepRecord[] = [];
    const dummyData = [
      { daysAgo: 6, bed: '23:15', wake: '06:45', dur: 450, score: 88, feel: 'segar' as const },
      { daysAgo: 5, bed: '23:30', wake: '06:30', dur: 420, score: 82, feel: 'biasa' as const },
      { daysAgo: 4, bed: '00:15', wake: '06:45', dur: 390, score: 74, feel: 'lemas' as const },
      { daysAgo: 3, bed: '22:45', wake: '06:30', dur: 465, score: 92, feel: 'segar' as const },
      { daysAgo: 2, bed: '23:00', wake: '06:30', dur: 450, score: 89, feel: 'segar' as const },
      { daysAgo: 1, bed: '23:10', wake: '07:00', dur: 470, score: 91, feel: 'segar' as const },
      { daysAgo: 0, bed: '22:50', wake: '06:40', dur: 470, score: 93, feel: 'segar' as const },
    ];

    dummyData.forEach((d) => {
      const dt = new Date(today);
      dt.setDate(today.getDate() - d.daysAgo);
      defaults.push({
        id: `sleep-${dt.getTime()}`,
        date: dt.toISOString().split('T')[0],
        bedtime: d.bed,
        wakeTime: d.wake,
        durationMinutes: d.dur,
        qualityScore: d.score,
        wakeFeeling: d.feel,
        deepSleepPercent: 22,
        remSleepPercent: 24,
        lightSleepPercent: 49,
      });
    });
    return defaults;
  });

  // Active Real-time Sleep Session
  const [activeSleepStart, setActiveSleepStart] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SLEEP);
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeElapsedMinutes, setActiveElapsedMinutes] = useState<number>(0);

  // Smart Alarm State
  const [alarmTime, setAlarmTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLEEP_ALARM);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.time || '05:30';
      }
    } catch {
      // fallback
    }
    return '05:30';
  });

  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLEEP_ALARM);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.active);
      }
    } catch {
      // fallback
    }
    return true;
  });

  // Cycle Calculator Inputs
  const [calcMode, setCalcMode] = useState<'wake' | 'bed'>('wake');
  const [calcInputTime, setCalcInputTime] = useState<string>('05:30');

  // Wind-Down Audio State
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const [audioTimerMin, setAudioTimerMin] = useState<number>(30);

  // Guided Breathing 4-7-8
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Tarik Napas (4s)' | 'Tahan Napas (7s)' | 'Hembuskan Perlahan (8s)'>('Tarik Napas (4s)');
  const [breathCounter, setBreathCounter] = useState<number>(4);

  // AI Sleep Analysis
  const [aiAnalysis, setAiAnalysis] = useState<SleepAIAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Manual Log Form State
  const [manualBedtime, setManualBedtime] = useState<string>('23:00');
  const [manualWakeTime, setManualWakeTime] = useState<string>('06:30');
  const [manualWakeFeeling, setManualWakeFeeling] = useState<'segar' | 'biasa' | 'lemas'>('segar');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [savedSuccessToast, setSavedSuccessToast] = useState<boolean>(false);

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SLEEP_LOGS, JSON.stringify(sleepLogs));
    } catch (e) {
      console.warn('Error saving sleep logs', e);
    }
  }, [sleepLogs]);

  // Save active sleep state
  useEffect(() => {
    if (activeSleepStart) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_SLEEP, String(activeSleepStart));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SLEEP);
    }
  }, [activeSleepStart]);

  // Save alarm setting
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SLEEP_ALARM,
        JSON.stringify({ time: alarmTime, active: isAlarmActive })
      );
    } catch {
      // ignore
    }
  }, [alarmTime, isAlarmActive]);

  // Track active sleep elapsed time timer
  useEffect(() => {
    if (!activeSleepStart) {
      setActiveElapsedMinutes(0);
      return;
    }
    const updateElapsed = () => {
      const diffMs = Date.now() - activeSleepStart;
      setActiveElapsedMinutes(Math.floor(diffMs / (1000 * 60)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 10000); // every 10s
    return () => clearInterval(interval);
  }, [activeSleepStart]);

  // 4-7-8 Breathing Loop
  useEffect(() => {
    if (!isBreathingActive) return;
    let timer: any = null;

    const runBreathingCycle = () => {
      // 1. Inhale 4s
      setBreathPhase('Tarik Napas (4s)');
      let count = 4;
      setBreathCounter(count);

      const inhaleInterval = setInterval(() => {
        count--;
        setBreathCounter(count);
        if (count <= 0) {
          clearInterval(inhaleInterval);
          // 2. Hold 7s
          setBreathPhase('Tahan Napas (7s)');
          let holdCount = 7;
          setBreathCounter(holdCount);

          const holdInterval = setInterval(() => {
            holdCount--;
            setBreathCounter(holdCount);
            if (holdCount <= 0) {
              clearInterval(holdInterval);
              // 3. Exhale 8s
              setBreathPhase('Hembuskan Perlahan (8s)');
              let exhaleCount = 8;
              setBreathCounter(exhaleCount);

              const exhaleInterval = setInterval(() => {
                exhaleCount--;
                setBreathCounter(exhaleCount);
                if (exhaleCount <= 0) {
                  clearInterval(exhaleInterval);
                  // repeat
                  if (isBreathingActive) runBreathingCycle();
                }
              }, 1000);
            }
          }, 1000);
        }
      }, 1000);
    };

    runBreathingCycle();
    return () => {
      clearInterval(timer);
    };
  }, [isBreathingActive]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      sleepAudio.stopSound();
    };
  }, []);

  // Compute 7-day average metrics
  const stats = useMemo(() => {
    const recent = sleepLogs.slice(-7);
    if (recent.length === 0) {
      return { avgHours: 7.5, avgScore: 85, totalLogs: 0, debtHours: 0 };
    }
    const totalMin = recent.reduce((sum, item) => sum + item.durationMinutes, 0);
    const totalScore = recent.reduce((sum, item) => sum + item.qualityScore, 0);
    const avgMinutes = totalMin / recent.length;
    const avgHours = Math.round((avgMinutes / 60) * 10) / 10;
    const avgScore = Math.round(totalScore / recent.length);

    // Biological target: ~7.5 hours for adults
    const targetHours = 7.5;
    const debtHours = Math.max(0, Math.round((targetHours * recent.length - totalMin / 60) * 10) / 10);

    return { avgHours, avgScore, totalLogs: recent.length, debtHours };
  }, [sleepLogs]);

  // Request AI Sleep Doctor Analysis
  const fetchAiAnalysis = async (customRecord?: SleepRecord) => {
    setIsAiLoading(true);
    const latest = customRecord || sleepLogs[sleepLogs.length - 1] || {
      bedtime: '23:00',
      wakeTime: '06:30',
      durationMinutes: 450,
      wakeFeeling: 'segar',
    };

    try {
      const res = await fetch('/api/sleep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          sleepData: {
            bedtime: latest.bedtime,
            wakeTime: latest.wakeTime,
            durationMinutes: latest.durationMinutes,
            wakeFeeling: latest.wakeFeeling,
            pastWeekAverageHours: stats.avgHours,
            chronotype: 'bear',
            disturbances: ['kamar sejuk', 'minum air teratur'],
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAiAnalysis(json.data);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI sleep analysis fallback:', err);
    }

    // Fallback analysis
    const hours = Math.round((latest.durationMinutes / 60) * 10) / 10;
    const cycles = Math.floor(latest.durationMinutes / 90);
    const score = latest.qualityScore || 85;

    setAiAnalysis({
      sleepScore: score,
      sleepQualityLabel: score >= 88 ? 'Sangat Baik & Restoratif' : 'Optimal & Menyehatkan',
      circadianAssessment: `Durasi tidur ${hours} jam dengan ~${cycles} siklus 90 menit selaras dengan ritme sirkadian tubuh ${profile.name || 'Sahabat'}.`,
      sleepEfficiency: 89,
      sleepCyclesCompleted: cycles,
      biologicalImpact: {
        cellularRepair: 'Hormon pertumbuhan (HGH) aktif meregenerasi jaringan otot dan sintesis protein.',
        brainDetox: 'Sistem glimfatik membersihkan sisa metabolit otak, menjaga fokus konsentrasi esok hari.',
        metabolicFatBurn: 'Keseimbangan hormon leptin & ghrelin terjaga, mencegah nafsu makan berlebih.',
        heartRecovery: 'Denyut jantung istirahat turun alami, meregangkan pembuluh darah kardiovaskular.',
      },
      sleepStagesEstimate: {
        deepSleepPercentage: 22,
        remSleepPercentage: 24,
        lightSleepPercentage: 49,
        awakePercentage: 5,
      },
      doctorRecommendations: [
        'Hentikan konsumsi minuman manis dan kafein minimal 6 jam sebelum jam tidur malam.',
        'Matikan layar gawai 30 menit sebelum berbaring untuk merangsang produksi hormon melatonin alami.',
        'Minum 1 gelas kecil air hangat 45-60 menit sebelum tidur untuk melancarkan sirkulasi tanpa memicu nokturia.',
        'Pertahankan suhu kamar sejuk sekitar 20-22°C dan suasana gelap gulita untuk memperpanjang fase Deep Sleep.',
        'Lakukan teknik pernapasan 4-7-8 untuk menenangkan sistem saraf simpatik sebelum tidur.',
      ],
      idealScheduleAdvice: {
        recommendedBedtime: '22:30',
        recommendedWakeTime: '06:00',
        windDownStartTime: '21:45',
        waterCutoffTime: '21:15',
      },
      motivationalDoctorQuote:
        'Tidur berkualitas adalah obat gratis paling mujarab bagi pemulihan otak, metabolisme pembakar lemak, dan vitalitas tubuh.',
    });
    setIsAiLoading(false);
  };

  // Initial analysis fetch
  useEffect(() => {
    if (isOpen && !aiAnalysis) {
      fetchAiAnalysis();
    }
  }, [isOpen]);

  // Handle Start Bedtime
  const handleStartBedtime = () => {
    const now = Date.now();
    setActiveSleepStart(now);
  };

  // Handle Wake Up
  const handleWakeUp = () => {
    if (!activeSleepStart) return;
    const now = Date.now();
    const durationMin = Math.max(15, Math.floor((now - activeSleepStart) / (1000 * 60)));

    const bedDate = new Date(activeSleepStart);
    const wakeDate = new Date(now);

    const bedStr = `${String(bedDate.getHours()).padStart(2, '0')}:${String(bedDate.getMinutes()).padStart(2, '0')}`;
    const wakeStr = `${String(wakeDate.getHours()).padStart(2, '0')}:${String(wakeDate.getMinutes()).padStart(2, '0')}`;

    // Calculate score
    const hours = durationMin / 60;
    let score = 85;
    if (hours >= 7 && hours <= 8.5) score = 92;
    else if (hours >= 6 && hours < 7) score = 78;
    else if (hours < 6) score = 60;
    else score = 76;

    const newRecord: SleepRecord = {
      id: `sleep-${now}`,
      date: wakeDate.toISOString().split('T')[0],
      bedtime: bedStr,
      wakeTime: wakeStr,
      durationMinutes: durationMin,
      qualityScore: score,
      wakeFeeling: 'segar',
      deepSleepPercent: 22,
      remSleepPercent: 24,
      lightSleepPercent: 49,
      notes: 'Tidur dicatat secara otomatis via Mode Jam Tidur AI',
    };

    setSleepLogs((prev) => [...prev, newRecord]);
    setActiveSleepStart(null);
    setActiveElapsedMinutes(0);
    fetchAiAnalysis(newRecord);
  };

  // Handle Manual Log Submission
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const [bH, bM] = manualBedtime.split(':').map(Number);
    const [wH, wM] = manualWakeTime.split(':').map(Number);

    let bedMinTotal = bH * 60 + bM;
    let wakeMinTotal = wH * 60 + wM;
    if (wakeMinTotal <= bedMinTotal) {
      wakeMinTotal += 24 * 60; // crossed midnight
    }
    const durationMin = Math.max(30, wakeMinTotal - bedMinTotal);
    const hours = durationMin / 60;

    let score = 85;
    if (hours >= 7 && hours <= 8.5) score = manualWakeFeeling === 'segar' ? 93 : 84;
    else if (hours >= 6 && hours < 7) score = manualWakeFeeling === 'segar' ? 80 : 72;
    else if (hours < 6) score = 60;
    else score = 76;

    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: SleepRecord = {
      id: `sleep-${Date.now()}`,
      date: todayStr,
      bedtime: manualBedtime,
      wakeTime: manualWakeTime,
      durationMinutes: durationMin,
      qualityScore: score,
      wakeFeeling: manualWakeFeeling,
      notes: manualNotes.trim() || undefined,
      deepSleepPercent: 22,
      remSleepPercent: 24,
      lightSleepPercent: 49,
    };

    setSleepLogs((prev) => [...prev, newRecord]);
    setShowManualForm(false);
    setManualNotes('');
    fetchAiAnalysis(newRecord);
  };

  // Delete Log
  const handleDeleteLog = (id: string) => {
    setSleepLogs((prev) => prev.filter((item) => item.id !== id));
  };

  // Save to Health Notes
  const handleSaveToHealthNotes = () => {
    if (!aiAnalysis) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const content = `🌙 ANALISIS JAM TIDUR & SIRKADIAN DOKTER AI:
Skor Kualitas Tidur: ${aiAnalysis.sleepScore}/100 (${aiAnalysis.sleepQualityLabel})
Efisiensi Tidur: ${aiAnalysis.sleepEfficiency}%
Siklus 90-Menit Tercapai: ${aiAnalysis.sleepCyclesCompleted} Siklus

EVALUASI SIRKADIAN:
${aiAnalysis.circadianAssessment}

DAMPAK BIOLOGIS & METABOLISME:
• Regenerasi Seluler & Otot: ${aiAnalysis.biologicalImpact.cellularRepair}
• Detoksifikasi Otak (Glimfatik): ${aiAnalysis.biologicalImpact.brainDetox}
• Pengaruh Hormon Lemak (Leptin/Ghrelin): ${aiAnalysis.biologicalImpact.metabolicFatBurn}
• Pemulihan Jantung: ${aiAnalysis.biologicalImpact.heartRecovery}

JADWAL IDEAL DIREKOMENDASIKAN DOKTER:
• Jam Tidur Terbaik: ${aiAnalysis.idealScheduleAdvice.recommendedBedtime}
• Jam Bangun Terbaik: ${aiAnalysis.idealScheduleAdvice.recommendedWakeTime}
• Mulai Relaksasi: ${aiAnalysis.idealScheduleAdvice.windDownStartTime}
• Cut-off Minum Air: ${aiAnalysis.idealScheduleAdvice.waterCutoffTime}

5 ATURAN TIDUR DOKTER AI:
${aiAnalysis.doctorRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

PESAN DOKTER:
"${aiAnalysis.motivationalDoctorQuote}"`;

    addNote({
      date: dateStr,
      time: timeStr,
      title: `🌙 Evaluasi Jam Tidur Sehat AI (${aiAnalysis.sleepScore}/100)`,
      content,
      category: 'kesehatan',
      mood: 'hebat',
      hasAlarm: true,
      alarmTime: alarmTime || '05:30',
      isAlarmActive: isAlarmActive,
      completed: false,
    });

    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3000);
  };

  // Toggle Ambient Sleep Sound
  const handleToggleSound = (type: 'rain' | 'ocean' | 'breeze' | 'delta') => {
    if (playingSound === type) {
      sleepAudio.stopSound();
      setPlayingSound(null);
    } else {
      sleepAudio.playSound(type, soundVolume, audioTimerMin);
      setPlayingSound(type);
    }
  };

  // Test Alarm Sound
  const handleTestAlarmChime = () => {
    sleepAudio.playSunriseAlarmChime();
  };

  // 90-minute cycle calculation logic
  const cycleCalculations = useMemo(() => {
    const [h, m] = calcInputTime.split(':').map(Number);
    const results: Array<{ time: string; cycles: number; hours: number; tag: string; isBest: boolean }> = [];

    if (calcMode === 'wake') {
      // User specifies wake time, calculate bedtime options: 15 min latency to fall asleep + 90 min cycles
      // 6 cycles = 9h, 5 cycles = 7.5h (optimal), 4 cycles = 6h, 3 cycles = 4.5h
      const wakeTotalMin = h * 60 + m;
      [
        { cycles: 5, hours: 7.5, tag: 'Rekomendasi Medis (5 Siklus)', isBest: true },
        { cycles: 6, hours: 9.0, tag: 'Tidur Ekstra Panjang (6 Siklus)', isBest: false },
        { cycles: 4, hours: 6.0, tag: 'Batas Minimum Sehat (4 Siklus)', isBest: false },
      ].forEach((item) => {
        const sleepDurationMin = item.cycles * 90 + 15; // 15 min to fall asleep
        let bedTotalMin = wakeTotalMin - sleepDurationMin;
        if (bedTotalMin < 0) bedTotalMin += 24 * 60;

        const bedH = Math.floor(bedTotalMin / 60) % 24;
        const bedM = bedTotalMin % 60;
        const timeStr = `${String(bedH).padStart(2, '0')}:${String(bedM).padStart(2, '0')}`;
        results.push({
          time: timeStr,
          cycles: item.cycles,
          hours: item.hours,
          tag: item.tag,
          isBest: item.isBest,
        });
      });
    } else {
      // User specifies bedtime, calculate wake time options
      const bedTotalMin = h * 60 + m;
      [
        { cycles: 5, hours: 7.5, tag: 'Rekomendasi Medis (5 Siklus)', isBest: true },
        { cycles: 6, hours: 9.0, tag: 'Tidur Ekstra Panjang (6 Siklus)', isBest: false },
        { cycles: 4, hours: 6.0, tag: 'Batas Minimum Sehat (4 Siklus)', isBest: false },
      ].forEach((item) => {
        const sleepDurationMin = item.cycles * 90 + 15;
        let wakeTotalMin = bedTotalMin + sleepDurationMin;
        if (wakeTotalMin >= 24 * 60) wakeTotalMin -= 24 * 60;

        const wakeH = Math.floor(wakeTotalMin / 60) % 24;
        const wakeM = wakeTotalMin % 60;
        const timeStr = `${String(wakeH).padStart(2, '0')}:${String(wakeM).padStart(2, '0')}`;
        results.push({
          time: timeStr,
          cycles: item.cycles,
          hours: item.hours,
          tag: item.tag,
          isBest: item.isBest,
        });
      });
    }

    return results;
  }, [calcMode, calcInputTime]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-30 cursor-pointer shadow-lg border border-slate-700/60"
          title="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overscroll-contain flex-1 p-5 sm:p-7 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold shadow-lg shadow-indigo-500/10">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>KEDOKTERAN TIDUR & RITME SIRKADIAN AI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              Jam Tidur Sehat Sirkadian AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Analisis siklus tidur 90-menit, pemulihan seluler & sistem imun, audio relaksasi alam, dan alarm bangun cerdas.
            </p>
          </div>

          {/* ACTIVE BEDTIME RUNNING CARD / SLEEP CONTROLLER */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    activeSleepStart
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 animate-pulse ring-4 ring-indigo-500/20'
                      : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-white">
                      {activeSleepStart ? 'Sedang Dalam Waktu Tidur 🌙' : 'Status: Belum Masuk Waktu Tidur'}
                    </span>
                    {activeSleepStart && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeSleepStart
                      ? `Tertidur selama ${Math.floor(activeElapsedMinutes / 60)}j ${activeElapsedMinutes % 60}m (~${Math.floor(activeElapsedMinutes / 90)} siklus 90m)`
                      : 'Aktifkan mode tidur saat mulai berbaring untuk pencatatan durasi otomatis presisi.'}
                  </p>
                </div>
              </div>

              {/* Action Button: Start or Wake */}
              <div>
                {activeSleepStart ? (
                  <button
                    type="button"
                    onClick={handleWakeUp}
                    className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Sun className="w-4 h-4 stroke-[2.5]" />
                    <span>Saya Sudah Bangun ☀️</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartBedtime}
                    className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Moon className="w-4 h-4 fill-slate-950" />
                    <span>Mulai Waktu Tidur Sekarang</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick 7-Day Health Overview Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Rata-Rata Tidur</div>
                <div className="text-sm font-black text-indigo-300 mt-0.5">
                  {stats.avgHours} <span className="text-[10px]">jam/malam</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Skor Kualitas Rata-Rata</div>
                <div className="text-sm font-black text-emerald-400 mt-0.5">
                  {stats.avgScore} <span className="text-[10px]">/ 100</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Target Sehat Tubuh</div>
                <div className="text-sm font-black text-cyan-400 mt-0.5">
                  7.5 <span className="text-[10px]">jam</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Utang Tidur (Sleep Debt)</div>
                <div className={`text-sm font-black mt-0.5 ${stats.debtHours > 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {stats.debtHours > 0 ? `${stats.debtHours} jam` : 'Optimal (0j)'}
                </div>
              </div>
            </div>
          </div>

          {/* SUB-TABS NAVIGATION */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
            {[
              { id: 'grafik', label: 'Grafik & Analisis AI', icon: BarChart2 },
              { id: 'atur', label: 'Kalkulator Siklus & Alarm', icon: AlarmClock },
              { id: 'relaksasi', label: 'Audio Alam & Relaksasi', icon: Volume2 },
              { id: 'riwayat', label: 'Data & Catatan Tidur', icon: Calendar },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GRAFIK & ANALISIS MEDIS DOKTER AI */}
          {activeTab === 'grafik' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* 7-DAY SLEEP DURATION VISUAL BAR CHART */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Grafik Tren Durasi Tidur 7 Hari Terakhir
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Target Ideal: 7.5 Jam</span>
                </div>

                {/* SVG/CSS Bar Chart */}
                <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 relative">
                  {/* Reference line for 7.5h */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-emerald-500/50 flex items-center justify-end pr-2 pointer-events-none"
                    style={{ bottom: '65%' }}
                  >
                    <span className="text-[9px] text-emerald-400 font-bold bg-slate-950/80 px-1 rounded">
                      Garis Sehat 7.5j
                    </span>
                  </div>

                  {sleepLogs.slice(-7).map((log, idx) => {
                    const hours = Math.round((log.durationMinutes / 60) * 10) / 10;
                    // Max height calculation (up to 10 hours = 100%)
                    const heightPercent = Math.min(100, Math.round((hours / 10) * 100));
                    const isOptimal = hours >= 7;
                    const isFair = hours >= 6 && hours < 7;

                    const dateObj = new Date(log.date);
                    const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][dateObj.getDay()];

                    return (
                      <div key={log.id || idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <span className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-white transition-colors">
                          {hours}j
                        </span>
                        <div className="w-full max-w-[28px] h-full flex items-end">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-lg transition-all duration-300 group-hover:brightness-125 ${
                              isOptimal
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                                : isFair
                                ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                                : 'bg-gradient-to-t from-rose-600 to-red-400'
                            }`}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 font-medium">{dayName}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Optimal (≥ 7.0j)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Cukup (6.0 - 6.9j)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span>Kurang (&lt; 6.0j)</span>
                  </div>
                </div>
              </div>

              {/* 90-MINUTE SLEEP STAGE CYCLE DIAGRAM */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Distribusi Fase Siklus Tidur Sirkadian
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Standar Medis 90-Menit</span>
                </div>

                {/* Progress bar split */}
                <div className="space-y-1.5">
                  <div className="w-full h-4 rounded-xl overflow-hidden flex bg-slate-900 border border-slate-800">
                    <div style={{ width: '22%' }} className="bg-indigo-600 h-full" title="Deep Sleep (22%)"></div>
                    <div style={{ width: '24%' }} className="bg-purple-500 h-full" title="REM Sleep (24%)"></div>
                    <div style={{ width: '49%' }} className="bg-cyan-600 h-full" title="Light Sleep (49%)"></div>
                    <div style={{ width: '5%' }} className="bg-slate-700 h-full" title="Awake (5%)"></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                      <div className="font-bold text-indigo-300">Deep Sleep (~22%)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pemulihan sel, otot & hormon HGH</div>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
                      <div className="font-bold text-purple-300">REM Sleep (~24%)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Konsolidasi memori & emosi otak</div>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                      <div className="font-bold text-cyan-300">Light Sleep (~49%)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Transisi relaksasi mental & fisik</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-slate-300">Awake / Terjaga (~5%)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Perubahan posisi wajar tidur</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI CLINICAL SLEEP ASSESSMENT */}
              {aiAnalysis ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-950 to-slate-950 border border-indigo-500/40 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        Hasil Analisis Dokter AI Tidur & Metabolisme
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchAiAnalysis()}
                      disabled={isAiLoading}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAiLoading ? 'animate-spin' : ''}`} />
                      <span>Analisis Ulang</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400">Skor Kualitas Jam Tidur</div>
                      <div className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                        <span className="text-indigo-400">{aiAnalysis.sleepScore}</span>
                        <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {aiAnalysis.sleepQualityLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Efisiensi Tidur</div>
                        <div className="font-bold text-cyan-400">{aiAnalysis.sleepEfficiency}%</div>
                      </div>
                      <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Siklus 90m Selesai</div>
                        <div className="font-bold text-purple-400">{aiAnalysis.sleepCyclesCompleted} Siklus</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                    {aiAnalysis.circadianAssessment}
                  </p>

                  {/* Biological Impact 4 Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Regenerasi Seluler & Otot (HGH)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {aiAnalysis.biologicalImpact.cellularRepair}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-purple-400" />
                        <span>Detoksifikasi Glimfatik Otak</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {aiAnalysis.biologicalImpact.brainDetox}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pengaruh Hormon Lemak (Leptin/Ghrelin)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {aiAnalysis.biologicalImpact.metabolicFatBurn}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        <span>Pemulihan Jantung & Sirkulasi</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {aiAnalysis.biologicalImpact.heartRecovery}
                      </p>
                    </div>
                  </div>

                  {/* 5 Doctor AI Sleep Rules */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>5 Rekomendasi Medis Dokter AI untuk Kualitas Tidur</span>
                    </h4>
                    <div className="space-y-1.5">
                      {aiAnalysis.doctorRecommendations.map((rule, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motivational Quote */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center italic text-xs text-indigo-200">
                    "{aiAnalysis.motivationalDoctorQuote}"
                  </div>

                  {/* Save to Notes Button */}
                  <button
                    type="button"
                    onClick={handleSaveToHealthNotes}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-slate-950" />
                    <span>
                      {savedSuccessToast ? '✓ Berhasil Disimpan ke Catatan Sehat!' : 'Simpan Evaluasi Tidur Ini ke Catatan Sehat'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Dokter AI sedang menganalisis data sirkadian tidur Anda...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATUR JAM TIDUR & ALARM BANGUN CERDAS (90-MIN CYCLE CALCULATOR) */}
          {activeTab === 'atur' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* SMART WAKE ALARM SETTER */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Alarm Bangun Harmonis (Gentle Sunrise Chime)
                    </h3>
                  </div>
                  <span className="text-[11px] text-amber-300 font-bold">Bangun Segar</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="text-xs">
                      <div className="text-slate-400">Jam Alarm Bangun:</div>
                      <input
                        type="time"
                        value={alarmTime}
                        onChange={(e) => setAlarmTime(e.target.value)}
                        className="text-xl font-black text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 mt-1 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestAlarmChime}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Tes suara alarm bangun"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Tes Suara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAlarmActive(!isAlarmActive)}
                      className={`px-3 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                        isAlarmActive
                          ? 'bg-amber-400 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isAlarmActive ? 'Alarm Aktif ✓' : 'Nonaktif'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <em>Tips Dokter:</em> Suara alarm bangun ini disintesis dengan nada lembut berfrekuensi harmonis bertingkat, membantu otak bertransisi dari fase tidur ringan tanpa sentakan lonjakan adrenalin atau kaget.
                </p>
              </div>

              {/* 90-MINUTE SLEEP CYCLE CALCULATOR */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Kalkulator Waktu Tidur Siklus 90-Menit
                    </h3>
                  </div>
                  <span className="text-[11px] text-cyan-300 font-semibold">Bebas Pusing Saat Bangun</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcMode('wake')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      calcMode === 'wake'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Saya ingin bangun jam...
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('bed')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      calcMode === 'bed'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    Saya tidur pada jam...
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">
                    {calcMode === 'wake' ? 'Target Jam Bangun Pagi:' : 'Rencana Jam Masuk Tidur:'}
                  </span>
                  <input
                    type="time"
                    value={calcInputTime}
                    onChange={(e) => setCalcInputTime(e.target.value)}
                    className="text-base font-black text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Calculation Results List */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">
                    {calcMode === 'wake'
                      ? 'Waktu terbaik Anda harus mulai tidur malam ini:'
                      : 'Waktu bangun terbaik agar Anda bangun di fase tidur ringan (segar):'}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {cycleCalculations.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          item.isBest
                            ? 'bg-cyan-500/15 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400">{item.tag}</div>
                        <div className="text-xl font-black text-white font-mono mt-1">{item.time}</div>
                        <div className="text-[11px] text-cyan-300 mt-0.5">{item.hours} jam tidur</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Setiap manusia tidur dalam siklus ultradian berulang selama 90 menit. Bangun di akhir siklus (fase tidur ringan) mencegah *sleep inertia* (sensasi pusing, linglung, atau lemas saat alarm berbunyi).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO ALAM & PROTOKOL RELAKSASI SEBELUM TIDUR (WIND-DOWN) */}
          {activeTab === 'relaksasi' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* AMBIENT SLEEP SOUND GENERATOR */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Suara Alam Relaksasi Menjelang Tidur (White/Pink Noise)
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    100% OFFLINE
                  </span>
                </div>

                {/* Sound cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'rain', label: '🌧️ Hujan Rintik', desc: 'Pink Noise santai' },
                    { id: 'ocean', label: '🌊 Ombak Laut', desc: 'Irama laut malam' },
                    { id: 'breeze', label: '🍃 Angin Sejuk', desc: 'Gemersik pegunungan' },
                    { id: 'delta', label: '🧘 Gelombang Delta', desc: 'Binaural 3Hz deep sleep' },
                  ].map((s) => {
                    const isCurrent = playingSound === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleSound(s.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{s.label}</span>
                          {isCurrent ? (
                            <Square className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400 animate-pulse" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Volume & Timer Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Volume Suara:</span>
                      <span className="font-mono text-indigo-300">{Math.round(soundVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={soundVolume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setSoundVolume(v);
                        sleepAudio.setVolume(v);
                      }}
                      className="w-full accent-indigo-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Timer Otomatis Mati:</span>
                      <span className="font-mono text-indigo-300">{audioTimerMin} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[15, 30, 45, 60].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAudioTimerMin(t)}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            audioTimerMin === t
                              ? 'bg-indigo-500 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {t}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {playingSound && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
                      <span>Sedang memutar audio alam... akan mati otomatis dalam {audioTimerMin} menit.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sleepAudio.stopSound();
                        setPlayingSound(null);
                      }}
                      className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
                    >
                      Hentikan
                    </button>
                  </div>
                )}
              </div>

              {/* 4-7-8 GUIDED BREATHING EXERCISE */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/30 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Teknik Pernapasan 4-7-8 untuk Tidur Cepat (Dr. Andrew Weil)</span>
                </div>

                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      isBreathingActive
                        ? breathPhase.includes('Tarik')
                          ? 'scale-110 bg-purple-500/20 border-2 border-purple-400'
                          : breathPhase.includes('Tahan')
                          ? 'scale-105 bg-indigo-500/30 border-2 border-indigo-300 animate-pulse'
                          : 'scale-90 bg-cyan-500/15 border-2 border-cyan-400'
                        : 'bg-slate-900 border border-slate-800'
                    }`}
                  ></div>

                  <div className="relative z-10 space-y-1">
                    <div className="text-3xl font-black text-white font-mono">
                      {isBreathingActive ? breathCounter : '4-7-8'}
                    </div>
                    <div className="text-[11px] font-bold text-purple-300 max-w-[100px] mx-auto leading-tight">
                      {isBreathingActive ? breathPhase : 'Relaksasi Saraf'}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className={`py-2 px-6 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer ${
                      isBreathingActive
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-500/20'
                    }`}
                  >
                    {isBreathingActive ? 'Hentikan Latihan' : 'Mulai Latihan Pernapasan 4-7-8'}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Menahan napas 7 detik dan menghembuskan perlahan 8 detik memicu sistem saraf parasimpatis, menurunkan denyut jantung dan mempercepat pelepasan hormon kantuk melatonin.
                </p>
              </div>

              {/* SLEEP HYGIENE CHECKLIST */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Protokol Kamar Tidur & Higienitas Sirkadian</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Suhu kamar sejuk (20°C - 22°C)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Kamar gelap total (tanpa lampu tidur terang)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Lepas layar HP/laptop 30 menit sebelum tidur</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Cut-off minum air 1 jam sebelum tidur</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA & RIWAYAT CATATAN TIDUR (LOGS) */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Riwayat Data Tidur Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-400">Total {sleepLogs.length} catatan tersimpan</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="py-1.5 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Tidur Manual</span>
                </button>
              </div>

              {/* Manual Entry Form */}
              {showManualForm && (
                <form
                  onSubmit={handleAddManualLog}
                  className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3"
                >
                  <div className="text-xs font-bold text-indigo-300 border-b border-slate-800 pb-1">
                    Form Catat Jam Tidur Manual
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Mulai Tidur (Jam):</label>
                      <input
                        type="time"
                        value={manualBedtime}
                        onChange={(e) => setManualBedtime(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Bangun (Jam):</label>
                      <input
                        type="time"
                        value={manualWakeTime}
                        onChange={(e) => setManualWakeTime(e.target.value)}
                        required
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Sensasi Saat Bangun:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'segar', label: '😊 Segar & Bugar' },
                        { id: 'biasa', label: '😐 Biasa Saja' },
                        { id: 'lemas', label: '😴 Mengantuk/Lemas' },
                      ].map((feel) => (
                        <button
                          key={feel.id}
                          type="button"
                          onClick={() => setManualWakeFeeling(feel.id as any)}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                            manualWakeFeeling === feel.id
                              ? 'bg-indigo-500 text-slate-950 border-indigo-400'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {feel.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Catatan Tambahan (Opsional):</label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Contoh: Minum kopi jam 16:00, kamar tenang"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualForm(false)}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 rounded-xl bg-indigo-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              )}

              {/* Logs List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {sleepLogs.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    Belum ada riwayat tidur tercatat. Tekan tombol "Mulai Waktu Tidur" atau "Catat Tidur Manual".
                  </div>
                ) : (
                  [...sleepLogs].reverse().map((log) => {
                    const hours = Math.round((log.durationMinutes / 60) * 10) / 10;
                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{log.date}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                              {log.bedtime} - {log.wakeTime}
                            </span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                log.qualityScore >= 85
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              Skor {log.qualityScore}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span>Durasi: <strong className="text-slate-200">{hours} jam</strong></span>
                            <span>•</span>
                            <span>Bangun: <strong className="text-slate-200 capitalize">{log.wakeFeeling}</strong></span>
                            {log.notes && (
                              <>
                                <span>•</span>
                                <span className="italic text-slate-500 truncate max-w-[150px]">{log.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
