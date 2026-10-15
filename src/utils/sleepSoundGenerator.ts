// Web Audio API Ambient Sleep Sound & Gentle Wake-up Alarm Generator
// Works 100% offline, zero external audio files, zero CORS or 404 errors!

class SleepAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSourceNodes: any[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentSoundType: string | null = null;
  private timerId: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSound(type: 'rain' | 'ocean' | 'breeze' | 'delta', volume = 0.5, durationMinutes?: number) {
    this.stopSound();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentSoundType = type;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'rain') {
      this.playRain(masterGain);
    } else if (type === 'ocean') {
      this.playOcean(masterGain);
    } else if (type === 'breeze') {
      this.playBreeze(masterGain);
    } else if (type === 'delta') {
      this.playDeltaWaves(masterGain);
    }

    if (durationMinutes && durationMinutes > 0) {
      if (this.timerId) clearTimeout(this.timerId);
      this.timerId = setTimeout(() => {
        this.stopSound();
      }, durationMinutes * 60 * 1000);
    }
  }

  private playRain(destination: AudioNode) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(destination);
    whiteNoise.start();
    this.currentSourceNodes.push(whiteNoise, filter);
  }

  private playOcean(destination: AudioNode) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.06;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);

    // Ocean swell LFO modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave period
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(320, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(destination);

    lfo.start();
    noise.start();
    this.currentSourceNodes.push(noise, filter, lfo, lfoGain);
  }

  private playBreeze(destination: AudioNode) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(destination);

    lfo.start();
    noise.start();
    this.currentSourceNodes.push(noise, filter, lfo, lfoGain);
  }

  private playDeltaWaves(destination: AudioNode) {
    if (!this.ctx) return;
    // Isochronic / binaural-like tone for Delta 3Hz (150Hz carrier & 153Hz carrier)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(143, this.ctx.currentTime); // 3Hz delta difference

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    osc1.connect(waveGain);
    osc2.connect(waveGain);
    waveGain.connect(destination);

    osc1.start();
    osc2.start();
    this.currentSourceNodes.push(osc1, osc2, waveGain);
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public stopSound() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentSourceNodes.forEach((node) => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.currentSourceNodes = [];
    this.isPlaying = false;
    this.currentSoundType = null;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentSoundType(): string | null {
    return this.currentSoundType;
  }

  // Play Gentle Sunrise Alarm Chime
  public playSunriseAlarmChime() {
    this.initContext();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25, 783.99], // C5, E5, G5
      [587.33, 739.99, 880.0],  // D5, F#5, A5
      [659.25, 830.61, 987.77], // E5, G#5, B5
      [783.99, 987.77, 1174.66] // G5, B5, D6
    ];

    let delay = 0;
    chords.forEach((chord) => {
      setTimeout(() => {
        const ctx = this.ctx;
        if (!ctx) return;
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 1.8);
        });
      }, delay);
      delay += 450;
    });
  }
}

export const sleepAudio = new SleepAudioEngine();
