import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile, dietGoal = 'weight_loss', preferences = '' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    const aiClient = apiKey ? new GoogleGenAI({ apiKey: apiKey.trim() }) : null;

    const name = profile?.name || 'Sahabat Sehat';
    const weight = Number(profile?.weight) || 65;
    const height = Number(profile?.height) || 170;
    const age = Number(profile?.age) || 26;
    const gender = profile?.gender || 'pria';

    const bmr = gender === 'wanita'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
    const tdee = Math.round(bmr * 1.375);
    
    let targetCalories = tdee;
    if (dietGoal === 'weight_loss') targetCalories = Math.max(1200, Math.round(tdee - 450));
    if (dietGoal === 'muscle_gain') targetCalories = Math.round(tdee + 300);
    if (dietGoal === 'intermittent_fasting') targetCalories = Math.max(1300, Math.round(tdee - 350));
    if (dietGoal === 'low_carb_sugar') targetCalories = Math.max(1300, Math.round(tdee - 250));

    const targetWater = Math.max(2000, Math.round(weight * 35));

    const systemPrompt = `Anda adalah "Dokter AI Spesialis Gizi Klinis & Dietologi Olahraga" di aplikasi Hidup Sehatku.
Tugas Anda adalah merancang panduan "TIPS DIET SUKSES ALA DOKTER AI" yang ilmiah, aman, realistis, dan lezat menggunakan bahan makanan lokal Indonesia.
Data Pasien: Nama: ${name}, Berat: ${weight}kg, Tinggi: ${height}cm, Usia: ${age}thn, Target Kalori: ${targetCalories}kcal, Fokus: ${dietGoal}.
Berikan respons HANYA berupa JSON valid dengan struktur:
{
  "dietTitle": "string",
  "dailyCalorieTarget": number,
  "dailyWaterTargetMl": number,
  "macroSplit": { "protein": "string", "carbs": "string", "fat": "string" },
  "doctorPrinciples": ["string", "string", "string", "string", "string"],
  "mealPlan": [
    { "time": "string", "mealType": "string", "menu": "string", "calories": number, "tips": "string" }
  ],
  "hydrationProtocol": "string",
  "commonMistakesToAvoid": ["string", "string", "string"],
  "motivationalQuote": "string"
}`;

    let parsedResult: any = null;
    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ text: systemPrompt }],
          config: { responseMimeType: 'application/json', temperature: 0.6 },
        });
        const text = response.text?.trim() || '';
        if (text) parsedResult = JSON.parse(text);
      } catch (e) {
        // fallback
      }
    }

    if (!parsedResult) {
      parsedResult = {
        dietTitle: `Protokol Diet Sukses Defisit Kalori Sehat ${name}`,
        dailyCalorieTarget: targetCalories,
        dailyWaterTargetMl: targetWater,
        macroSplit: { protein: `${Math.round(weight * 1.6)}g`, carbs: '190g', fat: '45g' },
        doctorPrinciples: [
          'Konsumsi 400-500 ml air hangat 15 menit sebelum makan.',
          'Prioritaskan protein di setiap sesi makan.',
          'Ganti karbohidrat olahan dengan nasi merah atau ubi.',
          'Kunyah makanan secara perlahan 20-30 kali.',
          'Hentikan makan berat 3 jam sebelum tidur.'
        ],
        mealPlan: [
          { time: '06:30', mealType: 'Pagi', menu: 'Air hangat + 2 telur rebus', calories: 250, tips: 'Stabilkan gula darah.' },
          { time: '12:00', mealType: 'Siang', menu: 'Nasi merah 1 kepal + ayam panggang + sayur', calories: 480, tips: 'Serat tinggi.' }
        ],
        hydrationProtocol: `Minum minimal ${targetWater} ml air putih per hari.`,
        commonMistakesToAvoid: ['Melewatkan sarapan', 'Minum kalori cair'],
        motivationalQuote: 'Diet sukses adalah konsistensi nutrisi dan hidrasi.'
      };
    }

    return res.status(200).json({ success: true, data: parsedResult });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
}
