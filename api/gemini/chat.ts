import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, profile, todayStats } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey) {
      return res.status(200).json({
        reply: `Halo ${profile?.name || 'Sahabat'}! Silakan tanyakan seputar hidrasi, kalori, kesehatan ginjal, atau olahraga. (Catatan: Tambahkan GEMINI_API_KEY di environment variables Vercel untuk mengaktifkan AI penuh).`
      });
    }

    const aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });

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

    const reply = response.text?.trim() || 'Maaf, Dokter AI sedang sibuk memproses. Silakan coba lagi.';
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error('Vercel chat error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
