import React, { useState, useEffect } from 'react';
import { Network, Activity, Cpu, ArrowUpRight, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RtmpPacketLog, StreamSettings } from '../types/obs';
import { rtmpService } from '../services/rtmpSimulator';

interface RtmpTelemetryConsoleProps {
  settings: StreamSettings;
  onUpdateSettings: (settings: StreamSettings) => void;
}

export const RtmpTelemetryConsole: React.FC<RtmpTelemetryConsoleProps> = ({
  settings,
  onUpdateSettings
}) => {
  const [packetLogs, setPacketLogs] = useState<RtmpPacketLog[]>([]);
  const [telemetry, setTelemetry] = useState({
    bitrate: 0,
    fps: 60,
    dropped: 0,
    rtt: 18,
    bytes: 0
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [localSettings, setLocalSettings] = useState<StreamSettings>(settings);

  useEffect(() => {
    const unsubPackets = rtmpService.subscribePackets((logs) => {
      setPacketLogs(logs);
    });

    const interval = setInterval(() => {
      setTelemetry({
        bitrate: rtmpService.currentBitrateKbps,
        fps: rtmpService.currentFps,
        dropped: rtmpService.droppedFrames,
        rtt: rtmpService.rttMs,
        bytes: rtmpService.totalBytesSent
      });
    }, 500);

    return () => {
      unsubPackets();
      clearInterval(interval);
    };
  }, []);

  const isLive = rtmpService.getState() === 'live';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setShowSettingsModal(false);
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Telemetry Headline Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Bitrate */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Video + Audio Bitrate</span>
            <Network className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isLive ? telemetry.bitrate.toLocaleString() : '0'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">kbps</span>
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
            <span>Target: {settings.videoBitrateKbps + settings.audioBitrateKbps} kbps</span>
          </div>
        </div>

        {/* Framerate */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Hardware Framerate</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isLive ? telemetry.fps : '0'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">FPS</span>
          </div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
            <span>Hardware EGL vsync sync</span>
          </div>
        </div>

        {/* Dropped Frames */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">Dropped Frames</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${telemetry.dropped > 0 ? 'text-amber-400' : 'text-white'}`}>
              {telemetry.dropped}
            </span>
            <span className="text-xs text-neutral-400 font-mono">frames</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            <span>0.0% frame drop rate</span>
          </div>
        </div>

        {/* Latency & Bytes */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-medium">RTMP Socket RTT</span>
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isLive ? telemetry.rtt : '0'}
            </span>
            <span className="text-xs text-neutral-400 font-mono">ms</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">
            <span>{isLive ? (telemetry.bytes / (1024 * 1024)).toFixed(1) : '0'} MB uploaded</span>
          </div>
        </div>
      </div>

      {/* RTMP Destination Configuration Bar */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Ingest Endpoint: {settings.service}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              TCP 1935
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-mono truncate max-w-xl">
            {settings.rtmpUrl} · Key: {settings.streamKey.slice(0, 6)}•••••••••
          </span>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configure RTMP Server</span>
        </button>
      </div>

      {/* Live Packetizer Hex Dump / NALU Inspector */}
      <div className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col overflow-hidden min-h-[360px]">
        <div className="h-10 px-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold text-neutral-200">FLV Tag & AVC NALU Packet Inspection Stream</span>
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            {packetLogs.length} frames queued in ring buffer
          </span>
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-[11px]">
          {packetLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center gap-2">
              <Network className="w-8 h-8 text-neutral-700 animate-bounce" />
              <span>RTMP Stream is currently idle.</span>
              <span className="text-neutral-600 text-xs">
                Press <strong>GO LIVE</strong> to initiate C0-C2 handshake and stream FLV packets.
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Time (ms)</th>
                  <th className="py-2 px-3">FLV Tag Type</th>
                  <th className="py-2 px-3">Payload</th>
                  <th className="py-2 px-3">AVC / AAC NALU Header</th>
                  <th className="py-2 px-3 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {packetLogs.map((pkt) => {
                  let tagColor = 'text-neutral-300';
                  if (pkt.type === 'VIDEO_KEYFRAME') tagColor = 'text-rose-400 font-bold';
                  else if (pkt.type === 'VIDEO_INTER') tagColor = 'text-sky-300';
                  else if (pkt.type === 'AUDIO_AAC') tagColor = 'text-amber-300';
                  else if (pkt.type === 'METADATA_AMF0') tagColor = 'text-purple-400';

                  return (
                    <tr key={pkt.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-1.5 px-3 text-neutral-500 tabular-nums">#{pkt.id}</td>
                      <td className="py-1.5 px-3 text-neutral-400 tabular-nums">+{pkt.timestampMs}ms</td>
                      <td className={`py-1.5 px-3 ${tagColor}`}>
                        {pkt.tagTypeHex}
                      </td>
                      <td className="py-1.5 px-3 text-neutral-400">{pkt.ptsDts}</td>
                      <td className="py-1.5 px-3 text-neutral-300 font-mono truncate max-w-xs">{pkt.naluType}</td>
                      <td className="py-1.5 px-3 text-right text-neutral-400 tabular-nums">
                        {(pkt.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-bold text-sm text-white">Configure Live Broadcast Destination</span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Streaming Platform</label>
                <select
                  value={localSettings.service}
                  onChange={(e) => {
                    const serv = e.target.value as StreamSettings['service'];
                    let defaultUrl = localSettings.rtmpUrl;
                    if (serv === 'Twitch') defaultUrl = 'rtmp://live.twitch.tv/app';
                    if (serv === 'YouTube') defaultUrl = 'rtmp://a.rtmp.youtube.com/live2';
                    if (serv === 'Kick') defaultUrl = 'rtmp://fa7237.contribute.live-video.net/app';
                    setLocalSettings({ ...localSettings, service: serv, rtmpUrl: defaultUrl });
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Twitch">Twitch</option>
                  <option value="YouTube">YouTube Live</option>
                  <option value="Kick">Kick</option>
                  <option value="Custom">Custom RTMP Server</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Server RTMP URL</label>
                <input
                  type="text"
                  value={localSettings.rtmpUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, rtmpUrl: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Stream Key</label>
                <input
                  type="password"
                  value={localSettings.streamKey}
                  onChange={(e) => setLocalSettings({ ...localSettings, streamKey: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Video Bitrate</label>
                  <select
                    value={localSettings.videoBitrateKbps}
                    onChange={(e) => setLocalSettings({ ...localSettings, videoBitrateKbps: parseInt(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="2500">2500 kbps (720p30)</option>
                    <option value="4500">4500 kbps (1080p30)</option>
                    <option value="6000">6000 kbps (1080p60 HQ)</option>
                    <option value="8000">8000 kbps (1080p60 Ultra)</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Target FPS</label>
                  <select
                    value={localSettings.fps}
                    onChange={(e) => setLocalSettings({ ...localSettings, fps: parseInt(e.target.value) as 30 | 60 })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="30">30 FPS</option>
                    <option value="60">60 FPS</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
