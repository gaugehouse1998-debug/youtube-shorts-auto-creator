import React from 'react';
import {
  History,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Share2,
  Film,
} from 'lucide-react';
import { UploadRecord, ShortJob } from '../types/index.ts';

interface UploadHistoryViewProps {
  history: UploadRecord[];
  jobs: ShortJob[];
  onSelectJob: (job: ShortJob) => void;
  onCreateNew: () => void;
}

export const UploadHistoryView: React.FC<UploadHistoryViewProps> = ({
  history,
  jobs,
  onSelectJob,
  onCreateNew,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-red-500" />
            <span>Upload & Creation History</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track your generated YouTube Shorts and their publication status.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all"
        >
          + Create New Short
        </button>
      </div>

      {/* Upload Records */}
      {history.length === 0 && jobs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/50 border border-slate-800">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Shorts Created Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            Enter a topic and generate your first AI vertical Short ready for YouTube.
          </p>
          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/30"
          >
            Start First Short
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent YouTube Uploads ({history.length})
          </h3>

          {history.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
              No videos uploaded to YouTube yet. You can upload any generated short from the Preview tab.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            record.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : record.status === 'uploading'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {record.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                          {record.status === 'uploading' && <Clock className="w-3 h-3 animate-spin" />}
                          {record.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          <span className="capitalize">{record.status}</span>
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono capitalize">
                          • {record.visibility}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{record.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">Topic: {record.topic}</p>
                    </div>

                    {record.youtubeUrl && (
                      <a
                        href={record.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all shrink-0"
                        title="View on YouTube Shorts"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {record.restrictionNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-snug">
                      <span className="font-bold text-amber-200 block mb-0.5">⚠️ API Notice:</span>
                      {record.restrictionNotice}
                    </div>
                  )}

                  {record.error && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
                      {record.error}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                    {record.youtubeUrl && (
                      <span className="font-mono text-emerald-400">youtube.com/shorts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Past Generated Jobs */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Generated Shorts Archive ({jobs.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => onSelectJob(j)}
                  className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400 truncate max-w-[180px]">
                      {j.options.topic}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {j.options.duration}s
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {j.metadata?.title || j.options.topic}
                  </h5>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{j.options.style}</span>
                    <span className="flex items-center gap-1 text-red-400 font-semibold group-hover:underline">
                      <Play className="w-3 h-3 fill-current" />
                      Preview
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
