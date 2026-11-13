import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LandingView } from './views/LandingView';

// Eager LandingView, Lazy secondary views (Phase 1.5 & Performance)
const DashboardView = React.lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const PredictionView = React.lazy(() => import('./views/PredictionView').then(m => ({ default: m.PredictionView })));
const SimulatorView = React.lazy(() => import('./views/SimulatorView').then(m => ({ default: m.SimulatorView })));
const MapView = React.lazy(() => import('./views/MapView').then(m => ({ default: m.MapView })));
const AssistantView = React.lazy(() => import('./views/AssistantView').then(m => ({ default: m.AssistantView })));
const EarlyWarningView = React.lazy(() => import('./views/EarlyWarningView').then(m => ({ default: m.EarlyWarningView })));
const CommunityReportsView = React.lazy(() => import('./views/CommunityReportsView').then(m => ({ default: m.CommunityReportsView })));
const HistoricalView = React.lazy(() => import('./views/HistoricalView').then(m => ({ default: m.HistoricalView })));
const AdminView = React.lazy(() => import('./views/AdminView').then(m => ({ default: m.AdminView })));
const AboutView = React.lazy(() => import('./views/AboutView').then(m => ({ default: m.AboutView })));
const BasinTwinView = React.lazy(() => import('./views/BasinTwinView').then(m => ({ default: m.BasinTwinView })));
const EvidenceFusionView = React.lazy(() => import('./views/EvidenceFusionView').then(m => ({ default: m.EvidenceFusionView })));
const ImpactLensView = React.lazy(() => import('./views/ImpactLensView').then(m => ({ default: m.ImpactLensView })));
const RouteSafeView = React.lazy(() => import('./views/RouteSafeView').then(m => ({ default: m.RouteSafeView })));
const ResiliencePlannerView = React.lazy(() => import('./views/ResiliencePlannerView').then(m => ({ default: m.ResiliencePlannerView })));
const SatelliteView = React.lazy(() => import('./views/SatelliteView').then(m => ({ default: m.SatelliteView })));
const GlobalCoverageView = React.lazy(() => import('./views/GlobalCoverageView').then(m => ({ default: m.GlobalCoverageView })));
const HealthWatchView = React.lazy(() => import('./views/HealthWatchView').then(m => ({ default: m.HealthWatchView })));
const SafetyPlanView = React.lazy(() => import('./views/SafetyPlanView').then(m => ({ default: m.SafetyPlanView })));
const OpsCenterView = React.lazy(() => import('./views/OpsCenterView').then(m => ({ default: m.OpsCenterView })));
import { GuidedDemoOverlay, DEMO_STEPS } from './components/GuidedDemoOverlay';
import { CommandPalette } from './components/CommandPalette';
import { AccessibilityToggle } from './components/AccessibilityToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { parseRoute, buildRoute } from './utils/router';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from './utils/storage';

import {
  LocationData,
  AlertItem,
  CommunityReport,
  ReportDraft,
  ReportSubmitResult,
  Language,
} from './types';
import {
  INITIAL_LOCATIONS,
  INITIAL_ALERTS,
  INITIAL_REPORTS,
} from './data/mockData';
import { LiveWeatherPayload, mapWeatherToLocations } from './utils/weatherTransform';

function ViewLoadingSkeleton({ language }: { language: Language }) {
  const isBn = language === 'bn';
  return (
    <div
      role="status"
      aria-label={isBn ? 'মডিউল প্রস্তুত হচ্ছে...' : 'Loading module telemetry...'}
      className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto animate-pulse"
    >
      <div className="h-8 bg-slate-900/80 rounded-xl w-1/3 border border-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
      <div className="h-64 bg-slate-900/70 rounded-2xl border border-slate-800 flex items-center justify-center">
        <span className="text-xs font-mono text-cyan-400">
          {isBn ? 'টেলিমেট্রি উপাত্ত লোড হচ্ছে...' : 'Loading telemetry workspace...'}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  // Initialize route from URL hash
  const initialRoute = typeof window !== 'undefined' ? parseRoute(window.location.hash) : { view: 'landing' };
  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [preselectedLocationId, setPreselectedLocationId] = useState<string | null>(
    initialRoute.areaId || null
  );

  // Initialize persistent language
  const [language, setLanguage] = useState<Language>(() =>
    safeGetItem<Language>(STORAGE_KEYS.LANGUAGE, 'en')
  );

  // Persistent "My Upazila" preference
  const [myUpazilaId, setMyUpazilaId] = useState<string | null>(() =>
    safeGetItem<string | null>(STORAGE_KEYS.MY_UPAZILA, null)
  );

  const [locations, setLocations] = useState<LocationData[]>(INITIAL_LOCATIONS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [reports, setReports] = useState<CommunityReport[]>(INITIAL_REPORTS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Live Open-Meteo Weather state
  const [liveWeather, setLiveWeather] = useState<LiveWeatherPayload | null>(null);
  const [isWeatherLive, setIsWeatherLive] = useState<boolean>(false);
  const [weatherOfflineNotice, setWeatherOfflineNotice] = useState<string | null>(null);

  // Navigation payload states
  const [selectedLocationForPrediction, setSelectedLocationForPrediction] =
    useState<LocationData | null>(null);

  // Guided Demo Tour state (5 key views)
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(0);

  // Fetch live weather from server endpoint
  const fetchLiveWeather = async () => {
    try {
      const res = await fetch('/api/weather/live');
      if (res.ok) {
        const data: LiveWeatherPayload = await res.json();
        setLiveWeather(data);
        setIsWeatherLive(data.isLive);
        setWeatherOfflineNotice(data.offlineNotice || null);

        // Feed real live precipitation into flood risk algorithm for all monitored stations
        setLocations((prevLocations) => mapWeatherToLocations(prevLocations, data));
      }
    } catch (err) {
      console.warn('Could not fetch live weather from /api/weather/live:', err);
      setIsWeatherLive(false);
      setWeatherOfflineNotice('Could not reach weather service. Operating on calibrated monsoonal baseline.');
    }
  };

  // Sync HTML lang attribute on mount and language change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    safeSetItem(STORAGE_KEYS.LANGUAGE, newLang);
  };

  const handleSelectMyUpazila = (id: string | null) => {
    setMyUpazilaId(id);
    safeSetItem(STORAGE_KEYS.MY_UPAZILA, id);
  };

  // Synchronize browser history and hash navigation (Back/Forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseRoute(window.location.hash);
      setCurrentView(parsed.view);
      if (parsed.areaId) {
        setPreselectedLocationId(parsed.areaId);
        const loc = locations.find(
          (l) =>
            l.id === parsed.areaId ||
            l.nameEn.toLowerCase() === parsed.areaId?.toLowerCase() ||
            l.upazilaEn.toLowerCase() === parsed.areaId?.toLowerCase()
        );
        if (loc) setSelectedLocationForPrediction(loc);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [locations]);

  // Global Ctrl/Cmd + K keyboard listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hydrate server-persisted reports and alerts, and fetch weather on first load.
  // The API responses retain source metadata so offline/demo data is not mislabelled as live.
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const [reportsRes, alertsRes] = await Promise.all([
          fetch('/api/reports'),
          fetch('/api/alerts'),
        ]);
        if (reportsRes.ok) {
          const payload = await reportsRes.json();
          if (active && Array.isArray(payload.reports)) setReports(payload.reports as CommunityReport[]);
        }
        if (alertsRes.ok) {
          const payload = await alertsRes.json();
          if (active && Array.isArray(payload.alerts)) setAlerts(payload.alerts as AlertItem[]);
        }
      } catch (error) {
        console.warn('Could not hydrate server-persisted reports and alerts:', error);
      }
    };
    void hydrate();
    void fetchLiveWeather();
    const weatherRefresh = window.setInterval(() => void fetchLiveWeather(), 10 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(weatherRefresh);
    };
  }, []);

  // Navigation handler with URL hash update
  const handleNavigate = (view: string, targetId?: string) => {
    setCurrentView(view);
    if (targetId) {
      setPreselectedLocationId(targetId);
      const loc = locations.find((l) => l.id === targetId);
      if (loc) setSelectedLocationForPrediction(loc);
    }
    const newHash = buildRoute(view, targetId);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guided demo tour handlers
  const handleStartDemo = () => {
    setIsDemoActive(true);
    setDemoStepIndex(0);
    setCurrentView(DEMO_STEPS[0].view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextDemoStep = () => {
    if (demoStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = demoStepIndex + 1;
      setDemoStepIndex(nextIdx);
      setCurrentView(DEMO_STEPS[nextIdx].view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsDemoActive(false);
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStepIndex > 0) {
      const prevIdx = demoStepIndex - 1;
      setDemoStepIndex(prevIdx);
      setCurrentView(DEMO_STEPS[prevIdx].view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExitDemo = () => {
    setIsDemoActive(false);
  };

  // Mark alert as read
  const handleMarkAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  // Moderation is only complete after the protected server confirms the change.
  const handleVerifyReport = async (id: string, status: 'verified' | 'flagged' = 'verified'): Promise<boolean> => {
    const pin = sessionStorage.getItem('floodguard_admin_pin');
    if (!pin || id.startsWith('rep-local-')) return false;
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(id)}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return false;
      setReports((prev) => prev.map((r) => r.id === id ? {
        ...r, status, verifiedBy: status === 'verified' ? 'Authorized administrator' : undefined,
      } : r));
      return true;
    } catch {
      return false;
    }
  };

  // Submit new community report.
  // The server is the source of truth: a report only appears as saved when the API confirms it.
  // If the API is unreachable (e.g. a static-only deployment) the report is kept in this browser
  // session only and the form says so, instead of pretending it was stored.
  const handleSubmitReport = async (draft: ReportDraft): Promise<ReportSubmitResult> => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.report) {
        setReports((prev) => [data.report as CommunityReport, ...prev]);
        return { ok: true };
      }

      // The API answered and rejected the report (validation, rate limit, payload too large).
      if ([400, 413, 429].includes(res.status) && data?.error) {
        return { ok: false, error: String(data.error) };
      }
    } catch {
      // network error: fall through to the local-only path
    }

    const { consent: _consent, phoneOrContact: _phone, ...rest } = draft;
    const localReport: CommunityReport = {
      ...rest,
      id: `rep-local-${Date.now()}`,
      timestamp: 'Just now (not saved to server)',
      status: 'pending',
    };
    setReports((prev) => [localReport, ...prev]);
    return { ok: true, localOnly: true };
  };

  // Persist station calibration on the server before changing the visible state.
  const handleUpdateLocationDangerLevel = async (id: string, newDL: number, newWarningLevel?: number): Promise<boolean> => {
    const pin = sessionStorage.getItem('floodguard_admin_pin');
    if (!pin || !Number.isFinite(newDL) || newDL <= 0 || newDL > 50) return false;
    const warningLevel = Number((newWarningLevel ?? (newDL - 0.5)).toFixed(2));
    if (warningLevel < 0 || warningLevel >= newDL) return false;
    try {
      const res = await fetch('/api/admin/station-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ stationId: id, dangerLevel: newDL, warningLevel }),
      });
      if (!res.ok) return false;
      setLocations((prev) => prev.map((l) => l.id === id
        ? { ...l, dangerLevel: newDL, warningLevel }
        : l));
      return true;
    } catch {
      return false;
    }
  };

  // Store and publish the alert only when the protected endpoint confirms it.
  const handleCreateAlert = async (
    newAlertData: Omit<AlertItem, 'id' | 'timestamp' | 'isVerified' | 'isRead'>
  ): Promise<boolean> => {
    const pin = sessionStorage.getItem('floodguard_admin_pin');
    if (!pin) return false;
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(newAlertData),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.success || !payload?.alert) return false;
      setAlerts((prev) => [payload.alert as AlertItem, ...prev.filter((a) => a.id !== payload.alert.id)]);
      return true;
    } catch {
      return false;
    }
  };

  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;
  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none"
      >
        {language === 'bn' ? 'মূল কনটেন্টে যান' : 'Skip to main content'}
      </a>

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={handleLanguageChange}
        unreadAlertCount={unreadAlertCount}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        locations={locations}
        weatherPayload={liveWeather}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        myUpazilaName={myUpazilaId ? locations.find((l) => l.id === myUpazilaId)?.[language === 'bn' ? 'nameBn' : 'nameEn'] : null}
        onNavigateToMyUpazila={() => handleNavigate('healthWatch', myUpazilaId || undefined)}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          language={language}
          unreadAlertCount={unreadAlertCount}
          pendingReportsCount={pendingReportsCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic View Viewport */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none"
        >
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary language={language} onResetView={() => handleNavigate('landing')}>
              {currentView === 'landing' && (
                <LandingView
                  onNavigate={handleNavigate}
                  onStartDemo={handleStartDemo}
                  language={language}
                  locations={locations}
                  alerts={alerts}
                  selectedUpazilaId={myUpazilaId || undefined}
                  onSelectUpazila={(id) => handleSelectMyUpazila(id)}
                />
              )}

              <React.Suspense fallback={<ViewLoadingSkeleton language={language} />}>
                {currentView === 'dashboard' && (
                <DashboardView
                  locations={locations}
                  alerts={alerts}
                  reports={reports}
                  language={language}
                  onNavigate={handleNavigate}
                  onSelectLocationForPrediction={(loc) => {
                    setSelectedLocationForPrediction(loc);
                  }}
                  liveWeather={liveWeather}
                  isWeatherLive={isWeatherLive}
                  weatherOfflineNotice={weatherOfflineNotice}
                  onRefreshWeather={fetchLiveWeather}
                />
              )}

              {currentView === 'healthWatch' && (
                <HealthWatchView
                  locations={locations}
                  language={language}
                  onNavigate={handleNavigate}
                  initialAreaId={preselectedLocationId}
                />
              )}

            {currentView === 'basinTwin' && (
              <BasinTwinView language={language} onNavigate={handleNavigate} />
            )}

            {currentView === 'evidenceFusion' && (
              <EvidenceFusionView language={language} />
            )}

            {currentView === 'satellite' && (
              <SatelliteView language={language} />
            )}

            {currentView === 'impactLens' && (
              <ImpactLensView language={language} />
            )}

            {currentView === 'routeSafe' && (
              <RouteSafeView language={language} />
            )}

            {currentView === 'resiliencePlanner' && (
              <ResiliencePlannerView language={language} locations={locations} />
            )}

            {currentView === 'safetyPlan' && (
              <SafetyPlanView locations={locations} language={language} myUpazilaId={myUpazilaId} onNavigate={handleNavigate} />
            )}

            {currentView === 'opsCenter' && (
              <OpsCenterView locations={locations} alerts={alerts} reports={reports} language={language} myUpazilaId={myUpazilaId} onSelectUpazila={handleSelectMyUpazila} />
            )}

            {currentView === 'globalCoverage' && (
              <GlobalCoverageView language={language} />
            )}

            {currentView === 'prediction' && (
              <PredictionView
                locations={locations}
                selectedLocation={selectedLocationForPrediction}
                language={language}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'simulator' && (
              <SimulatorView
                locations={locations}
                preselectedLocationId={preselectedLocationId}
                language={language}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'map' && (
              <MapView
                locations={locations}
                reports={reports}
                preselectedLocationId={preselectedLocationId}
                language={language}
                onNavigate={handleNavigate}
                onSelectLocationForPrediction={(loc) => {
                  setSelectedLocationForPrediction(loc);
                }}
              />
            )}

            {currentView === 'assistant' && <AssistantView language={language} />}

            {currentView === 'alerts' && (
              <EarlyWarningView
                alerts={alerts}
                language={language}
                onMarkAsRead={handleMarkAlertAsRead}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'community' && (
              <CommunityReportsView
                reports={reports}
                language={language}
                onSubmitReport={handleSubmitReport}
              />
            )}

            {currentView === 'historical' && (
              <HistoricalView locations={locations} language={language} />
            )}

            {currentView === 'admin' && (
              <AdminView
                locations={locations}
                reports={reports}
                alerts={alerts}
                language={language}
                onUpdateLocationDangerLevel={handleUpdateLocationDangerLevel}
                onVerifyReport={handleVerifyReport}
                onCreateAlert={handleCreateAlert}
              />
            )}

            {currentView === 'about' && <AboutView language={language} />}
            </React.Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Operations Command Palette (Ctrl/Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        language={language}
        onNavigate={handleNavigate}
        onLanguageChange={handleLanguageChange}
        onStartDemo={handleStartDemo}
        locations={locations}
      />

      {/* Guided Demo Tour Overlay */}
      {isDemoActive && (
        <GuidedDemoOverlay
          currentStepIndex={demoStepIndex}
          language={language}
          onNext={handleNextDemoStep}
          onPrev={handlePrevDemoStep}
          onExit={handleExitDemo}
        />
      )}

      {/* Offline Indicator */}
      <OfflineIndicator language={language} />
      <AccessibilityToggle language={language} />
    </div>
  );
}
