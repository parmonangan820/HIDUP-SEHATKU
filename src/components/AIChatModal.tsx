import React, { useState, useRef, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { Sparkles, Send, X, Bot, User, Clock, AlertCircle } from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const { profile, todayRecord } = useHealth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo ${profile.name || 'Sahabat Sehat'}! Saya adalah Dokter AI Hidup Sehatku. Silakan ajukan pertanyaan apapun seputar kesehatan, takaran air putih, fungsi organ, elektrolit, metabolisme, panduan olahraga, maupun tips hidup bugar. Ada yang ingin Anda ketahui hari ini?`,
      time: 'Baru saja',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Berapa ml air terbaik saat bangun tidur pagi?',
    'Bagaimana cara menjaga kesehatan ginjal dengan hidrasi?',
    'Apakah elektrolit penting saat berolahraga?',
    'Berapa kebutuhan air untuk menurunkan berat badan?',
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
      return `Halo ${name}, pertanyaan yang sangat penting mengenai kesehatan ginjal. Ginjal Anda menyaring sekitar 120-150 liter darah setiap hari untuk membuang limbah dan kelebihan cairan melalui urin. Kurangnya hidrasi menyebabkan urin menjadi pekat, meningkatkan risiko kristalisasi mineral (batu ginjal). Berdasarkan profil Anda (berat ${weight}kg), target air harian Anda adalah ${target} ml. Saat ini Anda telah mencatat ${water} ml. Pastikan minum air putih secara bertkala sepanjang hari agar ginjal dapat bekerja optimal!`;
    }

    if (q.includes('elektrolit') || q.includes('garam') || q.includes('sodium') || q.includes('pusing') || q.includes('lemas')) {
      return `Halo ${name}. Ketika Anda berolahraga intens atau berkeringat banyak, tubuh tidak hanya kehilangan cairan (air) tetapi juga elektrolit penting seperti natrium dan kalium. Jika hanya minum air putih tanpa elektrolit dalam durasi ekstrem, dapat terjadi hiponatremia (kadar natrium darah rendah). Untuk olahraga di atas 1 jam, disarankan air yang mengandung sedikit elektrolit atau buah segar seperti pisang. Hari ini Anda sudah berolahraga ${workoutMins} menit. Tetap jaga keseimbangan hidrasi ya!`;
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

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

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
      // fallback to smart clinical engine
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
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Dokter AI Hidup Sehatku</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </h3>
              <p className="text-[10px] text-slate-400">Konsultasi Medis & Gaya Hidup Bugar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Area */}
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

          {isLoading && (
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
              onClick={() => handleSend(prompt)}
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
            handleSend();
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Tanyakan pertanyaan kesehatan, hidrasi, atau olahraga..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
