import React, { useState } from 'react';
import { LocationData, AlertItem, Language } from '../types';
import { summarizeNetwork } from '../utils/landingSummary';
import { Hero } from '../components/landing/Hero';
import { LiveKpiStrip } from '../components/landing/LiveKpiStrip';
import { CauseEffectChain } from '../components/landing/CauseEffectChain';
import { TryItPanel } from '../components/landing/TryItPanel';
import { PriorityBoard } from '../components/landing/PriorityBoard';
import { PersonaTabs } from '../components/landing/PersonaTabs';
import { FeatureBento } from '../components/landing/FeatureBento';
import { ProvenanceStrip } from '../components/landing/ProvenanceStrip';
import { SiteFooter } from '../components/landing/SiteFooter';

interface LandingViewProps {
  onNavigate: (view: string, targetId?: string) => void;
  onStartDemo: () => void;
  language: Language;
  locations: LocationData[];
  alerts: AlertItem[];
  selectedUpazilaId?: string;
  onSelectUpazila?: (id: string) => void;
  onOpenDataHealth?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onStartDemo,
  language,
  locations,
  alerts,
  selectedUpazilaId: controlledUpazilaId,
  onSelectUpazila: controlledSetMyUpazila,
  onOpenDataHealth,
}) => {
  // Local upazila selection state if not controlled externally
  const [internalUpazilaId, setInternalUpazilaId] = useState<string>(
    controlledUpazilaId || locations[0]?.id || 'loc-1'
  );

  const activeUpazilaId = controlledUpazilaId || internalUpazilaId;

  const handleSelectUpazila = (id: string) => {
    setInternalUpazilaId(id);
    if (controlledSetMyUpazila) {
      controlledSetMyUpazila(id);
    }
  };

  // Pure summary of network telemetry, risk ranking, and populations
  const networkSummary = summarizeNetwork(locations, alerts);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero with Integrated Health Radar */}
      <Hero
        language={language}
        onNavigate={onNavigate}
        onStartDemo={onStartDemo}
        locations={locations}
        selectedUpazilaId={activeUpazilaId}
        onSelectUpazila={handleSelectUpazila}
        highestDiseaseScore={networkSummary.highestDiseaseIndex}
        onOpenDataHealth={onOpenDataHealth}
      />

      {/* 2. Live KPI Strip */}
      <LiveKpiStrip summary={networkSummary} language={language} />

      {/* 3. Cause-to-Effect Chain (Story of the project) */}
      <CauseEffectChain
        locations={locations}
        selectedUpazilaId={activeUpazilaId}
        onSelectUpazila={handleSelectUpazila}
        language={language}
        onNavigate={onNavigate}
      />

      {/* 4. Try It in 10 Seconds Panel */}
      <TryItPanel
        locations={locations}
        selectedUpazilaId={activeUpazilaId}
        onSelectUpazila={handleSelectUpazila}
        language={language}
        onNavigate={onNavigate}
      />

      {/* 5. Priority Board (Replaces 5-row table) */}
      <PriorityBoard
        priorityUpazilas={networkSummary.topPriorityUpazilas}
        language={language}
        onNavigate={onNavigate}
      />

      {/* 6. Persona Tabs (Who it helps) */}
      <PersonaTabs language={language} onNavigate={onNavigate} />

      {/* 7. Feature Bento Grid */}
      <FeatureBento language={language} onNavigate={onNavigate} />

      {/* 8. Provenance & Transparency Strip */}
      <ProvenanceStrip language={language} onNavigate={onNavigate} />

      {/* 9. Site Footer */}
      <SiteFooter language={language} onNavigate={onNavigate} />
    </div>
  );
};
