import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { AudioMixerDock } from './components/AudioMixerDock';
import { SceneList } from './components/SceneList';
import { ControlsDock } from './components/ControlsDock';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { SourcePropertiesModal } from './components/SourcePropertiesModal';
import { StreamChatDock } from './components/StreamChatDock';
import { ContextMenu } from './components/ContextMenu';
import { StudioModeControls } from './components/StudioModeControls';
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

  // Audio Volumes
  const [micVolume, setMicVolume] = useState(1.0);
  const [sysVolume, setSysVolume] = useState(0.8);

  // Hardware devices
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [isVirtualCam, setIsVirtualCam] = useState(false);

  // Stream & Recording state
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [liveDuration, setLiveDuration] = useState('00:00:00');

  // OBS Workstation Modes & Docks
  const [isStudioMode, setIsStudioMode] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [transitionType, setTransitionType] = useState('Fade');
  const [transitionDuration, setTransitionDuration] = useState(300);
  const [tbarPosition, setTbarPosition] = useState(0);

  // Modals & Context Menus (Matching Reference Images 1, 3, 5)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [propertiesSource, setPropertiesSource] = useState<SourceItem | null>(null);
  const [isBuildApkOpen, setIsBuildApkOpen] = useState(false);

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; sourceId: string | null } | null>(null);

  // Sync scenes to local storage
  useEffect(() => {
    storageService.saveScenes(scenes);
  }, [scenes]);

  useEffect(() => {
    storageService.saveActiveSceneId(activeSceneId);
  }, [activeSceneId]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  // Subscribe to RTMP simulator state
  useEffect(() => {
    const unsub = rtmpService.subscribeState((st) => {
      setStreamState(st);
    });
    return unsub;
  }, []);

  // Live broadcast duration timer
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
  const selectedSource = activeScene.sources.find(s => s.id === selectedSourceId) || null;

  // Toggle Camera
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      compositor.stopCamera();
      setIsCameraActive(false);
    } else {
      const ok = await compositor.startCamera('user');
      setIsCameraActive(ok);
    }
  };

  // Toggle Screen Capture
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

  // Toggle Stream
  const handleToggleStream = async () => {
    audioMixer.resumeContext();
    if (streamState === 'live' || streamState === 'handshaking') {
      rtmpService.stopStream();
    } else {
      await rtmpService.startStream(settings);
    }
  };

  // Toggle Recording
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

  // Virtual Camera Toggle
  const handleToggleVirtualCam = () => {
    setIsVirtualCam(!isVirtualCam);
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

  const handleDuplicateScene = (sceneId: string) => {
    const sourceScene = scenes.find(s => s.id === sceneId);
    if (!sourceScene) return;
    const newId = `scene-${Date.now()}`;
    const duplicated: SceneItem = {
      id: newId,
      name: `${sourceScene.name} (Copy)`,
      sources: sourceScene.sources.map(s => ({
        ...s,
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        transform: { ...s.transform }
      }))
    };
    setScenes([...scenes, duplicated]);
    setActiveSceneId(newId);
  };

  // Source Operations
  const handleAddSource = (type: SourceType) => {
    const newSourceId = `source-${Date.now()}`;
    let name = 'New Layer';
    let transform: SourceTransform = {
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      zIndex: activeScene.sources.length + 1
    };
    let properties: SourceItem['properties'] = {};

    if (type === 'camera') {
      name = 'Video Capture (Camera)';
      transform = { x: 62, y: 55, width: 35, height: 40, rotation: 0, opacity: 1, zIndex: activeScene.sources.length + 1 };
      properties = { facingMode: 'user', chromaKey: false };
    } else if (type === 'screen') {
      name = 'Display Capture';
      transform = { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 };
    } else if (type === 'demo_game') {
      name = 'Media Source';
      transform = { x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1 };
    } else if (type === 'text') {
      name = 'Title (Lower Third)';
      transform = { x: 5, y: 82, width: 45, height: 10, rotation: 0, opacity: 1, zIndex: activeScene.sources.length + 1 };
      properties = { text: 'OBS MOBILE LIVE STREAM', textColor: '#ffffff', textBgColor: '#e11d48' };
    } else if (type === 'image') {
      name = 'Watermark';
      transform = { x: 5, y: 5, width: 18, height: 12, rotation: 0, opacity: 0.9, zIndex: activeScene.sources.length + 1 };
    } else if (type === 'color_bars') {
      name = 'Color Source (SMPTE)';
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

    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return { ...sc, sources: [...sc.sources, newSource] };
      }
      return sc;
    });

    setScenes(updatedScenes);
    setSelectedSourceId(newSourceId);
  };

  const handleDeleteSource = (sourceId: string) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return { ...sc, sources: sc.sources.filter(s => s.id !== sourceId) };
      }
      return sc;
    });
    setScenes(updatedScenes);
    if (selectedSourceId === sourceId) {
      setSelectedSourceId(null);
    }
  };

  const handleDuplicateSource = (sourceId: string) => {
    const src = activeScene.sources.find(s => s.id === sourceId);
    if (!src) return;
    const newSource: SourceItem = {
      ...src,
      id: `source-${Date.now()}`,
      name: `${src.name} (Copy)`,
      transform: { ...src.transform, x: src.transform.x + 4, y: src.transform.y + 4, zIndex: src.transform.zIndex + 1 }
    };
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return { ...sc, sources: [...sc.sources, newSource] };
      }
      return sc;
    });
    setScenes(updatedScenes);
    setSelectedSourceId(newSource.id);
  };

  const handleToggleSourceVisible = (sourceId: string) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return {
          ...sc,
          sources: sc.sources.map(s => s.id === sourceId ? { ...s, visible: !s.visible } : s)
        };
      }
      return sc;
    });
    setScenes(updatedScenes);
  };

  const handleToggleSourceLocked = (sourceId: string) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return {
          ...sc,
          sources: sc.sources.map(s => s.id === sourceId ? { ...s, locked: !s.locked } : s)
        };
      }
      return sc;
    });
    setScenes(updatedScenes);
  };

  const handleUpdateSourceTransform = (sourceId: string, transform: Partial<SourceTransform>) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return {
          ...sc,
          sources: sc.sources.map(s => {
            if (s.id === sourceId) {
              return { ...s, transform: { ...s.transform, ...transform } };
            }
            return s;
          })
        };
      }
      return sc;
    });
    setScenes(updatedScenes);
  };

  const handleReorderSource = (sourceId: string, direction: 'up' | 'down') => {
    const src = activeScene.sources.find(s => s.id === sourceId);
    if (!src) return;
    const delta = direction === 'up' ? 1 : -1;
    handleUpdateSourceTransform(sourceId, { zIndex: Math.max(0, src.transform.zIndex + delta) });
  };

  const handleUpdateSourceProperties = (sourceId: string, properties: Partial<SourceItem['properties']>) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return {
          ...sc,
          sources: sc.sources.map(s => {
            if (s.id === sourceId) {
              return { ...s, properties: { ...s.properties, ...properties } };
            }
            return s;
          })
        };
      }
      return sc;
    });
    setScenes(updatedScenes);
  };

  const handleUpdateSourceName = (sourceId: string, name: string) => {
    const updatedScenes = scenes.map(sc => {
      if (sc.id === activeSceneId) {
        return {
          ...sc,
          sources: sc.sources.map(s => (s.id === sourceId ? { ...s, name } : s))
        };
      }
      return sc;
    });
    setScenes(updatedScenes);
  };

  // Open Properties Modal for source
  const handleOpenSourceProperties = (source: SourceItem) => {
    setPropertiesSource(source);
    setIsPropertiesOpen(true);
  };

  // Open Context Menu on right click
  const handleOpenContextMenu = (e: React.MouseEvent, sourceId: string | null) => {
    e.preventDefault();
    setContextMenuPos({
      x: Math.min(window.innerWidth - 240, e.clientX),
      y: Math.min(window.innerHeight - 300, e.clientY),
      sourceId
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#14151b] text-neutral-100 overflow-hidden font-sans select-none">
      {/* 1. Authentic OBS Window Title Bar & Menu Bar (Reference 2 & 4) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        streamState={streamState}
        isRecording={isRecording}
        onToggleStream={handleToggleStream}
        onToggleRecord={handleToggleRecord}
        liveDuration={liveDuration}
        onOpenBuildApk={() => setIsBuildApkOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        isStudioMode={isStudioMode}
        onToggleStudioMode={() => setIsStudioMode(!isStudioMode)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dockable Stream Chat (Matches Reference 4) */}
        {currentTab === 'studio' && showChat && (
          <StreamChatDock isOpen={showChat} onClose={() => setShowChat(false)} />
        )}

        {/* Studio Director Mode (Matches Reference 2 & 4) */}
        {currentTab === 'studio' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181921]">
            {/* TOP HALF: Interactive Canvas Viewport (or Dual Monitor if in Studio Mode) */}
            <div className="flex-1 flex overflow-hidden border-b border-[#2b2d3a]">
              {/* Left Monitor: PREVIEW (Editable) */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <CanvasPreview
                  scene={activeScene}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={setSelectedSourceId}
                  onUpdateSourceTransform={handleUpdateSourceTransform}
                  isCameraActive={isCameraActive}
                  isScreenActive={isScreenActive}
                  onToggleCamera={handleToggleCamera}
                  onToggleScreen={handleToggleScreen}
                  onOpenProperties={() => {
                    if (selectedSource) handleOpenSourceProperties(selectedSource);
                  }}
                  onContextMenu={handleOpenContextMenu}
                  isProgram={false}
                />
              </div>

              {/* Studio Mode Center Transition Bar (when Studio Mode enabled) */}
              {isStudioMode && (
                <StudioModeControls
                  onTransition={() => {
                    // Flash transition
                  }}
                  onCut={() => {
                    // Quick cut
                  }}
                  transitionType={transitionType}
                  durationMs={transitionDuration}
                  faderPosition={tbarPosition}
                  onFaderChange={setTbarPosition}
                />
              )}

              {/* Right Monitor: PROGRAM (Clean Live Output) */}
              {isStudioMode && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <CanvasPreview
                    scene={activeScene}
                    selectedSourceId={null}
                    onSelectSource={() => {}}
                    onUpdateSourceTransform={() => {}}
                    isCameraActive={isCameraActive}
                    isScreenActive={isScreenActive}
                    onToggleCamera={() => {}}
                    onToggleScreen={() => {}}
                    onOpenProperties={() => {}}
                    onContextMenu={() => {}}
                    isProgram={true}
                  />
                </div>
              )}
            </div>

            {/* BOTTOM HALF: The 5 Iconic OBS Dock Panels (Matches Reference 2) */}
            <div className="h-56 bg-[#16171f] p-2 flex gap-2 shrink-0 overflow-x-auto">
              {/* 1. Scenes Dock + 2. Sources Dock + 3. Scene Transitions Dock */}
              <SceneList
                scenes={scenes}
                activeSceneId={activeSceneId}
                selectedSourceId={selectedSourceId}
                onSelectScene={handleSelectScene}
                onSelectSource={setSelectedSourceId}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
                onAddSource={handleAddSource}
                onDeleteSource={handleDeleteSource}
                onToggleSourceVisible={handleToggleSourceVisible}
                onToggleSourceLocked={handleToggleSourceLocked}
                onReorderSource={handleReorderSource}
                onDuplicateScene={handleDuplicateScene}
                onOpenSourceProperties={handleOpenSourceProperties}
                transitionType={transitionType}
                onTransitionTypeChange={setTransitionType}
                transitionDuration={transitionDuration}
                onTransitionDurationChange={setTransitionDuration}
              />

              {/* 4. Audio Mixer Dock */}
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

              {/* 5. Controls Dock */}
              <ControlsDock
                streamState={streamState}
                isRecording={isRecording}
                isVirtualCam={isVirtualCam}
                isStudioMode={isStudioMode}
                onToggleStream={handleToggleStream}
                onToggleRecord={handleToggleRecord}
                onToggleVirtualCam={handleToggleVirtualCam}
                onToggleStudioMode={() => setIsStudioMode(!isStudioMode)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenBuildApk={() => setIsBuildApkOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Mobile Device Simulation Rig Tab */}
        {currentTab === 'mobile_rig' && (
          <div className="flex-1 overflow-y-auto bg-[#181921] p-6 flex justify-center items-center">
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
          </div>
        )}

        {/* RTMP Telemetry Console Tab */}
        {currentTab === 'rtmp_telemetry' && (
          <div className="flex-1 overflow-y-auto bg-[#181921]">
            <RtmpTelemetryConsole
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </div>
        )}

        {/* Android NDK Core Architecture Tab */}
        {currentTab === 'architecture' && (
          <div className="flex-1 overflow-y-auto bg-[#181921]">
            <AndroidCodeExplorer onOpenBuildApk={() => setIsBuildApkOpen(true)} />
          </div>
        )}
      </div>

      {/* Bottom Status Bar (Matches Reference 2 & 4) */}
      <StatusBar
        streamState={streamState}
        isRecording={isRecording}
        liveDuration={liveDuration}
        fps={settings.fps}
        bitrateKbps={settings.videoBitrateKbps}
      />

      {/* Settings Modal (Matches Reference 1) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* Source Properties Modal (Matches Reference 3) */}
      <SourcePropertiesModal
        isOpen={isPropertiesOpen}
        onClose={() => {
          setIsPropertiesOpen(false);
          setPropertiesSource(null);
        }}
        source={propertiesSource || selectedSource}
        onUpdateSourceProperties={handleUpdateSourceProperties}
        onUpdateSourceName={handleUpdateSourceName}
      />

      {/* Right-Click Context Menu (Matches Reference 5) */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setContextMenuPos(null)}
          source={activeScene.sources.find(s => s.id === contextMenuPos.sourceId) || selectedSource}
          onUpdateTransform={(t) => {
            const sid = contextMenuPos.sourceId || selectedSourceId;
            if (sid) handleUpdateSourceTransform(sid, t);
          }}
          onOpenProperties={() => {
            const s = activeScene.sources.find(s => s.id === contextMenuPos.sourceId) || selectedSource;
            if (s) handleOpenSourceProperties(s);
          }}
          onRemoveSource={() => {
            const sid = contextMenuPos.sourceId || selectedSourceId;
            if (sid) handleDeleteSource(sid);
          }}
          onDuplicateSource={() => {
            const sid = contextMenuPos.sourceId || selectedSourceId;
            if (sid) handleDuplicateSource(sid);
          }}
        />
      )}

      {/* APK Build Modal */}
      <BuildApkModal
        isOpen={isBuildApkOpen}
        onClose={() => setIsBuildApkOpen(false)}
      />
    </div>
  );
}
