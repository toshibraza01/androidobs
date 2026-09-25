import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Monitor,
  Radio,
  Video,
  Volume2,
  Tv,
  Keyboard,
  Accessibility,
  Sliders,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { StreamSettings } from '../types/obs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StreamSettings;
  onSaveSettings: (settings: StreamSettings) => void;
}

type SettingsCategory =
  | 'general'
  | 'appearance'
  | 'stream'
  | 'output'
  | 'audio'
  | 'video'
  | 'hotkeys'
  | 'accessibility'
  | 'advanced';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('hotkeys');
  const [draftSettings, setDraftSettings] = useState<StreamSettings>({ ...settings });
  const [showStreamKey, setShowStreamKey] = useState(false);

  // Hotkey bindings state
  const [hotkeys, setHotkeys] = useState<Record<string, string>>({
    startStreaming: 'F9',
    stopStreaming: 'Shift+F9',
    startRecording: 'F10',
    stopRecording: 'Shift+F10',
    pauseRecording: 'F11',
    unpauseRecording: 'Shift+F11',
    splitRecording: '',
    addChapterMarker: '',
    startReplayBuffer: 'F8',
    stopReplayBuffer: 'Shift+F8',
    startVirtualCamera: 'F7',
    stopVirtualCamera: 'Shift+F7',
    enablePreview: 'Space',
    studioMode: 'F12'
  });

  const [activeListeningHotkey, setActiveListeningHotkey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = () => {
    onSaveSettings(draftSettings);
  };

  const handleOk = () => {
    onSaveSettings(draftSettings);
    onClose();
  };

  const categories = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'stream', label: 'Stream', icon: Radio },
    { id: 'output', label: 'Output', icon: Video },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'video', label: 'Video', icon: Tv },
    { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'advanced', label: 'Advanced', icon: Sliders }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, actionKey: string) => {
    e.preventDefault();
    let keyComb = '';
    if (e.ctrlKey) keyComb += 'Ctrl+';
    if (e.altKey) keyComb += 'Alt+';
    if (e.shiftKey) keyComb += 'Shift+';
    const key = e.key.toUpperCase();
    if (!['CONTROL', 'ALT', 'SHIFT'].includes(key)) {
      keyComb += key;
      setHotkeys(prev => ({ ...prev, [actionKey]: keyComb }));
      setActiveListeningHotkey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-4xl h-[600px] bg-[#1d1f28] border border-[#303342] rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans text-neutral-200">
        {/* Window Title Bar */}
        <div className="h-8 bg-[#16171e] border-b border-[#2a2c3a] px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body: Sidebar + Main Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-[#181921] border-r border-[#2a2c3a] py-2 flex flex-col shrink-0">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as SettingsCategory)}
                  className={`w-full px-3 py-2 flex items-center gap-2.5 text-xs text-left transition-colors ${
                    isActive
                      ? 'bg-[#2b66ff] text-white font-medium'
                      : 'text-neutral-300 hover:bg-[#222430]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Tab Contents */}
          <div className="flex-1 bg-[#1e202a] p-5 overflow-y-auto">
            {/* HOTKEYS TAB (Matches Reference 1) */}
            {activeCategory === 'hotkeys' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Filter"
                      className="w-full h-7 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-[#2b66ff]"
                    />
                  </div>
                  <div className="w-48">
                    <input
                      type="text"
                      placeholder="Filter by Hotkey"
                      className="w-full h-7 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-[#2b66ff]"
                    />
                  </div>
                  <button className="h-7 w-7 bg-[#282a36] border border-[#3c3f50] rounded flex items-center justify-center text-neutral-400 hover:text-white">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hotkeys List */}
                <div className="space-y-1.5 pt-2">
                  {[
                    { id: 'startStreaming', label: 'Start Streaming *' },
                    { id: 'stopStreaming', label: 'Stop Streaming *' },
                    { id: 'stopStreamingDelay', label: 'Stop Streaming (discard delay)' },
                    { id: 'startRecording', label: 'Start Recording *' },
                    { id: 'stopRecording', label: 'Stop Recording *' },
                    { id: 'pauseRecording', label: 'Pause Recording *' },
                    { id: 'unpauseRecording', label: 'Unpause Recording *' },
                    { id: 'splitRecording', label: 'Split Recording File' },
                    { id: 'addChapterMarker', label: 'Add Chapter Marker (Hybrid MP4 only)' },
                    { id: 'startReplayBuffer', label: 'Start Replay Buffer *' },
                    { id: 'stopReplayBuffer', label: 'Stop Replay Buffer *' },
                    { id: 'startVirtualCamera', label: 'Start Virtual Camera *' },
                    { id: 'stopVirtualCamera', label: 'Stop Virtual Camera *' },
                    { id: 'enablePreview', label: 'Enable Preview *' },
                    { id: 'studioMode', label: 'Studio Mode Toggle' }
                  ].map(hk => (
                    <div key={hk.id} className="flex items-center justify-between text-xs py-1">
                      <span className="text-neutral-300 w-64 truncate text-right pr-4">
                        {hk.label}
                      </span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <div
                          tabIndex={0}
                          onFocus={() => setActiveListeningHotkey(hk.id)}
                          onBlur={() => setActiveListeningHotkey(null)}
                          onKeyDown={(e) => handleKeyDown(e, hk.id)}
                          className={`flex-1 h-7 px-2.5 flex items-center text-xs rounded border transition-colors cursor-pointer ${
                            activeListeningHotkey === hk.id
                              ? 'bg-[#2b66ff]/20 border-[#2b66ff] text-white animate-pulse'
                              : 'bg-[#282a36] border-[#3c3f50] text-neutral-200'
                          }`}
                        >
                          {activeListeningHotkey === hk.id
                            ? 'Press key combination...'
                            : hotkeys[hk.id] || ''}
                        </div>
                        <button
                          onClick={() => setHotkeys(prev => ({ ...prev, [hk.id]: '' }))}
                          title="Clear"
                          className="h-7 w-7 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded flex items-center justify-center text-neutral-400 hover:text-white"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setHotkeys(prev => ({ ...prev, [hk.id]: '' }))}
                          title="Delete"
                          className="h-7 w-7 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded flex items-center justify-center text-neutral-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          title="Add Additional Binding"
                          className="h-7 w-7 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded flex items-center justify-center text-neutral-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          title="Reset"
                          className="h-7 w-7 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded flex items-center justify-center text-neutral-400 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STREAM TAB */}
            {activeCategory === 'stream' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Service
                  </label>
                  <select
                    value={draftSettings.service}
                    onChange={(e) => {
                      const s = e.target.value as StreamSettings['service'];
                      let url = draftSettings.rtmpUrl;
                      if (s === 'Twitch') url = 'rtmp://live.twitch.tv/app';
                      if (s === 'YouTube') url = 'rtmp://a.rtmp.youtube.com/live2';
                      if (s === 'Kick') url = 'rtmps://fa723fc1b171.global-contribute.live-video.net:443/app';
                      setDraftSettings(prev => ({ ...prev, service: s, rtmpUrl: url }));
                    }}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  >
                    <option value="Twitch">Twitch</option>
                    <option value="YouTube">YouTube - RTMPS</option>
                    <option value="Kick">Kick</option>
                    <option value="Custom">Custom...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Server (RTMP URL)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.rtmpUrl}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, rtmpUrl: e.target.value }))}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Stream Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showStreamKey ? 'text' : 'password'}
                      value={draftSettings.streamKey}
                      onChange={(e) => setDraftSettings(prev => ({ ...prev, streamKey: e.target.value }))}
                      placeholder="live_..."
                      className="flex-1 h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 font-mono focus:outline-hidden focus:border-[#2b66ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      className="h-8 px-3 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300 flex items-center gap-1.5"
                    >
                      {showStreamKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showStreamKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Never share your stream key with anyone. Broadcast stream is multiplexed into FLV tags over TCP port 1935.
                  </p>
                </div>
              </div>
            )}

            {/* OUTPUT TAB */}
            {activeCategory === 'output' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Video Bitrate (Kbps)
                  </label>
                  <input
                    type="number"
                    value={draftSettings.videoBitrateKbps}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, videoBitrateKbps: Number(e.target.value) }))}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">Recommended for 1080p60: 6000 Kbps</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Audio Bitrate (Kbps)
                  </label>
                  <select
                    value={draftSettings.audioBitrateKbps}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, audioBitrateKbps: Number(e.target.value) }))}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  >
                    <option value={96}>96 Kbps</option>
                    <option value={128}>128 Kbps</option>
                    <option value={160}>160 Kbps (High Quality)</option>
                    <option value={320}>320 Kbps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Hardware Video Encoder
                  </label>
                  <select
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                    defaultValue="mediacodec"
                  >
                    <option value="mediacodec">Android MediaCodec (Hardware H.264 / AVC)</option>
                    <option value="openh264">Software (x264 CBR VeryFast)</option>
                  </select>
                </div>
              </div>
            )}

            {/* VIDEO TAB */}
            {activeCategory === 'video' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Base (Canvas) Resolution
                  </label>
                  <select
                    value={draftSettings.resolution}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, resolution: e.target.value as any }))}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  >
                    <option value="1080p">1920x1080 (16:9 Landscape - Twitch/YouTube)</option>
                    <option value="vertical_1080p">1080x1920 (9:16 Portrait - TikTok/Shorts)</option>
                    <option value="720p">1280x720 (16:9 Standard HD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Common FPS Values
                  </label>
                  <select
                    value={draftSettings.fps}
                    onChange={(e) => setDraftSettings(prev => ({ ...prev, fps: Number(e.target.value) as any }))}
                    className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                  >
                    <option value={60}>60 fps (Smooth Gaming & Fast Motion)</option>
                    <option value={30}>30 fps (Power Saving & Low Bandwidth)</option>
                  </select>
                </div>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeCategory === 'audio' && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Sample Rate
                  </label>
                  <select className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]">
                    <option value="48000">48 kHz (Broadcast Standard)</option>
                    <option value="44100">44.1 kHz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Channels
                  </label>
                  <select className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]">
                    <option value="stereo">Stereo</option>
                    <option value="mono">Mono</option>
                  </select>
                </div>
              </div>
            )}

            {/* GENERAL / APPEARANCE / OTHER TABS */}
            {['general', 'appearance', 'accessibility', 'advanced'].includes(activeCategory) && (
              <div className="space-y-4 max-w-xl">
                <div className="p-4 bg-[#232533] border border-[#303344] rounded text-xs text-neutral-300">
                  <p className="font-semibold text-neutral-200 mb-1">
                    OBS Studio Profile: Untitled
                  </p>
                  <p className="text-neutral-400">
                    Configuration is synced with local persistent storage and Android NDK state.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Apply / Cancel / OK (Matches Reference 1) */}
        <div className="h-12 bg-[#16171e] border-t border-[#2a2c3a] px-4 flex items-center justify-between">
          <button
            onClick={() => {
              setDraftSettings({
                service: 'Twitch',
                rtmpUrl: 'rtmp://live.twitch.tv/app',
                streamKey: '',
                resolution: '1080p',
                fps: 60,
                videoBitrateKbps: 6000,
                audioBitrateKbps: 160
              });
            }}
            className="px-3 py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300"
          >
            Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleOk}
              className="px-4 py-1.5 bg-[#2b66ff] hover:bg-[#2055e0] text-white rounded text-xs font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
