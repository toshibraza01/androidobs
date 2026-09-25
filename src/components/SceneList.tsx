import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Copy,
  Layers,
  Video,
  Monitor,
  Type,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Globe
} from 'lucide-react';
import { SceneItem, SourceItem, SourceType } from '../types/obs';

interface SceneListProps {
  scenes: SceneItem[];
  activeSceneId: string;
  selectedSourceId: string | null;
  onSelectScene: (id: string) => void;
  onSelectSource: (id: string | null) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
  onAddSource: (type: SourceType) => void;
  onDeleteSource: (id: string) => void;
  onToggleSourceVisible: (id: string) => void;
  onToggleSourceLocked: (id: string) => void;
  onReorderSource: (id: string, direction: 'up' | 'down') => void;
  onDuplicateScene?: (id: string) => void;
  onOpenSourceProperties?: (source: SourceItem) => void;
  transitionType?: string;
  onTransitionTypeChange?: (type: string) => void;
  transitionDuration?: number;
  onTransitionDurationChange?: (ms: number) => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  activeSceneId,
  selectedSourceId,
  onSelectScene,
  onSelectSource,
  onAddScene,
  onDeleteScene,
  onAddSource,
  onDeleteSource,
  onToggleSourceVisible,
  onToggleSourceLocked,
  onReorderSource,
  onDuplicateScene,
  onOpenSourceProperties,
  transitionType = 'Fade',
  onTransitionTypeChange,
  transitionDuration = 300,
  onTransitionDurationChange
}) => {
  const [showAddSourceMenu, setShowAddSourceMenu] = useState(false);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const sortedSources = [...(activeScene?.sources || [])].sort(
    (a, b) => b.transform.zIndex - a.transform.zIndex
  );

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'camera':
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'screen':
        return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
      case 'demo_game':
        return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
      case 'color_bars':
        return <Palette className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const selectedSource = activeScene?.sources.find(s => s.id === selectedSourceId);

  return (
    <div className="flex gap-2 h-full select-none font-sans">
      {/* 1. SCENES DOCK (Matches Reference 2) */}
      <div className="w-48 bg-[#181921] border border-[#2b2d3a] rounded flex flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="h-7 px-2.5 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2b66ff]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              Scenes
            </span>
          </div>
        </div>

        {/* Scene Items List */}
        <div className="flex-1 p-1 overflow-y-auto space-y-0.5">
          {scenes.map(scene => {
            const isActive = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                className={`w-full px-2.5 py-1.5 rounded-xs text-xs text-left transition-colors flex items-center justify-between ${
                  isActive
                    ? 'bg-[#2b66ff] text-white font-medium shadow-xs'
                    : 'text-neutral-300 hover:bg-[#222430]'
                }`}
              >
                <span className="truncate">{scene.name}</span>
                <span className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-neutral-500'}`}>
                  {scene.sources.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scene Bottom Action Bar (+, Trash, Copy, Up, Down) */}
        <div className="h-7 px-1.5 bg-[#14151b] border-t border-[#2b2d3a] flex items-center justify-between text-neutral-400">
          <div className="flex items-center gap-1">
            <button
              onClick={onAddScene}
              title="Add Scene"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteScene(activeSceneId)}
              disabled={scenes.length <= 1}
              title="Remove Scene"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-neutral-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDuplicateScene?.(activeSceneId)}
              title="Duplicate Scene"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              title="Move Scene Up"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              title="Move Scene Down"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SOURCES DOCK (Matches Reference 2) */}
      <div className="w-64 bg-[#181921] border border-[#2b2d3a] rounded flex flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="h-7 px-2.5 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-[#2b66ff]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              Sources
            </span>
          </div>
        </div>

        {/* Source Items List */}
        <div className="flex-1 p-1 overflow-y-auto space-y-0.5">
          {sortedSources.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              No sources in this scene
            </div>
          ) : (
            sortedSources.map(src => {
              const isSelected = src.id === selectedSourceId;
              return (
                <div
                  key={src.id}
                  onClick={() => onSelectSource(src.id)}
                  onDoubleClick={() => onOpenSourceProperties?.(src)}
                  className={`w-full px-2 py-1.5 rounded-xs text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2b66ff] text-white font-medium'
                      : 'text-neutral-300 hover:bg-[#222430]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    {getSourceIcon(src.type)}
                    <span className="truncate">{src.name}</span>
                  </div>

                  {/* Visibility & Lock Icons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSourceVisible(src.id);
                      }}
                      className={`p-0.5 rounded hover:bg-black/20 ${
                        isSelected ? 'text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={src.visible ? 'Hide' : 'Show'}
                    >
                      {src.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 opacity-50" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSourceLocked(src.id);
                      }}
                      className={`p-0.5 rounded hover:bg-black/20 ${
                        isSelected ? 'text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                      title={src.locked ? 'Unlock' : 'Lock Transform'}
                    >
                      {src.locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 opacity-50" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Source Bottom Action Bar (+, Trash, Properties, Up, Down) */}
        <div className="h-7 px-1.5 bg-[#14151b] border-t border-[#2b2d3a] flex items-center justify-between text-neutral-400 relative">
          <div className="flex items-center gap-1">
            {/* Add Source Menu Button */}
            <button
              onClick={() => setShowAddSourceMenu(!showAddSourceMenu)}
              title="Add Source"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Delete Source */}
            <button
              onClick={() => selectedSourceId && onDeleteSource(selectedSourceId)}
              disabled={!selectedSourceId}
              title="Remove Selected Source"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-neutral-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Properties Dialog */}
            <button
              onClick={() => selectedSource && onOpenSourceProperties?.(selectedSource)}
              disabled={!selectedSource}
              title="Properties"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white disabled:opacity-30"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => selectedSourceId && onReorderSource(selectedSourceId, 'up')}
              disabled={!selectedSourceId}
              title="Move Up"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white disabled:opacity-30"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => selectedSourceId && onReorderSource(selectedSourceId, 'down')}
              disabled={!selectedSourceId}
              title="Move Down"
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white disabled:opacity-30"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Source Dropdown Menu */}
          {showAddSourceMenu && (
            <div className="absolute bottom-8 left-1 w-52 bg-[#1e2029] border border-[#343746] rounded-md shadow-2xl py-1 text-xs text-neutral-200 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-neutral-400 border-b border-[#2d303e]">
                Add Source
              </div>
              <button
                onClick={() => {
                  onAddSource('camera');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <Video className="w-3.5 h-3.5 text-blue-400" />
                <span>Video Capture Device (Camera)</span>
              </button>
              <button
                onClick={() => {
                  onAddSource('screen');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Screen Capture (Display)</span>
              </button>
              <button
                onClick={() => {
                  onAddSource('demo_game');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Media Source (Video/Game)</span>
              </button>
              <button
                onClick={() => {
                  onAddSource('text');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Text (GDI+)</span>
              </button>
              <button
                onClick={() => {
                  onAddSource('image');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Image (Watermark/Logo)</span>
              </button>
              <button
                onClick={() => {
                  onAddSource('color_bars');
                  setShowAddSourceMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Color Source (SMPTE Bars)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SCENE TRANSITIONS DOCK (Matches Reference 2) */}
      <div className="w-44 bg-[#181921] border border-[#2b2d3a] rounded flex flex-col overflow-hidden shrink-0">
        <div className="h-7 px-2.5 bg-[#14151b] border-b border-[#2b2d3a] flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
            Scene Transitions
          </span>
        </div>

        <div className="flex-1 p-2 space-y-2">
          <div>
            <select
              value={transitionType}
              onChange={(e) => onTransitionTypeChange?.(e.target.value)}
              className="w-full h-7 px-2 text-xs bg-[#242632] border border-[#343746] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
            >
              <option value="Cut">Cut</option>
              <option value="Fade">Fade</option>
              <option value="Swipe">Swipe</option>
              <option value="Slide">Slide</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={transitionDuration}
              onChange={(e) => onTransitionDurationChange?.(Number(e.target.value))}
              className="w-16 h-7 px-2 text-xs bg-[#242632] border border-[#343746] rounded text-neutral-200 font-mono"
            />
            <span className="text-xs text-neutral-400">ms</span>
          </div>
        </div>

        <div className="h-7 px-1.5 bg-[#14151b] border-t border-[#2b2d3a] flex items-center justify-between text-neutral-400">
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-neutral-800 hover:text-white">
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
