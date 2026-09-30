import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Film,
  Sparkles,
} from 'lucide-react';
import { ShortJob, ShortScene, SubtitleWord } from '../types/index.ts';
import { api } from '../services/api.ts';

interface VideoPlayerPreviewProps {
  job: ShortJob;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({ job }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const duration = job.script?.estimatedDurationSec || job.options.duration || 30;
  const scenes: ShortScene[] = job.script?.scenes || [];
  const subtitles: SubtitleWord[] = job.script?.subtitles || [];

  // Determine active scene based on currentTime
  const currentScene =
    scenes.find((s) => currentTime >= s.startSec && currentTime < s.endSec) ||
    scenes[scenes.length - 1] ||
    null;

  // Determine current active subtitle words
  const activeWordIndex = subtitles.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  // Group subtitles in phrases of 4-6 words around active word
  const activePhraseWords =
    activeWordIndex >= 0
      ? subtitles.slice(
          Math.max(0, activeWordIndex - 2),
          Math.min(subtitles.length, activeWordIndex + 3)
        )
      : [];

  // Audio setup
  const audioSrc = job.audioUrl ? api.getAudioUrl(job.id) : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.ended) {
        setIsPlaying(false);
        setCurrentTime(duration);
      }
    };

    const handleCanPlay = () => setAudioLoaded(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [duration]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Draw background gradient based on active scene
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      const primaryCol = currentScene?.colorTheme.primary || '#ff0055';
      const secondaryCol = currentScene?.colorTheme.secondary || '#00f0ff';
      const darkBg = currentScene?.colorTheme.background || '#0d0e15';

      bgGrad.addColorStop(0, darkBg);
      bgGrad.addColorStop(0.5, primaryCol + '33');
      bgGrad.addColorStop(1, '#05070e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Kinetic animated decorative elements
      const t = currentTime * 2;
      ctx.save();

      // Ambient radial lighting
      const radGrad = ctx.createRadialGradient(
        w / 2 + Math.sin(t) * 80,
        h / 3 + Math.cos(t) * 60,
        20,
        w / 2,
        h / 3,
        w * 0.7
      );
      radGrad.addColorStop(0, primaryCol + '44');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);

      // Scene Section Badge (Hook / Intro / Facts / Conclusion / CTA)
      const sectionName = currentScene?.section?.toUpperCase() || 'SHORTS';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(w / 2 - 140, 160, 280, 48, 24);
      ctx.fill();

      ctx.fillStyle = primaryCol;
      ctx.font = '900 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText(
        `● ${sectionName} (${currentScene ? `${Math.round(currentScene.startSec)}s - ${Math.round(currentScene.endSec)}s` : ''})`,
        w / 2,
        192
      );

      // Center Visual Prompt & Impact Text Overlay
      if (currentScene?.textOverlay) {
        ctx.save();
        ctx.shadowColor = primaryCol;
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 46px "Montserrat", sans-serif';
        ctx.textAlign = 'center';

        const lines = wrapText(ctx, currentScene.textOverlay.toUpperCase(), w - 120);
        const startY = h * 0.36;
        lines.forEach((line, idx) => {
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(line, w / 2, startY + idx * 56);
          ctx.fillText(line, w / 2, startY + idx * 56);
        });
        ctx.restore();
      }

      // Visual Scene Description card (Sub-visual)
      if (currentScene?.visualPrompt) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.roundRect(60, h * 0.52, w - 120, 140, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SCENE VISUALIZATION:', 84, h * 0.52 + 36);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        const promptLines = wrapText(ctx, currentScene.visualPrompt, w - 168);
        promptLines.slice(0, 3).forEach((line, i) => {
          ctx.fillText(line, 84, h * 0.52 + 70 + i * 26);
        });
      }

      // VIRAL TIKTOK / SHORTS CAPTIONS (Dynamic Word-Level Highlighting)
      if (activePhraseWords.length > 0) {
        const captionY = h * 0.76;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 52px "Montserrat", sans-serif';

        // Measure total width to center words
        const wordMetrics = activePhraseWords.map((item) => ({
          ...item,
          width: ctx.measureText(item.word.toUpperCase() + ' ').width,
        }));
        const totalPhraseWidth = wordMetrics.reduce((acc, curr) => acc + curr.width, 0);

        let currX = (w - totalPhraseWidth) / 2;

        wordMetrics.forEach((item) => {
          const isCurrent = currentTime >= item.start && currentTime <= item.end;
          const wordText = item.word.toUpperCase();

          ctx.lineWidth = 10;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(wordText, currX + item.width / 2, captionY);

          if (isCurrent) {
            // Bright animated popping active word
            ctx.shadowColor = '#FFE600';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#FFE600';
            ctx.fillText(wordText, currX + item.width / 2, captionY);
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(wordText, currX + item.width / 2, captionY);
          }

          currX += item.width;
        });

        ctx.restore();
      }

      // Top Progress Bar
      const progressRatio = Math.min(1, currentTime / duration);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(40, 50, w - 80, 8);
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(40, 50, (w - 80) * progressRatio, 8);

      // Watermark / Brand in bottom right
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('#Shorts', w - 40, h - 50);

      ctx.restore();

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [currentTime, isPlaying, currentScene, activePhraseWords, duration]);

  // Helper to wrap text
  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Play / Pause toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (audio) audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= duration) {
        setCurrentTime(0);
        if (audio) audio.currentTime = 0;
      }
      if (audio) {
        audio.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  // Replay
  const handleReplay = () => {
    const audio = audioRef.current;
    setCurrentTime(0);
    if (audio) audio.currentTime = 0;
    if (!isPlaying) {
      setIsPlaying(true);
      if (audio) audio.play().catch(() => {});
    }
  };

  // Manual Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Download Video Blob (recorded from 9:16 Canvas)
  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(job.metadata?.title || 'youtube-short').replace(/[^\w-]/g, '_')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      recorder.start();
      // Record 3 seconds sample or full duration
      setTimeout(() => {
        recorder.stop();
      }, 3500);
    } catch (e) {
      console.error('Download video failed:', e);
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden Audio Element */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          muted={isMuted}
          preload="auto"
        />
      )}

      {/* 9:16 Vertical Phone Mockup Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black flex flex-col justify-between select-none group"
      >
        {/* Real 1080x1920 High-Res Canvas */}
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
        />

        {/* Play/Pause Overlay indicator when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-all"
          >
            <div className="w-18 h-18 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all">
              <Play className="w-9 h-9 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Video Player Floating Overlay Controls */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-95 group-hover:opacity-100 transition-opacity">
          {/* Timeline Scrubber */}
          <div className="space-y-1 mb-2">
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-300">
              <span>{currentTime.toFixed(1)}s</span>
              <span>{duration}s</span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleReplay}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                title="Replay from start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/80 text-white tracking-wider">
                9:16 HD
              </span>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                title="Download Short Video"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Specifications & Resolution Badge */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 font-mono">
          1080x1920
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80">
          9:16 Vertical
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80">
          {duration}s Duration
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-emerald-400 font-semibold">
          Synced Captions ✓
        </span>
      </div>
    </div>
  );
};
