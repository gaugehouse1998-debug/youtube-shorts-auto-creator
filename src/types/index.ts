export type VideoDuration = 20 | 25 | 30;

export type VideoStyle =
  | 'Documentary'
  | 'Educational'
  | 'News-style'
  | 'Storytelling'
  | 'Cinematic'
  | 'UGC-style'
  | 'Facts'
  | 'Motivational';

export type VideoVoice = 'Male' | 'Female';

export type VideoLanguage = 'English' | 'Urdu' | 'Roman Urdu' | 'Hinglish';

export type UploadVisibility = 'public' | 'unlisted' | 'private';

export interface GenerationOptions {
  topic: string;
  duration: VideoDuration;
  style: VideoStyle;
  voice: VideoVoice;
  language: VideoLanguage;
}

export type SceneSection = 'hook' | 'intro' | 'facts' | 'conclusion' | 'cta';

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface ShortScene {
  id: string;
  section: SceneSection;
  startSec: number;
  endSec: number;
  narration: string;
  visualPrompt: string;
  textOverlay: string;
  motionStyle: 'zoom-in' | 'pan-left' | 'pan-right' | 'pulse' | 'cinematic';
  colorTheme: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  imageUrl?: string;
}

export interface ShortScript {
  fullNarration: string;
  hook: string;
  estimatedDurationSec: number;
  scenes: ShortScene[];
  subtitles: SubtitleWord[];
}

export interface ShortMetadata {
  title: string;
  description: string;
  hashtags: string[];
  category: string;
  thumbnailUrl?: string;
  thumbnailPrompt?: string;
}

export type JobStepStatus =
  | 'queued'
  | 'understanding_topic'
  | 'writing_script'
  | 'creating_scenes'
  | 'generating_visuals'
  | 'generating_voiceover'
  | 'creating_captions'
  | 'rendering_video'
  | 'preparing_metadata'
  | 'ready'
  | 'failed';

export interface GenerationStepInfo {
  id: JobStepStatus;
  label: string;
  description: string;
}

export interface VideoBlobInfo {
  duration: number;
  resolution: string;
  format: string;
  sizeBytes: number;
}

export interface ShortJob {
  id: string;
  status: JobStepStatus;
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  progressPercent: number;
  options: GenerationOptions;
  script?: ShortScript;
  metadata?: ShortMetadata;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoBlobInfo?: VideoBlobInfo;
  error?: string;
  failedStep?: JobStepStatus;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeChannel {
  connected: boolean;
  channelId?: string;
  title?: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
  error?: string;
}

export interface UploadRecord {
  id: string;
  jobId: string;
  topic: string;
  title: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  status: 'pending' | 'uploading' | 'published' | 'failed';
  visibility: UploadVisibility;
  actualVisibility?: string;
  scheduledAt?: string;
  error?: string;
  restrictionNotice?: string;
  createdAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

export interface SystemStatus {
  aiProvider: {
    name: string;
    model: string;
    configured: boolean;
    statusText: string;
  };
  videoProvider: {
    name: string;
    aspectRatio: string;
    targetResolution: string;
    configured: boolean;
    statusText: string;
  };
  voiceProvider: {
    name: string;
    model: string;
    configured: boolean;
    statusText: string;
  };
  youtubeOAuth: {
    clientIdConfigured: boolean;
    clientSecretConfigured: boolean;
    redirectUriConfigured: boolean;
    youtubeApiConfigured: boolean;
    redirectUri: string;
    connectedChannel: YouTubeChannel;
    statusText: string;
    errorDetails?: string;
  };
  server: {
    online: boolean;
    uptimeSeconds: number;
    videoRetentionHours: number;
  };
}
