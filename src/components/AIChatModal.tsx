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
      text: `Halo ${profile.name || 'Sahabat Sehat'}! Saya adalah Dokter AI Hidup Sehatku. Anda bisa bertanya tentang takaran minum air putih, jam-jam terbaik minum, panduan olahraga (seperti jalan kaki, senam, badminton, jogging), atau tips hidup sehat lainnya. Ada yang ingin Anda ketahui hari ini?`,
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
    'Apakah jalan di tempat seefektif jalan kaki luar?',
    'Jadwal minum yang baik saat main badminton?',
    'Mengapa minum malam dibatasi 1 jam sebelum tidur?',
  ];

  const getSmartAiReply = (query: string, currentProfile: any, stats: any): string => {
    const name = currentProfile?.name || 'Sahabat Sehat';
    const q = query.toLowerCase();
    const water = stats?.waterMl || 0;
    const target = currentProfile?.targetWaterMl || 2500;
    const workoutMins = stats?.workoutMinutes || 0;

    if (q.includes('bangun tidur') || q.includes('pagi')) {
      return `Halo ${name}! Saat bangun tidur pagi (sebelum sarapan), sangat dianjurkan minum **1 hingga 2 gelas (300-500 ml) air putih**. Ini berfungsi merehidrasi tubuh setelah 7-8 jam tidur malam, mengaktifkan organ internal, serta membantu membuang toksin pencernaan. Hari ini Anda sudah minum ${water} ml dari target ${target} ml. Yuk tambah lagi!`;
    }
    if (q.includes('jalan di tempat') || q.includes('jalan kaki')) {
      return `Bagus sekali pertanyaannya, ${name}! Jalan di tempat (indoor walking) sangat efektif membakar kalori dan melancarkan sirkulasi darah, hampir setara dengan jalan kaki ringan di luar ruangan jika dilakukan dengan intensitas stabil selama 20-30 menit. Hari ini total latihan Anda adalah ${workoutMins} menit. Pertahankan konsistensi ini!`;
    }
    if (q.includes('badminton') || q.includes('olahraga') || q.includes('jadwal minum')) {
      return `Untuk olahraga seperti badminton atau jogging, ${name}, strategi hidrasi terbaik adalah:\n1. Minum 250-300 ml air 30 menit sebelum mulai.\n2. Minum 150-200 ml setiap 15-20 menit selama bermain.\n3. Rehidrasi setelah selesai secukupnya untuk mengganti cairan yang keluar lewat keringat.`;
    }
    if (q.includes('malam') || q.includes('tidur')) {
      return `Membatasi minum air 1 jam sebelum tidur sangat dianjurkan agar kualitas tidur Anda (${name}) tidak terganggu oleh keinginan buang air kecil di tengah malam. Pastikan kebutuhan air harian (${target} ml) sudah tercapai sepanjang pagi hingga sore hari!`;
    }
    if (q.includes('takaran') || q.includes('berapa ml') || q.includes('kebutuhan') || q.includes('air')) {
      return `Berdasarkan profil Anda (${name}, berat ${currentProfile?.weight || 60}kg), takaran ideal hidrasi harian Anda adalah sekitar **${target} ml** (atau setara ~${Math.round(target/250)} gelas). Hari ini tercatat ${water} ml. Mari capai target 100% hari ini!`;
    }

    return `Halo ${name}! Sebagai Dokter AI Hidup Sehatku, saya menyarankan Anda untuk menjaga keseimbangan antara hidrasi teratur dan aktivitas fisik ringan. Hari ini Anda telah mencatat ${water} ml air dan ${workoutMins} menit olahraga. Tetap konsisten, cukupi istirahat, dan nikmati hidup bugar setiap hari!`;
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
      // fallback to client-side smart engine
    }

    if (!replyText) {
      replyText = getSmartAiReply(query, profile, todayStats);
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
              <p className="text-[10px] text-slate-400">Konsultasi Hidrasi & Gaya Hidup Bugar</p>
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
            placeholder="Tanyakan seputar minum air putih atau olahraga..."
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
