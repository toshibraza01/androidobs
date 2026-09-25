import React, { useState } from 'react';
import { Layers, Plus, Trash2, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Sliders, Type, Video, Monitor, Palette } from 'lucide-react';
import { SceneItem, SourceItem, SourceType } from '../types/obs';

interface SceneListProps {
  scenes: SceneItem[];
  activeSceneId: string;
  selectedSourceId: string | null;
  onSelectScene: (sceneId: string) => void;
  onSelectSource: (sourceId: string | null) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onAddSource: (type: SourceType) => void;
  onToggleSourceVisible: (sourceId: string) => void;
  onToggleSourceLock: (sourceId: string) => void;
  onMoveSourceOrder: (sourceId: string, direction: 'up' | 'down') => void;
  onDeleteSource: (sourceId: string) => void;
  onUpdateSourceProperty: (sourceId: string, property: string, value: unknown) => void;
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
  onToggleSourceVisible,
  onToggleSourceLock,
  onMoveSourceOrder,
  onDeleteSource,
  onUpdateSourceProperty
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const selectedSource = activeScene?.sources.find(s => s.id === selectedSourceId);

  return (
    <div className="flex flex-col gap-4">
      {/* Scenes Panel (Room SceneEntity) */}
      <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Scenes (Room DB)
            </span>
          </div>

          <button
            onClick={onAddScene}
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Create New Scene"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {scenes.map(scene => {
            const isActive = scene.id === activeSceneId;
            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                className={`group px-3 py-2 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold'
                    : 'bg-neutral-950/60 border border-neutral-800/60 text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-rose-500' : 'bg-neutral-600'}`} />
                  <span className="truncate">{scene.name}</span>
                </div>

                {scenes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScene(scene.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources & Layers Panel (Room SourceEntity) */}
      <div className="bg-neutral-900/40 rounded-xl border border-neutral-800 p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold tracking-tight text-white uppercase">
              Sources & Layers
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-1.5 z-40 flex flex-col gap-1 text-xs">
                <button
                  onClick={() => { onAddSource('camera'); setShowAddMenu(false); }}
                  className="px-2.5 py-1.5 rounded hover:bg-neutral-800 text-left flex items-center gap-2 text-neutral-200"
                >
                  <Video className="w-3.5 h-3.5 text-rose-400" />
                  <span>Camera Feed</span>
                </button>
                <button
                  onClick={() => { onAddSource('screen'); setShowAddMenu(false); }}
                  className="px-2.5 py-1.5 rounded hover:bg-neutral-800 text-left flex items-center gap-2 text-neutral-200"
                >
                  <Monitor className="w-3.5 h-3.5 text-sky-400" />
                  <span>Screen Capture</span>
                </button>
                <button
                  onClick={() => { onAddSource('text'); setShowAddMenu(false); }}
                  className="px-2.5 py-1.5 rounded hover:bg-neutral-800 text-left flex items-center gap-2 text-neutral-200"
                >
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Text / Alert Banner</span>
                </button>
                <button
                  onClick={() => { onAddSource('color_bars'); setShowAddMenu(false); }}
                  className="px-2.5 py-1.5 rounded hover:bg-neutral-800 text-left flex items-center gap-2 text-neutral-200"
                >
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>SMPTE Test Slate</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Source items list */}
        <div className="flex flex-col gap-1.5">
          {activeScene.sources.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-500">
              No sources in this scene. Tap + Add to ingest video or text.
            </div>
          ) : (
            // Render from top z-order to bottom
            [...activeScene.sources]
              .sort((a, b) => b.transform.zIndex - a.transform.zIndex)
              .map((src) => {
                const isSelected = src.id === selectedSourceId;
                return (
                  <div
                    key={src.id}
                    onClick={() => onSelectSource(src.id)}
                    className={`px-2.5 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-neutral-800 border-rose-500/50 text-white'
                        : 'bg-neutral-950/60 border-neutral-800/60 text-neutral-300 hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {src.type === 'camera' && <Video className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                      {src.type === 'screen' && <Monitor className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      {src.type === 'text' && <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {src.type === 'color_bars' && <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                      <span className="truncate font-medium">{src.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveSourceOrder(src.id, 'up'); }}
                        className="p-1 text-neutral-500 hover:text-white"
                        title="Move Up (Z-Order)"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveSourceOrder(src.id, 'down'); }}
                        className="p-1 text-neutral-500 hover:text-white"
                        title="Move Down (Z-Order)"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleSourceLock(src.id); }}
                        className={`p-1 ${src.locked ? 'text-amber-400' : 'text-neutral-500 hover:text-white'}`}
                        title={src.locked ? 'Unlock Layer' : 'Lock Layer'}
                      >
                        {src.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleSourceVisible(src.id); }}
                        className={`p-1 ${src.visible ? 'text-neutral-300 hover:text-white' : 'text-neutral-600'}`}
                        title={src.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {src.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSource(src.id); }}
                        className="p-1 text-neutral-500 hover:text-rose-400"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Selected Source Properties Drawer */}
        {selectedSource && (
          <div className="mt-2 pt-3 border-t border-neutral-800/80 flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Layer Properties: {selectedSource.name}
            </span>

            {/* Opacity Slider */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Opacity</span>
              <div className="flex items-center gap-2 w-32">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={selectedSource.transform.opacity}
                  onChange={(e) => onUpdateSourceProperty(selectedSource.id, 'opacity', parseFloat(e.target.value))}
                  className="flex-1 accent-rose-500 h-1 bg-neutral-800 rounded cursor-pointer"
                />
                <span className="font-mono text-[11px] tabular-nums text-neutral-300 w-8 text-right">
                  {Math.round(selectedSource.transform.opacity * 100)}%
                </span>
              </div>
            </div>

            {/* Chroma Key for Camera */}
            {selectedSource.type === 'camera' && (
              <div className="flex flex-col gap-2 pt-1 border-t border-neutral-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Chroma Key (Green Screen)</span>
                  <input
                    type="checkbox"
                    checked={selectedSource.properties.chromaKey || false}
                    onChange={(e) => onUpdateSourceProperty(selectedSource.id, 'chromaKey', e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>

                {selectedSource.properties.chromaKey && (
                  <div className="flex flex-col gap-1.5 p-2.5 bg-neutral-950/70 rounded-lg border border-neutral-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400 font-medium">Chroma Key Threshold</span>
                      <span className="font-mono text-[11px] tabular-nums text-rose-400 font-semibold">
                        {selectedSource.properties.chromaSimilarity ?? 90}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="20"
                        max="180"
                        step="1"
                        value={selectedSource.properties.chromaSimilarity ?? 90}
                        onChange={(e) =>
                          onUpdateSourceProperty(
                            selectedSource.id,
                            'chromaSimilarity',
                            parseInt(e.target.value, 10)
                          )
                        }
                        className="flex-1 accent-rose-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                      <span>Strict (20)</span>
                      <span>Default (90)</span>
                      <span>Aggressive (180)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text value for Text source */}
            {selectedSource.type === 'text' && (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-neutral-400">Overlay Text</span>
                <input
                  type="text"
                  value={selectedSource.properties.text || ''}
                  onChange={(e) => onUpdateSourceProperty(selectedSource.id, 'text', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  placeholder="Streamer Name // Title"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
