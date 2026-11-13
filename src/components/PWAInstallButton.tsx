import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallButtonProps {
  language: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold transition shadow-xs"
        title="Install FloodGuard PWA to home screen for offline field readiness"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span>{language === 'en' ? 'Install App' : 'অ্যাপ ইনস্টল'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Install PWA' : 'ইনস্টল'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  {language === 'en' ? 'Install on iPhone / iPad' : 'আইফোন / আইপ্যাডে ইনস্টল করুন'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {language === 'en' ? (
                  <>
                    1. Tap the <strong>Share</strong> button in the Safari bottom toolbar.
                    <br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    <br />
                    3. Launch FloodGuard anytime, even during offline power cuts.
                  </>
                ) : (
                  <>
                    ১. সাফারির নিচে থাকা <strong>Share</strong> বাটনে চাপ দিন।
                    <br />
                    ২. নিচে স্ক্রোল করে <strong>Add to Home Screen</strong> চাপুন।
                    <br />
                    ৩. অফলাইনে এবং বিদ্যুৎ বিচ্ছিন্ন অবস্থাতেও ব্যবহার করতে পারবেন।
                  </>
                )}
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
              >
                {language === 'en' ? 'Got It' : 'বুঝেছি'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
