export class SoundPlayer {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private volume: number = 0.8;
  private isLoaded: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Create AudioContext on first user interaction to avoid autoplay policy issues
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
      this.isLoaded = true;
    } catch (error) {
      console.warn('AudioContext not available, using fallback audio:', error);
      // Fallback to HTML5 Audio if Web Audio API is not available
    }
  }

  private async loadSounds() {
    // Since we're using simple beep sounds, we'll generate them programmatically
    // This avoids the need for external sound files
    const soundDefinitions = {
      'debate_start': { frequency: 440, duration: 0.3, type: 'sine' as OscillatorType },
      'debate_end': { frequency: 523, duration: 0.5, type: 'sine' as OscillatorType },
      'both_active': { frequency: 587, duration: 0.4, type: 'square' as OscillatorType },
      'milestone_5min': { frequency: 659, duration: 0.5, type: 'sine' as OscillatorType },
      'milestone_15min': { frequency: 698, duration: 0.7, type: 'sine' as OscillatorType },
      'milestone_30min': { frequency: 784, duration: 1.0, type: 'square' as OscillatorType },
      'new_record': { frequency: 880, duration: 1.2, type: 'sine' as OscillatorType },
      'daily_summary': { frequency: 523, duration: 0.6, type: 'sine' as OscillatorType },
      'weekly_summary': { frequency: 587, duration: 0.6, type: 'sine' as OscillatorType },
      'peaceful_day': { frequency: 440, duration: 0.8, type: 'sine' as OscillatorType },
      'test': { frequency: 523, duration: 0.5, type: 'sine' as OscillatorType },
    };

    if (!this.audioContext) return;

    for (const [name, definition] of Object.entries(soundDefinitions)) {
      try {
        const buffer = this.generateTone(
          definition.frequency,
          definition.duration,
          definition.type
        );
        this.sounds.set(name, buffer);
      } catch (error) {
        console.error(`Failed to generate sound: ${name}`, error);
      }
    }
  }

  private generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * ((t * frequency) % 1) - 1;
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * ((t * frequency) % 1) - 1) - 1;
          break;
      }

      // Apply envelope (fade in/out) for smoother sound
      const envelope = this.getEnvelope(i, numSamples);
      channelData[i] = sample * envelope;
    }

    return buffer;
  }

  private getEnvelope(index: number, totalSamples: number): number {
    const fadeInSamples = totalSamples * 0.1; // 10% fade in
    const fadeOutSamples = totalSamples * 0.2; // 20% fade out
    const fadeOutStart = totalSamples - fadeOutSamples;

    if (index < fadeInSamples) {
      // Fade in
      return index / fadeInSamples;
    } else if (index > fadeOutStart) {
      // Fade out
      return 1 - (index - fadeOutStart) / fadeOutSamples;
    } else {
      // Sustain
      return 1;
    }
  }

  play(soundName: string, customVolume?: number): void {
    if (!this.isLoaded || !this.audioContext) {
      // Fallback to a simple beep using HTML5 Audio
      this.playFallback(soundName, customVolume);
      return;
    }

    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      // Resume AudioContext if it's suspended (due to autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = sound;
      gainNode.gain.value = customVolume !== undefined ? customVolume : this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  private playFallback(soundName: string, customVolume?: number): void {
    // Simple HTML5 Audio fallback using data URI with a short beep
    try {
      const audio = new Audio();

      // Generate a simple beep sound using data URI
      // This is a base64-encoded WAV file containing a simple beep
      const beepSound = this.generateBeepDataURI();
      audio.src = beepSound;
      audio.volume = customVolume !== undefined ? customVolume : this.volume;

      audio.play().catch(error => {
        console.warn('Failed to play fallback sound:', error);
      });
    } catch (error) {
      console.error('Fallback sound playback failed:', error);
    }
  }

  private generateBeepDataURI(): string {
    // Simple sine wave beep as a data URI
    // This is a minimal WAV file structure
    return 'data:audio/wav;base64,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';
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Test sound playback
  test(): void {
    this.play('test');
  }
}
