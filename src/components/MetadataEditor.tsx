import React, { useState } from 'react';
import {
  UploadCloud,
  Edit3,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  FileText,
  Calendar,
  Layers,
  Save,
  Youtube,
  ImageIcon,
  Wand2,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  ShortJob,
  UploadVisibility,
  UploadRecord,
  YouTubeChannel,
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface MetadataEditorProps {
  job: ShortJob;
  channel: YouTubeChannel;
  onUpdateMetadata: (updates: {
    title?: string;
    description?: string;
    hashtags?: string[];
    fullNarration?: string;
  }) => Promise<void>;
  onRegenerate: () => void;
  onGenerateAgain: () => void;
  onUploadToYouTube: (visibility: UploadVisibility, scheduledAt?: string) => Promise<UploadRecord>;
  onOpenConnectModal: () => void;
}

const THUMBNAIL_STYLES = [
  'Bold & Punchy (Viral Shorts)',
  'Cinematic Action & Depth',
  'Dramatic Mystery & Glow',
  'High Contrast Neon Cyber',
  'Photorealistic Narrative',
];

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  job,
  channel,
  onUpdateMetadata,
  onRegenerate,
  onGenerateAgain,
  onUploadToYouTube,
  onOpenConnectModal,
}) => {
  const [title, setTitle] = useState(job.metadata?.title || '');
  const [description, setDescription] = useState(job.metadata?.description || '');
  const [hashtags, setHashtags] = useState<string[]>(job.metadata?.hashtags || []);
  const [narration, setNarration] = useState(job.script?.fullNarration || '');
  const [newTagInput, setNewTagInput] = useState('');

  // AI Thumbnail Generator state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    job.metadata?.thumbnailUrl || job.thumbnailUrl || null
  );
  const [thumbnailStyle, setThumbnailStyle] = useState(THUMBNAIL_STYLES[0]);
  const [customThumbPrompt, setCustomThumbPrompt] = useState(
    job.metadata?.thumbnailPrompt ||
      `Dramatic, cinematic viral 9:16 vertical YouTube Shorts thumbnail about "${job.options.topic}". Focusing on the hook: "${job.script?.hook || title}". Vibrant colors, bold lighting, extreme detail, 8k resolution, mobile-optimized cover.`
  );
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [thumbError, setThumbError] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<UploadVisibility>('public');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const [activeAccordion, setActiveAccordion] = useState<'meta' | 'thumbnail' | 'script' | 'scenes'>('meta');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessRecord, setUploadSuccessRecord] = useState<UploadRecord | null>(null);

  // Character limit check
  const titleCharCount = title.length;
  const isTitleOver = titleCharCount > 100;

  // Save edits
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateMetadata({
        title,
        description,
        hashtags,
        fullNarration: narration,
      });
    } catch (e: any) {
      console.error('Failed to save metadata:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate AI Thumbnail using Gemini Image Capabilities
  const handleGenerateThumbnail = async () => {
    setIsGeneratingThumb(true);
    setThumbError(null);
    try {
      const res = await api.generateThumbnail(
        job.id,
        thumbnailStyle,
        customThumbPrompt
      );
      setThumbnailUrl(res.thumbnailUrl);
      if (res.prompt) setCustomThumbPrompt(res.prompt);
    } catch (err: any) {
      console.error('Thumbnail generation error:', err);
      setThumbError(err.message || 'Failed to generate thumbnail');
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  // Add hashtag
  const handleAddTag = () => {
    let t = newTagInput.trim();
    if (!t) return;
    if (!t.startsWith('#')) t = `#${t}`;
    if (!hashtags.includes(t)) {
      const updated = [...hashtags, t];
      setHashtags(updated);
      setNewTagInput('');
    }
  };

  // Remove hashtag
  const handleRemoveTag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  // Upload handler
  const handleUpload = async () => {
    if (!channel.connected) {
      onOpenConnectModal();
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // First save any unsaved metadata edits
      await onUpdateMetadata({
        title,
        description,
        hashtags,
        fullNarration: narration,
      });

      const record = await onUploadToYouTube(
        visibility,
        isScheduled && scheduledDate ? scheduledDate : undefined
      );
      setUploadSuccessRecord(record);
    } catch (err: any) {
      setUploadError(err.message || 'YouTube upload failed. Your video is preserved for retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Success Modal / Banner */}
      {uploadSuccessRecord && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                  Published to YouTube
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {uploadSuccessRecord.visibility}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {uploadSuccessRecord.title}
              </h3>
              <p className="text-xs text-slate-300">
                Your 9:16 vertical Short is now live on your authorized YouTube channel!
              </p>

              {uploadSuccessRecord.restrictionNotice && (
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-100 block mb-0.5">⚠️ API Notice:</span>
                  {uploadSuccessRecord.restrictionNotice}
                </div>
              )}

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <a
                  href={uploadSuccessRecord.youtubeUrl || 'https://youtube.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  <span>Open on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setUploadSuccessRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error Banner (keeps video, allows retry) */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-200">Upload Failed</p>
            <p className="text-xs text-rose-300/90">{uploadError}</p>
            <p className="text-xs text-slate-400 pt-1">
              Your generated video and script remain safe. You can retry the upload anytime.
            </p>
          </div>
        </div>
      )}

      {/* Editor Accordion Header Tabs */}
      <div className="flex flex-wrap bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setActiveAccordion('meta')}
          className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAccordion === 'meta'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>SEO & Metadata</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAccordion('thumbnail')}
          className={`flex-1 min-w-[120px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAccordion === 'thumbnail'
              ? 'bg-red-600 text-white shadow shadow-red-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Thumbnail (9:16)</span>
          {thumbnailUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveAccordion('script')}
          className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAccordion === 'script'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Script</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAccordion('scenes')}
          className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAccordion === 'scenes'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Scenes</span>
        </button>
      </div>

      {/* TAB 1: SEO & Metadata */}
      {activeAccordion === 'meta' && (
        <div className="space-y-4 bg-slate-900/70 p-5 rounded-3xl border border-slate-800">
          {/* Edit Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-red-400" />
                <span>Shorts Title</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isTitleOver ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {titleCharCount}/100 chars
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Edit Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          {/* Edit Hashtags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Hashtags (3–8 recommended)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Add tag (e.g. #Shorts, #Dubai)"
                className="flex-1 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-750 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-650"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI THUMBNAIL GENERATOR (9:16) */}
      {activeAccordion === 'thumbnail' && (
        <div className="space-y-5 bg-slate-900/70 p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI-Powered 9:16 Thumbnail Generator</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Powered by Gemini Image capabilities to create high-clickthrough vertical covers
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              1080x1920 9:16
            </span>
          </div>

          {thumbError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {thumbError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Thumbnail Preview 9:16 Box */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-44 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 flex flex-col justify-between group">
                {thumbnailUrl ? (
                  <>
                    <img
                      src={thumbnailUrl}
                      alt="AI Generated 9:16 Thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={thumbnailUrl}
                        download={`thumbnail_${job.id}.png`}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                        title="Download Thumbnail"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gradient-to-b from-slate-900 to-slate-950">
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                    <span className="text-[11px] font-bold text-slate-400">
                      No Thumbnail Yet
                    </span>
                    <span className="text-[9px] text-slate-500 leading-tight">
                      Click below to generate a 9:16 frame from your video hook
                    </span>
                  </div>
                )}
              </div>

              {thumbnailUrl && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Thumbnail Active for YouTube
                </span>
              )}
            </div>

            {/* Thumbnail Generation Controls */}
            <div className="md:col-span-7 space-y-3.5">
              {/* Style Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Visual Style
                </label>
                <select
                  value={thumbnailStyle}
                  onChange={(e) => setThumbnailStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-red-500 focus:outline-none"
                >
                  {THUMBNAIL_STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prompt customization */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Gemini Prompt Formulation
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomThumbPrompt(
                        `Dramatic viral 9:16 vertical YouTube Shorts thumbnail about "${job.options.topic}". Hook: "${job.script?.hook || title}". Style: ${thumbnailStyle}. Sharp focus, cinematic dynamic lighting.`
                      )
                    }
                    className="text-[10px] text-red-400 hover:text-red-300"
                  >
                    Reset Prompt
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={customThumbPrompt}
                  onChange={(e) => setCustomThumbPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-red-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateThumbnail}
                disabled={isGeneratingThumb}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:via-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingThumb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing 9:16 Thumbnail Frame...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{thumbnailUrl ? 'Regenerate 9:16 Thumbnail' : 'Generate AI Thumbnail'}</span>
                  </>
                )}
              </button>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-750 text-[11px] text-slate-400 leading-snug">
                <span className="text-slate-300 font-semibold">Pro Creator Tip:</span> YouTube Shorts automatically picks the cover from this frame or uploads it as your high-converting thumbnail.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Script */}
      {activeAccordion === 'script' && (
        <div className="space-y-3 bg-slate-900/70 p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              Spoken Voiceover Script ({job.script?.estimatedDurationSec || 30}s target)
            </label>
            <span className="text-[11px] text-slate-400">
              {narration.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            rows={6}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:border-red-500 focus:outline-none resize-none font-sans"
          />
        </div>
      )}

      {/* TAB 4: Scenes Breakdown */}
      {activeAccordion === 'scenes' && (
        <div className="space-y-3 bg-slate-900/70 p-5 rounded-3xl border border-slate-800 max-h-72 overflow-y-auto pr-1">
          {job.script?.scenes.map((scene, idx) => (
            <div
              key={scene.id || idx}
              className="p-3 rounded-2xl bg-slate-800/60 border border-slate-750 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-400 uppercase tracking-wide">
                  {scene.section} ({scene.startSec}s - {scene.endSec}s)
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {scene.motionStyle}
                </span>
              </div>
              <p className="text-slate-200">"{scene.narration}"</p>
              <div className="text-[11px] text-slate-400 bg-slate-850 p-2 rounded-lg">
                <span className="text-amber-400 font-semibold">Visual:</span> {scene.visualPrompt}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Edits Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{isSaving ? 'Saving changes...' : 'Save Metadata & Script Changes'}</span>
      </button>

      {/* Upload Settings (Visibility & Scheduling) */}
      <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Upload Settings
        </h4>

        {/* Visibility */}
        <div className="grid grid-cols-3 gap-2">
          {(['public', 'unlisted', 'private'] as UploadVisibility[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                visibility === v
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Schedule Upload toggle */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Schedule upload for later</span>
            </span>
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="accent-red-600 w-4 h-4 cursor-pointer"
            />
          </label>

          {isScheduled && (
            <div className="mt-3">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Video will be uploaded as Private until the scheduled date/time is reached.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-3">
        {/* Upload Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading to YouTube...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              <span>UPLOAD TO YOUTUBE</span>
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            onClick={onGenerateAgain}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
