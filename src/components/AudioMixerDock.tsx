import React, { useState, useEffect } from 'react';
import { Mic, Volume2, VolumeX, Headphones, Sliders, ShieldCheck } from 'lucide-react';
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
  const [monitoring, setMonitoring] = useState(false);
  const [micActive, setMicActive] = useState(false);

  // Peak levels (0 to 1)
  const [levels, setLevels] = useState({ micPeak: 0, sysPeak: 0, masterPeak: 0 });

  // Real-time animation loop for VU meters
  useEffect(() => {
    let animId: number;
    const poll = () => {
      setLevels(audioMixer.getLevels());
      animId = requestAnimationFrame(poll);
    };
    animId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleToggleMicMute = () => {
    const isMuted = audioMixer.toggleMicMute();
    setMicMuted(isMuted);
  };

  const handleToggleSysMute = () => {
    const isMuted = audioMixer.toggleSysMute();
    setSysMuted(isMuted);
  };

  const handleToggleMonitoring = () => {
    const isMon = audioMixer.toggleMonitoring();
    setMonitoring(isMon);
  };

  const handleStartMic = async () => {
    const ok = await audioMixer.startMicrophone();
    setMicActive(ok);
  };

  // Convert normalized peak 0..1 to dB segments for VU meter
  const renderVuMeter = (peak: number, isMuted: boolean) => {
    const numBars = 24;
    const activeCount = isMuted ? 0 : Math.round(peak * numBars);

    return (
      <div className="flex items-center gap-[2px] h-3 w-full bg-neutral-950 p-[2px] rounded border border-neutral-800">
        {Array.from({ length: numBars }).map((_, i) => {
          const isActive = i < activeCount;
          // Green: 0..16, Yellow: 17..20, Red: 21..23
          let colorClass = 'bg-neutral-800';
          if (isActive) {
            if (i >= 21) colorClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
            else if (i >= 17) colorClass = 'bg-amber-400';
            else colorClass = 'bg-emerald-500';
          }
          return <div key={i} className={`flex-1 h-full rounded-[1px] transition-all duration-75 ${colorClass}`} />;
        })}
      </div>
    );
  };

  return (
    <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-4 flex flex-col gap-4">
      {/* Dock Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-bold tracking-tight text-white">
            Dual Audio Capture & Hardware Encoder
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">48kHz · AAC-LC</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800/80 rounded border border-neutral-700/50 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Soft-Knee Limiter Active</span>
          </div>

          <button
            onClick={handleToggleMonitoring}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              monitoring
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-white bg-neutral-800'
            }`}
            title="Toggle Direct Monitor to Headphones"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">{monitoring ? 'Monitor ON' : 'Monitor'}</span>
          </button>
        </div>
      </div>

      {/* Mixer Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channel 1: Microphone */}
        <div className="bg-neutral-950/60 rounded-lg p-3 border border-neutral-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${micActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                <Mic className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Microphone Ingestion</span>
                <span className="text-[10px] text-neutral-500">Android AudioRecord (MIC)</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!micActive && (
                <button
                  onClick={handleStartMic}
                  className="px-2 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-semibold transition-colors"
                >
                  Enable Mic
                </button>
              )}
              <button
                onClick={handleToggleMicMute}
                className={`p-1.5 rounded transition-colors ${
                  micMuted ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {micMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* VU Meter */}
          {renderVuMeter(levels.micPeak, micMuted)}

          {/* Fader & Gain readout */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={micVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onMicVolumeChange(val);
                audioMixer.setMicVolume(val);
              }}
              className="flex-1 accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs text-neutral-300 tabular-nums w-12 text-right">
              {Math.round(micVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Channel 2: Internal / System Audio */}
        <div className="bg-neutral-950/60 rounded-lg p-3 border border-neutral-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-sky-500/20 text-sky-400">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">System / Game Audio</span>
                <span className="text-[10px] text-neutral-500">AudioPlaybackCaptureConfig (API 29+)</span>
              </div>
            </div>

            <button
              onClick={handleToggleSysMute}
              className={`p-1.5 rounded transition-colors ${
                sysMuted ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={sysMuted ? 'Unmute System Audio' : 'Mute System Audio'}
            >
              {sysMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* VU Meter */}
          {renderVuMeter(levels.sysPeak, sysMuted)}

          {/* Fader & Gain readout */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={sysVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSysVolumeChange(val);
                audioMixer.setSysVolume(val);
              }}
              className="flex-1 accent-sky-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs text-neutral-300 tabular-nums w-12 text-right">
              {Math.round(sysVolume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
