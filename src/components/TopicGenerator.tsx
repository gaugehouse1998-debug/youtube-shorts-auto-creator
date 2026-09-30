import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Palette,
  Mic,
  Globe,
  Flame,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  GenerationOptions,
  VideoDuration,
  VideoLanguage,
  VideoStyle,
  VideoVoice,
} from '../types/index.ts';

interface TopicGeneratorProps {
  onGenerate: (options: GenerationOptions) => void;
  isGenerating: boolean;
}

const TOPIC_SUGGESTIONS = [
  '5 interesting facts about Dubai',
  '3 surprising facts about Pakistan',
  'Why you should never sleep on your stomach',
  '7 subtle psychological tricks that always work',
  'The mysterious secret beneath the Sahara desert',
  'Top 3 richest countries in the world in 2026',
];

export const TopicGenerator: React.FC<TopicGeneratorProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState<VideoDuration>(30);
  const [style, setStyle] = useState<VideoStyle>('Educational');
  const [voice, setVoice] = useState<VideoVoice>('Male');
  const [language, setLanguage] = useState<VideoLanguage>('English');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;
    onGenerate({
      topic: topic.trim(),
      duration,
      style,
      voice,
      language,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Instant AI Shorts Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create a new YouTube Short
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Enter one topic. We research, write the hook, synthesize speech, create captions, and render a 9:16 vertical Short ready for YouTube.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Large Topic Input Box */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Topic <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter your video topic... (e.g. 5 interesting facts about Dubai)"
                  disabled={isGenerating}
                  className="w-full px-5 py-4 bg-slate-800/90 border border-slate-700/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-2xl text-white text-base sm:text-lg placeholder:text-slate-500 transition-all outline-none disabled:opacity-60 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    const random = TOPIC_SUGGESTIONS[Math.floor(Math.random() * TOPIC_SUGGESTIONS.length)];
                    setTopic(random);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-750 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-650 transition-all"
                >
                  Surprise me
                </button>
              </div>

              {/* Topic suggestions pill list */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Ideas:
                </span>
                {TOPIC_SUGGESTIONS.slice(0, 4).map((suggested, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(suggested)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 transition-all truncate max-w-[220px]"
                  >
                    {suggested}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
              {/* Duration */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span>Duration</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                  {([20, 25, 30] as VideoDuration[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        duration === d
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>Style</span>
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as VideoStyle)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-white focus:border-red-500 focus:outline-none transition-all"
                >
                  <option value="Educational">Educational</option>
                  <option value="Documentary">Documentary</option>
                  <option value="News-style">News-style</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Cinematic">Cinematic</option>
                  <option value="UGC-style">UGC-style</option>
                  <option value="Facts">Facts</option>
                  <option value="Motivational">Motivational</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as VideoLanguage)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-white focus:border-red-500 focus:outline-none transition-all"
                >
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Roman Urdu">Roman Urdu</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>

              {/* Voice */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                  {(['Male', 'Female'] as VideoVoice[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVoice(v)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        voice === v
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Structure Breakdown Note */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Viral Short Timing Formula ({duration}s):</span>{' '}
                0–2s Scroll-stopping hook → 2–7s Introduction → 7–20s Core Facts → 20–27s Climax/Payoff → 27–{duration}s Call-to-action.
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={!topic.trim() || isGenerating}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:via-rose-500 hover:to-amber-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Video Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-current" />
                  <span>GENERATE SHORT</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
