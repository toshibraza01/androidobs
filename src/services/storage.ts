import { SceneItem, StreamSettings } from '../types/obs';

const STORAGE_KEY_SCENES = 'obs_mobile_scenes_v1';
const STORAGE_KEY_ACTIVE_SCENE = 'obs_mobile_active_scene_v1';
const STORAGE_KEY_SETTINGS = 'obs_mobile_settings_v1';

export const DEFAULT_SETTINGS: StreamSettings = {
  service: 'Twitch',
  rtmpUrl: 'rtmp://live.twitch.tv/app',
  streamKey: 'live_user_streamkey_abc123',
  resolution: '1080p',
  fps: 60,
  videoBitrateKbps: 4500,
  audioBitrateKbps: 160,
};

export const DEFAULT_SCENES: SceneItem[] = [
  {
    id: 'scene-game-pip',
    name: 'Gameplay + Facecam',
    sources: [
      {
        id: 'source-screen',
        name: 'Screen / Game Source',
        type: 'screen',
        visible: true,
        locked: true,
        transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 },
        properties: {}
      },
      {
        id: 'source-camera-pip',
        name: 'PIP Camera',
        type: 'camera',
        visible: true,
        locked: false,
        transform: { x: 68, y: 60, width: 28, height: 32, rotation: 0, opacity: 1, zIndex: 2 },
        properties: {
          facingMode: 'user',
          chromaKey: false,
          chromaColor: '#00ff00',
          chromaSimilarity: 90
        }
      },
      {
        id: 'source-text-title',
        name: 'Stream Watermark',
        type: 'text',
        visible: true,
        locked: false,
        transform: { x: 3, y: 4, width: 25, height: 6, rotation: 0, opacity: 0.95, zIndex: 3 },
        properties: {
          text: '🔴 OBS MOBILE · 1080p60',
          textColor: '#ffffff',
          textBgColor: 'rgba(15, 23, 42, 0.85)',
          fontSize: 20
        }
      }
    ]
  },
  {
    id: 'scene-fullscreen-cam',
    name: 'Fullscreen Camera',
    sources: [
      {
        id: 'source-full-cam',
        name: 'Main Camera (1080p)',
        type: 'camera',
        visible: true,
        locked: true,
        transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 },
        properties: {
          facingMode: 'user'
        }
      },
      {
        id: 'source-lower-third',
        name: 'Lower Third Banner',
        type: 'text',
        visible: true,
        locked: false,
        transform: { x: 5, y: 84, width: 45, height: 9, rotation: 0, opacity: 1, zIndex: 2 },
        properties: {
          text: 'TALKING TECH & NATIVE ANDROID // JUST CHATTING',
          textColor: '#38bdf8',
          textBgColor: 'rgba(3, 7, 18, 0.9)',
          fontSize: 22
        }
      }
    ]
  },
  {
    id: 'scene-screen-only',
    name: 'Screen Share Only',
    sources: [
      {
        id: 'source-clean-screen',
        name: 'Clean Screen Capture',
        type: 'screen',
        visible: true,
        locked: true,
        transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 },
        properties: {}
      }
    ]
  },
  {
    id: 'scene-brb',
    name: 'Be Right Back (BRB)',
    sources: [
      {
        id: 'source-color-bars',
        name: 'SMPTE Test Pattern',
        type: 'color_bars',
        visible: true,
        locked: true,
        transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 },
        properties: {}
      },
      {
        id: 'source-brb-text',
        name: 'Intermission Slate',
        type: 'text',
        visible: true,
        locked: false,
        transform: { x: 30, y: 44, width: 40, height: 12, rotation: 0, opacity: 1, zIndex: 2 },
        properties: {
          text: '☕ BE RIGHT BACK · RESUMING SHORTLY',
          textColor: '#ffffff',
          textBgColor: 'rgba(0, 0, 0, 0.92)',
          fontSize: 26
        }
      }
    ]
  }
];

export const storageService = {
  loadScenes(): SceneItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SCENES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load scenes from storage', e);
    }
    return DEFAULT_SCENES;
  },

  saveScenes(scenes: SceneItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY_SCENES, JSON.stringify(scenes));
    } catch (e) {
      console.warn('Failed to save scenes to storage', e);
    }
  },

  loadActiveSceneId(): string {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_SCENE) || DEFAULT_SCENES[0].id;
  },

  saveActiveSceneId(id: string) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SCENE, id);
  },

  loadSettings(): StreamSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load stream settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: StreamSettings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save stream settings', e);
    }
  }
};
