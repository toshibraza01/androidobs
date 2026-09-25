import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Monitor, Grid, Maximize2, RotateCcw, Eye, ShieldAlert } from 'lucide-react';
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
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  scene,
  selectedSourceId,
  onSelectSource,
  onUpdateSourceTransform,
  isCameraActive,
  isScreenActive,
  onToggleCamera,
  onToggleScreen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize-br' | 'resize-tl'>('move');
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; initialX: number; initialY: number; initialW: number; initialH: number } | null>(null);

  // Initialize compositor with canvas
  useEffect(() => {
    if (canvasRef.current) {
      compositor.setCanvas(canvasRef.current);
      compositor.setScene(scene);
      compositor.setSelectedSource(selectedSourceId);
      compositor.startRenderLoop();
    }
    return () => {
      compositor.stopRenderLoop();
    };
  }, []);

  // Update scene in compositor
  useEffect(() => {
    compositor.setScene(scene);
  }, [scene]);

  // Update selected source
  useEffect(() => {
    compositor.setSelectedSource(selectedSourceId);
  }, [selectedSourceId]);

  const selectedSource = scene.sources.find(s => s.id === selectedSourceId);

  // Pointer event handlers for Canvas interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked near resize handle of selected source
    if (selectedSource && !selectedSource.locked) {
      const t = selectedSource.transform;
      const brDist = Math.hypot(clickX - (t.x + t.width), clickY - (t.y + t.height));
      if (brDist < 4) {
        setIsDragging(true);
        setDragMode('resize-br');
        setDragStart({
          mouseX: clickX,
          mouseY: clickY,
          initialX: t.x,
          initialY: t.y,
          initialW: t.width,
          initialH: t.height
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Hit test sources from top (highest zIndex) to bottom
    const sorted = [...scene.sources]
      .filter(s => s.visible && !s.locked)
      .sort((a, b) => b.transform.zIndex - a.transform.zIndex);

    let hitSource: SourceItem | null = null;
    for (const src of sorted) {
      const t = src.transform;
      if (clickX >= t.x && clickX <= t.x + t.width && clickY >= t.y && clickY <= t.y + t.height) {
        hitSource = src;
        break;
      }
    }

    if (hitSource) {
      onSelectSource(hitSource.id);
      setIsDragging(true);
      setDragMode('move');
      setDragStart({
        mouseX: clickX,
        mouseY: clickY,
        initialX: hitSource.transform.x,
        initialY: hitSource.transform.y,
        initialW: hitSource.transform.width,
        initialH: hitSource.transform.height
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      onSelectSource(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !selectedSourceId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const deltaX = currentX - dragStart.mouseX;
    const deltaY = currentY - dragStart.mouseY;

    if (dragMode === 'move') {
      const newX = Math.max(0, Math.min(100 - dragStart.initialW, dragStart.initialX + deltaX));
      const newY = Math.max(0, Math.min(100 - dragStart.initialH, dragStart.initialY + deltaY));
      onUpdateSourceTransform(selectedSourceId, {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10
      });
    } else if (dragMode === 'resize-br') {
      const newW = Math.max(10, Math.min(100 - dragStart.initialX, dragStart.initialW + deltaX));
      const newH = Math.max(8, Math.min(100 - dragStart.initialY, dragStart.initialH + deltaY));
      onUpdateSourceTransform(selectedSourceId, {
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture release
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/40 rounded-xl border border-neutral-800 overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="h-10 px-4 border-b border-neutral-800/80 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-400 select-none">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-200 font-semibold">{scene.name}</span>
          <span className="text-neutral-500">· 1920x1080 60FPS</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className={`p-1.5 rounded transition-colors ${
              showSafeGuides ? 'bg-neutral-800 text-rose-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title="Toggle Rule of Thirds & Broadcast Safe Areas"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCamera}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isCameraActive ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isCameraActive ? 'Camera ON' : 'Start Camera'}</span>
          </button>
          <button
            onClick={onToggleScreen}
            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isScreenActive ? 'bg-sky-950/80 text-sky-300 border border-sky-700/50' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{isScreenActive ? 'Screen ON' : 'Share Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 p-3 flex items-center justify-center bg-black/80 relative overflow-hidden">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-video max-w-full max-h-full w-full shadow-2xl rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 cursor-crosshair touch-none"
        >
          {/* Main Rendering Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block"
          />

          {/* Safe Area Guides Overlay */}
          {showSafeGuides && (
            <div className="absolute inset-0 pointer-events-none border border-neutral-700/30">
              {/* 90% Action Safe */}
              <div className="absolute inset-[5%] border border-dashed border-amber-500/40 pointer-events-none" />
              {/* 80% Title Safe */}
              <div className="absolute inset-[10%] border border-dotted border-emerald-500/40 pointer-events-none" />
              {/* Rule of Thirds */}
              <div className="absolute top-1/3 left-0 right-0 border-t border-neutral-500/20" />
              <div className="absolute top-2/3 left-0 right-0 border-t border-neutral-500/20" />
              <div className="absolute left-1/3 top-0 bottom-0 border-l border-neutral-500/20" />
              <div className="absolute left-2/3 top-0 bottom-0 border-l border-neutral-500/20" />
              <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-400 bg-black/60 px-1.5 py-0.5 rounded">
                Title Safe (80%) / Action Safe (90%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Footer */}
      {selectedSource && (
        <div className="h-9 px-4 bg-neutral-950/90 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-rose-400">{selectedSource.name}</span>
            <span className="font-mono text-neutral-500 tabular-nums">
              X: {selectedSource.transform.x}% · Y: {selectedSource.transform.y}% · W: {selectedSource.transform.width}% · H: {selectedSource.transform.height}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSourceTransform(selectedSource.id, { x: 68, y: 60, width: 28, height: 32 })}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium transition-colors"
            >
              Reset PIP Position
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
