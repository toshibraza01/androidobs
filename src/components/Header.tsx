import React from 'react';
import { Radio, Video, Play, Square, Circle, Package } from 'lucide-react';
import { StreamState } from '../services/rtmpSimulator';

interface HeaderProps {
  currentTab: 'studio' | 'mobile_rig' | 'rtmp_telemetry' | 'architecture';
  onSelectTab: (tab: 'studio' | 'mobile_rig' | 'rtmp_telemetry' | 'architecture') => void;
  streamState: StreamState;
  isRecording: boolean;
  onToggleStream: () => void;
  onToggleRecord: () => void;
  liveDuration: string;
  onOpenBuildApk: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  streamState,
  isRecording,
  onToggleStream,
  onToggleRecord,
  liveDuration,
  onOpenBuildApk
}) => {
  const isLive = streamState === 'live';
  const isHandshaking = streamState === 'handshaking';

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Single text element brand wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center shadow-md shadow-rose-950/40">
          <Radio className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">
          OBS Mobile
        </span>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800/80">
        <button
          onClick={() => onSelectTab('studio')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentTab === 'studio'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Studio Director
        </button>
        <button
          onClick={() => onSelectTab('mobile_rig')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentTab === 'mobile_rig'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Mobile Rig Simulator
        </button>
        <button
          onClick={() => onSelectTab('rtmp_telemetry')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentTab === 'rtmp_telemetry'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          RTMP / FLV Packetizer
        </button>
        <button
          onClick={() => onSelectTab('architecture')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentTab === 'architecture'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Android & NDK Source
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Live Indicator */}
        {isLive && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-md text-rose-400 font-mono text-xs tabular-nums">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold">LIVE</span>
            <span className="text-rose-300">{liveDuration}</span>
          </div>
        )}

        {isHandshaking && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>RTMP HANDSHAKE...</span>
          </div>
        )}

        {/* Build APK Button */}
        <button
          onClick={onOpenBuildApk}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200 transition-all shadow-sm"
          title="Build & Export Android APK / Project"
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span>Build APK</span>
        </button>

        {/* Record Button */}
        <button
          onClick={onToggleRecord}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
            isRecording
              ? 'bg-red-950/80 border-red-600 text-red-300 hover:bg-red-900'
              : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white'
          }`}
          title={isRecording ? 'Stop Recording and Save Video' : 'Record Composited Stream to Disk'}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span>Stop REC</span>
            </>
          ) : (
            <>
              <Circle className="w-3.5 h-3.5 text-rose-500 fill-current" />
              <span>Record</span>
            </>
          )}
        </button>

        {/* Go Live / End Stream Button */}
        <button
          onClick={onToggleStream}
          disabled={isHandshaking}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            isLive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
          }`}
        >
          {isLive ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>END STREAM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>GO LIVE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
