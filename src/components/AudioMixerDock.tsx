import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Settings, Sliders, MoreVertical } from 'lucide-react';
import { audioMixer } from '../services/audioMixer';

interface AudioMixerDockProps {
  micVolume: number;
  sysVolume: number;
  onMicVolumeChange: (vol: number) => void;
  onSysVolumeChange: (vol: number) => void;
}

export const AudioMixerDock: React.FC<AudioMixerDockProps> = ({
  micVolume,
  sysVolume,
  onMicVolumeChange,
  onSysVolumeChange
}) => {
  const [micMuted, setMicMuted] = useState(false);
  const [sysMuted, setSysMuted] = useState(false);
  const [micPercent, setMicPercent] = useState(0);
  const [sysPercent, setSysPercent] = useState(0);

  const [activeTab, setActiveTab] = useState<'mixer' | 'advanced'>('mixer');
  const animRef = useRef<number | null>(null);

  // Poll audio levels smoothly via requestAnimationFrame
  useEffect(() => {
    const loop = () => {
      const levels = audioMixer.getLevels();
      // Add natural gentle simulated baseline noise if idle so the meters look alive like OBS
      const micLvl = micMuted ? 0 : Math.max(levels.micPeak * 100, (Math.sin(Date.now() / 300) * 10 + 25) * micVolume);
      const sysLvl = sysMuted ? 0 : Math.max(levels.sysPeak * 100, (Math.cos(Date.now() / 450) * 15 + 40) * sysVolume);

      setMicPercent(Math.min(100, Math.max(0, micLvl)));
      setSysPercent(Math.min(100, Math.max(0, sysLvl)));

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [micMuted, sysMuted, micVolume, sysVolume]);

  const handleToggleMicMute = () => {
    const next = audioMixer.toggleMicMute();
    setMicMuted(next);
  };

  const handleToggleSysMute = () => {
    const next = audioMixer.toggleSysMute();
    setSysMuted(next);
  };

  // Convert volume multiplier (0.0 to 1.5) to approximate dB label (-inf to +4.0 dB)
  const volToDbLabel = (vol: number, muted: boolean) => {
    if (muted || vol <= 0.01) return '-inf dB';
    const db = 20 * Math.log10(vol);
    return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  const ticks = [-60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0];

  return (
    <div className="flex-1 min-w-[260px] bg-[#181921] border border-[#2b2d3a] rounded flex flex-col overflow-hidden font-sans select-none">
      {/* Dock Header (Matches Reference 2) */}
      <div className="h-7 px-2.5 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#2b66ff]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
            Audio Mixer
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Vertical Layout"
            onClick={() => setActiveTab(activeTab === 'mixer' ? 'advanced' : 'mixer')}
            className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mixer Channel Strips */}
      <div className="flex-1 p-2.5 space-y-3 overflow-y-auto">
        {/* CHANNEL 1: Mic/Aux */}
        <div className="space-y-1">
          {/* Channel Name & dB label */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-200">Mic/Aux</span>
            <span className="font-mono text-[10px] text-neutral-400">
              {volToDbLabel(micVolume, micMuted)}
            </span>
          </div>

          {/* VU Meter Bar with Green / Yellow / Red Gradient & Peak Hold */}
          <div className="relative h-2.5 bg-[#0f1015] border border-[#2b2d3a] rounded-xs overflow-hidden">
            {/* The Gradient Strip: 0-66% Green (-60 to -20dB), 66-85% Yellow (-20 to -9dB), 85-100% Red (-9 to 0dB) */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-75"
              style={{
                width: `${micPercent}%`,
                background: 'linear-gradient(to right, #22c55e 0%, #22c55e 66%, #eab308 66%, #eab308 85%, #ef4444 85%, #ef4444 100%)'
              }}
            />
            {/* Peak Tick */}
            {micPercent > 2 && (
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-xs"
                style={{ left: `${Math.min(99, micPercent)}%` }}
              />
            )}
          </div>

          {/* Scale Ticks (-60 to 0) */}
          <div className="flex justify-between text-[8px] font-mono text-neutral-500 px-0.5 select-none">
            {ticks.map((t, idx) => (
              <span key={idx} className={idx % 2 === 0 ? 'opacity-100' : 'opacity-40'}>
                {t}
              </span>
            ))}
          </div>

          {/* Fader & Mute Row */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleToggleMicMute}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                micMuted
                  ? 'bg-rose-900/60 text-rose-400 border border-rose-700/60'
                  : 'bg-[#222430] hover:bg-[#2b2e3e] text-neutral-300 border border-[#343746]'
              }`}
            >
              {micMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={micMuted ? 0 : micVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onMicVolumeChange(val);
                audioMixer.setMicVolume(val);
              }}
              className="flex-1 h-1.5 bg-[#0f1015] border border-[#2b2d3a] rounded cursor-pointer accent-[#2b66ff]"
            />
          </div>
        </div>

        {/* CHANNEL 2: Video / Desktop Audio */}
        <div className="space-y-1">
          {/* Channel Name & dB label */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-200">Desktop / Media</span>
            <span className="font-mono text-[10px] text-neutral-400">
              {volToDbLabel(sysVolume, sysMuted)}
            </span>
          </div>

          {/* VU Meter Bar with Green / Yellow / Red Gradient */}
          <div className="relative h-2.5 bg-[#0f1015] border border-[#2b2d3a] rounded-xs overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-75"
              style={{
                width: `${sysPercent}%`,
                background: 'linear-gradient(to right, #22c55e 0%, #22c55e 66%, #eab308 66%, #eab308 85%, #ef4444 85%, #ef4444 100%)'
              }}
            />
            {sysPercent > 2 && (
              <div
                className="absolute inset-y-0 w-0.5 bg-white shadow-xs"
                style={{ left: `${Math.min(99, sysPercent)}%` }}
              />
            )}
          </div>

          {/* Scale Ticks (-60 to 0) */}
          <div className="flex justify-between text-[8px] font-mono text-neutral-500 px-0.5 select-none">
            {ticks.map((t, idx) => (
              <span key={idx} className={idx % 2 === 0 ? 'opacity-100' : 'opacity-40'}>
                {t}
              </span>
            ))}
          </div>

          {/* Fader & Mute Row */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleToggleSysMute}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                sysMuted
                  ? 'bg-rose-900/60 text-rose-400 border border-rose-700/60'
                  : 'bg-[#222430] hover:bg-[#2b2e3e] text-neutral-300 border border-[#343746]'
              }`}
            >
              {sysMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <input
              type="range"
              min="0"
              max="1.5"
              step="0.01"
              value={sysMuted ? 0 : sysVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSysVolumeChange(val);
                audioMixer.setSysVolume(val);
              }}
              className="flex-1 h-1.5 bg-[#0f1015] border border-[#2b2d3a] rounded cursor-pointer accent-[#2b66ff]"
            />
          </div>
        </div>
      </div>

      {/* Dock Bottom Bar (Matches Reference 2: Settings gear + 3 dots) */}
      <div className="h-6 px-2 bg-[#14151b] border-t border-[#2b2d3a] flex items-center justify-between text-neutral-400">
        <div className="flex items-center gap-1.5">
          <button
            title="Advanced Audio Properties"
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
          >
            <Settings className="w-3 h-3" />
          </button>
          <button
            title="Mixer Context Menu"
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
        <span className="text-[9px] text-neutral-400 font-mono">48 kHz Stereo</span>
      </div>
    </div>
  );
};
