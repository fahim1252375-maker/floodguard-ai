import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  ShieldCheck,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  Eye,
  Filter,
  Info,
} from 'lucide-react';
import { CommunityReport, Language, District, ReportDraft, ReportSubmitResult } from '../types';
import { t } from '../utils/translations';

interface CommunityReportsViewProps {
  reports: CommunityReport[];
  language: Language;
  onSubmitReport: (report: ReportDraft) => Promise<ReportSubmitResult>;
}

export const CommunityReportsView: React.FC<CommunityReportsViewProps> = ({
  reports,
  language,
  onSubmitReport,
}) => {
  const tr = t[language];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [reporterName, setReporterName] = useState('');
  const [phoneOrContact, setPhoneOrContact] = useState('');
  const [district, setDistrict] = useState<District>('Sylhet');
  const [upazilaEn, setUpazilaEn] = useState('Gowainghat');
  const [villageOrArea, setVillageOrArea] = useState('');
  const [waterDepthValue, setWaterDepthValue] = useState<number>(1.5);
  const [waterDepthUnit, setWaterDepthUnit] = useState<'ft' | 'cm'>('ft');
  const [waterTrend, setWaterTrend] = useState<'rapidly_rising' | 'slowly_rising' | 'stable' | 'receding'>('rapidly_rising');
  const [roadCondition, setRoadCondition] = useState<'passable' | 'waterlogged' | 'inundated' | 'completely_submerged'>('inundated');
  const [electricityStatus, setElectricityStatus] = useState<'normal' | 'intermittent' | 'cut_off'>('intermittent');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Available Upazilas by District
  const upazilaOptions = {
    Sylhet: ['Sylhet Sadar', 'Companiganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat'],
    Sunamganj: ['Sunamganj Sadar', 'Chhatak', 'Tahirpur', 'Dowarabazar'],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitNote(null);
    if (!reporterName.trim() || !villageOrArea.trim() || !description.trim()) {
      setFormError('Please fill out all required fields: Reporter Name, Village/Area, and Description.');
      return;
    }
    if (!consent) {
      setFormError('Please tick the consent box so we can store your report.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmitReport({
      reporterName,
      phoneOrContact: phoneOrContact.trim() || undefined,
      district,
      upazilaEn,
      upazilaBn: upazilaEn, // Simplified placeholder for Bengali name
      villageOrArea,
      waterDepthValue,
      waterDepthUnit,
      waterTrend,
      roadCondition,
      electricityStatus,
      description,
      // Only a photo link the reporter actually provides is attached (no stock image stand-in).
      photoUrl: photoUrl.trim() || undefined,
      consent: true,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.error || 'Could not submit the report. Please try again.');
      return;
    }

    if (result.localOnly) {
      setSubmitNote('Demo server not reachable: this report is shown only in this browser session and was not saved.');
    }

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setIsFormOpen(false);
      // Reset
      setReporterName('');
      setPhoneOrContact('');
      setVillageOrArea('');
      setDescription('');
      setPhotoUrl('');
      setConsent(false);
    }, 1500);
  };

  const filteredReports = reports.filter((rep) => {
    if (filterStatus === 'ALL') return true;
    return rep.status === filterStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <span>{tr.navCommunity}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Field Ground-Truth Network
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Crowdsourced field observations from local haor residents, union members, and disaster response teams'
              : 'মাঠ পর্যায় থেকে সরাসরি পানির উচ্চতা ও সড়ক চলাচলের অবস্থা জানিয়ে স্থানীয় প্রশাসনকে অবহিত করার ব্যবস্থা'}
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isFormOpen ? 'Cancel Submission' : 'Submit Ground-Truth Report'}</span>
        </button>
      </div>

      {/* Submission Form Modal / Expandable Card */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-6 animate-fadeIn"
        >
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                Submit New Field Observation Report
              </h2>
              <p className="text-xs text-slate-400">
                Provide accurate, honest ground observations to assist emergency responders.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
              Needs Moderation
            </span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {submitNote && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{submitNote}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Reporter Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Your Name / Organization <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Kabir Ahmed / Field Volunteer"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Contact / Phone */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Phone Number (for verification)
              </label>
              <input
                type="text"
                placeholder="+880 171X-XXXXXX"
                value={phoneOrContact}
                onChange={(e) => setPhoneOrContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">District</label>
              <select
                value={district}
                onChange={(e) => {
                  const d = e.target.value as District;
                  setDistrict(d);
                  setUpazilaEn(upazilaOptions[d][0]);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="Sylhet">Sylhet District</option>
                <option value="Sunamganj">Sunamganj District</option>
              </select>
            </div>

            {/* Upazila */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Upazila</label>
              <select
                value={upazilaEn}
                onChange={(e) => setUpazilaEn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                {upazilaOptions[district].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Village / Area */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Village / Ward / Area <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Jaflong Zero Point Road, Ward 2"
                value={villageOrArea}
                onChange={(e) => setVillageOrArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Water Depth */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Estimated Water Depth Above Ground
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={waterDepthValue}
                  onChange={(e) => setWaterDepthValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
                <select
                  value={waterDepthUnit}
                  onChange={(e) => setWaterDepthUnit(e.target.value as 'ft' | 'cm')}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="ft">Feet (ft)</option>
                  <option value="cm">Centimeters (cm)</option>
                </select>
              </div>
            </div>

            {/* Water Trend */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Water-Level Current Trend
              </label>
              <select
                value={waterTrend}
                onChange={(e) => setWaterTrend(e.target.value as 'rapidly_rising' | 'slowly_rising' | 'stable' | 'receding')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="rapidly_rising">Rapidly Rising (পানি দ্রুত বাড়ছে)</option>
                <option value="slowly_rising">Slowly Rising (ধীরে ধীরে বাড়ছে)</option>
                <option value="stable">Stable / Stagnant (স্থিতিশীল)</option>
                <option value="receding">Receding / Falling (পানি কমছে)</option>
              </select>
            </div>

            {/* Road Conditions */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Road Condition</label>
              <select
                value={roadCondition}
                onChange={(e) => setRoadCondition(e.target.value as 'passable' | 'waterlogged' | 'inundated' | 'completely_submerged')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="passable">Passable by Vehicle (চলাচলযোগ্য)</option>
                <option value="waterlogged">Waterlogged / Slow (জলমগ্ন)</option>
                <option value="inundated">Inundated / Country Boat Only (প্লাবিত)</option>
                <option value="completely_submerged">Completely Cut Off (সম্পূর্ণ যোগাযোগ বিচ্ছিন্ন)</option>
              </select>
            </div>

            {/* Electricity Status */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Electricity / Power Grid
              </label>
              <select
                value={electricityStatus}
                onChange={(e) => setElectricityStatus(e.target.value as 'normal' | 'intermittent' | 'cut_off')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="normal">Normal Power</option>
                <option value="intermittent">Intermittent / Fluctuating</option>
                <option value="cut_off">Cut Off / Transformer Submerged</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1">
              Field Report Narrative & Details <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe current breach, affected houses, elderly persons needing boat evacuation, livestock conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-cyan-500"
              aria-required="true"
            />
            <span>
              I agree to this report being stored on the FloodGuard AI demo server. My name, area and
              observations will be shown publicly as <strong>unverified</strong> until a moderator reviews them. My
              contact number (optional) is kept for verification only and is not shown publicly. *
            </span>
          </label>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Prototype: reports are held on this demo server for admin moderation. They are not forwarded to any
              government office; in an emergency call 999 or 16263.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : formSubmitted ? 'Report Submitted!' : 'Submit Field Report'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notice on Unverified Reports */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {language === 'en'
              ? 'Community reports are tagged as "Unverified / Pending" until confirmed by local field teams or drone survey.'
              : 'মাঠ পর্যায়ের টিম বা উপজেলা কন্ট্রোল রুম দ্বারা যাচাই না হওয়া পর্যন্ত রিপোর্ট "অযাচাইকৃত" হিসেবে থাকবে।'}
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400">Filter:</span>
          {['ALL', 'verified', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                filterStatus === st
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map((rep) => {
          const isVerified = rep.status === 'verified';

          return (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{rep.reporterName}</h3>
                    <p className="text-xs font-semibold text-cyan-300 mt-0.5">
                      {rep.villageOrArea}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {rep.upazilaEn}, {rep.district}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isVerified
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isVerified ? 'VERIFIED' : 'PENDING REVIEW'}
                  </span>
                </div>

                {/* Optional Photo Thumbnail */}
                {rep.photoUrl && (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={rep.photoUrl}
                      alt="Flood field evidence"
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-200 backdrop-blur-xs flex items-center gap-1">
                      <Camera className="w-3 h-3 text-cyan-400" />
                      Field Photo
                    </div>
                  </div>
                )}

                {/* Metrics Badges */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Depth</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {rep.waterDepthValue} {rep.waterDepthUnit}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Trend</span>
                    <span className="font-bold text-amber-300 capitalize text-[11px] truncate block">
                      {rep.waterTrend.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Road</span>
                    <span className="font-bold text-rose-300 capitalize text-[11px] truncate block">
                      {rep.roadCondition.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {rep.description}
                </p>
              </div>

              {/* Footer info & Admin Verification Action */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {rep.timestamp}
                </span>

                {!isVerified ? (
                  <span className="text-[10px] text-amber-300 font-medium">Awaiting authorized review</span>
                ) : (
                  <span className="text-[10px] text-emerald-300 font-medium truncate max-w-[150px]">
                    {rep.verifiedBy || 'Verified by field team'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
