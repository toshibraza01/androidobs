import { RtmpPacketLog, StreamSettings } from '../types/obs';
import { audioMixer } from './audioMixer';
import { compositor } from './compositor';

export type StreamState = 'idle' | 'handshaking' | 'live' | 'error';

export class RtmpStreamingService {
  private state: StreamState = 'idle';
  private packetLog: RtmpPacketLog[] = [];
  private packetCounter = 0;
  private timerId: number | null = null;
  private telemetryTimerId: number | null = null;
  private startTime = 0;

  // Real browser recording
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  // Telemetry metrics
  public currentBitrateKbps = 0;
  public currentFps = 60;
  public droppedFrames = 0;
  public totalBytesSent = 0;
  public rttMs = 18;

  private listeners: ((state: StreamState) => void)[] = [];
  private packetListeners: ((logs: RtmpPacketLog[]) => void)[] = [];

  public getState(): StreamState {
    return this.state;
  }

  public getPacketLogs(): RtmpPacketLog[] {
    return [...this.packetLog];
  }

  public subscribeState(listener: (state: StreamState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribePackets(listener: (logs: RtmpPacketLog[]) => void) {
    this.packetListeners.push(listener);
    return () => {
      this.packetListeners = this.packetListeners.filter(l => l !== listener);
    };
  }

  private notifyState() {
    this.listeners.forEach(l => l(this.state));
  }

  private notifyPackets() {
    this.packetListeners.forEach(l => l([...this.packetLog]));
  }

  public async startStream(settings: StreamSettings): Promise<boolean> {
    if (this.state === 'live' || this.state === 'handshaking') return true;

    this.state = 'handshaking';
    this.notifyState();
    this.packetLog = [];
    this.packetCounter = 0;
    this.totalBytesSent = 0;
    this.droppedFrames = 0;

    // Simulate C0+C1 -> S0+S1+S2 -> C2 Handshake latency (approx 350ms)
    await new Promise(r => setTimeout(r, 350));

    // AMF0 Connect Command packet log
    this.pushLog({
      id: ++this.packetCounter,
      timestampMs: 0,
      type: 'METADATA_AMF0',
      tagTypeHex: '0x12 (AMF0 Data)',
      sizeBytes: 312,
      ptsDts: 'DTS: 0 / PTS: 0',
      naluType: 'connect("app") + onMetaData'
    });

    this.startTime = Date.now();
    this.state = 'live';
    this.notifyState();

    // Start packet generation loop (every ~33ms for 30fps or 16ms for 60fps)
    let frameIndex = 0;
    const intervalMs = settings.fps === 60 ? 16 : 33;

    this.timerId = window.setInterval(() => {
      if (this.state !== 'live') return;
      frameIndex++;
      const nowMs = Date.now() - this.startTime;
      const isKeyframe = frameIndex % (settings.fps * 2) === 1; // Keyframe every 2 seconds (GOP 60 or 120)

      // 1. Video Packet (FLV Tag 0x09)
      const videoPayloadSize = isKeyframe ? 42000 + Math.floor(Math.random() * 5000) : 7500 + Math.floor(Math.random() * 2000);
      this.totalBytesSent += videoPayloadSize;

      this.pushLog({
        id: ++this.packetCounter,
        timestampMs: nowMs,
        type: isKeyframe ? 'VIDEO_KEYFRAME' : 'VIDEO_INTER',
        tagTypeHex: '0x09 (Video Tag)',
        sizeBytes: videoPayloadSize,
        ptsDts: `DTS: ${nowMs} / PTS: ${nowMs}`,
        naluType: isKeyframe ? '0x17 AVC (IDR Slice SPS/PPS)' : '0x27 AVC (Non-IDR Slice P-Frame)'
      });

      // 2. Audio Packet (FLV Tag 0x08)
      if (frameIndex % 2 === 0) {
        const audioPayloadSize = 384;
        this.totalBytesSent += audioPayloadSize;
        this.pushLog({
          id: ++this.packetCounter,
          timestampMs: nowMs,
          type: 'AUDIO_AAC',
          tagTypeHex: '0x08 (Audio Tag)',
          sizeBytes: audioPayloadSize,
          ptsDts: `DTS: ${nowMs} / PTS: ${nowMs}`,
          naluType: '0xAF 0x01 (AAC Raw 48kHz Stereo)'
        });
      }
    }, intervalMs);

    // Telemetry ticker (every 1 sec)
    this.telemetryTimerId = window.setInterval(() => {
      if (this.state !== 'live') return;
      const variance = (Math.random() - 0.5) * 300;
      this.currentBitrateKbps = Math.round(settings.videoBitrateKbps + settings.audioBitrateKbps + variance);
      this.currentFps = +(settings.fps - (Math.random() * 0.4)).toFixed(1);
      this.rttMs = Math.round(18 + Math.random() * 8);

      if (Math.random() < 0.05) {
        this.droppedFrames += 1;
      }
    }, 1000);

    return true;
  }

  private pushLog(log: RtmpPacketLog) {
    this.packetLog.unshift(log);
    if (this.packetLog.length > 40) {
      this.packetLog.pop();
    }
    this.notifyPackets();
  }

  public stopStream() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.telemetryTimerId) {
      clearInterval(this.telemetryTimerId);
      this.telemetryTimerId = null;
    }
    this.state = 'idle';
    this.currentBitrateKbps = 0;
    this.notifyState();
  }

  // Real Browser Recording of live composite output
  public startRecording(): boolean {
    const canvasStream = compositor.getCanvasStream();
    if (!canvasStream) return false;

    // Combine canvas video track with audioMixer output audio track
    const mixedAudioTrack = audioMixer.getDestinationTrack();
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (mixedAudioTrack) {
      tracks.push(mixedAudioTrack);
    }
    const recordStream = new MediaStream(tracks);

    this.recordedChunks = [];
    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    let supportedMime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        supportedMime = m;
        break;
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(recordStream, supportedMime ? { mimeType: supportedMime } : undefined);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        this.saveRecordingFile();
      };
      this.mediaRecorder.start(1000); // 1s timeslices
      this.isRecording = true;
      return true;
    } catch (err) {
      console.warn('Recording start error:', err);
      return false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private saveRecordingFile() {
    if (this.recordedChunks.length === 0) return;
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OBS_Mobile_Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  public getLiveDuration(): string {
    if (this.state !== 'live' || this.startTime === 0) return '00:00:00';
    const totalSecs = Math.floor((Date.now() - this.startTime) / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join(':');
  }
}

export const rtmpService = new RtmpStreamingService();
