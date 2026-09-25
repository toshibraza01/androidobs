import React, { useState } from 'react';
import { Smartphone, RotateCw, AudioLines, Layers, Wifi, Battery, Volume2, X } from 'lucide-react';
import { SceneItem, SourceTransform } from '../types/obs';
import { StreamState } from '../services/rtmpSimulator';
import { CanvasPreview } from './CanvasPreview';

interface MobileFrameProps {
  scene: SceneItem;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onUpdateSourceTransform: (sourceId: string, transform: Partial<SourceTransform>) => void;
  isCameraActive: boolean;
  isScreenActive: boolean;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  streamState: StreamState;
  onToggleStream: () => void;
  micVolume: number;
  sysVolume: number;
  onMicVolumeChange: (vol: number) => void;
  onSysVolumeChange: (vol: number) => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  scene,
  selectedSourceId,
  onSelectSource,
  onUpdateSourceTransform,
  isCameraActive,
  isScreenActive,
  onToggleCamera,
  onToggleScreen,
  streamState,
  onToggleStream,
  micVolume,
  sysVolume,
  onMicVolumeChange,
  onSysVolumeChange
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [showMixerSheet, setShowMixerSheet] = useState(false);

  const isLive = streamState === 'live';

  return (
    <div className="flex flex-col items-center justify-center h-full p-2 relative">
      {/* Frame Controls Header */}
      <div className="flex items-center gap-3 mb-3 bg-neutral-900/80 px-4 py-1.5 rounded-full border border-neutral-800">
        <Smartphone className="w-4 h-4 text-rose-400" />
        <span className="text-xs font-semibold text-white">Google Pixel 9 Pro Hardware Rig</span>
        <button
          onClick={() => setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
          className="ml-2 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
        >
          <RotateCw className="w-3 h-3" />
          <span>{orientation === 'portrait' ? 'Landscape (16:9)' : 'Portrait (9:16)'}</span>
        </button>
      </div>

      {/* Phone Shell */}
      <div
        className={`relative bg-[#0d0d0d] rounded-[44px] p-3.5 shadow-2xl border-[4px] border-neutral-700 transition-all duration-300 flex flex-col ${
          orientation === 'portrait'
            ? 'w-[360px] h-[720px]'
            : 'w-[780px] h-[440px]'
        }`}
      >
        {/* Dynamic Island / Camera punch hole */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-40 flex items-center justify-end pr-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800" />
        </div>

        {/* Screen Bezel Inside */}
        <div className="relative flex-1 bg-black rounded-[32px] overflow-hidden flex flex-col border border-neutral-900 select-none">
          {/* Status Bar */}
          <div className="h-7 px-6 bg-[#111111] flex items-center justify-between text-[11px] text-neutral-400 font-medium z-30">
            <span>9:41</span>
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3" />
              <span className="text-[10px]">5G</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Jetpack Compose TopAppBar */}
          <div className="h-12 px-4 bg-[#111111] border-b border-neutral-800 flex items-center justify-between z-20">
            <span className="text-sm font-bold text-white tracking-tight">OBS Mobile</span>
            {isLive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            )}
          </div>

          {/* Main SurfaceView Preview Canvas */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <CanvasPreview
              scene={scene}
              selectedSourceId={selectedSourceId}
              onSelectSource={onSelectSource}
              onUpdateSourceTransform={onUpdateSourceTransform}
              isCameraActive={isCameraActive}
              isScreenActive={isScreenActive}
              onToggleCamera={onToggleCamera}
              onToggleScreen={onToggleScreen}
            />
          </div>

          {/* Jetpack Compose BottomBar */}
          <div className="h-16 px-4 bg-[#141414] border-t border-neutral-800/80 flex items-center justify-between gap-3 z-20">
            <button
              onClick={() => setShowMixerSheet(true)}
              className="w-10 h-10 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors"
              title="Open Audio Mixer Sheet"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleStream}
              className={`flex-1 h-11 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md ${
                isLive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isLive ? 'END STREAM' : 'GO LIVE'}
            </button>

            <button
              onClick={() => onSelectSource(null)}
              className="w-10 h-10 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors"
              title="Scene Layers"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Jetpack Compose ModalBottomSheet: Audio Mixer */}
          {showMixerSheet && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end">
              <div className="bg-[#1e1e1e] rounded-t-3xl p-5 border-t border-neutral-700 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
                <div className="w-10 h-1.5 bg-neutral-600 rounded-full mx-auto" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Audio Mixer (Jetpack Compose)</span>
                  <button
                    onClick={() => setShowMixerSheet(false)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mic slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>Microphone Gain</span>
                    <span className="font-mono text-neutral-400">{Math.round(micVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={micVolume}
                    onChange={(e) => onMicVolumeChange(parseFloat(e.target.value))}
                    className="accent-rose-500 w-full h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Internal audio slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span>Internal Audio Gain</span>
                    <span className="font-mono text-neutral-400">{Math.round(sysVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={sysVolume}
                    onChange={(e) => onSysVolumeChange(parseFloat(e.target.value))}
                    className="accent-sky-500 w-full h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
