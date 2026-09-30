import React from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Mic,
  Film,
  Youtube,
  ShieldCheck,
  Copy,
  XCircle,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import { SystemStatus, YouTubeChannel } from '../types/index.ts';

interface SettingsStatusProps {
  status: SystemStatus | null;
  channel: YouTubeChannel;
  onConnectYouTube: () => void;
  onDisconnectYouTube: () => void;
}

export const SettingsStatus: React.FC<SettingsStatusProps> = ({
  status,
  channel,
  onConnectYouTube,
  onDisconnectYouTube,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const redirectUri =
    status?.youtubeOAuth?.redirectUri ||
    'https://your-backend.run.app/api/youtube/callback';

  const clientIdConfigured = status?.youtubeOAuth?.clientIdConfigured ?? false;
  const clientSecretConfigured = status?.youtubeOAuth?.clientSecretConfigured ?? false;
  const redirectUriConfigured = status?.youtubeOAuth?.redirectUriConfigured ?? true;
  const youtubeApiConfigured = status?.youtubeOAuth?.youtubeApiConfigured ?? true;
  const isFullyConfigured = clientIdConfigured && clientSecretConfigured;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
          <span>Settings</span>
          <span>→</span>
          <span>YouTube Integration</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <SlidersHorizontal className="w-6 h-6 text-red-500" />
          <span>System & API Configuration Status</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your modular AI pipeline providers, YouTube OAuth 2.0 integration, and backend services.
        </p>
      </div>

      {/* SECTION: Settings -> YouTube Integration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
              <Youtube className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">YouTube Integration</h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isFullyConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isFullyConfigured ? 'Ready for Authentication' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Google OAuth 2.0 server-side authentication and YouTube Data API v3 upload engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {channel.connected ? (
              <button
                onClick={onDisconnectYouTube}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-400 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-2"
              >
                <span>Disconnect Channel</span>
              </button>
            ) : (
              <button
                onClick={onConnectYouTube}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span>Connect YouTube Channel</span>
              </button>
            )}
          </div>
        </div>

        {/* OAuth Configuration 4-Point Checklist */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>OAuth Configuration Checklist</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Client ID */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                clientIdConfigured
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">Client ID</span>
                {clientIdConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-[11px] block text-slate-400">
                {clientIdConfigured ? '✓ Client ID configured' : '✗ Missing in backend .env'}
              </span>
            </div>

            {/* 2. Client Secret */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                clientSecretConfigured
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">Client Secret</span>
                {clientSecretConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-[11px] block text-slate-400">
                {clientSecretConfigured ? '✓ Client Secret configured' : '✗ Missing in backend .env'}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                (Never exposed to frontend)
              </span>
            </div>

            {/* 3. Redirect URI */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                redirectUriConfigured
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">Redirect URI</span>
                {redirectUriConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-[11px] block text-slate-400">
                ✓ Redirect URI configured
              </span>
            </div>

            {/* 4. YouTube Data API */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                youtubeApiConfigured
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">YouTube Data API</span>
                {youtubeApiConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-[11px] block text-slate-400">
                ✓ YouTube Data API configured
              </span>
            </div>
          </div>
        </div>

        {/* If Missing Credentials, Developer Setup Notice */}
        {!isFullyConfigured && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Developer Setup Notice: Google OAuth credentials required</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              To connect your real YouTube channel, create a Web Application in your Google Cloud Console and define these variables in your backend environment:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-amber-300 space-y-1">
              <div>GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"</div>
              <div>GOOGLE_CLIENT_SECRET="your-client-secret"</div>
              <div>GOOGLE_REDIRECT_URI="{redirectUri}"</div>
            </div>
          </div>
        )}

        {/* Connected Channel Info Card */}
        {channel.connected ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {channel.thumbnailUrl ? (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/40"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {channel.title?.charAt(0) || 'Y'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{channel.title}</span>
                  <span className="text-emerald-400 text-xs font-semibold">YouTube Connected ✓</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                  <span>{channel.customUrl || '@creator'}</span>
                  <span>•</span>
                  <span>{Number(channel.subscriberCount || 0).toLocaleString()} subscribers</span>
                  <span>•</span>
                  <span>Scope: youtube.upload</span>
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnectYouTube}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-750 text-xs text-slate-400 flex items-center justify-between">
            <span>No YouTube channel currently connected.</span>
            <span className="text-slate-500 font-mono">Requires Google OAuth Sign-in</span>
          </div>
        )}

        {/* Authorized Redirect URI copy box */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-750 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Authorized Redirect URI (configure this in Google Cloud Console):</span>
            <button
              onClick={() => copyToClipboard(redirectUri, 'redirect')}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedField === 'redirect' ? 'Copied!' : 'Copy URI'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 select-all truncate">
            {redirectUri}
          </div>
        </div>
      </div>

      {/* Provider Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. AI Text Provider */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Script & Research Provider</h4>
                <p className="text-xs text-slate-400">AITextProvider Interface</p>
              </div>
            </div>
            {status?.aiProvider.configured ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Pending
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-750 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Driver:</span>
              <span className="text-slate-200">{status?.aiProvider.name || 'Gemini 3.8 Flash'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-purple-400">{status?.aiProvider.model || 'models/gemini-3.8-flash'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400">{status?.aiProvider.statusText}</span>
            </div>
          </div>
        </div>

        {/* 2. Voice Generation Provider */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Voiceover Audio Provider</h4>
                <p className="text-xs text-slate-400">VoiceGenerationProvider Interface</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-750 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Engine:</span>
              <span className="text-slate-200">{status?.voiceProvider.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Output:</span>
              <span className="text-emerald-400">24kHz Mono 16-bit WAV</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-slate-300">{status?.voiceProvider.statusText}</span>
            </div>
          </div>
        </div>

        {/* 3. Video Generation Provider */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Video Assembly Provider</h4>
                <p className="text-xs text-slate-400">VideoGenerationProvider Interface</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              1080x1920 HD
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-750 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Aspect Ratio:</span>
              <span className="text-red-400 font-bold">{status?.videoProvider.aspectRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resolution:</span>
              <span className="text-slate-200">{status?.videoProvider.targetResolution}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Captions:</span>
              <span className="text-emerald-400">Synchronized High-Impact Typography</span>
            </div>
          </div>
        </div>

        {/* 4. Backend Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Full-Stack Server & Retention</h4>
                <p className="text-xs text-slate-400">Express API Service</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Online
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-750 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Uptime:</span>
              <span className="text-slate-200">{status?.server.uptimeSeconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auto-Cleanup Retention:</span>
              <span className="text-amber-400">{status?.server.videoRetentionHours} Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Temporary Storage:</span>
              <span className="text-emerald-400">Secure temp/videos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-5 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-400">
          <h4 className="text-sm font-bold text-white">Security & Privacy Architecture</h4>
          <p>
            • No Google passwords are ever requested or stored. All YouTube channel access strictly uses official Google OAuth 2.0 tokens with state verification.
          </p>
          <p>
            • OAuth client secrets and credentials reside exclusively on the server side and are NEVER bundled into client JavaScript.
          </p>
          <p>
            • Minimum required scope used: <code className="text-slate-300">https://www.googleapis.com/auth/youtube.upload</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
