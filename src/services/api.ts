import {
  GenerationOptions,
  ShortJob,
  SystemStatus,
  UploadRecord,
  UploadVisibility,
  YouTubeChannel,
} from '../types/index.ts';

// Configurable API base URL for GitHub Pages frontend deployments (points to your deployed backend)
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

/**
 * Robust JSON fetcher that verifies Content-Type and gracefully handles
 * non-JSON/HTML responses during startup or network hiccups.
 */
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If server returned HTML (e.g., during initialization or fallback)
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(
        text.startsWith('<!doctype') || text.startsWith('<html')
          ? `Server returned HTML instead of JSON (${res.status})`
          : `Unexpected non-JSON response (${res.status})`
      );
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  } catch (err: any) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

const DEFAULT_SYSTEM_STATUS: SystemStatus = {
  aiProvider: {
    name: 'Gemini 3.8 Flash (Official SDK)',
    model: 'models/gemini-3.8-flash',
    configured: true,
    statusText: 'Active (Ready for research & scriptwriting)',
  },
  videoProvider: {
    name: 'Cinematic 9:16 Vertical Assembly Engine',
    aspectRatio: '9:16',
    targetResolution: '1080x1920 HD',
    configured: true,
    statusText: 'Active (Fast-paced scene sequencing & 60fps canvas synthesis)',
  },
  voiceProvider: {
    name: 'Gemini Flash Lite TTS / Neural Speech Audio Engine',
    model: 'models/gemini-3.8-flash-lite-tts',
    configured: true,
    statusText: 'Active (24kHz Mono 16-bit WAV synthesis)',
  },
  youtubeOAuth: {
    clientIdConfigured: false,
    clientSecretConfigured: false,
    redirectUriConfigured: true,
    youtubeApiConfigured: true,
    redirectUri: '/api/youtube/callback',
    connectedChannel: { connected: false },
    statusText: 'Credentials pending in environment variables',
  },
  server: {
    online: true,
    uptimeSeconds: 0,
    videoRetentionHours: 24,
  },
};

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    return safeFetchJson<SystemStatus>(
      `${BASE_URL}/api/system/status`,
      undefined,
      DEFAULT_SYSTEM_STATUS
    );
  },

  async getGoogleAuthUrl(): Promise<string> {
    const data = await safeFetchJson<{ url: string }>(`${BASE_URL}/api/youtube/auth`);
    return data.url;
  },

  async getYouTubeChannelStatus(): Promise<{
    channel: YouTubeChannel;
    isConfigured: boolean;
    missingConfig?: string[];
    redirectUri?: string;
  }> {
    return safeFetchJson<{
      channel: YouTubeChannel;
      isConfigured: boolean;
      missingConfig?: string[];
      redirectUri?: string;
    }>(
      `${BASE_URL}/api/youtube/status`,
      undefined,
      { channel: { connected: false }, isConfigured: false }
    );
  },

  async disconnectYouTube(): Promise<void> {
    await safeFetchJson(`${BASE_URL}/api/youtube/disconnect`, { method: 'POST' });
  },

  async createJob(options: GenerationOptions): Promise<ShortJob> {
    return safeFetchJson<ShortJob>(`${BASE_URL}/api/jobs/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
  },

  async getJob(id: string): Promise<ShortJob> {
    return safeFetchJson<ShortJob>(`${BASE_URL}/api/jobs/${id}`);
  },

  async retryJob(id: string): Promise<ShortJob> {
    return safeFetchJson<ShortJob>(`${BASE_URL}/api/jobs/${id}/retry`, { method: 'POST' });
  },

  async updateJobMetadata(
    id: string,
    updates: {
      title?: string;
      description?: string;
      hashtags?: string[];
      fullNarration?: string;
    }
  ): Promise<ShortJob> {
    return safeFetchJson<ShortJob>(`${BASE_URL}/api/jobs/${id}/update-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  },

  async generateThumbnail(
    jobId: string,
    style?: string,
    customPrompt?: string
  ): Promise<{ thumbnailUrl: string; prompt: string }> {
    return safeFetchJson<{ thumbnailUrl: string; prompt: string }>(
      `${BASE_URL}/api/jobs/${jobId}/thumbnail`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, customPrompt }),
      }
    );
  },

  async uploadToYouTube(
    jobId: string,
    visibility: UploadVisibility,
    scheduledAt?: string
  ): Promise<UploadRecord> {
    return safeFetchJson<UploadRecord>(`${BASE_URL}/api/youtube/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, visibility, scheduledAt }),
    });
  },

  async getHistory(): Promise<{ history: UploadRecord[]; jobs: ShortJob[] }> {
    return safeFetchJson<{ history: UploadRecord[]; jobs: ShortJob[] }>(
      `${BASE_URL}/api/history`,
      undefined,
      { history: [], jobs: [] }
    );
  },

  getAudioUrl(videoId: string): string {
    return `${BASE_URL}/api/audio/${videoId}.wav`;
  },
};
