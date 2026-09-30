# YouTube Shorts Auto Creator 🎬⚡

A complete, production-ready full-stack application that transforms a single topic into a viral 20–30 second 9:16 vertical YouTube Short. It automatically handles topic research, hook writing, scene breakdowns, voiceover audio synthesis, dynamic TikTok/Shorts-style burned-in captions, preview playback, and direct publishing to YouTube via official Google OAuth 2.0 and the YouTube Data API v3.

---

## 📑 Table of Contents

1. [Architecture & Security Overview](#1-architecture--security-overview)
2. [Backend Environment Variables](#2-backend-environment-variables)
3. [Step-by-Step Google Cloud & YouTube Setup (A–L)](#3-step-by-step-google-cloud--youtube-setup-al)
4. [Backend Endpoints Reference](#4-backend-endpoints-reference)
5. [Frontend Deployment (GitHub Pages)](#5-frontend-deployment-github-pages)
6. [Backend Deployment](#6-backend-deployment)
7. [Complete End-to-End Test Flow](#7-complete-end-to-end-test-flow)
8. [Project Structure](#8-project-structure)

---

## 1. Architecture & Security Overview

```
Frontend (React + Vite, GitHub Pages Compatible)
  │
  ├── 1. Enter Topic ("5 interesting facts about Dubai", duration, style, voice, language)
  ├── 2. Live 9-Step Progress Tracker (Real status, not fake percentages)
  ├── 3. 9:16 Vertical Video Player (1080x1920 HD, dynamic synced captions)
  ├── 4. AI-Powered 9:16 Thumbnail Generator (Gemini image generation with custom styles)
  ├── 5. Metadata Editor (Title <100 chars, Script, Description, 3-8 Hashtags)
  └── 6. Upload & Scheduling Controls (Public / Unlisted / Private)
  │
Backend (Express + TypeScript, Node.js Container / Serverless API)
  │
  ├── Modular Provider Interfaces:
  │    ├── AITextProvider (Gemini 3.8 Flash for script & research)
  │    ├── VoiceGenerationProvider (Gemini TTS 24kHz WAV audio)
  │    ├── ImageGenerationProvider (Cinematic vertical scene compositions)
  │    └── VideoGenerationProvider (1080x1920 HD assembly engine)
  │
  ├── Official Google OAuth 2.0 & YouTube Data API v3 Service:
  │    ├── Scopes: https://www.googleapis.com/auth/youtube.upload (minimum upload scope)
  │    ├── Scopes: https://www.googleapis.com/auth/youtube.readonly (channel info)
  │    ├── Cryptographic CSRF state token generation and verification
  │    ├── Automatic token refresh handling with offline access
  │    ├── Resumable 9:16 vertical video upload protocol
  │    └── Unverified project restriction detection (alerts if video is forced to private)
  │
  └── Job Manager & Storage:
       ├── Async stage-by-stage pipeline with resumption/retry
       └── Configurable retention cleaner (purges temp files after 24 hours)
```

### Security Guarantees:
- **No passwords stored**: The app never asks for or stores your Google password.
- **Server-side secrets**: `GOOGLE_CLIENT_SECRET` and API keys are stored exclusively in backend environment variables and are **never** included in client JavaScript bundles, Vite builds, or GitHub Pages.
- **CSRF State Validation**: OAuth flow uses cryptographically randomized tokens to prevent cross-site request forgery.

---

## 2. Backend Environment Variables

Configure these in your backend environment (or `.env` file for local development):

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key for script, scene timing, and voice synthesis. | `AIzaSyD...` |
| `GOOGLE_CLIENT_ID` | **Yes** | Google Cloud OAuth 2.0 Web Client ID. | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google Cloud OAuth 2.0 Web Client Secret. | `GOCSPX-xyz...` |
| `GOOGLE_REDIRECT_URI` | **Yes** | Exact authorized redirect URI registered in Google Cloud Console. | `https://your-backend.run.app/api/youtube/callback` |
| `YOUTUBE_API_KEY` | Optional | Google Cloud API key for auxiliary YouTube public data queries. | `AIzaSy...` |
| `PORT` | Optional | Backend port (default: 3000). | `3000` |
| `APP_URL` | Optional | Base public URL of backend service. | `https://your-backend.run.app` |
| `FRONTEND_URL` | Optional | Frontend origin for CORS allowlist (e.g. GitHub Pages). | `https://yourusername.github.io` |
| `VIDEO_RETENTION_HOURS` | Optional | Hours before temporary files are purged (default: 24). | `24` |

Frontend build variable (set during `npm run build` on GitHub Pages):
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base HTTPS URL of your deployed backend service. | `https://your-backend.run.app` |

---

## 3. Step-by-Step Google Cloud & YouTube Setup (A–L)

Follow these exact steps to connect your real YouTube channel:

### A. Create Google Cloud Project
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar and select **New Project**.
3. Name your project (e.g., `youtube-shorts-auto-creator`) and click **Create**.
4. Select your newly created project.

### B. Enable YouTube Data API v3
1. In the left navigation menu, go to **APIs & Services > Library**.
2. Search for `YouTube Data API v3`.
3. Click on the card and click the blue **Enable** button.

### C. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select User Type: **External** and click **Create**.
3. Complete the required App Information:
   - **App name**: `YouTube Shorts Auto Creator`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.
5. On the **Scopes** page:
   - Click **Add or Remove Scopes**.
   - Select:
     - `https://www.googleapis.com/auth/youtube.upload` (Upload YouTube videos)
     - `https://www.googleapis.com/auth/youtube.readonly` (View YouTube channel details)
     - `https://www.googleapis.com/auth/userinfo.profile` (View user profile)
   - Click **Update** then **Save and Continue**.
6. On the **Test users** page:
   - Under *Test users*, click **+ Add Users**.
   - Enter your YouTube Google account email address.
   - Click **Save and Continue**.

### D. Create OAuth 2.0 Client ID
1. In the left navigation menu, click **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.

### E. Select Web Application
1. Under **Application type**, select **Web application**.
2. Set the **Name** to `YouTube Shorts Web Client`.

### F. Configure Authorized Redirect URI
In the **Authorized redirect URIs** section, click **+ Add URI** and add the exact callback URL expected by this project:

- **For local development**:
  ```
  http://localhost:3000/api/youtube/callback
  ```
- **For production backend**:
  ```
  https://<your-backend-domain>/api/youtube/callback
  ```
*(Example: `https://youtube-shorts-backend-743842357149.asia-east1.run.app/api/youtube/callback`)*

Under **Authorized JavaScript origins**, add:
- Local: `http://localhost:3000`
- Production Backend: `https://<your-backend-domain>`
- GitHub Pages: `https://<your-username>.github.io`

Click **Create**. Google will display your **Client ID** and **Client Secret**.

### G. Add Client ID & Secret to Backend Environment
Copy the credentials into your backend `.env` file or cloud secrets manager:
```env
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
GOOGLE_REDIRECT_URI="https://<your-backend-domain>/api/youtube/callback"
```

### H. Deploy Backend
Deploy your backend to a Node.js runtime (e.g. Google Cloud Run, Railway, Render, Fly.io, or VPS) as described in Section 6.

### I. Put Backend URL in VITE_API_BASE_URL
In your frontend repository, configure `VITE_API_BASE_URL`:
```bash
VITE_API_BASE_URL="https://<your-backend-domain>"
```

### J. Deploy Frontend to GitHub Pages
Build and push your static Vite distribution to GitHub Pages as described in Section 5.

### K. Test Connect YouTube Channel
1. Open your deployed frontend.
2. In the top header, click **[ Connect YouTube Channel ]**.
3. A Google sign-in window will open. Select your Google account and grant the requested YouTube permissions.
4. The window closes automatically, and the header displays **YouTube Connected ✓** with your channel avatar and subscriber count.

### L. Test Private/Unlisted Upload
1. Generate a 20s test Short.
2. In the **Preview & Edit** tab, set visibility to **Private** or **Unlisted**.
3. Click **[ Upload to YouTube ]**.
4. Confirm successful publication and click **Open on YouTube** to view your video live on YouTube Shorts!

---

## 4. Backend Endpoints Reference

The backend provides clean, secure REST endpoints:

- `GET /api/youtube/auth`: Generates an official Google OAuth authorization URL with CSRF state token.
- `GET /api/youtube/callback`: Handles Google's redirect code, exchanges for tokens, fetches channel details, and posts success message to the client.
- `GET /api/youtube/status`: Returns current channel connection status and OAuth configuration checklist without exposing secrets.
- `POST /api/youtube/upload`: Performs a resumable 9:16 upload of the generated MP4 with title, description, tags, and visibility status.
- `POST /api/youtube/disconnect`: Clears active session tokens and channel credentials.
- `POST /api/jobs/create`: Launches the 9-stage video creation pipeline.
- `GET /api/jobs/:id`: Polls job progress and retrieves generated script, audio, and video URLs.
- `POST /api/jobs/:id/thumbnail`: Uses Gemini image generation to synthesize a 9:16 vertical thumbnail frame.

---

## 5. Frontend Deployment (GitHub Pages)

GitHub Pages hosts only static HTML, CSS, and JavaScript. **No secrets or OAuth client secrets should ever be placed in GitHub Pages.**

1. In `package.json`, ensure your repository build script includes the GitHub Pages base path:
   ```json
   "scripts": {
     "build": "tsc && vite build"
   }
   ```
2. In `vite.config.ts`, set the base path if not deploying to a custom domain:
   ```ts
   export default defineConfig({
     base: '/youtube-shorts-auto-creator/',
     // ...
   });
   ```
3. Build with your production backend URL:
   ```bash
   VITE_API_BASE_URL="https://<your-backend-domain>" npm run build
   ```
4. Deploy the `dist/` folder using GitHub Actions or `npx gh-pages -d dist`.

---

## 6. Backend Deployment

The backend runs an Express + TypeScript application on Node.js 20+.

### Recommended: Google Cloud Run (Fully Managed Container)
```bash
# Set your environment variables in Google Cloud Secret Manager or pass directly
gcloud run deploy youtube-shorts-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="...",GOOGLE_CLIENT_ID="...",GOOGLE_CLIENT_SECRET="...",GOOGLE_REDIRECT_URI="https://youtube-shorts-backend-xyz.run.app/api/youtube/callback",FRONTEND_URL="https://<your-username>.github.io"
```

---

## 7. Complete End-to-End Test Flow

1. **Connect YouTube**: Click **Connect YouTube Channel** in the header.
2. **Google Login**: The official Google OAuth consent screen opens (`accounts.google.com`).
3. **Permission**: Grant access to manage YouTube videos (`https://www.googleapis.com/auth/youtube.upload`).
4. **Channel Connected**: Google redirects back to `/api/youtube/callback`, tokens are stored securely on the backend, and the UI immediately displays **YouTube Connected ✓** with your channel title and subscriber count.
5. **Generate Short**: Enter a topic (e.g. `5 interesting facts about Dubai`), select duration (20s/25s/30s), style, and voice.
6. **Preview**: Watch the generated 9:16 vertical video with synchronized captions, audio voiceover, and custom AI thumbnail.
7. **Upload**: Select visibility (`Public`, `Unlisted`, or `Private`) and click **UPLOAD TO YOUTUBE**.
8. **YouTube URL**: The app uploads the video binary via YouTube Data API v3 and provides your live `https://youtube.com/shorts/<id>` link!

---

## 8. Project Structure

```
.
├── .env.example                     # Environment variables specification
├── index.html                       # HTML entry point
├── metadata.json                    # AI Studio metadata
├── package.json                     # Scripts & dependencies
├── README.md                        # Complete documentation & deployment guide
├── server.ts                        # Full-stack Express server with /api/youtube/* routes
├── tsconfig.json                    # TypeScript compiler options
├── vite.config.ts                   # Vite configuration
│
├── server/
│   ├── providers/
│   │   ├── interfaces.ts            # Modular interfaces (AIText, Voice, Image, Video)
│   │   ├── geminiProvider.ts        # Gemini 3.8 Flash, TTS & 9:16 Thumbnail generator
│   │   └── videoRenderer.ts         # 9:16 HD vertical video assembler
│   │
│   └── services/
│       ├── youtubeService.ts        # Official Google OAuth 2.0 & YouTube Data API v3
│       └── jobManager.ts            # Async 9-stage job engine & retention cleaner
│
└── src/
    ├── App.tsx                      # Primary application controller & tab router
    ├── index.css                    # Tailwind CSS configuration
    ├── main.tsx                     # React client bootstrap
    ├── types/
    │   └── index.ts                 # TypeScript type definitions
    ├── services/
    │   └── api.ts                   # Client API communication service
    └── components/
        ├── Header.tsx               # Header with YouTube status & navigation
        ├── TopicGenerator.tsx       # Topic input & configuration controls
        ├── GenerationProgress.tsx   # Real 9-step generation progress tracker
        ├── VideoPlayerPreview.tsx   # 9:16 vertical video player with synced captions
        ├── MetadataEditor.tsx       # Title, description, hashtags & AI thumbnail editor
        ├── UploadHistoryView.tsx    # Upload history & archive of generated shorts
        └── SettingsStatus.tsx       # Admin & system API status dashboard
```
