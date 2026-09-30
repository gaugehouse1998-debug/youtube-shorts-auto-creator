import {
  GenerationOptions,
  ShortScript,
  ShortMetadata,
  ShortScene,
  SubtitleWord,
  VideoBlobInfo,
} from '../../src/types/index.ts';

export interface GeneratedScriptResult {
  script: ShortScript;
  metadata: ShortMetadata;
}

export interface GeneratedVoiceResult {
  audioBuffer: Buffer;
  mimeType: string;
  durationSec: number;
  wordTimings: SubtitleWord[];
}

export interface GeneratedVisualResult {
  sceneId: string;
  imageUrl?: string;
  gradient: [string, string];
  keywords: string[];
}

export interface RenderedVideoResult {
  videoBuffer?: Buffer;
  videoUrl: string;
  info: VideoBlobInfo;
}

export interface AITextProvider {
  name: string;
  isConfigured(): boolean;
  generateScriptAndMetadata(options: GenerationOptions): Promise<GeneratedScriptResult>;
}

export interface VoiceGenerationProvider {
  name: string;
  isConfigured(): boolean;
  generateVoiceover(
    text: string,
    voice: 'Male' | 'Female',
    language: string,
    estimatedDuration: number
  ): Promise<GeneratedVoiceResult>;
}

export interface ImageGenerationProvider {
  name: string;
  isConfigured(): boolean;
  generateVisual(scene: ShortScene, style: string): Promise<GeneratedVisualResult>;
}

export interface VideoGenerationProvider {
  name: string;
  isConfigured(): boolean;
  assembleShort(
    script: ShortScript,
    voiceResult: GeneratedVoiceResult,
    visuals: GeneratedVisualResult[],
    metadata: ShortMetadata
  ): Promise<RenderedVideoResult>;
}
