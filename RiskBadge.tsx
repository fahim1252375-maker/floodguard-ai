import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  language?: 'en' | 'bn';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  language = 'en',
}) => {
  const labels = {
    LOW: { en: 'Low Risk', bn: 'নিম্ন ঝুঁকি' },
    MODERATE: { en: 'Moderate Risk', bn: 'মাঝারি ঝুঁকি' },
    HIGH: { en: 'High Risk', bn: 'উচ্চ ঝুঁকি' },
    CRITICAL: { en: 'Critical Risk', bn: 'মারাত্মক ঝুঁকি' },
  };

  const colorStyles = {
    LOW: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50',
    MODERATE: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-950/50',
    HIGH: 'bg-orange-950/80 text-orange-300 border-orange-500/40 shadow-orange-950/50',
    CRITICAL: 'bg-rose-950/90 text-rose-200 border-rose-500/60 shadow-rose-950/60 animate-pulse',
  };

  const dotStyles = {
    LOW: 'bg-emerald-400',
    MODERATE: 'bg-amber-400',
    HIGH: 'bg-orange-400',
    CRITICAL: 'bg-rose-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm tracking-wide ${colorStyles[level]} ${sizeStyles[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotStyles[level]}`} />
      <span>{labels[level][language]}</span>
    </span>
  );
};
