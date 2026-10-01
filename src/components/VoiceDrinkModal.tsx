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
  const [customInputMl, setCustomInputMl] = useState<number>(50);
  const [manualText, setManualText] = useState('');
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
        // If already started, stop and restart
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
      // Simulate quick voice recording if browser blocks microphone
      simulateVoiceInput('Minum satu gelas');
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

  const handleProcessVoice = async (textToParse: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/gemini/parse-water-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceText: textToParse }),
      });

      const data = await res.json();
      const amount = Number(data.amountMl) || 250;
      const container = data.containerType || 'gelas';
      const note = data.note || `Minum ${amount} ml`;

      // Automatically log to app database / state
      logWater(amount, container);

      // Celebrate
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

      setTimeout(() => {
        // Keep feedback for 2 seconds then auto close if desired
      }, 2000);
    } catch (err) {
      console.error(err);
      // Fallback
      logWater(250, 'gelas');
      setSuccessInfo({
        amount: 250,
        container: 'gelas',
        note: 'Minum 250 ml (1 Gelas)',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPreset = (amount: number, container: any, label: string) => {
    logWater(amount, container);
    setSuccessInfo({
      amount,
      container,
      note: `Tercatat: Minum ${amount} ml (${label})`,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#10b981'],
      });
    } catch (e) {
      // ignore
    }
  };

  const simulateVoiceInput = (samplePhrase: string) => {
    setTranscript(samplePhrase);
    handleProcessVoice(samplePhrase);
  };

  const currentTotal = todayRecord.totalWaterMl;
  const target = profile.targetWaterMl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Droplet className="w-5 h-5 fill-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>Tombol Minum & Suara AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                Voice AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ucapkan atau pilih langsung untuk mendata air minum secara otomatis.
            </p>
          </div>
        </div>

        {/* Current Total Progress Strip */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 mb-4 flex items-center justify-between">
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

        {/* Big Interactive Microphone Section */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/30 p-5 text-center relative overflow-hidden mb-4 shadow-inner">
          <div className="relative z-10 flex flex-col items-center">
            {/* The Big Mic Button */}
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
                title={isListening ? 'Ketuk untuk berhenti merekam' : 'Ketuk mikrofon dan ucapkan'}
              >
                {isListening ? (
                  <MicOff className="w-9 h-9 stroke-[2.5] animate-pulse" />
                ) : (
                  <Mic className="w-9 h-9 stroke-[2.5]" />
                )}
              </button>
            </div>

            {/* Instruction / Status Label */}
            <span className="text-xs font-bold text-white mt-2">
              {isListening
                ? 'Sedang Mendengarkan... Silakan Bicara'
                : isProcessing
                ? 'AI Sedang Menganalisis Suara...'
                : 'Ketuk Mikrofon & Ucapkan Takaran Minum'}
            </span>

            {/* Live Transcript Box */}
            <div className="w-full mt-3 min-h-[44px] p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center text-center">
              {transcript ? (
                <p className="text-xs font-semibold text-cyan-300 italic">
                  "{transcript}"
                </p>
              ) : isListening ? (
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  Katakan: "Minum 200 ml" atau "Minum satu gelas"...
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Contoh: "Minum 100 ml", "Minum dua gelas", "Minum 50 ml"
                </p>
              )}
            </div>

            {/* Success Message Banner */}
            {successInfo && (
              <div className="w-full mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-left flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-300 block">
                    AI Berhasil Mendata Minum!
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    {successInfo.note} · (+{successInfo.amount} ml ditambahkan ke total akumulasi hari ini)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Voice Phrase Simulation Chips */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            Atau Ketuk Contoh Perintah Suara Ini:
          </span>

          <div className="grid grid-cols-2 gap-2">
            {[
              { text: 'Minum 100 ml', amount: 100 },
              { text: 'Minum 200 ml', amount: 200 },
              { text: 'Minum satu gelas', amount: 250 },
              { text: 'Minum dua gelas', amount: 500 },
              { text: 'Minum 50 ml', amount: 50 },
              { text: 'Minum setengah botol', amount: 300 },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => simulateVoiceInput(item.text)}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-left text-xs font-medium text-slate-200 flex items-center justify-between group active:scale-95 transition-all"
              >
                <span className="truncate group-hover:text-cyan-300">🎙️ "{item.text}"</span>
                <span className="text-[10px] text-cyan-400 font-bold ml-1">{item.amount}ml</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preset Direct Selection Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            Pilihan Cepat Sekali Ketuk (Presisi):
          </span>

          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { ml: 50, label: '50 ml', desc: 'Teguk', type: 'cangkir' },
              { ml: 100, label: '100 ml', desc: 'Gelas Kcl', type: 'cangkir' },
              { ml: 200, label: '200 ml', desc: 'Gelas', type: 'gelas' },
              { ml: 250, label: '250 ml', desc: '1 Cangkir', type: 'cangkir' },
              { ml: 300, label: '300 ml', desc: 'Mug', type: 'gelas' },
              { ml: 500, label: '500 ml', desc: '2 Gelas', type: 'botol' },
              { ml: 600, label: '600 ml', desc: '1 Botol', type: 'botol' },
              { ml: 1000, label: '1000 ml', desc: '1 Liter', type: 'galon' },
            ].map((p) => (
              <button
                key={p.ml}
                type="button"
                onClick={() => handleQuickPreset(p.ml, p.type, p.desc)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/70 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-slate-700/80 active:scale-95 transition-all group"
              >
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                  {p.label}
                </span>
                <span className="text-[9px] text-slate-400">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Custom ml input (e.g. user wants 50ml, 75ml, etc.) */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Bebas Atur:</span>
              <input
                type="number"
                min="10"
                max="2500"
                step="10"
                value={customInputMl}
                onChange={(e) => setCustomInputMl(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs text-center focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-medium">ml</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickPreset(customInputMl, 'custom', `${customInputMl} ml`)}
              className="py-1 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Catat {customInputMl} ml
            </button>
          </div>
        </div>

        {/* Bottom Done button */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
