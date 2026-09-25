import React from 'react';
import { ArrowRight, SlidersHorizontal, Scissors, Play } from 'lucide-react';

interface StudioModeControlsProps {
  onTransition: () => void;
  onCut: () => void;
  transitionType: string;
  durationMs: number;
  faderPosition: number;
  onFaderChange: (val: number) => void;
}

export const StudioModeControls: React.FC<StudioModeControlsProps> = ({
  onTransition,
  onCut,
  transitionType,
  durationMs,
  faderPosition,
  onFaderChange
}) => {
  return (
    <div className="w-24 bg-[#181921] border-x border-[#2b2d3a] flex flex-col items-center justify-center p-2 gap-3 select-none shrink-0 font-sans">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        Transition
      </span>

      {/* Main Transition Button */}
      <button
        onClick={onTransition}
        className="w-full py-2 px-1 bg-[#2b66ff] hover:bg-[#1e54e0] text-white rounded text-xs font-semibold shadow-md flex flex-col items-center gap-1 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span className="text-[11px]">Transition</span>
      </button>

      {/* Quick Cut Button */}
      <button
        onClick={onCut}
        className="w-full py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
      >
        <Scissors className="w-3 h-3 text-neutral-400" />
        <span>Cut</span>
      </button>

      {/* Fade Button */}
      <button
        onClick={onTransition}
        className="w-full py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] text-neutral-200 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
      >
        <span>Fade</span>
      </button>

      {/* Transition T-Bar Slider */}
      <div className="flex flex-col items-center gap-1 pt-2 w-full">
        <span className="text-[9px] text-neutral-400 uppercase font-mono">T-Bar</span>
        <input
          type="range"
          min="0"
          max="100"
          value={faderPosition}
          onChange={(e) => onFaderChange(Number(e.target.value))}
          className="w-full accent-[#2b66ff] h-1.5 bg-[#282a36] rounded cursor-pointer"
        />
        <span className="text-[10px] font-mono text-neutral-400">{durationMs}ms</span>
      </div>
    </div>
  );
};
