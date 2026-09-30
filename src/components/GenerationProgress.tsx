import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Mic,
  Subtitles,
  Film,
  Tag,
  ThumbsUp,
  Brain,
} from 'lucide-react';
import { ShortJob, JobStepStatus } from '../types/index.ts';

interface GenerationProgressProps {
  job: ShortJob;
  onRetry: () => void;
  onViewPreview: () => void;
}

const STEP_ICONS: Record<JobStepStatus, React.ReactNode> = {
  queued: <Clock className="w-4 h-4" />,
  understanding_topic: <Brain className="w-4 h-4" />,
  writing_script: <Sparkles className="w-4 h-4" />,
  creating_scenes: <Layers className="w-4 h-4" />,
  generating_visuals: <Film className="w-4 h-4" />,
  generating_voiceover: <Mic className="w-4 h-4" />,
  creating_captions: <Subtitles className="w-4 h-4" />,
  rendering_video: <Film className="w-4 h-4" />,
  preparing_metadata: <Tag className="w-4 h-4" />,
  ready: <ThumbsUp className="w-4 h-4" />,
  failed: <AlertCircle className="w-4 h-4" />,
};

const STEP_ORDER: { status: JobStepStatus; title: string; subtitle: string }[] = [
  {
    status: 'understanding_topic',
    title: '1. Understanding topic',
    subtitle: 'Researching current facts and viral angles',
  },
  {
    status: 'writing_script',
    title: '2. Writing script',
    subtitle: 'Structuring 0-2s hook and 20-30s narration',
  },
  {
    status: 'creating_scenes',
    title: '3. Creating scenes',
    subtitle: 'Dividing into timed visual blocks and color themes',
  },
  {
    status: 'generating_visuals',
    title: '4. Generating visuals',
    subtitle: 'Preparing high-contrast 9:16 vertical scene compositions',
  },
  {
    status: 'generating_voiceover',
    title: '5. Generating voiceover',
    subtitle: 'Synthesizing energetic narrator voice and WAV audio',
  },
  {
    status: 'creating_captions',
    title: '6. Creating captions',
    subtitle: 'Timing synchronized, high-impact word highlights',
  },
  {
    status: 'rendering_video',
    title: '7. Rendering video',
    subtitle: 'Assembling 1080x1920 vertical MP4 with music balance',
  },
  {
    status: 'preparing_metadata',
    title: '8. Preparing YouTube metadata',
    subtitle: 'Generating title, description, and hashtags',
  },
  {
    status: 'ready',
    title: '9. Ready for upload',
    subtitle: 'Preview approved and ready for YouTube upload',
  },
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  job,
  onRetry,
  onViewPreview,
}) => {
  const currentStepIndex = STEP_ORDER.findIndex((s) => s.status === job.status);
  const isFailed = job.status === 'failed';
  const isReady = job.status === 'ready';

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Pipeline Status
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                "{job.options.topic}"
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {isFailed ? 'Generation Encountered an Error' : isReady ? 'Short Generated Successfully!' : 'Creating YouTube Short...'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {isReady && (
              <button
                onClick={onViewPreview}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>View & Upload Short</span>
                <ThumbsUp className="w-4 h-4" />
              </button>
            )}

            {isFailed && (
              <button
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Generation</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Callout if failed */}
        {isFailed && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-200">Stage Failed: {job.failedStep || job.status}</p>
              <p className="text-xs text-rose-300/90">{job.error || 'Failed to complete video pipeline stage.'}</p>
              <p className="text-xs text-slate-400 pt-1">
                Your topic and options are preserved. Click "Retry Generation" to resume or check API credentials in the Status tab.
              </p>
            </div>
          </div>
        )}

        {/* Real Step Progression Grid */}
        <div className="mt-8 space-y-3">
          {STEP_ORDER.map((step, idx) => {
            let state: 'completed' | 'active' | 'pending' | 'failed' = 'pending';

            if (isReady) {
              state = 'completed';
            } else if (isFailed) {
              if (idx < currentStepIndex) state = 'completed';
              else if (idx === currentStepIndex || step.status === job.failedStep) state = 'failed';
              else state = 'pending';
            } else {
              if (idx < currentStepIndex) state = 'completed';
              else if (idx === currentStepIndex) state = 'active';
              else state = 'pending';
            }

            return (
              <div
                key={step.status}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  state === 'active'
                    ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-500/10'
                    : state === 'completed'
                    ? 'bg-slate-800/40 border-slate-700/60'
                    : state === 'failed'
                    ? 'bg-rose-500/10 border-rose-500/40'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                      state === 'active'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : state === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : state === 'failed'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : state === 'active' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      STEP_ICONS[step.status]
                    )}
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        state === 'active'
                          ? 'text-white'
                          : state === 'completed'
                          ? 'text-slate-200'
                          : state === 'failed'
                          ? 'text-rose-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-slate-400">{step.subtitle}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {state === 'completed' && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      Done ✓
                    </span>
                  )}
                  {state === 'active' && (
                    <span className="text-xs font-semibold text-red-400 animate-pulse">
                      In progress...
                    </span>
                  )}
                  {state === 'failed' && (
                    <span className="text-xs font-semibold text-rose-400">Failed</span>
                  )}
                  {state === 'pending' && (
                    <span className="text-xs font-semibold text-slate-600">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
