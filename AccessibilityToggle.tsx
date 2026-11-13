import React, { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { Language } from '../types';
import { safeGetItem, safeSetItem } from '../utils/storage';

const KEY = 'floodguard_a11y_v1';
interface Prefs { large: boolean; contrast: boolean }

/** Floating panel: large text + high contrast, persisted and applied as classes on <html>. */
export const AccessibilityToggle: React.FC<{ language: Language }> = ({ language }) => {
  const bn = language === 'bn';
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(() => safeGetItem<Prefs>(KEY, { large: false, contrast: false }));

  useEffect(() => {
    document.documentElement.classList.toggle('fg-large-text', prefs.large);
    document.documentElement.classList.toggle('fg-high-contrast', prefs.contrast);
    safeSetItem(KEY, prefs);
  }, [prefs]);

  const row = (on: boolean, label: string, onClick: () => void) => (
    <button role="switch" aria-checked={on} onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${on ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' : 'border-slate-700 text-slate-200'}`}>
      {label}: {on ? (bn ? 'চালু' : 'On') : (bn ? 'বন্ধ' : 'Off')}
    </button>
  );

  return (
    <div className="fixed bottom-4 left-4 z-40 print:hidden">
      {open && (
        <div className="mb-2 w-56 p-3 space-y-2 rounded-xl bg-slate-900 border border-slate-700 shadow-xl">
          {row(prefs.large, bn ? 'বড় লেখা' : 'Large text', () => setPrefs((p) => ({ ...p, large: !p.large })))}
          {row(prefs.contrast, bn ? 'উচ্চ কনট্রাস্ট' : 'High contrast', () => setPrefs((p) => ({ ...p, contrast: !p.contrast })))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        aria-label={bn ? 'অ্যাক্সেসিবিলিটি সেটিংস' : 'Accessibility settings'}
        className="w-11 h-11 rounded-full bg-slate-800 border border-slate-600 text-cyan-300 flex items-center justify-center shadow-lg hover:bg-slate-700">
        <Accessibility className="w-5 h-5" />
      </button>
    </div>
  );
};
