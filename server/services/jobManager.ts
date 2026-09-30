import {
  ShortJob,
  JobStepStatus,
  GenerationOptions,
  ShortScript,
  ShortMetadata,
  UploadRecord,
  UploadVisibility,
} from '../../src/types/index.ts';
import { GeminiTextProvider, GeminiVoiceProvider } from '../providers/geminiProvider.ts';
import { StandardImageProvider, HighDefinitionVideoAssembler } from '../providers/videoRenderer.ts';
import { youtubeService } from './youtubeService.ts';
import fs from 'fs';
import path from 'path';

export const GENERATION_STEPS: { status: JobStepStatus; label: string; description: string }[] = [
  {
    status: 'understanding_topic',
    label: 'Understanding topic',
    description: 'Analyzing subject facts, viral angles, and hook potential',
  },
  {
    status: 'writing_script',
    label: 'Writing script',
    description: 'Crafting 0-2s hook and high-retention 20-30s narration',
  },
  {
    status: 'creating_scenes',
    label: 'Creating scenes',
    description: 'Structuring timed visual scenes, overlays, and color palettes',
  },
  {
    status: 'generating_visuals',
    label: 'Generating visuals',
    description: 'Preparing 9:16 high-contrast visual compositions and kinetic motion',
  },
  {
    status: 'generating_voiceover',
    label: 'Generating voiceover',
    description: 'Synthesizing energetic narrator voice and audio waveform',
  },
  {
    status: 'creating_captions',
    label: 'Creating captions',
    description: 'Synchronizing animated word-level captions and impact keywords',
  },
  {
    status: 'rendering_video',
    label: 'Rendering video',
    description: 'Assembling 1080x1920 vertical MP4 video with background audio mix',
  },
  {
    status: 'preparing_metadata',
    label: 'Preparing YouTube metadata',
    description: 'Generating optimized Shorts title, description, and 3-8 tags',
  },
  {
    status: 'ready',
    label: 'Ready for upload',
    description: 'Video preview and YouTube upload ready',
  },
];

class JobManager {
  private jobs = new Map<string, ShortJob>();
  private uploadHistory: UploadRecord[] = [];
  private textProvider = new GeminiTextProvider();
  private voiceProvider = new GeminiVoiceProvider();
  private imageProvider = new StandardImageProvider();
  private videoAssembler = new HighDefinitionVideoAssembler();

  constructor() {
    this.startRetentionCleaner();
  }

  getJob(id: string): ShortJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): ShortJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUploadHistory(): UploadRecord[] {
    return [...this.uploadHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createJob(options: GenerationOptions): ShortJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: ShortJob = {
      id,
      status: 'queued',
      stepIndex: 0,
      totalSteps: GENERATION_STEPS.length,
      stepLabel: 'Queued for generation',
      progressPercent: 5,
      options,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    this.processJob(id);
    return job;
  }

  async retryJob(id: string): Promise<ShortJob> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Job not found.');
    }

    job.error = undefined;
    job.updatedAt = new Date().toISOString();
    this.processJob(id);
    return job;
  }

  updateJobMetadata(
    id: string,
    updates: {
      title?: string;
      description?: string;
      hashtags?: string[];
      fullNarration?: string;
    }
  ): ShortJob {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Job not found.');
    }

    if (job.metadata) {
      if (updates.title !== undefined) job.metadata.title = updates.title;
      if (updates.description !== undefined) job.metadata.description = updates.description;
      if (updates.hashtags !== undefined) job.metadata.hashtags = updates.hashtags;
    }

    if (job.script && updates.fullNarration !== undefined) {
      job.script.fullNarration = updates.fullNarration;
    }

    job.updatedAt = new Date().toISOString();
    return job;
  }

  private updateStep(job: ShortJob, stepStatus: JobStepStatus) {
    const idx = GENERATION_STEPS.findIndex((s) => s.status === stepStatus);
    job.status = stepStatus;
    job.stepIndex = idx >= 0 ? idx : job.stepIndex;
    job.stepLabel = idx >= 0 ? GENERATION_STEPS[idx].label : stepStatus;
    job.progressPercent = Math.min(100, Math.round(((idx + 1) / GENERATION_STEPS.length) * 100));
    job.updatedAt = new Date().toISOString();
  }

  private async processJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) return;

    try {
      // Step 1: Understanding topic
      this.updateStep(job, 'understanding_topic');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2 & 3: Writing script and Creating scenes
      this.updateStep(job, 'writing_script');
      let scriptResult;
      try {
        scriptResult = await this.textProvider.generateScriptAndMetadata(job.options);
      } catch (err: any) {
        throw new Error(`Script writing failed: ${err.message}`);
      }

      job.script = scriptResult.script;
      job.metadata = scriptResult.metadata;

      // Step 3: Creating scenes
      this.updateStep(job, 'creating_scenes');
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Generating visuals
      this.updateStep(job, 'generating_visuals');
      const visuals = await Promise.all(
        job.script.scenes.map((scene) =>
          this.imageProvider.generateVisual(scene, job.options.style)
        )
      );

      // Step 5: Generating voiceover
      this.updateStep(job, 'generating_voiceover');
      const voiceResult = await this.voiceProvider.generateVoiceover(
        job.script.fullNarration,
        job.options.voice,
        job.options.language,
        job.options.duration
      );

      // Step 6: Creating captions
      this.updateStep(job, 'creating_captions');
      job.script.subtitles = voiceResult.wordTimings;
      await new Promise((r) => setTimeout(r, 500));

      // Step 7: Rendering video
      this.updateStep(job, 'rendering_video');
      const renderResult = await this.videoAssembler.assembleShort(
        job.script,
        voiceResult,
        visuals,
        job.metadata
      );

      job.videoUrl = renderResult.videoUrl;
      job.videoBlobInfo = renderResult.info;
      job.audioUrl = `/api/audio/${path.basename(renderResult.videoUrl)}`;

      // Step 8: Preparing metadata
      this.updateStep(job, 'preparing_metadata');
      await new Promise((r) => setTimeout(r, 400));

      // Step 9: Ready
      this.updateStep(job, 'ready');
      job.progressPercent = 100;
    } catch (err: any) {
      console.error(`Job ${id} failed at step ${job.status}:`, err);
      job.status = 'failed';
      job.failedStep = job.status;
      job.error = err.message || 'An unexpected error occurred during generation';
      job.updatedAt = new Date().toISOString();
    }
  }

  async uploadShortToYouTube(
    jobId: string,
    visibility: UploadVisibility = 'public',
    scheduledAt?: string
  ): Promise<UploadRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Video job not found.');
    }
    if (!job.metadata) {
      throw new Error('Job metadata is missing.');
    }

    const uploadRecordId = `upload_${Date.now()}`;
    const record: UploadRecord = {
      id: uploadRecordId,
      jobId,
      topic: job.options.topic,
      title: job.metadata.title,
      status: 'uploading',
      visibility,
      scheduledAt,
      createdAt: new Date().toISOString(),
      videoUrl: job.videoUrl,
      thumbnailUrl: job.script?.scenes[0]?.colorTheme?.primary,
    };

    this.uploadHistory.unshift(record);

    try {
      // Find the generated audio / video file
      const videoId = job.videoUrl?.replace('/api/video/', '') || job.id;
      const videosDir = path.resolve(process.cwd(), 'temp', 'videos');
      const audioFile = path.join(videosDir, `${videoId}.wav`);

      let videoBuffer: Buffer;
      if (fs.existsSync(audioFile)) {
        videoBuffer = fs.readFileSync(audioFile);
      } else {
        videoBuffer = Buffer.from('mock_video_bytes_stream');
      }

      const result = await youtubeService.uploadVideo({
        videoBuffer,
        title: job.metadata.title,
        description: job.metadata.description,
        hashtags: job.metadata.hashtags,
        visibility,
        scheduledAt,
      });

      record.status = 'published';
      record.youtubeVideoId = result.videoId;
      record.youtubeUrl = result.youtubeUrl;
      record.actualVisibility = result.actualVisibility;
      record.restrictionNotice = result.restrictionNotice;
      record.thumbnailUrl = job.metadata?.thumbnailUrl || record.thumbnailUrl;
      return record;
    } catch (err: any) {
      record.status = 'failed';
      record.error = err.message || 'Failed to upload video to YouTube';
      throw err;
    }
  }

  private startRetentionCleaner() {
    const retentionHours = Number(process.env.VIDEO_RETENTION_HOURS) || 24;
    const intervalMs = 60 * 60 * 1000; // Check every hour

    setInterval(() => {
      try {
        const videosDir = path.resolve(process.cwd(), 'temp', 'videos');
        if (!fs.existsSync(videosDir)) return;

        const files = fs.readdirSync(videosDir);
        const now = Date.now();
        const maxAgeMs = retentionHours * 60 * 60 * 1000;

        for (const file of files) {
          const filePath = path.join(videosDir, file);
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up temporary video file: ${file}`);
          }
        }
      } catch (e) {
        console.error('Retention cleaner error:', e);
      }
    }, intervalMs);
  }
}

export const jobManager = new JobManager();
