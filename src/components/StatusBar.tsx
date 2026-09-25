import React, { useState, useEffect } from 'react';
import { Circle, Radio, Activity, Cpu } from 'lucide-react';
import { StreamState } from '../services/rtmpSimulator';

interface StatusBarProps {
  streamState: StreamState;
  isRecording: boolean;
  liveDuration: string;
  fps?: number;
  bitrateKbps?: number;
  scaleMode?: string;
  onScaleModeChange?: (mode: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  streamState,
  isRecording,
  liveDuration,
  fps = 60,
  bitrateKbps = 6230,
  scaleMode = 'Scale to Window',
  onScaleModeChange
}) => {
  const isLive = streamState === 'live';
  const [cpuUsage, setCpuUsage] = useState(1.5);
  const [currentFps, setCurrentFps] = useState(fps);
  const [currentBitrate, setCurrentBitrate] = useState(bitrateKbps);

  // Subtle natural jitter for authentic OBS stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Number((1.2 + Math.random() * 0.8).toFixed(1)));
      setCurrentFps(fps === 60 ? Number((59.8 + Math.random() * 0.4).toFixed(2)) : 30.0);
      if (isLive) {
        setCurrentBitrate(Math.round(bitrateKbps + (Math.random() * 200 - 100)));
      } else {
        setCurrentBitrate(0);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [fps, bitrateKbps, isLive]);

  return (
    <div className="h-6 bg-[#121319] border-t border-[#262834] px-3 flex items-center justify-between text-[11px] text-neutral-400 font-sans select-none shrink-0">
      {/* Left: Viewport Scale Dropdown */}
      <div className="flex items-center gap-3">
        <select
          value={scaleMode}
          onChange={(e) => onScaleModeChange?.(e.target.value)}
          className="bg-transparent border-0 text-neutral-400 hover:text-neutral-200 text-[11px] cursor-pointer focus:outline-hidden"
        >
          <option value="Scale to Window" className="bg-[#181921] text-neutral-300">
            68% Scale to Window
          </option>
          <option value="Fit to Window" className="bg-[#181921] text-neutral-300">
            Fit to Window
          </option>
          <option value="100% Original" className="bg-[#181921] text-neutral-300">
            100% Original (1920x1080)
          </option>
        </select>
      </div>

      {/* Right Stats (Matches Reference 2 & 4 exactly) */}
      <div className="flex items-center gap-4">
        {/* Dropped Frames */}
        <div className="flex items-center gap-1.5">
          <span>Dropped Frames:</span>
          <span className="text-neutral-200 font-mono">0 (0.0%)</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        {/* Live Timer */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isLive ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span className="font-mono text-neutral-300">
            LIVE: {isLive ? liveDuration : '00:00:00'}
          </span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        {/* Rec Timer */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          <span className="font-mono text-neutral-300">
            REC: {isRecording ? liveDuration : '00:00:00'}
          </span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        {/* CPU Usage */}
        <div className="flex items-center gap-1 font-mono">
          <span>CPU:</span>
          <span className="text-neutral-200">{cpuUsage}%</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        {/* FPS */}
        <div className="font-mono text-neutral-200">
          {currentFps} / {fps}.00 FPS
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        {/* Bitrate & Health Indicator */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-neutral-200">
            {isLive ? `kb/s: ${currentBitrate}` : 'kb/s: 0'}
          </span>
          <div
            title={isLive ? 'Stream Health: Excellent' : 'Offline'}
            className={`w-2.5 h-2.5 rounded-xs ${
              isLive ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
