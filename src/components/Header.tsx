import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Sparkles,
  SlidersHorizontal,
  History,
  Info,
  Youtube,
  AlertTriangle,
} from 'lucide-react';
import { YouTubeChannel } from '../types/index.ts';

interface HeaderProps {
  channel: YouTubeChannel;
  isOAuthAvailable: boolean;
  activeTab: 'create' | 'preview' | 'history' | 'status';
  setActiveTab: (tab: 'create' | 'preview' | 'history' | 'status') => void;
  onConnectYouTube: () => void;
  onDisconnectYouTube: () => void;
  hasActiveJob: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  channel,
  isOAuthAvailable,
  activeTab,
  setActiveTab,
  onConnectYouTube,
  onDisconnectYouTube,
  hasActiveJob,
}) => {
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('create')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20 text-white font-black">
              <Youtube className="w-6 h-6 fill-current text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Montserrat']">
                  SHORTS<span className="text-red-500">AUTO</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                  AI 9:16
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated 20–30s YouTube Shorts Studio</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Short</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'preview'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Preview & Edit</span>
              {hasActiveJob && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'status'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Status & API</span>
            </button>
          </nav>

          {/* YouTube Connection Status */}
          <div className="flex items-center gap-3">
            {channel.connected ? (
              <div className="relative">
                <button
                  onClick={() => setShowChannelMenu(!showChannelMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-emerald-500/40 text-left transition-all group"
                >
                  {channel.thumbnailUrl ? (
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.title || 'Channel'}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                      {channel.title?.charAt(0) || 'Y'}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white max-w-[120px] truncate">
                        {channel.title}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium block">
                      YouTube Connected ✓
                    </span>
                  </div>
                </button>

                {showChannelMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                      {channel.thumbnailUrl && (
                        <img
                          src={channel.thumbnailUrl}
                          alt="avatar"
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{channel.title}</p>
                        <p className="text-xs text-slate-400">{channel.customUrl || '@creator'}</p>
                      </div>
                    </div>
                    <div className="py-2.5 text-xs text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subscribers:</span>
                        <span className="font-semibold text-white">
                          {Number(channel.subscriberCount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Upload Scope:</span>
                        <span className="text-emerald-400 font-medium">youtube.upload ✓</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <button
                        onClick={() => {
                          setShowChannelMenu(false);
                          onDisconnectYouTube();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect Channel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onConnectYouTube}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Youtube className="w-4 h-4 fill-current" />
                  <span>Connect YouTube Channel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/95 px-2 py-1.5 justify-around">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium rounded-lg ${
            activeTab === 'create' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Create</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium rounded-lg ${
            activeTab === 'preview' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          <Play className="w-4 h-4 mb-0.5" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium rounded-lg ${
            activeTab === 'history' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4 mb-0.5" />
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium rounded-lg ${
            activeTab === 'status' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mb-0.5" />
          <span>Status</span>
        </button>
      </div>
    </header>
  );
};
