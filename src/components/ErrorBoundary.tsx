import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Language } from '../types';

interface Props {
  children: ReactNode;
  language?: Language;
  onResetView?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onResetView) {
      this.props.onResetView();
    } else {
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isBn = this.props.language === 'bn';
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[50vh] flex items-center justify-center p-6"
        >
          <div className="max-w-lg w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-2">
              {isBn ? 'ভিউ প্রদর্শনে সাময়িক বিঘ্ন' : 'View encountered an unexpected issue'}
            </h2>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {isBn
                ? 'হাইড্রোলজিক্যাল বা স্বাস্থ্য ঝুঁকি বিশ্লেষণ ডেটা লোড করার সময় একটি ত্রুটি হয়েছে। আপনি পৃষ্ঠাটি পুনরায় লোড করতে পারেন অথবা মূল ড্যাশবোর্ডে ফিরে যেতে পারেন।'
                : 'A transient error occurred while rendering this operational view. Telemetry feeds remain secure in the background.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry View'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/';
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>{isBn ? 'হোমপেজে ফিরুন' : 'Return to Home'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
