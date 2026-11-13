import React from 'react';

/**
 * Subtle topographic-contour SVG pattern for the calm operations-room hero background.
 * Uses thin 1px lines, restrained slate strokes, and low opacity to avoid visual noise.
 */
export const TopographicBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-30 select-none"
    >
      <svg
        className="h-full w-full stroke-slate-700/60"
        fill="none"
        strokeWidth="1"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M-100,120 C180,100 320,240 600,190 C880,140 1020,80 1300,140" />
        <path d="M-100,220 C140,190 360,330 640,280 C920,230 1080,170 1300,240" />
        <path d="M-100,320 C160,290 400,430 680,380 C960,330 1120,260 1300,330" />
        <path d="M-100,420 C200,390 440,510 720,470 C1000,430 1140,360 1300,420" />
        <path d="M-100,520 C220,490 480,600 760,560 C1040,520 1180,450 1300,520" />
        <path d="M-100,620 C260,590 520,690 800,650 C1080,610 1200,540 1300,610" />

        {/* Contour elevation index ticks */}
        <text x="320" y="235" fill="currentColor" className="text-[9px] font-mono fill-slate-600/70">
          EL. 18.5m
        </text>
        <text x="640" y="275" fill="currentColor" className="text-[9px] font-mono fill-slate-600/70">
          EL. 14.0m
        </text>
        <text x="760" y="555" fill="currentColor" className="text-[9px] font-mono fill-slate-600/70">
          EL. 8.2m HAOR SINK
        </text>
      </svg>
    </div>
  );
};
