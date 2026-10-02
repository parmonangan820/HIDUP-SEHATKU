import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Mic,
  MicOff,
  Droplet,
  Sparkles,
  CheckCircle2,
  X,
  Volume2,
  ChevronRight,
  ArrowRight,
  Clock,
  Radio,
  Plus,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceDrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceDrinkModal: React.FC<VoiceDrinkModalProps> = ({ isOpen, onClose }) => {
  const { logWater, todayRecord, profile } = useHealth();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    amount: number;
    container: string;
    note: string;
  } | null>(null);
  const [manualInputText, setManualInputText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Indonesian

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('');
          setSuccessInfo(null);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  // When speech stops and we have a transcript, process automatically!
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0 && !isProcessing && !successInfo) {
      handleProcessVoice(transcript);
    }
  }, [isListening, transcript]);

  if (!isOpen) return null;

  const startListening = () => {
    setSuccessInfo(null);
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error(e);
          }
        }, 150);
      }
    } else {
      setTranscript('Minum 5 teguk');
      handleProcessVoice('Minum 5 teguk');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const parseVoiceLocally = (text: string) => {
    const lower = text.toLowerCase();

    // Check "X teguk" (1 teguk = 10 ml)
    const tegukMatch = lower.match(/(\d+)\s*teguk/);
    if (tegukMatch && tegukMatch[1]) {
      const teguks = parseInt(tegukMatch[1], 10);
      if (teguks > 0) {
        const ml = teguks * 10;
        return { amountMl: ml, containerType: 'cangkir' as const, note: `${teguks} Teguk air (${ml} ml)` };
      }
    }
    if (lower.includes('5 teguk') || lower.includes('lima teguk')) {
      return { amountMl: 50, containerType: 'cangkir' as const, note: '5 Teguk air (50 ml)' };
    }
    if (lower.includes('10 teguk') || lower.includes('sepuluh teguk')) {
      return { amountMl: 100, containerType: 'cangkir' as const, note: '10 Teguk air (100 ml)' };
    }

    // Check explicit numbers with ml
    const mlMatch = lower.match(/(\d+)\s*(ml|mili|mililiter)?/);
    if (mlMatch && mlMatch[1]) {
      const parsed = parseInt(mlMatch[1], 10);
      if (parsed > 0) {
        let container: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom' = 'gelas';
        if (parsed <= 100) container = 'cangkir';
        else if (parsed <= 350) container = 'gelas';
        else if (parsed <= 650) container = 'botol';
        else container = 'tumbler';

        return { amountMl: parsed, containerType: container, note: `Minum ${parsed} ml` };
      }
    }

    if (lower.includes('dua gelas') || lower.includes('2 gelas')) return { amountMl: 500, containerType: 'gelas' as const, note: '2 Gelas air (500 ml)' };
    if (lower.includes('satu gelas') || lower.includes('1 gelas') || lower.includes('segelas')) return { amountMl: 250, containerType: 'gelas' as const, note: '1 Gelas air (250 ml)' };
    if (lower.includes('setengah gelas')) return { amountMl: 125, containerType: 'gelas' as const, note: 'Setengah gelas air (125 ml)' };
    if (lower.includes('satu botol') || lower.includes('1 botol') || lower.includes('sebotol')) return { amountMl: 600, containerType: 'botol' as const, note: '1 Botol air (600 ml)' };

    return { amountMl: 250, containerType: 'gelas' as const, note: 'Minum 250 ml' };
  };

  const handleProcessVoice = async (textToParse: string) => {
    setIsProcessing(true);
    setTranscript(textToParse);

    let amount = 250;
    let container: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom' = 'gelas';
    let note = 'Minum 250 ml';

    // 1. Precise local parse first to ensure exact spoken values (e.g. 5 teguk / 100 ml)
    const localParsed = parseVoiceLocally(textToParse);
    if (localParsed) {
      amount = localParsed.amountMl;
      container = localParsed.containerType;
      note = localParsed.note;
    }

    // 2. Try server API enhancement
    try {
      const res = await fetch('/api/gemini/parse-water-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceText: textToParse }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.amountMl && data.amountMl > 0) {
          amount = Number(data.amountMl);
          container = (data.containerType as any) || container;
          note = data.note || note;
        }
      }
    } catch (err) {
      // use local parse
    }

    logWater(amount, container);

    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#3b82f6'],
      });
    } catch (e) {
      // ignore
    }

    setSuccessInfo({
      amount,
      container,
      note,
    });
    setIsProcessing(false);
  };

  const handleQuickPreset = (amount: number, container: 'gelas' | 'cangkir' | 'botol' | 'tumbler' | 'galon' | 'custom', label: string) => {
    logWater(amount, container);
    setTranscript(label);
    setSuccessInfo({
      amount,
      container,
      note: label,
    });
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981'],
      });
    } catch (e) {
      // ignore
    }
  };

  const currentTotal = todayRecord.totalWaterMl;
  const target = profile.targetWaterMl || 2500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 font-bold">
              <Droplet className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Tombol Minum & Suara AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                  Voice AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ucapkan atau ketik perintah suara (termasuk teguk).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Current Progress */}
          <div className="p-3.5 rounded-2xl bg-slate-950/85 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Air Hari Ini:</span>
              <span className="text-base font-extrabold text-white">
                {(currentTotal ?? 0).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">/ {(target ?? 0).toLocaleString()} ml</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Status Akumulasi:</span>
              <span className="text-xs font-bold text-cyan-400">
                {Math.min(100, Math.round((currentTotal / target) * 100))}% Tercapai
              </span>
            </div>
          </div>

          {/* Microphone Section */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/30 p-5 text-center relative overflow-hidden shadow-inner">
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative my-2">
                {isListening && (
                  <>
                    <div className="absolute -inset-3 rounded-full bg-cyan-500/20 animate-ping"></div>
                    <div className="absolute -inset-6 rounded-full bg-cyan-500/10 animate-pulse"></div>
                  </>
                )}

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 shadow-xl ${
                    isListening
                      ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-rose-500/30'
                      : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-cyan-500/30'
                  }`}
                  title={isListening ? 'Ketuk untuk berhenti' : 'Ketuk mikrofon dan ucapkan'}
                >
                  {isListening ? (
                    <MicOff className="w-9 h-9 stroke-[2.5] animate-pulse" />
                  ) : (
                    <Mic className="w-9 h-9 stroke-[2.5]" />
                  )}
                </button>
              </div>

              <span className="text-xs font-bold text-white mt-2">
                {isListening
                  ? 'Sedang Mendengarkan... Silakan Bicara'
                  : isProcessing
                  ? 'AI Memproses Suara...'
                  : 'Ketuk Mikrofon & Ucapkan Takaran Minum'}
              </span>

              {/* Live Transcript Output */}
              <div className="w-full mt-3 min-h-[46px] p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center text-center">
                {transcript ? (
                  <p className="text-xs font-bold text-cyan-300">
                    "{transcript}"
                  </p>
                ) : isListening ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    Katakan: "5 teguk", "10 teguk", "Minum 100 ml"...
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Contoh: "5 teguk", "10 teguk", "Minum 100 ml"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successInfo && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-emerald-300 block">
                  Berhasil Dicatat AI!
                </span>
                <span className="text-[11px] text-slate-300">
                  {successInfo.note} (+{successInfo.amount} ml)
                </span>
              </div>
            </div>
          )}

          {/* Manual Voice Simulator Input */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Atau Ketik Perintah Suara (Simulasi Cepat):
            </span>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualInputText.trim()) {
                  handleProcessVoice(manualInputText.trim());
                  setManualInputText('');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualInputText}
                onChange={(e) => setManualInputText(e.target.value)}
                placeholder="Misal: '5 teguk', '10 teguk', 'Minum 100 ml'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!manualInputText.trim()}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Atau Ketuk Contoh Perintah Suara:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickPreset(50, 'cangkir', '5 teguk')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"5 Teguk"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">50 ml</span>
              </button>

              <button
                onClick={() => handleQuickPreset(100, 'cangkir', '10 teguk')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"10 Teguk"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">100 ml</span>
              </button>

              <button
                onClick={() => handleQuickPreset(200, 'gelas', 'Minum 200 ml')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"200 ml"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">200 ml</span>
              </button>

              <button
                onClick={() => handleQuickPreset(250, 'gelas', 'Minum satu gelas')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"1 Gelas"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">250 ml</span>
              </button>

              <button
                onClick={() => handleQuickPreset(500, 'gelas', 'Minum dua gelas')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"2 Gelas"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">500 ml</span>
              </button>

              <button
                onClick={() => handleQuickPreset(600, 'botol', '1 Botol')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex flex-col justify-between group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">"1 Botol"</span>
                <span className="text-[10px] font-black text-cyan-400 mt-1">600 ml</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
