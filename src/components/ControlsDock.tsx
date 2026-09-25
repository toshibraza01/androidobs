import React from 'react';
import { Settings, Play, Square, Video, Layers, Download, Power, Radio } from 'lucide-react';
import { StreamState } from '../services/rtmpSimulator';

interface ControlsDockProps {
  streamState: StreamState;
  isRecording: boolean;
  isVirtualCam: boolean;
  isStudioMode: boolean;
  onToggleStream: () => void;
  onToggleRecord: () => void;
  onToggleVirtualCam: () => void;
  onToggleStudioMode: () => void;
  onOpenSettings: () => void;
  onOpenBuildApk: () => void;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  streamState,
  isRecording,
  isVirtualCam,
  isStudioMode,
  onToggleStream,
  onToggleRecord,
  onToggleVirtualCam,
  onToggleStudioMode,
  onOpenSettings,
  onOpenBuildApk
}) => {
  const isLive = streamState === 'live';
  const isHandshaking = streamState === 'handshaking';

  return (
    <div className="w-44 bg-[#181921] border border-[#2b2d3a] rounded flex flex-col overflow-hidden shrink-0 font-sans select-none">
      {/* Header */}
      <div className="h-7 px-2.5 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
          Controls
        </span>
      </div>

      {/* Buttons Stack (Matches Reference 2 & 4 exactly) */}
      <div className="flex-1 p-2 flex flex-col gap-1.5 justify-between">
        {/* Stream Buttons: Start Streaming / Manage Broadcast */}
        <div className="flex gap-1">
          <button
            onClick={onToggleStream}
            className={`flex-1 h-7.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
              isLive
                ? 'bg-[#d32f2f] hover:bg-[#b71c1c] text-white animate-pulse'
                : isHandshaking
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200'
            }`}
          >
            {isLive ? (
              <>
                <Square className="w-3 h-3 fill-white" />
                <span>Stop Stream</span>
              </>
            ) : isHandshaking ? (
              <span>Connecting...</span>
            ) : (
              <>
                <Radio className="w-3 h-3 text-red-500" />
                <span>Start Stream</span>
              </>
            )}
          </button>
        </div>

        {/* Start / Stop Recording */}
        <button
          onClick={onToggleRecord}
          className={`w-full h-7.5 px-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            isRecording
              ? 'bg-[#d32f2f] hover:bg-[#b71c1c] text-white animate-pulse'
              : 'bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3 h-3 fill-white" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Start Recording</span>
            </>
          )}
        </button>

        {/* Start Virtual Camera */}
        <div className="flex gap-1">
          <button
            onClick={onToggleVirtualCam}
            className={`flex-1 h-7.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              isVirtualCam
                ? 'bg-[#2b66ff] text-white'
                : 'bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200'
            }`}
          >
            <Video className="w-3 h-3" />
            <span className="truncate">
              {isVirtualCam ? 'Stop Virtual Cam' : 'Start Virtual Cam'}
            </span>
          </button>
        </div>

        {/* Studio Mode Toggle */}
        <button
          onClick={onToggleStudioMode}
          className={`w-full h-7.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            isStudioMode
              ? 'bg-[#2b66ff] text-white font-semibold'
              : 'bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Studio Mode</span>
        </button>

        {/* Settings Dialog */}
        <button
          onClick={onOpenSettings}
          className="w-full h-7.5 px-2 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Settings className="w-3 h-3 text-neutral-400" />
          <span>Settings</span>
        </button>

        {/* Build & Export APK */}
        <button
          onClick={onOpenBuildApk}
          className="w-full h-7.5 px-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-300 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-3 h-3" />
          <span>Build APK</span>
        </button>
      </div>
    </div>
  );
};
