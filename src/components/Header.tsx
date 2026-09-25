import React, { useState } from 'react';
import {
  Radio,
  Video,
  Download,
  MessageSquare,
  Layers,
  Settings,
  Tv,
  FileCode,
  Smartphone,
  ChevronDown
} from 'lucide-react';
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
  onOpenSettings: () => void;
  showChat: boolean;
  onToggleChat: () => void;
  isStudioMode: boolean;
  onToggleStudioMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  streamState,
  isRecording,
  liveDuration,
  onOpenBuildApk,
  onOpenSettings,
  showChat,
  onToggleChat,
  isStudioMode,
  onToggleStudioMode
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const isLive = streamState === 'live';

  return (
    <div className="bg-[#121319] border-b border-[#262834] select-none font-sans shrink-0 z-30">
      {/* 1. OBS Window Title Bar (Matches Reference 2 & 4: "OBS 31.0.0 - Profile: Untitled - Scenes: Untitled") */}
      <div className="h-6 px-3 bg-[#0d0e13] flex items-center justify-between text-[11px] text-neutral-400 border-b border-[#1c1d27]">
        {/* Left Mac/Window dots + App Identity */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="font-semibold text-neutral-300">
            OBS 31.0.0
          </span>
          <span className="text-neutral-500">- Profile: Untitled - Scenes: Untitled</span>
        </div>

        {/* Center/Right: Quick Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('studio')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
              currentTab === 'studio'
                ? 'bg-[#2b66ff] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            OBS Director
          </button>
          <button
            onClick={() => onSelectTab('mobile_rig')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              currentTab === 'mobile_rig'
                ? 'bg-[#2b66ff] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile Device Rig</span>
          </button>
          <button
            onClick={() => onSelectTab('rtmp_telemetry')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              currentTab === 'rtmp_telemetry'
                ? 'bg-[#2b66ff] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>RTMP Telemetry</span>
          </button>
          <button
            onClick={() => onSelectTab('architecture')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
              currentTab === 'architecture'
                ? 'bg-[#2b66ff] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>Android NDK Core</span>
          </button>
        </div>

        {/* Right Action: Build APK */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBuildApk}
            className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Get APK</span>
          </button>
        </div>
      </div>

      {/* 2. Authentic OBS Menu Bar (File, Edit, View, Docks, Profile, Scene Collection, Tools, Help) */}
      <div className="h-6 px-2 flex items-center justify-between text-xs text-neutral-300">
        <div className="flex items-center gap-1">
          {['File', 'Edit', 'View', 'Docks', 'Profile', 'Scene Collection', 'Tools', 'Help'].map(item => (
            <button
              key={item}
              onClick={() => {
                if (item === 'Docks') {
                  onToggleChat();
                } else if (item === 'Tools' || item === 'File') {
                  onOpenSettings();
                }
              }}
              className="px-2 py-0.5 rounded hover:bg-[#222430] hover:text-white text-[11px] cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Quick Toolbar Toggles */}
        <div className="flex items-center gap-1">
          {/* Chat Dock Toggle */}
          <button
            onClick={onToggleChat}
            className={`h-5 px-2 rounded text-[10px] font-medium flex items-center gap-1 border transition-colors ${
              showChat
                ? 'bg-[#2b66ff]/20 border-[#2b66ff] text-[#60a5fa]'
                : 'bg-[#181921] border-[#2b2d3a] text-neutral-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Stream Chat</span>
          </button>

          {/* Studio Mode Toggle */}
          <button
            onClick={onToggleStudioMode}
            className={`h-5 px-2 rounded text-[10px] font-medium flex items-center gap-1 border transition-colors ${
              isStudioMode
                ? 'bg-[#2b66ff] border-[#2b66ff] text-white'
                : 'bg-[#181921] border-[#2b2d3a] text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Studio Mode</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
