import React from 'react';
import {
  Info,
  ShieldCheck,
  Compass,
  Cpu,
  Layers,
  HeartHandshake,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  MapPin,
  Waves,
  BrainCircuit,
  Database,
  Users,
  Target,
  Clock,
  Radio,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
  Printer,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface AboutViewProps {
  language: Language;
}

export const AboutView: React.FC<AboutViewProps> = ({ language }) => {
  const tr = t[language];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Title & Mission Statement */}
      <div className="space-y-4 border-b border-slate-800 pb-6 no-print">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded text-xs font-bold uppercase bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Flood-health preparedness research prototype
            </span>
            <span className="text-xs text-slate-400">Sylhet & Sunamganj Haor Basin</span>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-100 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 transition flex items-center gap-2 shadow-sm active:scale-95"
            title="Print or save as clean A4 PDF"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>{language === 'en' ? 'Print / Export One-Pager (A4 PDF)' : 'প্রিন্ট / পিডিএফ ডাউনলোড'}</span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          FloodGuard AI: <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-300">Floods become health crises. We estimate health risks to support earlier preparation.</span>
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          A community-centered flood-preparedness prototype. It combines transboundary weather context with hand-weighted health-risk indicators and shelter medical readiness to help people plan as conditions evolve.
        </p>
      </div>

      {/* The Core Challenge in Sylhet and Sunamganj */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Waves className="w-5 h-5 text-cyan-400" />
          <span>The Challenge: Why Sylhet & Sunamganj are Uniquely Vulnerable</span>
        </h2>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            The north-eastern haor region of Bangladesh lies downstream of the steep Meghalaya plateau in India, including the Cherrapunji and Mawsynram catchments. Torrential orographic rainfall can send runoff through connected cross-border river networks such as the Surma, Kushiyara, Sari-Gowain, Piyain, and Jadukata. Travel time varies by storm, catchment and river conditions; FloodGuard AI does not claim a single fixed transit time for the basin.
          </p>
          <p>
            In the historic <strong>June 2022 floods</strong>, the India Meteorological Department recorded 972 mm at Cherrapunji in 24 hours. The IFRC reported that around 94% of Sunamganj town and 84% of Sylhet district were submerged, and estimated 7.2 million people affected across nine north-eastern districts. <strong>FloodGuard AI</strong> directly addresses this crucial temporal lag between upstream cloudbursts and downstream haor inundation.
          </p>
        </div>
      </div>

      {/* NEW SECTION: Community Impact & Target Beneficiaries */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border border-cyan-500/30 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white">
              Community Impact: Bridging the Warning-Time Gap
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            Real-World Resilience
          </span>
        </div>

        {/* Who Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Haor Boro Rice Farmers</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Enables early harvesting and grain relocation before flash flood surges breach village dykes and submerge unharvested Boro paddy fields.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <Waves className="w-4 h-4 text-sky-400" />
              <span>Fishermen & Boatmen</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Provides real-time river stage velocity and severe haor wave (afal) warnings, preventing boat capsizes in wide open haor channels.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Vulnerable Haor Families</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Equips remote households with life-saving checklists, water purification instructions, safe evacuation routes, and accessible Bangla SMS alerts.
            </p>
          </div>
        </div>

        {/* Measurable Goals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xl font-black font-mono text-cyan-400 block">48 Hours</span>
            <span className="text-[11px] text-slate-400">Statistical Forecast Horizon</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xl font-black font-mono text-emerald-400 block">9 Upazilas</span>
            <span className="text-[11px] text-slate-400">Sylhet & Sunamganj High Risk</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xl font-black font-mono text-purple-400 block">230 Shelters</span>
            <span className="text-[11px] text-slate-400">Mapped across 9 Upazilas</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-xl font-black font-mono text-amber-400 block">&lt;160 Chars</span>
            <span className="text-[11px] text-slate-400">Offline-Friendly SMS Alerts</span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Data Sources & Limitations */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white">
              Data Sources & Technical Limitations
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Full Provenance Disclosure
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          In adherence to scientific ethics and hackathon transparency standards, every data stream in FloodGuard AI is explicitly categorized as <strong>LIVE</strong>, <strong>DERIVED</strong>, or <strong>SIMULATED</strong>:
        </p>

        <div className="space-y-3">
          {/* 1. LIVE DATA */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>1. LIVE WEATHER API & MODELLED DISCHARGE ESTIMATES</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                LIVE / OPERATIONAL
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              • <strong>Precipitation & Outlook</strong>: Live hourly precipitation and 7-day forecasts from Open-Meteo for Sylhet (24.8949, 91.8687), Sunamganj (25.0658, 91.4073), and the transboundary Cherrapunji catchment (25.27, 91.73). Cached for 10 minutes.<br />
              • <strong>GloFAS River Discharge</strong>: Daily modelled river-discharge estimates via the Open-Meteo Flood API when available. This ~5 km grid-cell output is not a local river-gauge observation; missing values remain unavailable.<br />
              • <strong>June 2022 Scenario Replay</strong>: Historical hourly rainfall can be fetched from the Open-Meteo Archive API, then passed through a simplified synthetic river-stage response. Scenario timing is not measured warning lead time or forecast-skill validation.
            </p>
          </div>

          {/* 2. DERIVED DATA */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>2. DERIVED SCIENTIFIC MODELS & PROJECTIONS</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold">
                DERIVED / STATISTICAL
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Includes the <strong>+48h Linear Regression Forecast Overlay</strong> (ordinary least squares slope velocity and R² correlation), the <strong>Multi-Factor Flood Risk Scoring Engine</strong> (configured reference thresholds, precipitation rates and runoff assumptions), and the <strong>BasinTwin Scenario Graph</strong> (static river connections and assumed travel-lag values).
            </p>
          </div>

          {/* 3. SIMULATED DATA */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>3. SIMULATED HYDROLOGICAL TELEMETRY</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                SIMULATED / BENCHMARK
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              River water-level sensor telemetry is calibrated to real-world BWDB station benchmarks (e.g. Sylhet SW267, Sunamganj SW268, Sarighat SW272, Chhatak SW269) reflecting the actual historic danger and warning thresholds of the 2022 mega-flood, 2024 Remal event, and 2017 haor disasters. Telemetry readings are transparently badged as SIMULATED across all cards and tables.
            </p>
          </div>
        </div>
      </div>

      {/* Project One-Pager Printable View (A4 Print / Screen Card) */}
      <div className="printable-one-pager rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="border-b border-slate-700 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-400">
                FloodGuard AI Project Overview
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400">Theme: AI x Healthcare</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              FloodGuard AI — Project One-Pager
            </h2>
            <p className="text-xs text-slate-300 italic mt-0.5">
              "Floods become health crises. We estimate health risks to support earlier preparation."
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Target: Sylhet & Sunamganj Haor Basin</div>
            <div className="text-cyan-400 font-semibold">Forecast Horizon: 48 Hours</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Column 1: The Problem & Basin Physics */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <h3 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              1. Upstream-to-downstream context
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Torrential cloudbursts on India's Meghalaya plateau (Cherrapunji/Mawsynram) can drive runoff into connected rivers in Bangladesh. The timing varies, so the app visualises basin relationships rather than promising a fixed lead time.
            </p>
            <p className="text-slate-300 leading-relaxed">
              In June 2022, Cherrapunji recorded 972 mm of rain in 24 hours, during floods that affected an estimated 7.2 million people across nine districts. FloodGuard AI combines upstream weather context with preparedness indicators; it does not guarantee additional warning hours.
            </p>
          </div>

          {/* Column 2: The Healthcare Layer */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-rose-500/30">
            <h3 className="font-bold text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              2. The Healthcare Layer
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Standing water and displaced populations drive cholera, typhoid, dermatitis, and snakebites.
            </p>
            <ul className="text-slate-300 space-y-1 list-disc list-inside text-[11px]">
              <li><strong>Disease Risk Index</strong>: Upazila-level multi-factor severity.</li>
              <li><strong>Shelter Readiness</strong>: Uses illustrative stock and access inputs to demonstrate preparedness gap calculations.</li>
              <li><strong>Clinic Access</strong>: Illustrative route conditions for planning demonstrations; not live road reports.</li>
            </ul>
          </div>

          {/* Column 3: AI Engine & Verification */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-purple-500/30">
            <h3 className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              3. AI & Data Architecture
            </h3>
            <p className="text-slate-300 leading-relaxed">
              <strong>Optional Gemini integration</strong> can assist with general bilingual preparedness explanations and draft wording when configured. It does not provide clinical diagnosis, and emergency instructions use fixed reviewed text.
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong>Transparent Provenance</strong>: Live Open-Meteo weather data when reachable, modelled GloFAS estimates when available, OLS trend extrapolation, and simulated BWDB-reference station inputs.
            </p>
            <div className="pt-1 text-[10px] text-amber-300/90 font-mono">
              Emergency Hotlines: 16263 (Shastho Batayan), 999
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 shadow-xl no-print">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          <span>System Architecture & Prediction Pipeline</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-400 block">01. INGESTION</span>
            <h4 className="font-bold text-white text-xs">Weather API & GloFAS Model Estimates</h4>
            <p className="text-slate-400 text-[11px]">
              Open-Meteo rainfall data when available and GloFAS model estimates when returned; neither is a local river-gauge reading.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1.5 shadow-sm shadow-cyan-950/40">
            <span className="text-[10px] font-mono font-bold text-cyan-400 block">02. MODELING</span>
            <h4 className="font-bold text-white text-xs">Hydrology & OLS</h4>
            <p className="text-slate-400 text-[11px]">
              Hand-weighted planning scores, 48-hour trend extrapolation, and an illustrative basin graph.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-1.5 shadow-sm shadow-rose-950/40">
            <span className="text-[10px] font-mono font-bold text-rose-400 block">03. HEALTH RISK</span>
            <h4 className="font-bold text-white text-xs">Disease Vector Index</h4>
            <p className="text-slate-400 text-[11px]">
              Cholera, typhoid, skin infection, and snakebite risk indices using hand-weighted planning indicators; not clinical or epidemiological predictions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-purple-400 block">04. REASONING</span>
            <h4 className="font-bold text-white text-xs">Gemini Flash</h4>
            <p className="text-slate-400 text-[11px]">
              Optional bilingual preparedness explanations and draft alert wording. Safety-critical instructions remain fixed application text.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-emerald-400 block">05. ACTION</span>
            <h4 className="font-bold text-white text-xs">Field Delivery</h4>
            <p className="text-slate-400 text-[11px]">
              Illustrative RouteSafe map layer, moderated community-report workflow, and CSV exports.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical Transparency & Statutory Authority Compliance */}
      <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs text-amber-200/90 shadow-xl">
        <div className="flex items-center gap-2 text-amber-300 font-bold">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Statutory Authority Compliance & Prototype Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          FloodGuard AI is a software technology prototype created for academic innovation, disaster technology research, and community preparedness education. It explicitly respects statutory government authority. In Bangladesh, official flood bulletins, red alerts, and evacuation orders are legally mandated to originate exclusively from the <strong>Flood Forecasting and Warning Centre (FFWC)</strong> under the <strong>Bangladesh Water Development Board (BWDB)</strong> and the <strong>Ministry of Disaster Management and Relief (MoDMR)</strong>.
        </p>
        <p className="leading-relaxed">
          Our platform does not replace official civil protection sirens or government evacuation directives. Whenever using simulated telemetry, the user interface prominently labels data to prevent any dissemination of erroneous emergency notices.
        </p>
      </div>

      {/* Technology Stack Credentials */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Core Technologies Utilized
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs font-semibold">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300">
            React 19 & TypeScript
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300">
            Open-Meteo Live API
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-purple-300">
            Gemini Flash
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300">
            Leaflet GIS
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300">
            Recharts & OLS
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-rose-300">
            Node / Express
          </div>
        </div>
      </div>
    </div>
  );
};
