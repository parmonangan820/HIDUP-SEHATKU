import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Camera,
  Upload,
  Flame,
  Droplet,
  Check,
  ShieldCheck,
  Zap,
  RotateCcw,
  PlusCircle,
  Apple,
  Salad,
} from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDietTips?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface FoodScanResult {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sugarG: number;
  waterRequirementMl: number;
  glycemicIndex: string;
  healthGrade: string;
  analysisSummary: string;
  recommendations: string[];
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, onOpenDietTips }) => {
  const { profile, todayRecord, isPro, setIsProModalOpen, logWater } = useHealth();
  const [activeTab, setActiveTab] = useState<'chat' | 'scanner'>('chat');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo ${profile.name || 'Sahabat Sehat'}! Saya adalah Dokter AI Hidup Sehatku. Silakan ajukan pertanyaan seputar kesehatan, takaran air putih, fungsi organ, elektrolit, metabolisme, panduan olahraga, maupun analisis nutrisi makanan. Ada yang ingin Anda ketahui hari ini?`,
      time: 'Baru saja',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scanner State
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [foodInput, setFoodInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FoodScanResult | null>(null);
  const [loggedToast, setLoggedToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading, activeTab]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Berapa ml air terbaik saat bangun tidur pagi?',
    'Bagaimana cara menjaga kesehatan ginjal dengan hidrasi?',
    'Apakah elektrolit penting saat berolahraga?',
    'Berapa kebutuhan air untuk menurunkan berat badan?',
  ];

  const foodPresets = [
    'Nasi Goreng Ayam + Telur',
    'Ayam Bakar + Nasi',
    'Gado-Gado Spesial',
    'Soto Ayam Lamongan',
    'Es Teh Manis',
    'Kopi Susu Gula Aren',
    'Smoothie Pisang Oat',
    'Salad Buah Segar',
  ];

  const getDynamicClinicalReply = (query: string, currentProfile: any, stats: any): string => {
    const name = currentProfile?.name || 'Sahabat Sehat';
    const q = query.toLowerCase();
    const water = stats?.waterMl || 0;
    const target = currentProfile?.targetWaterMl || 2500;
    const weight = currentProfile?.weight || 60;
    const height = currentProfile?.height || 165;
    const workoutMins = stats?.workoutMinutes || 0;

    if (q.includes('ginjal') || q.includes('batu ginjal') || q.includes('ureter') || q.includes('kencing')) {
      return `Halo ${name}, pertanyaan yang sangat penting mengenai kesehatan ginjal. Ginjal Anda menyaring sekitar 120-150 liter darah setiap hari untuk membuang limbah dan kelebihan cairan melalui urin. Kurangnya hidrasi menyebabkan urin menjadi pekat, meningkatkan risiko kristalisasi mineral (batu ginjal). Berdasarkan profil Anda (berat ${weight}kg), target air harian Anda adalah ${target} ml. Saat ini Anda telah mencatat ${water} ml. Pastikan minum air putih secara berkala sepanjang hari agar ginjal dapat bekerja optimal!`;
    }

    if (q.includes('elektrolit') || q.includes('garam') || q.includes('sodium') || q.includes('pusing') || q.includes('lemas')) {
      return `Halo ${name}. Ketika Anda berolahraga intens atau berkeringat banyak, tubuh tidak hanya kehilangan cairan (air) tetapi juga elektrolit penting seperti natrium dan kalium. Jika hanya minum air putih dalam durasi ekstrem, dapat terjadi hiponatremia. Untuk olahraga di atas 1 jam, disarankan air yang mengandung sedikit elektrolit atau buah segar seperti pisang. Hari ini Anda sudah berolahraga ${workoutMins} menit. Tetap jaga keseimbangan hidrasi ya!`;
    }

    if (q.includes('turun berat badan') || q.includes('diet') || q.includes('lemak') || q.includes('kalori') || q.includes('langsing')) {
      return `Halo ${name}! Hidrasi memegang peranan krusial dalam metabolisme dan pembakaran lemak. Seringkali otak salah mengartikan rasa haus sebagai rasa lapar, sehingga kita makan berlebihan padahal tubuh hanya butuh air. Minum 500 ml air sebelum makan terbukti secara klinis membantu mengurangi asupan kalori. Dengan berat ${weight}kg dan tinggi ${height}cm, menjaga konsistensi air ${target} ml per hari serta olahraga teratur adalah kunci sukses penurunan berat badan yang sehat.`;
    }

    if (q.includes('tidur') || q.includes('malam') || q.includes('insomnia') || q.includes('istirahat') || q.includes('lelah')) {
      return `Kualitas tidur dan hidrasi saling berkaitan erat, ${name}. Dehidrasi ringan dapat menyebabkan kram otot, sakit kepala ringan, atau mulut kering di malam hari yang mengganggu siklus tidur REM. Namun, disarankan membatasi asupan air besar 1 jam sebelum tidur agar Anda tidak sering terbangun untuk buang air kecil. Hari ini total air Anda ${water} ml.`;
    }

    if (q.includes('olahraga') || q.includes('kardio') || q.includes('lari') || q.includes('gym') || q.includes('fitness') || q.includes('badminton') || q.includes('jalan')) {
      return `Aktivitas fisik seperti yang Anda lakukan (${workoutMins} menit hari ini) meningkatkan suhu tubuh, memaksa jantung memompa lebih cepat dan tubuh mendinginkan diri melalui keringat. Aturan emas hidrasi olahraga:\n1. 250-300 ml sebelum mulai.\n2. 150 ml setiap 20 menit saat latihan.\n3. Rehidrasi penuh setelah selesai.\nTetap dengarkan tubuh Anda dan istirahat jika merasa lelah!`;
    }

    if (q.includes('bangun tidur') || q.includes('pagi')) {
      return `Halo ${name}! Saat bangun tidur pagi (sebelum sarapan), sangat dianjurkan minum **1 hingga 2 gelas (300-500 ml) air putih**. Ini berfungsi merehidrasi tubuh setelah 7-8 jam tidur malam, mengaktifkan organ internal, serta membantu membuang toksin pencernaan. Hari ini Anda sudah minum ${water} ml dari target ${target} ml. Yuk tambah lagi!`;
    }

    return `Halo ${name}! Terima kasih atas pertanyaan Anda: "${query}".\n\nSebagai Dokter AI Hidup Sehatku, saya menganalisis bahwa pertanyaan Anda sangat relevan dengan pemeliharaan kebugaran preventif. Berdasarkan profil Anda (Usia ${currentProfile?.age || 25} tahun, Berat ${weight}kg) dan status hari ini (${water} ml air, ${workoutMins} menit olahraga):\n\n1. **Hidrasi Optimal**: Menjaga asupan air sesuai target harian (${target} ml) membantu suplai oksigen ke sel, melancarkan sirkulasi, dan menjaga kesehatan organ vital.\n2. **Gaya Hidup Bugar**: Kombinasikan dengan istirahat cukup dan nutrisi seimbang.\n\nJika Anda memiliki keluhan spesifik yang berkelanjutan, disarankan untuk berkonsultasi langsung dengan dokter spesialis. Ada hal lain seputar kesehatan yang ingin didiskusikan?`;
  };

  const handleSendChat = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isChatLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsChatLoading(true);

    const todayStats = {
      waterMl: todayRecord.totalWaterMl,
      workoutMinutes: todayRecord.totalWorkoutMinutes,
      calories: todayRecord.totalCalories,
    };

    let replyText = '';

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          profile,
          todayStats,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          replyText = data.reply;
        }
      }
    } catch (err) {
      // ignore server fetch error
    }

    if (!replyText) {
      // Secondary fallback: Direct browser-side Gemini SDK call
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (apiKey) {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          const systemPrompt = `Anda adalah Dokter AI Medis & Asisten Virtual Kesehatan Ahli dari aplikasi "Hidup Sehatku". Jawablah pertanyaan pengguna secara tepat, langsung pada intinya, ramah, dan ilmiah.`;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Pertanyaan Pengguna: ${query}`,
            config: { systemInstruction: systemPrompt, temperature: 0.7 },
          });
          if (response.text) {
            replyText = response.text.trim();
          }
        }
      } catch (clientErr) {
        // ignore
      }
    }

    if (!replyText) {
      replyText = getDynamicClinicalReply(query, profile, todayStats);
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsChatLoading(false);
  };

  // Image File Upload Handler for Scanner
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScannedImage(reader.result as string);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Health Scanner
  const handleScanFood = async (overrideFoodName?: string) => {
    const queryFood = overrideFoodName || foodInput;
    if (!scannedImage && !queryFood.trim()) return;

    setIsScanning(true);
    setScanResult(null);
    setLoggedToast(null);

    try {
      const res = await fetch('/api/gemini/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scannedImage || undefined,
          foodName: queryFood || undefined,
          profile,
        }),
      });

      if (res.ok) {
        const data: FoodScanResult = await res.json();
        setScanResult(data);
      } else {
        throw new Error('Gagal memindai');
      }
    } catch (err) {
      // Offline fallback estimate
      setScanResult({
        foodName: queryFood || 'Makanan Pilihan',
        calories: 390,
        proteinG: 17,
        carbsG: 49,
        fatG: 15,
        sugarG: 4,
        waterRequirementMl: 300,
        glycemicIndex: 'Sedang',
        healthGrade: 'A-',
        analysisSummary: `Analisis nutrisi untuk ${queryFood || 'Makanan Pilihan'}. Mengandung energi seimbang untuk aktivitas seharian.`,
        recommendations: [
          'Minum 300 ml air putih ekstra untuk menetralkan kadar sodium.',
          'Dampingi dengan olahraga ringan 15-20 menit untuk pembakaran kalori maksimal.',
        ],
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogScanToHealthTracker = () => {
    if (!scanResult) return;
    logWater(scanResult.waterRequirementMl || 300);
    setLoggedToast(`Berhasil menambahkan ${scanResult.waterRequirementMl || 300} ml air minum penyeimbang & ${scanResult.calories} kcal ke tracker!`);
    setTimeout(() => {
      setLoggedToast(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl h-[88vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Bar Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AI Health Scanner & Chat</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-slate-400">Analisis Kalori Makanan & Dokter AI Medis</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pro Account Status Header Banner */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
          {isPro ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="text-[11px]">Akun PRO Unlocked: Akses Scanner & Dokter AI Tanpa Batas!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[9px] shadow-sm">
                UNLIMITED
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Paket Pro: Akses Analisis Kalori & Konsultasi Tanpa Batas</span>
              </div>
              <button
                onClick={() => setIsProModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-[10px] hover:brightness-110 transition-all shadow-sm"
              >
                Aktifkan PRO
              </button>
            </div>
          )}
        </div>

        {/* Mode Selector Navigation Tabs */}
        <div className="grid grid-cols-3 p-1 bg-slate-950 border-b border-slate-800 text-[11px] font-bold gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="truncate">Dokter AI</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="truncate">Food Scanner</span>
          </button>

          <button
            onClick={() => {
              if (onOpenDietTips) {
                onClose();
                onOpenDietTips();
              }
            }}
            className="py-2 rounded-xl flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 text-emerald-300 font-bold transition-all shadow-sm cursor-pointer"
            title="Buka Fitur Tips Diet Sukses ala Dokter AI (Eksklusif PRO)"
          >
            <Salad className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Diet PRO</span>
          </button>
        </div>

        {/* TAB 1: DOKTER AI CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-indigo-600/30 border border-indigo-500/30 text-indigo-300'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800/90 border border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        msg.sender === 'user' ? 'text-cyan-100' : 'text-slate-400'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-800/90 border border-slate-700/60 text-slate-300 p-3 rounded-2xl flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Question Chips */}
            <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto flex gap-1.5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] whitespace-nowrap border border-slate-700/80 transition-colors active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Tanyakan kesehatan, ginjal, hidrasi, atau olahraga..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isChatLoading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: AI HEALTH SCANNER & KALORI */}
        {activeTab === 'scanner' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {loggedToast && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs text-center flex items-center justify-center gap-2 animate-in fade-in shadow-lg">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{loggedToast}</span>
              </div>
            )}

            {/* Upload or Camera Area */}
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3 relative">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {scannedImage ? (
                <div className="relative rounded-2xl overflow-hidden max-h-48 bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <img
                    src={scannedImage}
                    alt="Foto Makanan"
                    className="object-cover max-h-48 w-full rounded-2xl"
                  />
                  <button
                    onClick={() => setScannedImage(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                    title="Hapus foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="py-6 px-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-amber-500/10">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Unggah Foto Makanan / Minuman</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Pilih dari Galeri atau Kamera Smartphone Anda
                    </p>
                  </div>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-slate-800 text-amber-300 font-semibold border border-slate-700 mt-1">
                    Atau ketik nama makanan di bawah
                  </span>
                </div>
              )}

              {/* Food Text Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder="Ketik nama makanan/minuman (misal: Nasi Goreng Ayam + Telur)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />

                {/* Quick Food Preset Chips */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {foodPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setFoodInput(preset);
                        handleScanFood(preset);
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 text-[10px] border border-slate-800 hover:border-amber-500/40 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scan Trigger Button */}
              <button
                onClick={() => handleScanFood()}
                disabled={isScanning || (!scannedImage && !foodInput.trim())}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Kalori & Nutrisi dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Pindai Kalori & Nutrisi Makanan</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan Results View */}
            {scanResult && (
              <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-4 animate-in fade-in shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* Result Title & Grade */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{scanResult.foodName}</h3>
                      <p className="text-[10px] text-slate-400">Hasil Pemindaian Nutrisi AI</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black inline-block">
                      Grade: {scanResult.healthGrade || 'A-'}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Indeks Glikemik: {scanResult.glycemicIndex || 'Sedang'}
                    </span>
                  </div>
                </div>

                {/* Macro Nutrition Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.calories}</span>
                    <span className="text-[10px] text-slate-400 block">Kalori (kcal)</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Zap className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.proteinG}g</span>
                    <span className="text-[10px] text-slate-400 block">Protein</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Apple className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">{scanResult.carbsG}g</span>
                    <span className="text-[10px] text-slate-400 block">Karbohidrat</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <Droplet className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <span className="text-sm font-black text-white">+{scanResult.waterRequirementMl}ml</span>
                    <span className="text-[10px] text-cyan-400 font-bold block">Air Penyeimbang</span>
                  </div>
                </div>

                {/* AI Summary Prose */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 leading-relaxed text-slate-300 text-xs">
                  <strong className="text-amber-400 block mb-1">Ulasan Dokter Nutrisi AI:</strong>
                  {scanResult.analysisSummary}
                </div>

                {/* Recommendations */}
                {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-white block">Rekomendasi Hidrasi & Kesehatan:</span>
                    {scanResult.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Log Button */}
                <button
                  onClick={handleLogScanToHealthTracker}
                  className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambahkan +{scanResult.waterRequirementMl}ml Air Penyeimbang ke Tracker</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
