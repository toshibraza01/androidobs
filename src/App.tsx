import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { AudioMixerDock } from './components/AudioMixerDock';
import { SceneList } from './components/SceneList';
import { RtmpTelemetryConsole } from './components/RtmpTelemetryConsole';
import { AndroidCodeExplorer } from './components/AndroidCodeExplorer';
import { MobileFrame } from './components/MobileFrame';
import { BuildApkModal } from './components/BuildApkModal';
import { SceneItem, SourceItem, SourceTransform, SourceType, StreamSettings } from './types/obs';
import { storageService } from './services/storage';
import { compositor } from './services/compositor';
import { audioMixer } from './services/audioMixer';
import { rtmpService, StreamState } from './services/rtmpSimulator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'mobile_rig' | 'rtmp_telemetry' | 'architecture'>('studio');
  const [scenes, setScenes] = useState<SceneItem[]>(() => storageService.loadScenes());
  const [activeSceneId, setActiveSceneId] = useState<string>(() => storageService.loadActiveSceneId());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [settings, setSettings] = useState<StreamSettings>(() => storageService.loadSettings());

  const [micVolume, setMicVolume] = useState(1.0);
  const [sysVolume, setSysVolume] = useState(0.8);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);

  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [liveDuration, setLiveDuration] = useState('00:00:00');
  const [isBuildApkOpen, setIsBuildApkOpen] = useState(false);

  // Sync scenes to storage
  useEffect(() => {
    storageService.saveScenes(scenes);
  }, [scenes]);

  useEffect(() => {
    storageService.saveActiveSceneId(activeSceneId);
  }, [activeSceneId]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  // Subscribe to RTMP state
  useEffect(() => {
    const unsub = rtmpService.subscribeState((st) => {
      setStreamState(st);
    });
    return unsub;
  }, []);

  // Live timer interval
  useEffect(() => {
    let timer: number;
    if (streamState === 'live') {
      timer = window.setInterval(() => {
        setLiveDuration(rtmpService.getLiveDuration());
      }, 1000);
    } else {
      setLiveDuration('00:00:00');
    }
    return () => clearInterval(timer);
  }, [streamState]);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  // Camera Toggle
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      compositor.stopCamera();
      setIsCameraActive(false);
    } else {
      const ok = await compositor.startCamera('user');
      setIsCameraActive(ok);
    }
  };

  // Screen Toggle (MediaProjection simulation)
  const handleToggleScreen = async () => {
    if (isScreenActive) {
      compositor.stopScreenCapture();
      setIsScreenActive(false);
    } else {
      const stream = await compositor.startScreenCapture();
      if (stream) {
        setIsScreenActive(true);
        audioMixer.attachSystemAudioStream(stream);
      }
    }
  };

  // Stream Toggle
  const handleToggleStream = async () => {
    audioMixer.resumeContext();
    if (streamState === 'live' || streamState === 'handshaking') {
      rtmpService.stopStream();
    } else {
      await rtmpService.startStream(settings);
    }
  };

  // Record Toggle (MediaRecorder)
  const handleToggleRecord = () => {
    audioMixer.resumeContext();
    if (isRecording) {
      rtmpService.stopRecording();
      setIsRecording(false);
    } else {
      const ok = rtmpService.startRecording();
      if (ok) {
        setIsRecording(true);
      }
    }
  };

  // Scene Operations
  const handleSelectScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setSelectedSourceId(null);
  };

  const handleAddScene = () => {
    const newId = `scene-${Date.now()}`;
    const newScene: SceneItem = {
      id: newId,
      name: `Scene ${scenes.length + 1}`,
      sources: [
        {
          id: `source-cam-${Date.now()}`,
          name: 'Camera Feed',
          type: 'camera',
          visible: true,
          locked: false,
          transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 },
          properties: { facingMode: 'user' }
        }
      ]
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newId);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) return;
    const remaining = scenes.filter(s => s.id !== sceneId);
    setScenes(remaining);
    if (activeSceneId === sceneId) {
      setActiveSceneId(remaining[0].id);
    }
  };

  const handleAddSource = (type: SourceType) => {
    const newSourceId = `source-${Date.now()}`;
    let name = 'New Layer';
    let transform: SourceTransform = { x: 20, y: 20, width: 60, height: 60, rotation: 0, opacity: 1, zIndex: activeScene.sources.length + 1 };
    let properties: SourceItem['properties'] = {};

    if (type === 'camera') {
      name = 'PIP Camera';
      transform = { x: 65, y: 60, width: 30, height: 35, rotation: 0, opacity: 1, zIndex: activeScene.sources.length + 1 };
      properties = { facingMode: 'user', chromaKey: false };
    } else if (type === 'screen') {
      name = 'Screen Feed';
      transform = { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 };
    } else if (type === 'text') {
      name = 'Lower Third';
      transform = { x: 10, y: 80, width: 40, height: 8, rotation: 0, opacity: 1, zIndex: activeScene.sources.length + 1 };
      properties = { text: '🔴 STREAMING LIVE ON OBS MOBILE', textColor: '#ffffff', textBgColor: 'rgba(0,0,0,0.85)', fontSize: 22 };
    } else if (type === 'color_bars') {
      name = 'SMPTE Color Bars';
      transform = { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 };
    }

    const newSource: SourceItem = {
      id: newSourceId,
      name,
      type,
      visible: true,
      locked: false,
      transform,
      properties
    };

    const updated = scenes.map(s => {
      if (s.id === activeSceneId) {
        return { ...s, sources: [...s.sources, newSource] };
      }
      return s;
    });

    setScenes(updated);
    setSelectedSourceId(newSourceId);
  };

  const handleUpdateSourceTransform = (sourceId: string, transform: Partial<SourceTransform>) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      return {
        ...s,
        sources: s.sources.map(src => {
          if (src.id !== sourceId) return src;
          return { ...src, transform: { ...src.transform, ...transform } };
        })
      };
    }));
  };

  const handleUpdateSourceProperty = (sourceId: string, property: string, value: unknown) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      return {
        ...s,
        sources: s.sources.map(src => {
          if (src.id !== sourceId) return src;
          if (property === 'opacity') {
            return { ...src, transform: { ...src.transform, opacity: value as number } };
          }
          return { ...src, properties: { ...src.properties, [property]: value } };
        })
      };
    }));
  };

  const handleToggleSourceVisible = (sourceId: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      return {
        ...s,
        sources: s.sources.map(src => {
          if (src.id !== sourceId) return src;
          return { ...src, visible: !src.visible };
        })
      };
    }));
  };

  const handleToggleSourceLock = (sourceId: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      return {
        ...s,
        sources: s.sources.map(src => {
          if (src.id !== sourceId) return src;
          return { ...src, locked: !src.locked };
        })
      };
    }));
  };

  const handleMoveSourceOrder = (sourceId: string, direction: 'up' | 'down') => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      const sources = [...s.sources].sort((a, b) => a.transform.zIndex - b.transform.zIndex);
      const idx = sources.findIndex(src => src.id === sourceId);
      if (idx === -1) return s;
      if (direction === 'up' && idx < sources.length - 1) {
        const tempZ = sources[idx].transform.zIndex;
        sources[idx].transform.zIndex = sources[idx + 1].transform.zIndex;
        sources[idx + 1].transform.zIndex = tempZ;
      } else if (direction === 'down' && idx > 0) {
        const tempZ = sources[idx].transform.zIndex;
        sources[idx].transform.zIndex = sources[idx - 1].transform.zIndex;
        sources[idx - 1].transform.zIndex = tempZ;
      }
      return { ...s, sources };
    }));
  };

  const handleDeleteSource = (sourceId: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== activeSceneId) return s;
      return {
        ...s,
        sources: s.sources.filter(src => src.id !== sourceId)
      };
    }));
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        streamState={streamState}
        isRecording={isRecording}
        onToggleStream={handleToggleStream}
        onToggleRecord={handleToggleRecord}
        liveDuration={liveDuration}
        onOpenBuildApk={() => setIsBuildApkOpen(true)}
      />

      {/* Main Viewport Content Area */}
      <main className="flex-1 p-3 md:p-4 overflow-y-auto">
        {currentTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
            {/* Left Col (8 cols): Canvas Live Compositor + Audio Mixer */}
            <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-[520px]">
              <div className="flex-1 min-h-[340px]">
                <CanvasPreview
                  scene={activeScene}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={setSelectedSourceId}
                  onUpdateSourceTransform={handleUpdateSourceTransform}
                  isCameraActive={isCameraActive}
                  isScreenActive={isScreenActive}
                  onToggleCamera={handleToggleCamera}
                  onToggleScreen={handleToggleScreen}
                />
              </div>

              {/* Hardware Audio Mixer Dock */}
              <AudioMixerDock
                micVolume={micVolume}
                sysVolume={sysVolume}
                onMicVolumeChange={(vol) => {
                  setMicVolume(vol);
                  audioMixer.setMicVolume(vol);
                }}
                onSysVolumeChange={(vol) => {
                  setSysVolume(vol);
                  audioMixer.setSysVolume(vol);
                }}
              />
            </div>

            {/* Right Col (4 cols): Scenes & Sources Layer Manager */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <SceneList
                scenes={scenes}
                activeSceneId={activeSceneId}
                selectedSourceId={selectedSourceId}
                onSelectScene={handleSelectScene}
                onSelectSource={setSelectedSourceId}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
                onAddSource={handleAddSource}
                onToggleSourceVisible={handleToggleSourceVisible}
                onToggleSourceLock={handleToggleSourceLock}
                onMoveSourceOrder={handleMoveSourceOrder}
                onDeleteSource={handleDeleteSource}
                onUpdateSourceProperty={handleUpdateSourceProperty}
              />
            </div>
          </div>
        )}

        {currentTab === 'mobile_rig' && (
          <MobileFrame
            scene={activeScene}
            selectedSourceId={selectedSourceId}
            onSelectSource={setSelectedSourceId}
            onUpdateSourceTransform={handleUpdateSourceTransform}
            isCameraActive={isCameraActive}
            isScreenActive={isScreenActive}
            onToggleCamera={handleToggleCamera}
            onToggleScreen={handleToggleScreen}
            streamState={streamState}
            onToggleStream={handleToggleStream}
            micVolume={micVolume}
            sysVolume={sysVolume}
            onMicVolumeChange={(v) => {
              setMicVolume(v);
              audioMixer.setMicVolume(v);
            }}
            onSysVolumeChange={(v) => {
              setSysVolume(v);
              audioMixer.setSysVolume(v);
            }}
          />
        )}

        {currentTab === 'rtmp_telemetry' && (
          <RtmpTelemetryConsole
            settings={settings}
            onUpdateSettings={setSettings}
          />
        )}

        {currentTab === 'architecture' && (
          <AndroidCodeExplorer onOpenBuildApk={() => setIsBuildApkOpen(true)} />
        )}
      </main>

      {/* APK Build & Export Modal */}
      <BuildApkModal
        isOpen={isBuildApkOpen}
        onClose={() => setIsBuildApkOpen(false)}
      />
    </div>
  );
}
