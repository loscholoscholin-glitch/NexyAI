export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
          this.masterGain = this.ctx.createGain();
          this.masterGain.connect(this.ctx.destination);
        }
      } catch (e) {
        console.warn("AudioContext no está soportado o fue bloqueado", e);
      }
    }
    // Si está en estado suspendido (por políticas del navegador), intenta reanudarlo.
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain) {
      // Ajusta de forma segura evitando clicks (rampa)
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx!.currentTime, 0.05);
    }
  }

  public playCompletion(volume = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.setVolume(volume);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Un sonido de "éxito" suave: dos tonos ascendentes rápidos
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // Do5
    osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.1); // Do6
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playError(volume = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.setVolume(volume);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Sonido de "error" apagado
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.2); 
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playClick(volume = 0.5) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.setVolume(volume);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

export const soundEngine = new AudioEngine();
