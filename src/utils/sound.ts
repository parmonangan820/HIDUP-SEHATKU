// Web Audio API Synthesizer for Alarms & Chimes (No external audio file dependency)

let audioCtx: AudioContext | null = null;
let activeLoopInterval: any = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant medical chime (harmonic chords)
 */
export function playAlarmChime(repeat = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const playSingleChime = () => {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright energetic chime)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Smooth envelope
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.65);
    });
  };

  playSingleChime();

  if (repeat) {
    if (activeLoopInterval) clearInterval(activeLoopInterval);
    activeLoopInterval = setInterval(() => {
      playSingleChime();
    }, 1800);
  }
}

/**
 * Stops alarm repeating sound
 */
export function stopAlarmChime(): void {
  if (activeLoopInterval) {
    clearInterval(activeLoopInterval);
    activeLoopInterval = null;
  }
}

/**
 * Short notification blip
 */
export function playNotificationBlip(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}
