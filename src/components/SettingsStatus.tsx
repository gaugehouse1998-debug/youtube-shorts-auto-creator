import React, { useState, useEffect } from 'react';
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
  KeyRound,
  ExternalLink,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { SystemStatus, YouTubeChannel } from '../types/index.ts';
import {
  getEffectiveApiBaseUrl,
  setCustomBackendUrl,
  DEFAULT_PRODUCTION_BACKEND_URL,
  api,
} from '../services/api.ts';

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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentBackendUrl, setCurrentBackendUrl] = useState('');
  const [inputBackendUrl, setInputBackendUrl] = useState('');
  const [backendTestStatus, setBackendTestStatus] = useState<string | null>(null);
  const [isTestingBackend, setIsTestingBackend] = useState(false);

  useEffect(() => {
    const effective = getEffectiveApiBaseUrl();
    const finalUrl = effective || DEFAULT_PRODUCTION_BACKEND_URL;
    setCurrentBackendUrl(finalUrl);
    setInputBackendUrl(finalUrl);
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const frontendUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}`
      : 'https://gaugehouse1998-debug.github.io/youtube-shorts-auto-creator';

  const backendUrl = currentBackendUrl || DEFAULT_PRODUCTION_BACKEND_URL;

  const redirectUri =
    status?.youtubeOAuth?.redirectUri && status.youtubeOAuth.redirectUri.startsWith('http')
      ? status.youtubeOAuth.redirectUri
      : `${backendUrl.replace(/\/$/, '')}/api/youtube/callback`;

  const clientIdConfigured = status?.youtubeOAuth?.clientIdConfigured ?? false;
  const clientSecretConfigured = status?.youtubeOAuth?.clientSecretConfigured ?? false;
  const youtubeApiConfigured = status?.youtubeOAuth?.youtubeApiConfigured ?? true;
  const isFullyConfigured = clientIdConfigured && clientSecretConfigured;

  const handleSaveCustomBackend = async () => {
    setIsTestingBackend(true);
    setBackendTestStatus('Connecting...');
    try {
      const testUrl = inputBackendUrl.trim().replace(/\/$/, '');
      const res = await fetch(`${testUrl}/api/system/status`);
      if (res.ok) {
        setCustomBackendUrl(testUrl);
        setCurrentBackendUrl(testUrl);
        setBackendTestStatus('Connected successfully! Reloading status...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setBackendTestStatus(`Server responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      setBackendTestStatus(`Connection error: ${err.message}`);
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleResetBackend = () => {
    setCustomBackendUrl(null);
    setCurrentBackendUrl(DEFAULT_PRODUCTION_BACKEND_URL);
    setInputBackendUrl(DEFAULT_PRODUCTION_BACKEND_URL);
    setBackendTestStatus('Reset to default backend. Reloading...');
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
          <span>Settings</span>
          <span>→</span>
          <span>YouTube OAuth Integration</span>
        </div>
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <SlidersHorizontal className="w-6 h-6 text-red-500" />
          <span>YouTube OAuth & System Status</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your official Google Cloud OAuth 2.0 configuration, live backend connection, and modular video pipeline.
        </p>
      </div>

      {/* SECTION: Google Cloud Setup & YouTube OAuth Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
              <Youtube className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">YouTube OAuth Configuration</h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isFullyConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isFullyConfigured ? 'OAuth Credentials Ready' : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Google Cloud Console Web Application credentials and server-side token exchange
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

        {/* 1. Environment & URL Diagnostics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Frontend URL */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-750 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="font-bold flex items-center gap-1.5 text-slate-300">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Frontend URL (GitHub Pages)</span>
              </span>
              <button
                onClick={() => copyToClipboard(frontendUrl, 'frontend')}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedField === 'frontend' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 select-all break-all">
              {frontendUrl}
            </div>
          </div>

          {/* Backend URL */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-750 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="font-bold flex items-center gap-1.5 text-slate-300">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Backend URL (Live Deployed Backend)</span>
              </span>
              <button
                onClick={() => copyToClipboard(backendUrl, 'backend')}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-semibold"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedField === 'backend' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 select-all break-all">
              {backendUrl}
            </div>
          </div>
        </div>

        {/* 2. Official OAuth Redirect URI (Prominent) */}
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-red-400" />
              <span>OAuth Redirect URI (Add this exact URI to Google Cloud Console):</span>
            </span>
            <button
              onClick={() => copyToClipboard(redirectUri, 'redirect')}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] font-bold"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedField === 'redirect' ? 'Copied to Clipboard!' : 'Copy Redirect URI'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 select-all break-all">
            {redirectUri}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            In Google Cloud Console under <strong>APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs</strong>, paste this exact string under <strong>Authorized redirect URIs</strong>.
          </p>
        </div>

        {/* 3. OAuth Configuration Status Checklist */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Credentials Status Checklist</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Client ID */}
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
              <span className="text-[11px] block font-semibold">
                {clientIdConfigured ? 'Configured ✓' : 'Missing ✕'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {clientIdConfigured ? 'Valid Google OAuth ID' : 'Requires .apps.googleusercontent.com in backend'}
              </span>
            </div>

            {/* Client Secret */}
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
              <span className="text-[11px] block font-semibold">
                {clientSecretConfigured ? 'Configured ✓' : 'Missing ✕'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Stored securely on backend; never shown in UI)
              </span>
            </div>

            {/* YouTube Data API */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                youtubeApiConfigured
                  ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">YouTube API</span>
                {youtubeApiConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <span className="text-[11px] block font-semibold">
                {youtubeApiConfigured ? 'Configured ✓' : 'Missing ✕'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                YouTube Data API v3 enabled
              </span>
            </div>
          </div>
        </div>

        {/* 4. Connected YouTube Channel Card */}
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
                  <span>Channel ID: {channel.channelId || 'Connected via OAuth'}</span>
                  <span>•</span>
                  <span>{channel.customUrl || '@creator'}</span>
                  <span>•</span>
                  <span>{Number(channel.subscriberCount || 0).toLocaleString()} subscribers</span>
                </div>
              </div>
            </div>

            <button
              onClick={onDisconnectYouTube}
              className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30"
            >
              Disconnect YouTube
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-750 text-xs text-slate-400 flex items-center justify-between">
            <span>No YouTube channel currently connected.</span>
            <button
              onClick={onConnectYouTube}
              className="text-red-400 hover:text-red-300 font-bold"
            >
              Connect with Google →
            </button>
          </div>
        )}

        {/* 5. Custom Backend URL Switcher / Override */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-750 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>Backend API Connection Settings</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                The GitHub Pages frontend routes all API calls and OAuth requests to this backend.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetBackend}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Reset to Live Default
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputBackendUrl}
              onChange={(e) => setInputBackendUrl(e.target.value)}
              placeholder="https://your-backend.run.app"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveCustomBackend}
              disabled={isTestingBackend}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isTestingBackend ? 'Testing...' : 'Update & Test'}
            </button>
          </div>

          {backendTestStatus && (
            <p className="text-xs text-amber-300 font-mono">{backendTestStatus}</p>
          )}
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
            • No Google passwords are ever requested or stored. All YouTube channel access strictly uses official Google OAuth 2.0 tokens with CSRF state verification.
          </p>
          <p>
            • OAuth client secrets and credentials reside exclusively on the server side and are NEVER bundled into client JavaScript or GitHub Pages.
          </p>
          <p>
            • Minimum required scope used: <code className="text-slate-300">https://www.googleapis.com/auth/youtube.upload</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
