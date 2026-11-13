import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Languages,
  Menu,
  X,
} from 'lucide-react';
import { Language, LocationData } from '../types';
import { t } from '../utils/translations';
import { useDataHealth } from '../hooks/useDataHealth';
import { EmergencyModal } from './EmergencyModal';
import { PWAInstallButton } from './PWAInstallButton';
import { SignalStrip } from './navbar/SignalStrip';
import { DataHealthPopover } from './navbar/DataHealthPopover';
import { NavMenu } from './navbar/NavMenu';
import { MobileDrawer } from './navbar/MobileDrawer';
import { LiveWeatherPayload } from '../utils/weatherTransform';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  unreadAlertCount: number;
  onToggleSidebar?: () => void;
  locations?: LocationData[];
  weatherPayload?: LiveWeatherPayload | null;
  onOpenCommandPalette?: () => void;
  myUpazilaName?: string | null;
  onNavigateToMyUpazila?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  unreadAlertCount,
  onToggleSidebar,
  locations = [],
  weatherPayload = null,
  onOpenCommandPalette,
  myUpazilaName,
  onNavigateToMyUpazila,
}) => {
  const [bstTime, setBstTime] = useState<string>('');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isDataHealthOpen, setIsDataHealthOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const tr = t[language];

  // Shared Data Health Hook
  const {
    overall,
    isRefreshing,
    lastUpdated,
    cherrapunjiRainfall24h,
    past24hTotalMm,
    next24hTotalMm,
    daily7Days,
    sources,
    refresh,
  } = useDataHealth();

  // Ticking Dhaka Bangladesh Standard Time (BST, UTC+6)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setBstTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreDropdownOpen(false);
      }
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDataHealthOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMoreDropdownOpen(false);
        setIsDataHealthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setIsMobileMenuOpen(false);
    setIsMoreDropdownOpen(false);
    setIsDataHealthOpen(false);
  };

  // Helper for last-synced relative time
  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return tr.justNow;
    const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMin <= 1) return tr.justNow;
    return `${diffMin} ${tr.minutesAgo}`;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-colors">
        {/* Signal Strip Row */}
        <SignalStrip
          language={language}
          bstTime={bstTime}
          overall={overall}
          cherrapunjiRainfall24h={cherrapunjiRainfall24h}
          past24hTotalMm={past24hTotalMm}
          next24hTotalMm={next24hTotalMm}
          daily7Days={daily7Days}
          locations={locations}
          weatherPayload={weatherPayload}
          onOpenDataHealth={() => setIsDataHealthOpen(!isDataHealthOpen)}
          onOpenCommandPalette={onOpenCommandPalette}
          myUpazilaName={myUpazilaName}
          onNavigateToMyUpazila={onNavigateToMyUpazila}
          onNavigate={handleNavClick}
        />

        {/* Data Health Popover */}
        <DataHealthPopover
          ref={popoverRef}
          isOpen={isDataHealthOpen}
          onClose={() => setIsDataHealthOpen(false)}
          language={language}
          overall={overall}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          sources={sources}
          onRefresh={() => refresh()}
          formatTimeAgo={formatTimeAgo}
        />

        {/* Main Navbar Row */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Toggle navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              title="Return to FloodGuard Operations Room"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    FloodGuard<span className="text-cyan-400">.AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-wide bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 uppercase hidden sm:inline-block">
                    RESEARCH PROTOTYPE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  {language === 'en'
                    ? 'Sylhet & Sunamganj Basin Intelligence'
                    : 'সিলেট-সুনামগঞ্জ প্লাবন ও স্বাস্থ্য ঝুঁকি'}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links (NavMenu) */}
          <NavMenu
            currentView={currentView}
            onNavigate={handleNavClick}
            language={language}
            unreadAlertCount={unreadAlertCount}
            isMoreDropdownOpen={isMoreDropdownOpen}
            onToggleMoreDropdown={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
            dropdownRef={dropdownRef}
          />

          {/* Right Action Controls: PWA, Language, Emergency Hotline */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* PWA Install Button */}
            <PWAInstallButton language={language} />

            {/* Language Switcher */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner"
              role="group"
              aria-label="Language selection"
            >
              <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold select-none pr-0.5">
                <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>

              <div className="relative inline-flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  aria-pressed={language === 'en'}
                  aria-label="Switch language to English (EN)"
                  title="English"
                  className={`relative z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EN
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange('bn')}
                  aria-pressed={language === 'bn'}
                  aria-label="Switch language to Bengali (BN / বাংলা)"
                  title="বাংলা"
                  className={`relative z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold rounded-md transition-all cursor-pointer font-bengali ${
                    language === 'bn'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BN
                </button>
              </div>
            </div>

            {/* Emergency Hotline Button */}
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25 hover:border-rose-500/50 transition-all shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer"
              title="Official Emergency Hotlines: 1090 FFWC / 999 Police & Ambulance"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
              <span className="hidden md:inline">{tr.emergencyHotline}</span>
              <span className="md:hidden font-mono font-bold text-xs">1090</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          currentView={currentView}
          onNavigate={handleNavClick}
          language={language}
          onLanguageChange={onLanguageChange}
          unreadAlertCount={unreadAlertCount}
          onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
          bstTime={bstTime}
        />
      </header>

      {/* Emergency Modal Component */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        language={language}
      />
    </>
  );
};
