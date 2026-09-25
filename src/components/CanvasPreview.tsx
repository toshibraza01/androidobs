import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  Monitor,
  Grid,
  Maximize2,
  RotateCcw,
  Eye,
  Sliders,
  Settings,
  RefreshCw,
  Play,
  Pause,
  MousePointer,
  Globe,
  Video,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { SceneItem, SourceItem, SourceTransform } from '../types/obs';
import { compositor } from '../services/compositor';

interface CanvasPreviewProps {
  scene: SceneItem;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onUpdateSourceTransform: (sourceId: string, transform: Partial<SourceTransform>) => void;
  isCameraActive: boolean;
  isScreenActive: boolean;
  onToggleCamera: () => void;
  onToggleScreen: () => void;
  onOpenProperties?: () => void;
  onContextMenu?: (e: React.MouseEvent, sourceId: string | null) => void;
  isProgram?: boolean;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  scene,
  selectedSourceId,
  onSelectSource,
  onUpdateSourceTransform,
  isCameraActive,
  isScreenActive,
  onToggleCamera,
  onToggleScreen,
  onOpenProperties,
  onContextMenu,
  isProgram = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'>('move');
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const [isPlayingMedia, setIsPlayingMedia] = useState(true);
  const [mediaTime, setMediaTime] = useState(8);

  // Initialize compositor with canvas
  useEffect(() => {
    if (canvasRef.current && !isProgram) {
      compositor.setCanvas(canvasRef.current);
      compositor.setScene(scene);
      compositor.setSelectedSource(selectedSourceId);
      compositor.startRenderLoop();
    }
  }, [isProgram]);

  useEffect(() => {
    if (!isProgram) {
      compositor.setScene(scene);
    }
  }, [scene, isProgram]);

  useEffect(() => {
    if (!isProgram) {
      compositor.setSelectedSource(selectedSourceId);
    }
  }, [selectedSourceId, isProgram]);

  const selectedSource = scene.sources.find(s => s.id === selectedSourceId);

  // Interactive Drag & Resize
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, mode: typeof dragMode = 'move') => {
    if (isProgram || !selectedSource || selectedSource.locked) return;
    if (e.button !== 0) return; // Only primary click
    e.stopPropagation();

    setIsDragging(true);
    setDragMode(mode);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: selectedSource.transform.x,
      initialY: selectedSource.transform.y,
      initialW: selectedSource.transform.width,
      initialH: selectedSource.transform.height
    });
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !dragStart || !selectedSource || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

    if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(100 - dragStart.initialW, dragStart.initialX + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - dragStart.initialH, dragStart.initialY + deltaYPercent));
      onUpdateSourceTransform(selectedSource.id, { x: newX, y: newY });
    } else if (dragMode === 'se') {
      const newW = Math.max(10, Math.min(100 - dragStart.initialX, dragStart.initialW + deltaXPercent));
      const newH = Math.max(10, Math.min(100 - dragStart.initialY, dragStart.initialH + deltaYPercent));
      onUpdateSourceTransform(selectedSource.id, { width: newW, height: newH });
    } else if (dragMode === 'nw') {
      const newX = dragStart.initialX + deltaXPercent;
      const newY = dragStart.initialY + deltaYPercent;
      const newW = dragStart.initialW - deltaXPercent;
      const newH = dragStart.initialH - deltaYPercent;
      if (newW > 10 && newH > 10 && newX >= 0 && newY >= 0) {
        onUpdateSourceTransform(selectedSource.id, { x: newX, y: newY, width: newW, height: newH });
      }
    } else if (dragMode === 'e') {
      const newW = Math.max(10, Math.min(100 - dragStart.initialX, dragStart.initialW + deltaXPercent));
      onUpdateSourceTransform(selectedSource.id, { width: newW });
    } else if (dragMode === 's') {
      const newH = Math.max(10, Math.min(100 - dragStart.initialY, dragStart.initialH + deltaYPercent));
      onUpdateSourceTransform(selectedSource.id, { height: newH });
    }
  }, [isDragging, dragStart, selectedSource, dragMode, onUpdateSourceTransform]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181921] overflow-hidden select-none font-sans">
      {/* Studio Monitor Label if in Studio Mode */}
      {isProgram !== undefined && (
        <div className={`h-6 px-3 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase border-b border-[#2b2d3a] ${
          isProgram ? 'bg-red-950/60 text-red-400' : 'bg-[#15161c] text-neutral-300'
        }`}>
          <span>{isProgram ? '● PROGRAM (LIVE)' : 'PREVIEW'}</span>
          <span className="text-[10px] text-neutral-400 font-mono">1920x1080 (60 fps)</span>
        </div>
      )}

      {/* Main Canvas Viewport with OBS Diagonal Hatch Background (Matches Reference 2 & 4) */}
      <div
        ref={containerRef}
        onClick={() => onSelectSource(null)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (onContextMenu) onContextMenu(e, selectedSourceId);
        }}
        className="flex-1 relative flex items-center justify-center overflow-hidden p-3"
        style={{
          backgroundColor: '#14151a',
          backgroundImage: 'repeating-linear-gradient(45deg, #181922, #181922 10px, #1f212c 10px, #1f212c 20px)'
        }}
      >
        {/* Aspect Ratio 16:9 Canvas Container */}
        <div className="relative aspect-video max-h-full max-w-full w-full bg-black shadow-2xl border border-[#303342] overflow-hidden">
          {/* Main Rendering HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full object-contain block"
          />

          {/* Interactive Red Transform Bounding Box with 8 grab handles and alignment guide (Reference 2) */}
          {!isProgram && selectedSource && selectedSource.visible && (
            <div
              style={{
                left: `${selectedSource.transform.x}%`,
                top: `${selectedSource.transform.y}%`,
                width: `${selectedSource.transform.width}%`,
                height: `${selectedSource.transform.height}%`,
                transform: `rotate(${selectedSource.transform.rotation}deg)`
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onContextMenu) onContextMenu(e, selectedSource.id);
              }}
              className="absolute border-2 border-red-500 cursor-move pointer-events-auto"
            >
              {/* Alignment pixel marker (Matches "662 px" marker in Reference 2) */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-600/90 text-white font-mono text-[10px] font-bold rounded-xs shadow-md whitespace-nowrap pointer-events-none">
                {Math.round((selectedSource.transform.width / 100) * 1920)} px
              </div>

              {/* Center Crosshair Marker */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                <div className="w-3 h-0.5 bg-red-500" />
                <div className="h-3 w-0.5 bg-red-500 absolute" />
              </div>

              {/* 8 Grab Handles (Corners + Edges) */}
              {!selectedSource.locked && (
                <>
                  {/* NW Corner */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-600 rounded-xs cursor-nwse-resize z-20"
                  />
                  {/* NE Corner */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-600 rounded-xs cursor-nesw-resize z-20"
                  />
                  {/* SW Corner */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-600 rounded-xs cursor-nesw-resize z-20"
                  />
                  {/* SE Corner */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-red-600 rounded-xs cursor-nwse-resize z-20"
                  />

                  {/* N Edge */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2 bg-white border border-red-600 rounded-xs cursor-ns-resize z-20" />
                  {/* S Edge */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2 bg-white border border-red-600 rounded-xs cursor-ns-resize z-20"
                  />
                  {/* E Edge */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2.5 bg-white border border-red-600 rounded-xs cursor-ew-resize z-20"
                  />
                  {/* W Edge */}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2.5 bg-white border border-red-600 rounded-xs cursor-ew-resize z-20" />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source Quick Action Toolbar directly beneath canvas (Matches Reference 2 & 3) */}
      {!isProgram && (
        <div className="h-8 bg-[#14151b] border-t border-[#2b2d3a] px-3 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            {/* Source Name with Icon */}
            {selectedSource ? (
              <div className="flex items-center gap-1.5 font-semibold text-white mr-2">
                {selectedSource.type === 'camera' && <Video className="w-3.5 h-3.5 text-blue-400" />}
                {selectedSource.type === 'screen' && <Monitor className="w-3.5 h-3.5 text-emerald-400" />}
                {selectedSource.type === 'demo_game' && <Globe className="w-3.5 h-3.5 text-indigo-400" />}
                {selectedSource.type === 'text' && <Type className="w-3.5 h-3.5 text-amber-400" />}
                {selectedSource.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-pink-400" />}
                <span>{selectedSource.name}</span>
              </div>
            ) : (
              <span className="text-neutral-500 italic mr-2">No source selected</span>
            )}

            {/* Properties Button (Reference 2) */}
            <button
              onClick={onOpenProperties}
              disabled={!selectedSource}
              className="h-6 px-2.5 bg-[#242632] hover:bg-[#303342] border border-[#343746] rounded flex items-center gap-1 text-[11px] disabled:opacity-30 disabled:hover:bg-[#242632]"
            >
              <Settings className="w-3 h-3 text-neutral-400" />
              <span>Properties</span>
            </button>

            {/* Filters Button (Reference 2) */}
            <button
              onClick={onOpenProperties}
              disabled={!selectedSource}
              className="h-6 px-2.5 bg-[#242632] hover:bg-[#303342] border border-[#343746] rounded flex items-center gap-1 text-[11px] disabled:opacity-30"
            >
              <Sliders className="w-3 h-3 text-neutral-400" />
              <span>Filters</span>
            </button>

            {/* Interact Button (Reference 2) */}
            <button
              className="h-6 px-2.5 bg-[#242632] hover:bg-[#303342] border border-[#343746] rounded flex items-center gap-1 text-[11px]"
            >
              <MousePointer className="w-3 h-3 text-neutral-400" />
              <span>Interact</span>
            </button>

            {/* Refresh Button (Reference 2) */}
            <button
              title="Refresh Source"
              className="h-6 px-2 bg-[#242632] hover:bg-[#303342] border border-[#343746] rounded flex items-center text-[11px]"
            >
              <RefreshCw className="w-3 h-3 text-neutral-400" />
            </button>
          </div>

          {/* Media timeline scrubber if selected source is media / game (Reference 3) */}
          {selectedSource?.type === 'demo_game' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingMedia(!isPlayingMedia)}
                className="hover:text-white"
              >
                {isPlayingMedia ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <input
                type="range"
                min="0"
                max="11"
                value={mediaTime}
                onChange={(e) => setMediaTime(Number(e.target.value))}
                className="w-28 accent-[#2b66ff] h-1"
              />
              <span className="font-mono text-[10px] text-neutral-400">
                00:00:0{mediaTime} / -00:00:03
              </span>
            </div>
          )}

          {/* Quick Hardware Camera / Screen Ingestion Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleCamera}
              className={`h-6 px-2 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors ${
                isCameraActive
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-[#242632] border-[#343746] text-neutral-400 hover:text-white'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>{isCameraActive ? 'Cam ON' : 'Start Cam'}</span>
            </button>

            <button
              onClick={onToggleScreen}
              className={`h-6 px-2 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors ${
                isScreenActive
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-[#242632] border-[#343746] text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>{isScreenActive ? 'Display ON' : 'Capture Display'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
