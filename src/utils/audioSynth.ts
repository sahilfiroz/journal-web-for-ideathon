// Web Audio API Procedural Ambient Sound Generator
// Generates gentle soothing soundscapes natively without external audio dependencies

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private currentType: string = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.gainNode.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Safe cleanup
      }
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  public play(type: 'rain' | 'forest' | 'waves' | 'cafe' | 'fireplace', volume: number = 0.4) {
    this.initContext();
    if (!this.ctx) return;

    this.stop();
    this.currentType = type;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'rain') {
      this.createRainSound(masterGain);
    } else if (type === 'waves') {
      this.createOceanWavesSound(masterGain);
    } else if (type === 'forest') {
      this.createForestWindSound(masterGain);
    } else if (type === 'fireplace') {
      this.createFireplaceSound(masterGain);
    } else if (type === 'cafe') {
      this.createCafeSound(masterGain);
    }
  }

  private createPinkNoiseBuffer(duration: number = 5): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private createRainSound(target: GainNode) {
    if (!this.ctx) return;
    const noiseBuffer = this.createPinkNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter for gentle rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(300, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(highpass);
    highpass.connect(target);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, highpass);
  }

  private createOceanWavesSound(target: GainNode) {
    if (!this.ctx) return;
    const noiseBuffer = this.createPinkNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    // LFO for surging wave swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    const waveAmpLfo = this.ctx.createOscillator();
    waveAmpLfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const waveAmpGain = this.ctx.createGain();
    waveAmpGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    waveAmpLfo.connect(waveAmpGain);
    waveAmpGain.connect(waveGain.gain);

    noiseSource.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(target);

    noiseSource.start();
    lfo.start();
    waveAmpLfo.start();

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain, waveGain, waveAmpLfo, waveAmpGain);
  }

  private createForestWindSound(target: GainNode) {
    if (!this.ctx) return;
    const noiseBuffer = this.createPinkNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(target);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, filter, lfo, lfoGain);
  }

  private createFireplaceSound(target: GainNode) {
    if (!this.ctx) return;
    const noiseBuffer = this.createPinkNoiseBuffer(4);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(400, this.ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(target);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lowpass);
  }

  private createCafeSound(target: GainNode) {
    if (!this.ctx) return;
    const noiseBuffer = this.createPinkNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(target);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter);
  }
}

export const ambientSound = new AmbientSoundEngine();
