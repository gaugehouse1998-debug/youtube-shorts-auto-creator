import crypto from 'crypto';
import { YouTubeChannel, UploadVisibility } from '../../src/types/index.ts';

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  channel?: YouTubeChannel;
}

// In-memory token storage for active sessions (in production this connects to secure Redis/DB)
let currentTokenStore: StoredTokens | null = null;

// Secure CSRF state storage with TTL (15 minutes)
const validStates = new Map<string, number>();

// Minimum required scopes: upload videos, read authenticated channel information, and basic profile
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export interface YouTubeUploadResult {
  videoId: string;
  youtubeUrl: string;
  actualVisibility: string;
  restrictionNotice?: string;
}

export class YouTubeService {
  get clientId(): string {
    return (process.env.GOOGLE_CLIENT_ID || '').trim();
  }

  get clientSecret(): string {
    return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  }

  get redirectUri(): string {
    const explicit = (process.env.GOOGLE_REDIRECT_URI || process.env.YOUTUBE_REDIRECT_URI || '').trim();
    if (explicit && (explicit.startsWith('http://') || explicit.startsWith('https://'))) {
      return explicit;
    }
    const appUrl = (
      process.env.APP_URL ||
      'https://ais-dev-hmzxjhb6oabtwfvt7amhpw-743842357149.asia-east1.run.app'
    ).trim().replace(/\/$/, '');
    return `${appUrl}/api/youtube/callback`;
  }

  get apiKey(): string {
    return (process.env.YOUTUBE_API_KEY || '').trim();
  }

  isClientIdConfigured(): boolean {
    return (
      !!this.clientId &&
      this.clientId !== '1234' &&
      !this.clientId.startsWith('your-') &&
      this.clientId.includes('.apps.googleusercontent.com')
    );
  }

  isClientSecretConfigured(): boolean {
    return (
      !!this.clientSecret &&
      this.clientSecret !== '1234' &&
      !this.clientSecret.startsWith('your-') &&
      this.clientSecret.length >= 10
    );
  }

  isOAuthCredentialsConfigured(): boolean {
    return this.isClientIdConfigured() && this.isClientSecretConfigured();
  }

  getMissingConfig(): string[] {
    const missing: string[] = [];
    if (!this.isClientIdConfigured()) missing.push('GOOGLE_CLIENT_ID (must end with .apps.googleusercontent.com)');
    if (!this.isClientSecretConfigured()) missing.push('GOOGLE_CLIENT_SECRET');
    return missing;
  }

  /**
   * Generates official Google OAuth 2.0 authorization URL with secure CSRF state token
   */
  getAuthorizationUrl(): string {
    if (!this.isOAuthCredentialsConfigured()) {
      const missing = this.getMissingConfig().join(', ');
      throw new Error(
        `Google OAuth is not configured on the server. Missing: ${missing}. Please set these in your backend environment variables.`
      );
    }

    // Generate cryptographic state for CSRF protection
    const state = crypto.randomBytes(24).toString('hex');
    validStates.set(state, Date.now() + 15 * 60 * 1000); // 15-minute TTL

    // Clean up expired state tokens
    const now = Date.now();
    for (const [key, expires] of validStates.entries()) {
      if (now > expires) validStates.delete(key);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Validates state and exchanges authorization code for tokens, then retrieves channel details
   */
  async handleCallback(code: string, state?: string): Promise<YouTubeChannel> {
    if (!this.isOAuthCredentialsConfigured()) {
      throw new Error('Google OAuth credentials not configured on the backend server.');
    }

    if (!code) {
      throw new Error('Authorization code missing from Google callback.');
    }

    // CSRF State Validation
    if (state) {
      const expires = validStates.get(state);
      if (!expires || Date.now() > expires) {
        throw new Error('OAuth state verification failed or expired. Please initiate login again.');
      }
      validStates.delete(state);
    }

    let tokenResponse: globalThis.Response;
    try {
      tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }),
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to contact Google OAuth token endpoint: ${networkErr.message}`);
    }

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errBody);
      } catch {
        // use raw body
      }

      const errorType = parsedErr?.error || 'token_exchange_failed';
      const errorDesc = parsedErr?.error_description || errBody;

      if (errorType === 'redirect_uri_mismatch') {
        throw new Error(
          `Redirect URI mismatch in Google Cloud Console. Current redirect URI: "${this.redirectUri}". Ensure this exact URL is listed under "Authorized redirect URIs" in your Google Cloud OAuth Client credentials.`
        );
      } else if (errorType === 'invalid_client') {
        throw new Error(
          'Invalid Google OAuth Client ID or Client Secret. Please verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        );
      } else {
        throw new Error(`Google OAuth token exchange error [${errorType}]: ${errorDesc}`);
      }
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    const channel = await this.fetchChannelInfo(accessToken);

    currentTokenStore = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      channel,
    };

    return channel;
  }

  async getValidAccessToken(): Promise<string> {
    if (!currentTokenStore) {
      throw new Error('No YouTube channel connected. Please authorize your YouTube channel via Google OAuth first.');
    }

    // Refresh if expiring within 5 minutes
    if (Date.now() > currentTokenStore.expiresAt - 300000 && currentTokenStore.refreshToken) {
      await this.refreshAccessToken();
    }

    return currentTokenStore.accessToken;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!currentTokenStore?.refreshToken) return;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: currentTokenStore.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        currentTokenStore.accessToken = data.access_token;
        currentTokenStore.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      } else {
        const errText = await response.text();
        console.error('Failed refreshing Google access token:', errText);
        // Token might have been revoked
        if (response.status === 400 || response.status === 401) {
          currentTokenStore = null;
          throw new Error('YouTube authorization has expired or was revoked. Please reconnect your channel.');
        }
      }
    } catch (e: any) {
      console.error('Refresh token error:', e);
      throw e;
    }
  }

  async fetchChannelInfo(accessToken: string): Promise<YouTubeChannel> {
    const url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true';
    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err: any) {
      throw new Error(`Failed to reach YouTube Data API: ${err.message}`);
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(errText);
      } catch {}

      const reason = parsed?.error?.errors?.[0]?.reason || '';
      const message = parsed?.error?.message || errText;

      if (response.status === 403) {
        if (reason === 'accessNotConfigured' || message.includes('has not been used') || message.includes('disabled')) {
          throw new Error(
            'YouTube Data API v3 is not enabled in your Google Cloud Project. Go to Google Cloud Console -> APIs & Services -> Library -> Search "YouTube Data API v3" and click Enable.'
          );
        } else if (reason === 'quotaExceeded') {
          throw new Error('YouTube Data API daily quota exceeded for your Google Cloud project.');
        } else if (reason === 'insufficientPermissions') {
          throw new Error('Insufficient permissions granted. Please reconnect and ensure you accept all YouTube channel access scopes.');
        }
      }

      throw new Error(`YouTube API channel retrieval failed (${response.status}): ${message}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return {
        connected: true,
        channelId: 'unknown',
        title: 'Connected YouTube Account',
        customUrl: '@creator',
        subscriberCount: '0',
        videoCount: '0',
      };
    }

    const item = data.items[0];
    return {
      connected: true,
      channelId: item.id,
      title: item.snippet?.title || 'YouTube Channel',
      customUrl: item.snippet?.customUrl || '@creator',
      thumbnailUrl: item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.high?.url,
      subscriberCount: item.statistics?.subscriberCount || '0',
      videoCount: item.statistics?.videoCount || '0',
    };
  }

  getCurrentChannel(): YouTubeChannel {
    if (currentTokenStore?.channel) {
      return currentTokenStore.channel;
    }
    return {
      connected: false,
    };
  }

  disconnect(): void {
    currentTokenStore = null;
  }

  /**
   * Resumable upload of vertical 9:16 video to YouTube Data API v3
   * Validates actual visibility returned and alerts user if restricted to Private
   */
  async uploadVideo(options: {
    videoBuffer: Buffer;
    title: string;
    description: string;
    hashtags: string[];
    visibility: UploadVisibility;
    scheduledAt?: string;
  }): Promise<YouTubeUploadResult> {
    const accessToken = await this.getValidAccessToken();

    // YouTube Shorts title formatting (< 100 chars)
    let formattedTitle = options.title.trim();
    if (!formattedTitle.toLowerCase().includes('#shorts')) {
      if (formattedTitle.length + 8 <= 100) {
        formattedTitle = `${formattedTitle} #Shorts`;
      }
    }

    // Combine hashtags into description
    const tagsString = options.hashtags.join(' ');
    const fullDescription = `${options.description}\n\n${tagsString}\n\nCreated with YouTube Shorts Auto Creator`;

    // Metadata payload
    const metadata: any = {
      snippet: {
        title: formattedTitle,
        description: fullDescription,
        tags: options.hashtags.map((t) => t.replace(/^#/, '')),
        categoryId: '27', // Education
      },
      status: {
        privacyStatus: options.visibility,
        selfDeclaredMadeForKids: false,
      },
    };

    // If scheduled upload
    if (options.scheduledAt && options.visibility === 'private') {
      metadata.status.publishAt = new Date(options.scheduledAt).toISOString();
    }

    const videoBytes = options.videoBuffer;

    // Step 1: Initiate Resumable Upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/mp4',
          'X-Upload-Content-Length': videoBytes.length.toString(),
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(errText);
      } catch {}

      const reason = parsed?.error?.errors?.[0]?.reason || '';
      const message = parsed?.error?.message || errText;

      if (reason === 'quotaExceeded') {
        throw new Error('YouTube API upload quota exceeded. Daily video upload limit reached for this Google Cloud project.');
      }
      if (reason === 'accessNotConfigured') {
        throw new Error('YouTube Data API v3 is not enabled in your Google Cloud Project.');
      }
      if (initResponse.status === 401) {
        throw new Error('YouTube authorization expired. Please reconnect your YouTube channel.');
      }

      console.error('Failed to initiate YouTube upload session:', errText);
      throw new Error(`YouTube API upload initialization failed (${initResponse.status}): ${message}`);
    }

    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      throw new Error('No upload location URL returned by YouTube API.');
    }

    // Step 2: Upload Video Binary Stream
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBytes.length.toString(),
      },
      body: new Uint8Array(videoBytes),
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('Failed uploading video bytes to YouTube:', errText);
      throw new Error(`YouTube binary upload failed (${uploadResponse.status}): ${errText}`);
    }

    const result = await uploadResponse.json();
    const videoId = result.id;
    if (!videoId) {
      throw new Error('YouTube did not return a valid video ID.');
    }

    const actualPrivacy = result.status?.privacyStatus || options.visibility;
    let restrictionNotice: string | undefined;

    // RULE 10: Check if YouTube restricted video to private due to unverified Google API project
    if (options.visibility !== 'private' && actualPrivacy === 'private') {
      restrictionNotice =
        'YouTube API restriction notice: Video was uploaded as Private because this Google Cloud project has not completed Google API verification for public uploads. You can change visibility to Public in YouTube Studio, or complete Google Cloud project verification for automated public uploads.';
    }

    return {
      videoId,
      youtubeUrl: `https://youtube.com/shorts/${videoId}`,
      actualVisibility: actualPrivacy,
      restrictionNotice,
    };
  }
}

export const youtubeService = new YouTubeService();
