import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile, todayWater, todayWorkouts, historySummary } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const aiClient = apiKey ? new GoogleGenAI({ apiKey: apiKey.trim() }) : null;

    const totalMl = todayWater?.totalMl || 0;
    const targetMl = profile?.targetWaterMl || 2500;
    const isWaterHealthy = totalMl >= targetMl * 0.8;
    const totalWorkoutMins = (todayWorkouts || []).reduce(
      (sum: number, w: any) => sum + (Number(w.duration) || 0),
      0
    );

    let defaultCategory = 'Menuju Pola Hidup Sehat';
    if (totalMl >= targetMl && totalWorkoutMins >= 30) {
      defaultCategory = 'Ksatria Bugar & Terhidrasi Prima';
    } else if (totalMl >= targetMl) {
      defaultCategory = 'Juara Hidrasi Teratur';
    } else if (totalWorkoutMins >= 30) {
      defaultCategory = 'Atlet Aktif Bersemangat';
    }

    if (!aiClient) {
      return res.status(200).json({
        category: defaultCategory,
        waterStatus: isWaterHealthy ? 'Hidrasi Terpenuhi Baik' : 'Kurang Minum (Perlu Tambah Air)',
        waterFeedback: `Asupan air hari ini ${totalMl} ml dari target ${targetMl} ml. Pertahankan ritme hidrasi dengan minum 1 gelas tiap 1-2 jam.`,
        workoutStatus: totalWorkoutMins >= 30 ? 'Target Olahraga Tercapai' : 'Aktivitas Fisik Ringan',
        workoutFeedback: `Total bergerak aktif ${totalWorkoutMins} menit hari ini. Idealnya luangkan 30-45 menit untuk kardio atau peregangan.`,
        overallScore: Math.min(100, Math.round((totalMl / Math.max(1, targetMl)) * 50 + (totalWorkoutMins / 30) * 50)),
        recommendations: [
          'Minum 1 gelas air putih saat bangun pagi dan sebelum tidur.',
          'Lakukan peregangan 5 menit di sela-sela aktivitas.',
          'Konsumsi buah berkadar air tinggi seperti semangka atau jeruk.'
        ],
        healthTips: 'Konsistensi kecil setiap hari akan menghasilkan kualitas hidup yang jauh lebih bugar dan berenergi.',
      });
    }

    const prompt = `Analisis kesehatan pengguna:
Nama: ${profile?.name || 'Pengguna'}
Asupan air hari ini: ${totalMl} ml (Target: ${targetMl} ml)
Total durasi olahraga: ${totalWorkoutMins} menit
Kategori fallback: ${defaultCategory}
Riwayat singkat: ${JSON.stringify(historySummary || {})}

Berikan respons JSON tanpa format markdown:
{
  "category": "string nama julukan kesehatan yang memotivasi",
  "waterStatus": "string status hidrasi",
  "waterFeedback": "string analisis hidrasi 1-2 kalimat",
  "workoutStatus": "string status olahraga",
  "workoutFeedback": "string analisis olahraga 1-2 kalimat",
  "overallScore": 85,
  "recommendations": ["saran 1", "saran 2", "saran 3"],
  "healthTips": "string pesan kesehatan inspiratif"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('Error analyzing health:', err);
    return res.status(200).json({
      category: 'Pejuang Hidup Sehat',
      waterStatus: 'Cukup Baik',
      waterFeedback: 'Tetap perhatikan asupan air putih secara berkala sepanjang hari.',
      workoutStatus: 'Aktif Bergerak',
      workoutFeedback: 'Lanjutkan kebiasaan olahraga teratur untuk metabolisme optimal.',
      overallScore: 80,
      recommendations: [
        'Cukupi kebutuhan 8 gelas air per hari.',
        'Jaga postur dan istirahat cukup.'
      ],
      healthTips: 'Sehat dimulai dari langkah kecil yang konsisten.',
    });
  }
}
