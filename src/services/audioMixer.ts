/**
 * Dual Audio Ingestion & DSP Mixer Engine
 * Implements Web Audio API pipeline mirroring Android's AudioCaptureEngine and native C++ AudioMixer.
 */

export class AudioMixerEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  private sysStream: MediaStream | null = null;
  private sysSource: MediaStreamAudioSourceNode | null = null;
  private sysGain: GainNode | null = null;
  private sysAnalyser: AnalyserNode | null = null;

  // Synthetic synth loop for internal audio demo
  private synthOsc: OscillatorNode | null = null;
  private synthGain: GainNode | null = null;
  private synthTimer: number | null = null;

  // Master bus & Limiter
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;

  private micMuted = false;
  private sysMuted = false;
  private monitoring = false;

  private micDataArray = new Uint8Array(64);
  private sysDataArray = new Uint8Array(64);
  private masterDataArray = new Uint8Array(64);

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx({ sampleRate: 48000 });

    // Master Bus Nodes
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-0.5, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(2.0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 128;
    this.masterAnalyser.smoothingTimeConstant = 0.6;

    this.streamDestination = this.ctx.createMediaStreamDestination();

    // Connect Master -> Limiter -> MasterAnalyser -> StreamDestination
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.streamDestination);

    // Setup Synthetic Game Sound Generator (simulates internal audio if no screen audio attached)
    this.setupSyntheticSysAudio();
  }

  private setupSyntheticSysAudio() {
    if (!this.ctx || !this.masterGain) return;
    this.sysGain = this.ctx.createGain();
    this.sysGain.gain.value = 0.8;

    this.sysAnalyser = this.ctx.createAnalyser();
    this.sysAnalyser.fftSize = 128;
    this.sysAnalyser.smoothingTimeConstant = 0.6;

    this.sysGain.connect(this.sysAnalyser);
    this.sysAnalyser.connect(this.masterGain);

    // Ambient pulsing music synthesizer to simulate game soundtrack
    const baseFreqs = [110, 146.8, 164.8, 196.0, 220.0];
    let noteIdx = 0;

    const playPulse = () => {
      if (!this.ctx || this.ctx.state !== 'running' || this.sysMuted) return;
      try {
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreqs[noteIdx % baseFreqs.length], this.ctx.currentTime);
        noteIdx++;

        noteGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

        osc.connect(noteGain);
        if (this.sysGain) noteGain.connect(this.sysGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
      } catch {
        // audio context might be paused
      }
    };

    this.synthTimer = window.setInterval(playPulse, 500);
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return false;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: false
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = 1.0;

      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 128;
      this.micAnalyser.smoothingTimeConstant = 0.6;

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.micAnalyser);
      this.micAnalyser.connect(this.masterGain);

      return true;
    } catch (err) {
      console.warn('Microphone permission or capture error:', err);
      return false;
    }
  }

  public stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  public attachSystemAudioStream(stream: MediaStream) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    if (this.sysSource) {
      this.sysSource.disconnect();
    }

    this.sysStream = stream;
    this.sysSource = this.ctx.createMediaStreamSource(stream);
    if (!this.sysGain) {
      this.sysGain = this.ctx.createGain();
      this.sysGain.gain.value = 0.8;
      this.sysAnalyser = this.ctx.createAnalyser();
      this.sysAnalyser.fftSize = 128;
      this.sysGain.connect(this.sysAnalyser);
      this.sysAnalyser.connect(this.masterGain);
    }
    this.sysSource.connect(this.sysGain);
  }

  public setMicVolume(vol: number) {
    if (this.micGain && this.ctx) {
      this.micGain.gain.setTargetAtTime(this.micMuted ? 0 : vol, this.ctx.currentTime, 0.05);
    }
  }

  public setSysVolume(vol: number) {
    if (this.sysGain && this.ctx) {
      this.sysGain.gain.setTargetAtTime(this.sysMuted ? 0 : vol, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMicMute(): boolean {
    this.micMuted = !this.micMuted;
    if (this.micGain && this.ctx) {
      this.micGain.gain.setValueAtTime(this.micMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    return this.micMuted;
  }

  public toggleSysMute(): boolean {
    this.sysMuted = !this.sysMuted;
    if (this.sysGain && this.ctx) {
      this.sysGain.gain.setValueAtTime(this.sysMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.sysMuted;
  }

  public toggleMonitoring(): boolean {
    if (!this.ctx || !this.masterGain) return false;
    this.monitoring = !this.monitoring;
    if (this.monitoring) {
      this.masterGain.connect(this.ctx.destination);
    } else {
      try {
        this.masterGain.disconnect(this.ctx.destination);
      } catch {
        // was not connected
      }
    }
    return this.monitoring;
  }

  public getLevels() {
    let micPeak = 0;
    let sysPeak = 0;
    let masterPeak = 0;

    if (this.micAnalyser && !this.micMuted) {
      this.micAnalyser.getByteFrequencyData(this.micDataArray);
      let sum = 0;
      for (let i = 0; i < this.micDataArray.length; i++) {
        sum += this.micDataArray[i];
      }
      micPeak = Math.min(1, (sum / this.micDataArray.length) / 140);
    }

    if (this.sysAnalyser && !this.sysMuted) {
      this.sysAnalyser.getByteFrequencyData(this.sysDataArray);
      let sum = 0;
      for (let i = 0; i < this.sysDataArray.length; i++) {
        sum += this.sysDataArray[i];
      }
      sysPeak = Math.min(1, (sum / this.sysDataArray.length) / 140);
    }

    if (this.masterAnalyser) {
      this.masterAnalyser.getByteFrequencyData(this.masterDataArray);
      let sum = 0;
      for (let i = 0; i < this.masterDataArray.length; i++) {
        sum += this.masterDataArray[i];
      }
      masterPeak = Math.min(1, (sum / this.masterDataArray.length) / 140);
    }

    return { micPeak, sysPeak, masterPeak };
  }

  public getDestinationTrack(): MediaStreamTrack | null {
    if (this.streamDestination) {
      const tracks = this.streamDestination.stream.getAudioTracks();
      return tracks[0] || null;
    }
    return null;
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public destroy() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    this.stopMicrophone();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioMixer = new AudioMixerEngine();
