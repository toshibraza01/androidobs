export type SourceType = 'camera' | 'screen' | 'demo_game' | 'text' | 'image' | 'color_bars';

export interface SourceTransform {
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  width: number; // Percentage 0 - 100
  height: number; // Percentage 0 - 100
  rotation: number; // Degrees
  opacity: number; // 0 - 1
  zIndex: number;
}

export interface SourceItem {
  id: string;
  name: string;
  type: SourceType;
  visible: boolean;
  locked: boolean;
  transform: SourceTransform;
  properties: {
    facingMode?: 'user' | 'environment';
    chromaKey?: boolean;
    chromaColor?: string;
    chromaSimilarity?: number;
    text?: string;
    textColor?: string;
    textBgColor?: string;
    fontSize?: number;
    imageUrl?: string;
  };
}

export interface SceneItem {
  id: string;
  name: string;
  sources: SourceItem[];
}

export interface AudioChannelState {
  id: string;
  name: string;
  volume: number; // 0.0 to 1.5
  muted: boolean;
  peakLeft: number; // 0.0 to 1.0
  peakRight: number; // 0.0 to 1.0
  noiseGate: boolean;
}

export interface StreamSettings {
  service: 'Twitch' | 'YouTube' | 'Kick' | 'Custom';
  rtmpUrl: string;
  streamKey: string;
  resolution: '1080p' | '720p' | 'vertical_1080p';
  fps: 30 | 60;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
}

export interface RtmpPacketLog {
  id: number;
  timestampMs: number;
  type: 'VIDEO_KEYFRAME' | 'VIDEO_INTER' | 'AUDIO_AAC' | 'METADATA_AMF0';
  tagTypeHex: string;
  sizeBytes: number;
  ptsDts: string;
  naluType?: string;
}

export interface AndroidCodeFile {
  filename: string;
  path: string;
  language: 'kotlin' | 'cpp' | 'cmake';
  description: string;
  code: string;
}
