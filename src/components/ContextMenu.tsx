import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  RotateCw,
  RotateCcw,
  Sliders,
  Settings,
  Trash2,
  Copy,
  Layers,
  Maximize,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { SourceItem, SourceTransform } from '../types/obs';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  source: SourceItem | null;
  onUpdateTransform: (transform: Partial<SourceTransform>) => void;
  onOpenProperties: () => void;
  onRemoveSource: () => void;
  onDuplicateSource: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  source,
  onUpdateTransform,
  onOpenProperties,
  onRemoveSource,
  onDuplicateSource
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<'transform' | 'order' | null>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  // Prevent right-click inside context menu from reopening
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleMenuClick}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 min-w-56 bg-[#1e2029] border border-[#343746] rounded-md shadow-2xl py-1 text-xs text-neutral-200 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#282a36] cursor-pointer">
        <span className="flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-neutral-200" />
          <span>Enable Preview</span>
        </span>
      </div>

      <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#282a36] cursor-pointer text-neutral-400">
        <span>Lock Preview</span>
      </div>

      <div className="h-px bg-[#2d303e] my-1" />

      {source && (
        <>
          <div
            onClick={() => {
              onDuplicateSource();
              onClose();
            }}
            className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a36] cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-neutral-400" />
            <span>Duplicate Source</span>
          </div>

          <div
            onClick={() => {
              onRemoveSource();
              onClose();
            }}
            className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a36] cursor-pointer text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove '{source.name}'</span>
          </div>

          <div className="h-px bg-[#2d303e] my-1" />

          {/* Order Submenu */}
          <div
            onMouseEnter={() => setActiveSubmenu('order')}
            className="relative px-3 py-1.5 flex items-center justify-between hover:bg-[#2b66ff] hover:text-white cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Order</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />

            {activeSubmenu === 'order' && (
              <div
                className="absolute left-full top-0 ml-1 min-w-44 bg-[#1e2029] border border-[#343746] rounded-md shadow-2xl py-1 text-xs text-neutral-200"
                onMouseEnter={() => setActiveSubmenu('order')}
              >
                <button
                  onClick={() => {
                    onUpdateTransform({ zIndex: source.transform.zIndex + 1 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span>Move Up</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateTransform({ zIndex: Math.max(0, source.transform.zIndex - 1) });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>Move Down</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateTransform({ zIndex: 99 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Move to Top</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateTransform({ zIndex: 0 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Move to Bottom</span>
                </button>
              </div>
            )}
          </div>

          {/* Transform Submenu (Matches Reference 5) */}
          <div
            onMouseEnter={() => setActiveSubmenu('transform')}
            className="relative px-3 py-1.5 flex items-center justify-between hover:bg-[#2b66ff] hover:text-white cursor-pointer group"
          >
            <span>Transform</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />

            {activeSubmenu === 'transform' && (
              <div
                className="absolute left-full top-0 ml-1 min-w-56 bg-[#1e2029] border border-[#343746] rounded-md shadow-2xl py-1 text-xs text-neutral-200"
                onMouseEnter={() => setActiveSubmenu('transform')}
              >
                <button
                  onClick={() => {
                    onOpenProperties();
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Edit Transform...</span>
                  <span className="text-[10px] text-neutral-400">Ctrl+E</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateTransform({ x: 0, y: 0, width: 100, height: 100, rotation: 0 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Reset Transform</span>
                  <span className="text-[10px] text-neutral-400">Ctrl+R</span>
                </button>

                <div className="h-px bg-[#2d303e] my-1" />

                <button
                  onClick={() => {
                    onUpdateTransform({ rotation: (source.transform.rotation + 90) % 360 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotate 90 degrees Clockwise</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateTransform({ rotation: (source.transform.rotation - 90 + 360) % 360 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rotate 90 degrees Anti-Clockwise</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateTransform({ rotation: (source.transform.rotation + 180) % 360 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Rotate 180 degrees</span>
                </button>

                <div className="h-px bg-[#2d303e] my-1" />

                <button
                  onClick={() => {
                    // Center in canvas
                    const w = source.transform.width;
                    const h = source.transform.height;
                    onUpdateTransform({ x: (100 - w) / 2, y: (100 - h) / 2 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <Maximize className="w-3 h-3" />
                  <span>Center to Screen</span>
                </button>

                <button
                  onClick={() => {
                    onUpdateTransform({ x: 0, y: 0, width: 100, height: 100 });
                    onClose();
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#2b66ff] hover:text-white text-left"
                >
                  <span>Fit to Screen</span>
                  <span className="text-[10px] text-neutral-400">Ctrl+F</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-[#2d303e] my-1" />

          <div
            onClick={() => {
              onOpenProperties();
              onClose();
            }}
            className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a36] cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span>Filters</span>
          </div>

          <div
            onClick={() => {
              onOpenProperties();
              onClose();
            }}
            className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#282a36] cursor-pointer font-medium"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-400" />
            <span>Properties</span>
          </div>
        </>
      )}
    </div>
  );
};
