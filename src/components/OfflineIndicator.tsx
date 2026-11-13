import React, { useEffect, useState } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { Language } from '../types';

interface OfflineIndicatorProps {
  language: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        {language === 'en'
          ? 'Offline Field Mode — Cached offline guides and telemetry active.'
          : 'অফলাইন মোড — ক্যাশ করা জরুরি গাইডলাইন সক্রিয় রয়েছে।'}
      </span>
    </div>
  );
};
