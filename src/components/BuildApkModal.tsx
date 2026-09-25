import React, { useState } from 'react';
import { Package, Download, Terminal, CheckCircle2, Copy, Check, ExternalLink, X, Smartphone, Cpu, ShieldCheck } from 'lucide-react';
import { generateAndroidStudioProjectZip } from '../services/apkProjectExporter';

interface BuildApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuildApkModal: React.FC<BuildApkModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'cli' | 'github'>('studio');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await generateAndroidStudioProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'OBS-Mobile-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Failed to create Android project zip:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Build & Export OBS Mobile APK
              </h2>
              <p className="text-[11px] text-neutral-400">
                Native Android arm64-v8a EGL Compositor & MediaCodec Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 border-b border-neutral-800 flex gap-2 bg-neutral-900/60 text-xs">
          <button
            onClick={() => setActiveTab('studio')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'studio'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Android Studio (1-Click)
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'cli'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Terminal / Gradle
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            GitHub Actions CI (Cloud)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs">
          {activeTab === 'studio' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white">Download Ready-to-Build Project</span>
                    <p className="text-neutral-400 text-xs">
                      Contains the complete Gradle structure, AndroidManifest, CameraX, Room DB, NDK CMake, and Kotlin sources.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadZip}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Generating ZIP...' : 'Download Project .ZIP'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SDK 34 (Android 14)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NDK C++ (CMake 3.22)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Compose & MediaCodec</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-semibold text-white text-xs uppercase tracking-wider">
                  3 Steps to Build the APK in Android Studio:
                </span>
                <ol className="space-y-2 text-neutral-300">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center text-[10px] shrink-0">1</span>
                    <div>
                      <strong>Unzip the downloaded archive</strong> and open Android Studio (Hedgehog 2023.1+ or Ladybug recommended).
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center text-[10px] shrink-0">2</span>
                    <div>
                      Choose <strong>File &gt; Open</strong> and select the unzipped <code className="font-mono text-emerald-400">OBS-Mobile-Android-Project</code> directory. Let Gradle finish syncing.
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 font-mono flex items-center justify-center text-[10px] shrink-0">3</span>
                    <div>
                      Click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. The compiled APK will be generated at:
                      <div className="mt-1 font-mono text-[11px] text-emerald-400 bg-neutral-900 px-2 py-1 rounded">
                        app/build/outputs/apk/debug/app-debug.apk
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="flex flex-col gap-3">
              <p className="text-neutral-300">
                To build the APK locally from your terminal using Gradle wrapper:
              </p>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-neutral-400 font-medium text-[11px]">
                  <span>1. Build Debug APK</span>
                  <button
                    onClick={() => copyToClipboard('./gradlew assembleDebug', 'cmd1')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-emerald-300 text-xs overflow-x-auto">
                  ./gradlew assembleDebug --stacktrace
                </pre>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-neutral-400 font-medium text-[11px]">
                  <span>2. Build Release APK</span>
                  <button
                    onClick={() => copyToClipboard('./gradlew assembleRelease', 'cmd2')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd2' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-emerald-300 text-xs overflow-x-auto">
                  ./gradlew assembleRelease
                </pre>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-neutral-400 font-medium text-[11px]">
                  <span>3. Install Directly to Android Phone / Emulator via ADB</span>
                  <button
                    onClick={() => copyToClipboard('adb install -r app/build/outputs/apk/debug/app-debug.apk', 'cmd3')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCmd === 'cmd3' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'cmd3' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-neutral-300 text-xs overflow-x-auto">
                  adb install -r app/build/outputs/apk/debug/app-debug.apk
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white">Connected Repository: toshibraza01/androidobs</span>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Your repository is connected at <code className="font-mono text-emerald-400">https://github.com/toshibraza01/androidobs</code>. The GitHub Actions workflow file <code className="font-mono text-white">.github/workflows/build-apk.yml</code> builds the APK using GitHub's Ubuntu runners.
                  </p>
                </div>
              </div>

              {/* Direct Actions Link */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    GitHub Actions Workflows
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    https://github.com/toshibraza01/androidobs/actions
                  </span>
                </div>
                <a
                  href="https://github.com/toshibraza01/androidobs/actions"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors text-xs shadow-md shadow-emerald-950/40"
                >
                  <span>Open Actions Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Quick Push Commands if needed */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-neutral-400 font-medium text-[11px]">
                  <span>Git Sync Commands for toshibraza01/androidobs</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git remote set-url origin https://github.com/toshibraza01/androidobs.git\ngit add .\ngit commit -m "fix: update GitHub Actions workflow for Android APK build"\ngit push origin main`,
                        'push_commands'
                      )
                    }
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedCmd === 'push_commands' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'push_commands' ? 'Copied' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-emerald-300 text-[11px] overflow-x-auto leading-relaxed">
{`git remote set-url origin https://github.com/toshibraza01/androidobs.git
git add .
git commit -m "fix: update GitHub Actions workflow for Android APK build"
git push origin main`}
                </pre>
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between text-neutral-400 font-medium text-[11px]">
                  <span>Workflow File (.github/workflows/build-apk.yml)</span>
                  <button
                    onClick={() => copyToClipboard(`name: Build Android APK
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Set up Android SDK Environment
        run: |
          echo "$ANDROID_HOME/cmdline-tools/latest/bin" >> $GITHUB_PATH
          echo "$ANDROID_HOME/platform-tools" >> $GITHUB_PATH
          export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
          if command -v sdkmanager >/dev/null 2>&1; then
            yes | sdkmanager --licenses || true
            sdkmanager --install "ndk;26.1.10909125" "cmake;3.22.1" || true
          fi
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.4'
      - name: Build Debug APK with Gradle
        run: |
          if [ -d "android-project" ] && [ -f "android-project/build.gradle.kts" ]; then
            cd android-project
          fi
          chmod +x ./gradlew || true
          ./gradlew assembleDebug --stacktrace --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: OBS-Mobile-Debug-APK
          path: |
            **/build/outputs/apk/debug/*.apk
          if-no-files-found: warn`, 'ghw')}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCmd === 'ghw' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'ghw' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-300 max-h-36 overflow-y-auto">
{`name: Build Android APK
on: [push, pull_request, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Set up Android SDK Environment
        run: |
          echo "$ANDROID_HOME/cmdline-tools/latest/bin" >> $GITHUB_PATH
          echo "$ANDROID_HOME/platform-tools" >> $GITHUB_PATH
          export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
          if command -v sdkmanager >/dev/null 2>&1; then
            yes | sdkmanager --licenses || true
            sdkmanager --install "ndk;26.1.10909125" "cmake;3.22.1" || true
          fi
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.4'
      - name: Build Debug APK with Gradle
        run: |
          if [ -d "android-project" ] && [ -f "android-project/build.gradle.kts" ]; then
            cd android-project
          fi
          chmod +x ./gradlew || true
          ./gradlew assembleDebug --stacktrace --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: OBS-Mobile-Debug-APK
          path: |
            **/build/outputs/apk/debug/*.apk
          if-no-files-found: warn`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Target: Android 10+ (API 29–34) · OpenGL ES 3.0 · ARM64-v8a
          </span>
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 text-xs transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Packaging...' : 'Download Project .ZIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
