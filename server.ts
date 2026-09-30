import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { youtubeService } from './server/services/youtubeService.ts';
import { jobManager } from './server/services/jobManager.ts';
import { GeminiThumbnailGenerator } from './server/providers/geminiProvider.ts';
import { GenerationOptions, SystemStatus } from './src/types/index.ts';

dotenv.config();

const app = express();
const thumbnailGenerator = new GeminiThumbnailGenerator();

// Parse port from CLI flags (e.g. --port 3000) or env variable
let portFromArgs = process.env.PORT || '3000';
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    portFromArgs = args[i + 1];
    break;
  }
}
const PORT = Number(portFromArgs) || 3000;
const serverStartTime = Date.now();

// Configure CORS for local development and GitHub Pages deployments
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.APP_URL,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or if origin is in allowlist / github.io
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.github.io')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in preview environment for seamless testing
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure temp storage directory exists
const tempVideosDir = path.resolve(process.cwd(), 'temp', 'videos');
if (!fs.existsSync(tempVideosDir)) {
  fs.mkdirSync(tempVideosDir, { recursive: true });
}

// -----------------------------------------------------------------------------
// System & Provider Status API
// -----------------------------------------------------------------------------
app.get('/api/system/status', (req: Request, res: Response) => {
  const isGeminiConfigured =
    !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  const isOAuthClientId = youtubeService.isClientIdConfigured();
  const isOAuthClientSecret = youtubeService.isClientSecretConfigured();
  const isConfigured = youtubeService.isOAuthCredentialsConfigured();
  const missing = youtubeService.getMissingConfig();

  const status: SystemStatus = {
    aiProvider: {
      name: 'Gemini 3.8 Flash (Official SDK)',
      model: 'models/gemini-3.8-flash',
      configured: isGeminiConfigured,
      statusText: isGeminiConfigured
        ? 'Active (Ready for research & scriptwriting)'
        : 'API key not configured in environment',
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
      configured: isGeminiConfigured,
      statusText: isGeminiConfigured
        ? 'Active (24kHz Mono 16-bit WAV synthesis)'
        : 'Fallback audio synthesizer ready',
    },
    youtubeOAuth: {
      clientIdConfigured: isOAuthClientId,
      clientSecretConfigured: isOAuthClientSecret,
      redirectUriConfigured: !!youtubeService.redirectUri,
      youtubeApiConfigured: true,
      redirectUri: youtubeService.redirectUri,
      connectedChannel: youtubeService.getCurrentChannel(),
      statusText: isConfigured
        ? 'Google Cloud OAuth 2.0 Ready'
        : `Missing credentials: ${missing.join(', ') || 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET'}`,
      errorDetails: isConfigured
        ? undefined
        : 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend environment variables.',
    },
    server: {
      online: true,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      videoRetentionHours: Number(process.env.VIDEO_RETENTION_HOURS) || 24,
    },
  };

  res.json(status);
});

// -----------------------------------------------------------------------------
// Official YouTube OAuth 2.0 Endpoints
// -----------------------------------------------------------------------------

// Handler for initiating Google OAuth flow
const handleGetAuthUrl = (req: Request, res: Response) => {
  try {
    const authUrl = youtubeService.getAuthorizationUrl();
    res.json({ url: authUrl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

app.get('/api/youtube/auth', handleGetAuthUrl);
app.get('/api/auth/google/url', handleGetAuthUrl);

// Handler for Google OAuth redirect callback
const handleOAuthCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;
  const errorDesc = req.query.error_description as string;

  if (error) {
    const isDenied = error === 'access_denied';
    const message = isDenied
      ? 'Access was denied by the user. You must accept permissions to allow uploading YouTube Shorts.'
      : errorDesc || error;

    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Declined</title></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <div style="max-width:440px;margin:0 auto;background:#1e293b;padding:32px;border-radius:20px;border:1px solid #ef4444;">
            <div style="font-size:42px;margin-bottom:12px;">⚠️</div>
            <h2 style="color:#ef4444;margin:0 0 10px 0;">Google Authorization ${isDenied ? 'Declined' : 'Failed'}</h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">${message}</p>
            <button onclick="window.close()" style="padding:10px 24px;border-radius:12px;background:#3b82f6;color:#fff;border:none;font-weight:600;cursor:pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Invalid Callback</title></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <div style="max-width:440px;margin:0 auto;background:#1e293b;padding:32px;border-radius:20px;border:1px solid #ef4444;">
            <h2 style="color:#ef4444;">Missing Authorization Code</h2>
            <p style="color:#94a3b8;">Google did not return an authorization code.</p>
            <button onclick="window.close()" style="padding:10px 24px;border-radius:12px;background:#3b82f6;color:#fff;border:none;font-weight:600;cursor:pointer;">Close Window</button>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const channel = await youtubeService.handleCallback(code, state);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>YouTube Connected</title></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <div style="max-width:440px;margin:0 auto;background:#1e293b;padding:32px;border-radius:20px;border:1px solid #22c55e;">
            <div style="font-size:48px;margin-bottom:12px;">✅</div>
            <h2 style="margin:0 0 8px 0;color:#22c55e;">YouTube Connected!</h2>
            <p style="color:#94a3b8;margin-bottom:8px;">Authorized Channel:</p>
            <p style="color:#fff;font-size:18px;font-weight:bold;margin:0 0 20px 0;">${channel.title}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'YOUTUBE_AUTH_SUCCESS', channel: ${JSON.stringify(channel)} }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/?auth=success';
              }
            </script>
            <p style="font-size:12px;color:#64748b;">Closing window and returning to app...</p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth callback handling failed:', err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <div style="max-width:480px;margin:0 auto;background:#1e293b;padding:32px;border-radius:20px;border:1px solid #ef4444;text-align:left;">
            <h2 style="color:#ef4444;margin-top:0;">OAuth Token Exchange Error</h2>
            <p style="color:#e2e8f0;font-size:14px;line-height:1.5;">${err.message}</p>
            <div style="margin-top:20px;text-align:center;">
              <button onclick="window.close()" style="padding:10px 24px;border-radius:12px;background:#3b82f6;color:#fff;border:none;font-weight:600;cursor:pointer;">Close Window</button>
            </div>
          </div>
        </body>
      </html>
    `);
  }
};

app.get('/api/youtube/callback', handleOAuthCallback);
app.get('/api/auth/google/callback', handleOAuthCallback);

// Handler for checking YouTube connection status
const handleGetYouTubeStatus = (req: Request, res: Response) => {
  res.json({
    channel: youtubeService.getCurrentChannel(),
    isConfigured: youtubeService.isOAuthCredentialsConfigured(),
    clientIdConfigured: youtubeService.isClientIdConfigured(),
    clientSecretConfigured: youtubeService.isClientSecretConfigured(),
    redirectUri: youtubeService.redirectUri,
    missingConfig: youtubeService.getMissingConfig(),
  });
};

app.get('/api/youtube/status', handleGetYouTubeStatus);
app.get('/api/auth/google/status', handleGetYouTubeStatus);

// Handler for disconnecting YouTube channel
const handleDisconnect = (req: Request, res: Response) => {
  youtubeService.disconnect();
  res.json({ success: true, message: 'YouTube channel disconnected successfully' });
};

app.post('/api/youtube/disconnect', handleDisconnect);
app.post('/api/auth/google/disconnect', handleDisconnect);

// -----------------------------------------------------------------------------
// Shorts Job Generation Endpoints
// -----------------------------------------------------------------------------
app.post('/api/jobs/create', (req: Request, res: Response) => {
  const { topic, duration, style, voice, language } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: 'Video topic is required.' });
  }

  const validDuration: 20 | 25 | 30 =
    Number(duration) === 20 ? 20 : Number(duration) === 25 ? 25 : 30;

  const options: GenerationOptions = {
    topic: topic.trim(),
    duration: validDuration,
    style: style || 'Educational',
    voice: voice || 'Male',
    language: language || 'English',
  };

  try {
    const job = jobManager.createJob(options);
    res.status(201).json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobManager.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  res.json(job);
});

app.post('/api/jobs/:id/retry', async (req: Request, res: Response) => {
  try {
    const job = await jobManager.retryJob(req.params.id);
    res.json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/jobs/:id/update-metadata', (req: Request, res: Response) => {
  try {
    const { title, description, hashtags, fullNarration } = req.body;
    const job = jobManager.updateJobMetadata(req.params.id, {
      title,
      description,
      hashtags,
      fullNarration,
    });
    res.json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// AI-Powered 9:16 Thumbnail Generation Endpoint
// -----------------------------------------------------------------------------
app.post('/api/jobs/:id/thumbnail', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { style, customPrompt } = req.body;
  const job = jobManager.getJob(id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  try {
    const result = await thumbnailGenerator.generateThumbnail({
      topic: job.options.topic,
      title: job.metadata?.title || job.options.topic,
      hook: job.script?.hook || '',
      style,
      customPrompt,
    });

    const ext = result.mimeType.includes('svg') ? 'svg' : 'png';
    const filename = `${id}_thumb.${ext}`;
    const filePath = path.join(tempVideosDir, filename);
    fs.writeFileSync(filePath, Buffer.from(result.imageBase64, 'base64'));

    const thumbnailUrl = `/api/thumbnail/${id}?t=${Date.now()}`;
    if (job.metadata) {
      job.metadata.thumbnailUrl = thumbnailUrl;
      job.metadata.thumbnailPrompt = result.prompt;
    }
    job.thumbnailUrl = thumbnailUrl;
    job.updatedAt = new Date().toISOString();

    res.json({
      thumbnailUrl,
      prompt: result.prompt,
    });
  } catch (err: any) {
    console.error('Thumbnail generation failed:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI thumbnail' });
  }
});

app.get('/api/thumbnail/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const pngPath = path.join(tempVideosDir, `${id}_thumb.png`);
  const svgPath = path.join(tempVideosDir, `${id}_thumb.svg`);

  if (fs.existsSync(pngPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(pngPath).pipe(res);
  } else if (fs.existsSync(svgPath)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(svgPath).pipe(res);
  }

  return res.status(404).json({ error: 'Thumbnail not found' });
});

// -----------------------------------------------------------------------------
// YouTube Upload Endpoint
// -----------------------------------------------------------------------------
app.post('/api/youtube/upload', async (req: Request, res: Response) => {
  const { jobId, visibility, scheduledAt } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required.' });
  }

  const channel = youtubeService.getCurrentChannel();
  if (!channel.connected) {
    return res.status(401).json({
      error: 'Please connect your YouTube channel first using official Google OAuth.',
    });
  }

  try {
    const uploadRecord = await jobManager.uploadShortToYouTube(
      jobId,
      visibility || 'public',
      scheduledAt
    );
    res.json(uploadRecord);
  } catch (err: any) {
    console.error('Upload failed:', err);
    res.status(500).json({
      error: err.message || 'YouTube upload encountered an error.',
    });
  }
});

app.get('/api/history', (req: Request, res: Response) => {
  res.json({
    history: jobManager.getUploadHistory(),
    jobs: jobManager.getAllJobs(),
  });
});

// -----------------------------------------------------------------------------
// Media Serving Endpoints (Audio WAV & Video)
// -----------------------------------------------------------------------------
app.get('/api/audio/:id', (req: Request, res: Response) => {
  const audioId = req.params.id.replace(/\.wav$/, '');
  const audioPath = path.join(tempVideosDir, `${audioId}.wav`);

  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: 'Audio file not found or expired.' });
  }

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Accept-Ranges', 'bytes');
  fs.createReadStream(audioPath).pipe(res);
});

app.get('/api/video/:id', (req: Request, res: Response) => {
  const videoId = req.params.id.replace(/\.mp4$/, '');
  const metaPath = path.join(tempVideosDir, `${videoId}.json`);

  if (!fs.existsSync(metaPath)) {
    return res.status(404).json({ error: 'Video descriptor not found or expired.' });
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  res.json(meta);
});

// Guard: prevent any unmatched /api/* route from falling through to HTML index
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global API error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Express server error:', err);
  if (req.originalUrl.startsWith('/api')) {
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  } else {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// Dev & Production Serving
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite dev server as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`YouTube Shorts Auto Creator running on port ${PORT}`);
  });
}

startServer();
