import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Folder, Code2, Cpu, Package } from 'lucide-react';
import { ANDROID_FILES } from '../data/androidSourceCode';

interface AndroidCodeExplorerProps {
  onOpenBuildApk?: () => void;
}

export const AndroidCodeExplorer: React.FC<AndroidCodeExplorerProps> = ({ onOpenBuildApk }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = ANDROID_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate text bundle of all files
    const bundleText = ANDROID_FILES.map(f => `// ==========================================\n// File: ${f.path}\n// Description: ${f.description}\n// ==========================================\n\n${f.code}\n\n`).join('\n');
    const blob = new Blob([bundleText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OBS_Mobile_Android_Architecture_Bundle.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4">
      {/* Sidebar: File Tree */}
      <div className="w-full md:w-80 bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Android Kotlin / NDK
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenBuildApk && (
              <button
                onClick={onOpenBuildApk}
                className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors text-[10px] font-semibold flex items-center gap-1"
                title="Build and Export APK"
              >
                <Package className="w-3 h-3 text-emerald-400" />
                <span>Build APK</span>
              </button>
            )}
            <button
              onClick={handleDownloadAll}
              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-[10px] flex items-center gap-1"
              title="Download Architecture Code Bundle"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {ANDROID_FILES.map((file, idx) => {
            const isSelected = idx === selectedFileIdx;
            const isCpp = file.language === 'cpp' || file.language === 'cmake';
            return (
              <button
                key={file.filename}
                onClick={() => setSelectedFileIdx(idx)}
                className={`px-3 py-2 rounded-lg text-left text-xs transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-rose-500/15 border border-rose-500/40 text-white font-semibold'
                    : 'bg-neutral-950/40 border border-neutral-800/40 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                {isCpp ? (
                  <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                ) : (
                  <FileCode className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="truncate flex-1">
                  <div className="truncate font-mono">{file.filename}</div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {file.path.split('/').slice(0, 3).join('/')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Code Viewer */}
      <div className="flex-1 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col overflow-hidden min-h-[400px]">
        {/* Code Header */}
        <div className="h-11 px-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2 truncate">
            <Code2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-mono text-neutral-200 font-semibold truncate">{currentFile.path}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700/80"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* File Description Subtitle */}
        <div className="px-4 py-2 bg-neutral-900/40 border-b border-neutral-800/60 text-[11px] text-neutral-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>{currentFile.description}</span>
        </div>

        {/* Code Pre/Code Area with line numbers */}
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed bg-neutral-950 select-text">
          <pre className="table w-full">
            {currentFile.code.split('\n').map((line, i) => (
              <div key={i} className="table-row hover:bg-neutral-900/40">
                <span className="table-cell select-none pr-4 text-right text-neutral-600 text-[11px] w-10">
                  {i + 1}
                </span>
                <span className="table-cell whitespace-pre">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};
