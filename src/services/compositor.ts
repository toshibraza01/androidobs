import { SceneItem, SourceItem, SourceTransform } from '../types/obs';

export class CompositorEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;

  // Media source elements
  public cameraVideo: HTMLVideoElement | null = null;
  public screenVideo: HTMLVideoElement | null = null;
  public cameraStream: MediaStream | null = null;
  public screenStream: MediaStream | null = null;

  // Synthetic game simulation canvas
  private gameSimCanvas: HTMLCanvasElement | null = null;
  private gameSimCtx: CanvasRenderingContext2D | null = null;
  private gameSimTime = 0;

  private currentScene: SceneItem | null = null;
  private selectedSourceId: string | null = null;

  private width = 1920;
  private height = 1080;
  private fps = 60;

  // Offscreen canvas for Chroma Key processing
  private chromaCanvas: HTMLCanvasElement | null = null;
  private chromaCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initGameSim();
    this.initChroma();
  }

  private initGameSim() {
    this.gameSimCanvas = document.createElement('canvas');
    this.gameSimCanvas.width = 1280;
    this.gameSimCanvas.height = 720;
    this.gameSimCtx = this.gameSimCanvas.getContext('2d');
  }

  private initChroma() {
    this.chromaCanvas = document.createElement('canvas');
    this.chromaCanvas.width = 640;
    this.chromaCanvas.height = 360;
    this.chromaCtx = this.chromaCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.updateCanvasResolution();
  }

  public setResolution(w: number, h: number, targetFps = 60) {
    this.width = w;
    this.height = h;
    this.fps = targetFps;
    this.updateCanvasResolution();
  }

  private updateCanvasResolution() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public setScene(scene: SceneItem) {
    this.currentScene = scene;
  }

  public setSelectedSource(id: string | null) {
    this.selectedSourceId = id;
  }

  public async startCamera(facingMode: 'user' | 'environment' = 'user'): Promise<boolean> {
    try {
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(t => t.stop());
      }
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (!this.cameraVideo) {
        this.cameraVideo = document.createElement('video');
        this.cameraVideo.autoplay = true;
        this.cameraVideo.playsInline = true;
        this.cameraVideo.muted = true;
      }
      this.cameraVideo.srcObject = this.cameraStream;
      await this.cameraVideo.play();
      return true;
    } catch (err) {
      console.warn('Camera access error:', err);
      return false;
    }
  }

  public stopCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
    }
    if (this.cameraVideo) {
      this.cameraVideo.srcObject = null;
    }
  }

  public async startScreenCapture(): Promise<MediaStream | null> {
    try {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(t => t.stop());
      }
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60 } },
        audio: true
      });

      if (!this.screenVideo) {
        this.screenVideo = document.createElement('video');
        this.screenVideo.autoplay = true;
        this.screenVideo.playsInline = true;
        this.screenVideo.muted = true;
      }
      this.screenVideo.srcObject = this.screenStream;
      await this.screenVideo.play();

      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenCapture();
      };

      return this.screenStream;
    } catch (err) {
      console.warn('Screen capture cancelled or failed:', err);
      return null;
    }
  }

  public stopScreenCapture() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    if (this.screenVideo) {
      this.screenVideo.srcObject = null;
    }
  }

  public startRenderLoop() {
    if (this.animFrameId !== null) return;
    const render = () => {
      this.renderFrame();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  public stopRenderLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateSyntheticGame() {
    if (!this.gameSimCtx || !this.gameSimCanvas) return;
    const ctx = this.gameSimCtx;
    const w = this.gameSimCanvas.width;
    const h = this.gameSimCanvas.height;
    this.gameSimTime += 0.03;

    // Dark cyberpunk background grid
    ctx.fillStyle = '#080914';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grid floor
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    const horizon = h * 0.45;

    // Sun / glow
    const sunGrad = ctx.createRadialGradient(w / 2, horizon - 20, 20, w / 2, horizon - 20, 180);
    sunGrad.addColorStop(0, '#f43f5e');
    sunGrad.addColorStop(0.5, '#d946ef');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w / 2, horizon - 20, 180, 0, Math.PI * 2);
    ctx.fill();

    // Perspective lines
    for (let x = -w; x < w * 2; x += 80) {
      ctx.beginPath();
      ctx.moveTo(w / 2, horizon);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal speed lines
    const offset = (this.gameSimTime * 120) % 40;
    for (let y = horizon; y < h; y += 15 + (y - horizon) * 0.15) {
      ctx.beginPath();
      ctx.moveTo(0, y + (offset * (y - horizon) / (h - horizon)));
      ctx.lineTo(w, y + (offset * (y - horizon) / (h - horizon)));
      ctx.stroke();
    }

    // Racing vehicle simulation
    const carX = w / 2 + Math.sin(this.gameSimTime * 1.5) * 220;
    const carY = h - 140;

    // Vehicle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(carX, carY + 40, 60, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vehicle body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(carX - 45, carY, 90, 36, [10, 10, 4, 4]);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(carX - 30, carY + 6, 60, 16, 4);
    ctx.fill();

    // Thruster glow
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    ctx.fillRect(carX - 35, carY + 34, 16, 8);
    ctx.fillRect(carX + 19, carY + 34, 16, 8);
    ctx.shadowBlur = 0;

    // HUD overlays
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.fillText('SPEED: 248 KM/H', 40, 50);
    ctx.fillText(`SCORE: ${(Math.floor(this.gameSimTime * 1200)).toLocaleString()}`, 40, 80);
    ctx.fillStyle = '#22c55e';
    ctx.fillText('BOOST: [ READY ]', 40, 110);
  }

  private renderFrame() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Base background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);

    // Update synthetic game source
    this.updateSyntheticGame();

    if (!this.currentScene) return;

    // Sort sources by zIndex
    const sortedSources = [...this.currentScene.sources]
      .filter(s => s.visible)
      .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

    for (const src of sortedSources) {
      this.renderSource(src, ctx, w, h);
    }

    // If a source is selected, render transform gizmo (bounding box + handles)
    if (this.selectedSourceId) {
      const selected = this.currentScene.sources.find(s => s.id === this.selectedSourceId && s.visible);
      if (selected) {
        this.renderSelectionGizmo(selected, ctx, w, h);
      }
    }
  }

  private renderSource(src: SourceItem, ctx: CanvasRenderingContext2D, w: number, h: number) {
    const t = src.transform;
    const sx = (t.x / 100) * w;
    const sy = (t.y / 100) * h;
    const sw = (t.width / 100) * w;
    const sh = (t.height / 100) * h;

    ctx.save();
    ctx.globalAlpha = t.opacity;

    // Apply rotation around center
    if (t.rotation !== 0) {
      ctx.translate(sx + sw / 2, sy + sh / 2);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.translate(-(sx + sw / 2), -(sy + sh / 2));
    }

    switch (src.type) {
      case 'camera': {
        if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
          if (src.properties.chromaKey && this.chromaCtx && this.chromaCanvas) {
            this.renderChromaFrame(
              this.cameraVideo,
              ctx,
              sx,
              sy,
              sw,
              sh,
              src.properties.chromaColor || '#00ff00',
              src.properties.chromaSimilarity ?? 90
            );
          } else {
            ctx.drawImage(this.cameraVideo, sx, sy, sw, sh);
          }
        } else {
          // Camera Placeholder Card
          ctx.fillStyle = '#171717';
          ctx.fillRect(sx, sy, sw, sh);
          ctx.strokeStyle = '#262626';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx, sy, sw, sh);

          ctx.fillStyle = '#a3a3a3';
          ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Camera Feed Inactive', sx + sw / 2, sy + sh / 2 - 10);
          ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#737373';
          ctx.fillText('Tap "Start Camera" to bind GL_TEXTURE_EXTERNAL_OES', sx + sw / 2, sy + sh / 2 + 14);
        }
        break;
      }

      case 'screen': {
        if (this.screenVideo && this.screenVideo.readyState >= 2) {
          ctx.drawImage(this.screenVideo, sx, sy, sw, sh);
        } else {
          // Fallback to Synthetic Game Engine when screen share is not enabled
          if (this.gameSimCanvas) {
            ctx.drawImage(this.gameSimCanvas, sx, sy, sw, sh);
          }
        }
        break;
      }

      case 'demo_game': {
        if (this.gameSimCanvas) {
          ctx.drawImage(this.gameSimCanvas, sx, sy, sw, sh);
        }
        break;
      }

      case 'text': {
        const text = src.properties.text || 'OBS Mobile Stream';
        const fontSize = Math.max(16, Math.round((src.properties.fontSize || 24) * (w / 1920)));
        ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", sans-serif`;

        const paddingX = 18;
        const paddingY = 10;
        const textMetrics = ctx.measureText(text);
        const boxW = Math.max(sw, textMetrics.width + paddingX * 2);
        const boxH = Math.max(sh, fontSize + paddingY * 2);

        if (src.properties.textBgColor && src.properties.textBgColor !== 'transparent') {
          ctx.fillStyle = src.properties.textBgColor;
          ctx.beginPath();
          ctx.roundRect(sx, sy, boxW, boxH, 8);
          ctx.fill();
        }

        ctx.fillStyle = src.properties.textColor || '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, sx + paddingX, sy + boxH / 2);
        break;
      }

      case 'color_bars': {
        this.renderSmpteColorBars(ctx, sx, sy, sw, sh);
        break;
      }

      case 'image': {
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, 12);
        ctx.fill();
        ctx.fillStyle = '#818cf8';
        ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Custom Overlay Asset', sx + sw / 2, sy + sh / 2);
        break;
      }
    }

    ctx.restore();
  }

  private renderChromaFrame(
    video: HTMLVideoElement,
    targetCtx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    keyColorHex: string,
    similarity: number = 90
  ) {
    if (!this.chromaCtx || !this.chromaCanvas) return;
    const cw = this.chromaCanvas.width;
    const ch = this.chromaCanvas.height;

    this.chromaCtx.drawImage(video, 0, 0, cw, ch);
    const frame = this.chromaCtx.getImageData(0, 0, cw, ch);
    const l = frame.data.length / 4;

    // Parse key color
    const kr = parseInt(keyColorHex.slice(1, 3), 16) || 0;
    const kg = parseInt(keyColorHex.slice(3, 5), 16) || 255;
    const kb = parseInt(keyColorHex.slice(5, 7), 16) || 0;

    const threshold = similarity;
    const smoothness = 40;

    for (let i = 0; i < l; i++) {
      const r = frame.data[i * 4 + 0];
      const g = frame.data[i * 4 + 1];
      const b = frame.data[i * 4 + 2];

      // Euclidean distance in RGB
      const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
      if (dist < threshold) {
        frame.data[i * 4 + 3] = 0; // Transparent
      } else if (dist < threshold + smoothness) {
        frame.data[i * 4 + 3] = Math.floor(((dist - threshold) / smoothness) * 255);
      }
    }

    this.chromaCtx.putImageData(frame, 0, 0);
    targetCtx.drawImage(this.chromaCanvas, x, y, w, h);
  }

  private renderSmpteColorBars(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const colors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const barW = w / colors.length;
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(x + i * barW, y, barW, h * 0.75);
    }
    // Lower bars
    ctx.fillStyle = '#0000c0';
    ctx.fillRect(x, y + h * 0.75, barW, h * 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + barW, y + h * 0.75, barW, h * 0.25);
    ctx.fillStyle = '#101010';
    ctx.fillRect(x + barW * 2, y + h * 0.75, w - barW * 2, h * 0.25);
  }

  private renderSelectionGizmo(src: SourceItem, ctx: CanvasRenderingContext2D, w: number, h: number) {
    const t = src.transform;
    const sx = (t.x / 100) * w;
    const sy = (t.y / 100) * h;
    const sw = (t.width / 100) * w;
    const sh = (t.height / 100) * h;

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(sx, sy, sw, sh);
    ctx.setLineDash([]);

    // Corner handles
    const handleSize = 12;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;

    const corners = [
      [sx, sy],
      [sx + sw, sy],
      [sx, sy + sh],
      [sx + sw, sy + sh],
    ];

    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.roundRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Header tag with source name
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(sx, sy - 24, Math.min(sw, 140), 20, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(src.name, sx + 6, sy - 10);

    ctx.restore();
  }

  public getCanvasStream(): MediaStream | null {
    if (!this.canvas) return null;
    return this.canvas.captureStream(this.fps);
  }

  public destroy() {
    this.stopRenderLoop();
    this.stopCamera();
    this.stopScreenCapture();
  }
}

export const compositor = new CompositorEngine();
