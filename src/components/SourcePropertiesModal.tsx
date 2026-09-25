import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Video, Monitor, Type, Image as ImageIcon, Sparkles } from 'lucide-react';
import { SourceItem } from '../types/obs';

interface SourcePropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceItem | null;
  onUpdateSourceProperties: (sourceId: string, properties: Partial<SourceItem['properties']>) => void;
  onUpdateSourceName: (sourceId: string, name: string) => void;
}

export const SourcePropertiesModal: React.FC<SourcePropertiesModalProps> = ({
  isOpen,
  onClose,
  source,
  onUpdateSourceProperties,
  onUpdateSourceName
}) => {
  if (!isOpen || !source) return null;

  const [name, setName] = useState(source.name);
  const [localFile, setLocalFile] = useState(true);
  const [filePath, setFilePath] = useState('/Writing/Commissions-TechRadar/176-OBS Studio/Vids/Untitled.mp4');
  const [loop, setLoop] = useState(true);
  const [restartOnActive, setRestartOnActive] = useState(true);
  const [hardwareDecoding, setHardwareDecoding] = useState(true);
  const [hideWhenEnded, setHideWhenEnded] = useState(false);

  // Chroma key state
  const [chromaKey, setChromaKey] = useState(source.properties.chromaKey || false);
  const [chromaColor, setChromaColor] = useState(source.properties.chromaColor || '#00ff00');
  const [chromaSimilarity, setChromaSimilarity] = useState(source.properties.chromaSimilarity ?? 90);

  // Text source state
  const [text, setText] = useState(source.properties.text || 'LIVE STREAM TITLE');
  const [textColor, setTextColor] = useState(source.properties.textColor || '#ffffff');
  const [textBgColor, setTextBgColor] = useState(source.properties.textBgColor || '#e11d48');

  // Camera facing
  const [facingMode, setFacingMode] = useState(source.properties.facingMode || 'user');

  useEffect(() => {
    setName(source.name);
    setChromaKey(source.properties.chromaKey || false);
    setChromaColor(source.properties.chromaColor || '#00ff00');
    setChromaSimilarity(source.properties.chromaSimilarity ?? 90);
    setText(source.properties.text || 'LIVE STREAM TITLE');
    setTextColor(source.properties.textColor || '#ffffff');
    setTextBgColor(source.properties.textBgColor || '#e11d48');
    setFacingMode(source.properties.facingMode || 'user');
  }, [source]);

  const handleSave = () => {
    onUpdateSourceName(source.id, name);
    onUpdateSourceProperties(source.id, {
      chromaKey,
      chromaColor,
      chromaSimilarity,
      text,
      textColor,
      textBgColor,
      facingMode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl bg-[#1d1f28] border border-[#303342] rounded-lg shadow-2xl flex flex-col overflow-hidden font-sans text-neutral-200">
        {/* Title Bar */}
        <div className="h-8 bg-[#16171e] border-b border-[#2a2c3a] px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-300">
              Properties for '{source.name}'
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto bg-[#1e202a]">
          {/* Source Name Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Source Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
            />
          </div>

          {/* Media / Video Options (matching Reference 3) */}
          {(source.type === 'demo_game' || source.type === 'image') && (
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFile}
                  onChange={(e) => setLocalFile(e.target.checked)}
                  className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                />
                <span>Local File</span>
              </label>

              {localFile && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Local File
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="flex-1 h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 font-mono focus:outline-hidden focus:border-[#2b66ff]"
                    />
                    <button
                      type="button"
                      className="h-8 px-3 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300 flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-[#2a2c3a]">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loop}
                    onChange={(e) => setLoop(e.target.checked)}
                    className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                  />
                  <span>Loop</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restartOnActive}
                    onChange={(e) => setRestartOnActive(e.target.checked)}
                    className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                  />
                  <span>Restart playback when source becomes active</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hardwareDecoding}
                    onChange={(e) => setHardwareDecoding(e.target.checked)}
                    className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                  />
                  <span>Use hardware decoding when available</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideWhenEnded}
                    onChange={(e) => setHideWhenEnded(e.target.checked)}
                    className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                  />
                  <span>Show nothing when playback ends</span>
                </label>
              </div>
            </div>
          )}

          {/* Camera Source Options */}
          {source.type === 'camera' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Camera Lens / Facing Mode
                </label>
                <select
                  value={facingMode}
                  onChange={(e) => setFacingMode(e.target.value as any)}
                  className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                >
                  <option value="user">Front Camera (Selfie / Streamer Facecam)</option>
                  <option value="environment">Back Camera (Main Sensor / Wide)</option>
                </select>
              </div>

              {/* Chroma Key / Green Screen Filter */}
              <div className="p-3 bg-[#242634] border border-[#343748] rounded space-y-2.5">
                <label className="flex items-center justify-between text-xs text-neutral-200 cursor-pointer font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Chroma Key (Green Screen Removal)
                  </span>
                  <input
                    type="checkbox"
                    checked={chromaKey}
                    onChange={(e) => setChromaKey(e.target.checked)}
                    className="rounded border-[#3c3f50] bg-[#282a36] text-[#2b66ff] focus:ring-0"
                  />
                </label>

                {chromaKey && (
                  <div className="space-y-2 pt-2 border-t border-[#343748]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-300">Key Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={chromaColor}
                          onChange={(e) => setChromaColor(e.target.value)}
                          className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-neutral-300">{chromaColor}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-neutral-300 mb-1">
                        <span>Similarity (Tolerance)</span>
                        <span>{chromaSimilarity}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="180"
                        value={chromaSimilarity}
                        onChange={(e) => setChromaSimilarity(Number(e.target.value))}
                        className="w-full accent-[#2b66ff]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text Source Options */}
          {source.type === 'text' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Text Content
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-[#282a36] border border-[#3c3f50] rounded text-neutral-200 focus:outline-hidden focus:border-[#2b66ff]"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-neutral-300">{textColor}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Badge Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textBgColor}
                      onChange={(e) => setTextBgColor(e.target.value)}
                      className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-neutral-300">{textBgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Defaults on left, Cancel / OK on right */}
        <div className="h-12 bg-[#16171e] border-t border-[#2a2c3a] px-4 flex items-center justify-between">
          <button
            type="button"
            className="px-3 py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300"
          >
            Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#282a36] hover:bg-[#343746] border border-[#3c3f50] rounded text-xs text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
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
