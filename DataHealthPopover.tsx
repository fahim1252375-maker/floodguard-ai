import React, { forwardRef } from 'react';
import {
  Check,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../../types';
import { t } from '../../utils/translations';
import { DataSourceItem, HealthStatus, OverallHealth } from '../../hooks/useDataHealth';

interface DataHealthPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  overall: OverallHealth;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  sources: DataSourceItem[];
  onRefresh: () => void;
  formatTimeAgo: (date: Date | null) => string;
}

export const DataHealthPopover = forwardRef<HTMLDivElement, DataHealthPopoverProps>(
  (
    {
      isOpen,
      onClose,
      language,
      overall,
      isRefreshing,
      lastUpdated,
      sources,
      onRefresh,
      formatTimeAgo,
    },
    ref
  ) => {
    if (!isOpen) return null;

    const tr = t[language];

    const getStatusBadge = (status: HealthStatus, type: 'live_api' | 'simulated_benchmark') => {
      if (status === 'loading') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
            <span>SYNCING</span>
          </span>
        );
      }
      if (status === 'simulated' || type === 'simulated_benchmark') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
            <span>SIMULATED</span>
          </span>
        );
      }
      if (status === 'live') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>LIVE</span>
          </span>
        );
      }
      if (status === 'stale') {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>STALE</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>OFFLINE</span>
        </span>
      );
    };

    return (
      <div
        ref={ref}
        role="dialog"
        aria-label={tr.dataHealth}
        className="absolute right-2 sm:right-4 top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-4 z-50 text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <span>{tr.dataHealth}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  overall === 'all_live'
                    ? 'bg-emerald-400'
                    : overall === 'partial'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {language === 'en'
                ? 'Telemetry pipeline status & latency'
                : 'লাইভ উপাত্ত পাইপলাইনের অবস্থা'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3 space-y-3 divide-y divide-slate-800/60">
          {sources.map((src) => (
            <div key={src.id} className="pt-2.5 first:pt-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  {language === 'en' ? src.nameEn : src.nameBn}
                </span>
                {getStatusBadge(src.status, src.type)}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                {language === 'en' ? src.detailsEn : src.detailsBn}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>{src.endpoint}</span>
                <span>
                  {src.type === 'simulated_benchmark'
                    ? language === 'en'
                      ? 'Calibrated benchmark'
                      : 'ক্যালিব্রেটেড মান'
                    : `${tr.lastSynced}: ${formatTimeAgo(src.lastSynced)}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {lastUpdated ? `${tr.lastSynced}: ${formatTimeAgo(lastUpdated)}` : ''}
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-medium text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? tr.refreshing : tr.refreshNow}</span>
          </button>
        </div>
      </div>
    );
  }
);
DataHealthPopover.displayName = 'DataHealthPopover';
