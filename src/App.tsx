import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { TopicGenerator } from './components/TopicGenerator.tsx';
import { GenerationProgress } from './components/GenerationProgress.tsx';
import { VideoPlayerPreview } from './components/VideoPlayerPreview.tsx';
import { MetadataEditor } from './components/MetadataEditor.tsx';
import { UploadHistoryView } from './components/UploadHistoryView.tsx';
import { SettingsStatus } from './components/SettingsStatus.tsx';
import { api } from './services/api.ts';
import {
  GenerationOptions,
  ShortJob,
  SystemStatus,
  UploadRecord,
  UploadVisibility,
  YouTubeChannel,
} from './types/index.ts';
import { Youtube, ShieldCheck, X, Sparkles, SlidersHorizontal, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'history' | 'status'>('create');
  const [channel, setChannel] = useState<YouTubeChannel>({ connected: false });
  const [isOAuthAvailable, setIsOAuthAvailable] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const [currentJob, setCurrentJob] = useState<ShortJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [jobsList, setJobsList] = useState<ShortJob[]>([]);

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const pollTimerRef = useRef<any>(null);

  // Initialize data on mount
  useEffect(() => {
    loadStatus();
    loadHistory();

    // Listen for OAuth message from child popup
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YOUTUBE_AUTH_SUCCESS') {
        setChannel(event.data.channel);
        setShowConnectModal(false);
        setAuthError(null);
        loadStatus();
      }
    };
    window.addEventListener('message', handleAuthMessage);

    // Check URL params if redirected directly
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      loadStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const loadStatus = async () => {
    try {
      const [sys, authStatus] = await Promise.all([
        api.getSystemStatus(),
        api.getYouTubeChannelStatus(),
      ]);
      setSystemStatus(sys);
      setChannel(authStatus.channel);
      setIsOAuthAvailable(authStatus.isConfigured);
    } catch (e) {
      console.error('Failed to load status:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data.history);
      setJobsList(data.jobs);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  // Poll active generation job
  const startPollingJob = (jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const job = await api.getJob(jobId);
        setCurrentJob(job);

        if (job.status === 'ready') {
          clearInterval(pollTimerRef.current);
          setIsGenerating(false);
          loadHistory();
          // Transition to preview player
          setTimeout(() => {
            setActiveTab('preview');
          }, 800);
        } else if (job.status === 'failed') {
          clearInterval(pollTimerRef.current);
          setIsGenerating(false);
        }
      } catch (e) {
        console.error('Job polling error:', e);
      }
    }, 800);
  };

  // Generate Short
  const handleGenerate = async (options: GenerationOptions) => {
    setIsGenerating(true);
    setAuthError(null);
    try {
      const job = await api.createJob(options);
      setCurrentJob(job);
      setActiveTab('create');
      startPollingJob(job.id);
    } catch (err: any) {
      setIsGenerating(false);
      console.error('Failed to create generation job:', err);
    }
  };

  // Retry failed job
  const handleRetryJob = async () => {
    if (!currentJob) return;
    setIsGenerating(true);
    try {
      const job = await api.retryJob(currentJob.id);
      setCurrentJob(job);
      startPollingJob(job.id);
    } catch (e) {
      setIsGenerating(false);
    }
  };

  // Connect Google OAuth Popup
  const handleConnectYouTube = async () => {
    setAuthError(null);
    try {
      const url = await api.getGoogleAuthUrl();
      const width = 600;
      const height = 720;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Google OAuth');
      setShowConnectModal(true);
    }
  };

  // Disconnect YouTube
  const handleDisconnectYouTube = async () => {
    try {
      await api.disconnectYouTube();
      setChannel({ connected: false });
      loadStatus();
    } catch (e) {
      console.error('Failed to disconnect:', e);
    }
  };

  // Update Metadata Edits
  const handleUpdateMetadata = async (updates: {
    title?: string;
    description?: string;
    hashtags?: string[];
    fullNarration?: string;
  }) => {
    if (!currentJob) return;
    const updated = await api.updateJobMetadata(currentJob.id, updates);
    setCurrentJob(updated);
  };

  // Upload to YouTube
  const handleUploadToYouTube = async (
    visibility: UploadVisibility,
    scheduledAt?: string
  ): Promise<UploadRecord> => {
    if (!currentJob) throw new Error('No active video to upload');
    const record = await api.uploadToYouTube(currentJob.id, visibility, scheduledAt);
    loadHistory();
    return record;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <Header
        channel={channel}
        isOAuthAvailable={isOAuthAvailable}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onConnectYouTube={handleConnectYouTube}
        onDisconnectYouTube={handleDisconnectYouTube}
        hasActiveJob={!!currentJob && currentJob.status !== 'failed'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Create Short */}
        {activeTab === 'create' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <TopicGenerator onGenerate={handleGenerate} isGenerating={isGenerating} />

            {/* Show Real Generation Progress if Job exists */}
            {currentJob && (
              <GenerationProgress
                job={currentJob}
                onRetry={handleRetryJob}
                onViewPreview={() => setActiveTab('preview')}
              />
            )}
          </div>
        )}

        {/* Tab 2: Preview & Edit */}
        {activeTab === 'preview' && (
          <div className="animate-in fade-in duration-300">
            {currentJob && currentJob.status === 'ready' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* 9:16 Video Player Column */}
                <div className="lg:col-span-5 flex justify-center">
                  <VideoPlayerPreview job={currentJob} />
                </div>

                {/* Metadata & Script Editor Column */}
                <div className="lg:col-span-7">
                  <MetadataEditor
                    job={currentJob}
                    channel={channel}
                    onUpdateMetadata={handleUpdateMetadata}
                    onRegenerate={() => handleGenerate(currentJob.options)}
                    onGenerateAgain={() => {
                      setCurrentJob(null);
                      setActiveTab('create');
                    }}
                    onUploadToYouTube={handleUploadToYouTube}
                    onOpenConnectModal={() => setShowConnectModal(true)}
                  />
                </div>
              </div>
            ) : currentJob && currentJob.status !== 'ready' && currentJob.status !== 'failed' ? (
              <div className="text-center py-16">
                <GenerationProgress
                  job={currentJob}
                  onRetry={handleRetryJob}
                  onViewPreview={() => {}}
                />
              </div>
            ) : (
              <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto">
                <Sparkles className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">No Short Ready for Preview</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Enter a topic in the Create Short tab to automatically generate a 20–30s vertical video.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all"
                >
                  Create a Short Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Upload History */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <UploadHistoryView
              history={history}
              jobs={jobsList}
              onSelectJob={(selectedJob) => {
                setCurrentJob(selectedJob);
                setActiveTab('preview');
              }}
              onCreateNew={() => setActiveTab('create')}
            />
          </div>
        )}

        {/* Tab 4: System & API Status */}
        {activeTab === 'status' && (
          <div className="animate-in fade-in duration-300">
            <SettingsStatus
              status={systemStatus}
              channel={channel}
              onConnectYouTube={handleConnectYouTube}
              onDisconnectYouTube={handleDisconnectYouTube}
            />
          </div>
        )}
      </main>

      {/* YouTube Connection Modal (Real Google OAuth) */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30">
                  <Youtube className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connect YouTube Channel</h3>
                  <p className="text-xs text-slate-400">Official Google OAuth 2.0</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Missing Configuration Alert */}
            {(!isOAuthAvailable || authError) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Developer Configuration Notice</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {authError ||
                    'Google OAuth credentials are not configured on the backend server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your backend environment.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowConnectModal(false);
                    setActiveTab('status');
                  }}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>View OAuth Setup & Redirect URI in Status tab</span>
                </button>
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-750">
              <p className="font-semibold text-white">What this allows:</p>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct upload of vertical 9:16 Shorts to your YouTube channel</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automatic Shorts title, description, and hashtags setup</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Never requires or stores your Google password</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  handleConnectYouTube();
                }}
                disabled={!isOAuthAvailable}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>
          YouTube Shorts Auto Creator • Aspect Ratio 9:16 (1080x1920) • Official YouTube Data API v3
        </p>
      </footer>
    </div>
  );
}
