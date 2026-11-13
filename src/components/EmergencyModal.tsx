import React from 'react';
import { Phone, AlertTriangle, ShieldCheck, LifeBuoy, X } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;
  const tr = t[language];

  const emergencyContacts = [
    {
      number: '1090',
      titleEn: 'Toll-Free Flood Warning & IVR Service',
      titleBn: 'বন্যা পূর্বাভাস ও সতর্কবার্তা ভয়েস সেবা (টোল ফ্রি)',
      agencyEn: 'Comprehensive Disaster Management Programme / FFWC',
      agencyBn: 'দুর্যোগ ব্যবস্থাপনা অধিদপ্তর ও এফএফডব্লিউসি',
      badge: 'Toll-Free / টোল-ফ্রি',
      color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200',
    },
    {
      number: '999',
      titleEn: 'National Emergency Response (Rescue, Fire, Police)',
      titleBn: 'জাতীয় জরুরি সেবা (উদ্ধার অভিযান, ফায়ার সার্ভিস, পুলিশ)',
      agencyEn: 'Bangladesh Police & Fire Service Rescue Boats',
      agencyBn: 'বাংলাদেশ পুলিশ ও ফায়ার সার্ভিস উদ্ধারকারী বোট',
      badge: '24/7 Rapid Response',
      color: 'border-rose-500/50 bg-rose-950/40 text-rose-200',
    },
    {
      number: '109',
      titleEn: 'Women, Children & Vulnerable Protection Helpline',
      titleBn: 'নারী, শিশু ও দুর্যোগ সুরক্ষা হেল্পলাইন',
      agencyEn: 'Ministry of Women and Children Affairs',
      agencyBn: 'মহিলা ও শিশু বিষয়ক মন্ত্রণালয়',
      badge: 'Emergency Support',
      color: 'border-amber-500/50 bg-amber-950/40 text-amber-200',
    },
    {
      number: '333',
      titleEn: 'National Relief & Emergency Food Assistance',
      titleBn: 'জাতীয় তথ্য সেবা ও জরুরি খাদ্য/ত্রাণ সহায়তা',
      agencyEn: 'Government of Bangladesh Citizen Services',
      agencyBn: 'বাংলাদেশ সরকার নাগরিক সেবা',
      badge: 'Relief Hotline',
      color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200',
    },
  ];

  const districtControlRooms = [
    {
      district: language === 'en' ? 'Sylhet District DC Control Room' : 'সিলেট জেলা প্রশাসক নিয়ন্ত্রণ কক্ষ',
      phone: '+880 1713-33XXXX / 02996634XXX',
      location: 'Bandar Bazar, Sylhet',
    },
    {
      district: language === 'en' ? 'Sunamganj District DC Control Room' : 'সুনামগঞ্জ জেলা প্রশাসক নিয়ন্ত্রণ কক্ষ',
      phone: '+880 1713-33XXXX / 02996681XXX',
      location: 'Court Road, Sunamganj',
    },
    {
      district: language === 'en' ? 'BWDB Sylhet Hydrology Division' : 'বাপাউবো সিলেট হাইড্রোলজি বিভাগ',
      phone: '+880 1712-XXXXXX',
      location: 'Nayasarak, Sylhet',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Phone className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {tr.hotlineTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Official Bangladesh Government Disaster Assistance Directory'
                  : 'বাংলাদেশ সরকারের অফিসিয়াল দুর্যোগ সহায়তা ও উদ্ধার নম্বর'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Hotlines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className={`p-4 rounded-xl border transition hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between ${contact.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black tracking-wider flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      {contact.number}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      {contact.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {language === 'en' ? contact.titleEn : contact.titleBn}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {language === 'en' ? contact.agencyEn : contact.agencyBn}
                  </p>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-xs font-medium text-cyan-400 underline">
                    {language === 'en' ? 'Tap to Call' : 'কল করতে ট্যাপ করুন'} &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Regional Control Rooms */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-cyan-400" />
              {language === 'en' ? 'Haor Basin Regional Control Desks' : 'হাওর অববাহিকা আঞ্চলিক নিয়ন্ত্রণ ডেস্ক'}
            </h4>
            <div className="space-y-2">
              {districtControlRooms.map((room, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
                >
                  <div>
                    <span className="font-semibold text-white">{room.district}</span>
                    <span className="block text-[11px] text-slate-400">{room.location}</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-medium mt-1 sm:mt-0">
                    {room.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Immediate Safety Advice */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">
                {language === 'en' ? 'Flood Safety Advisory' : 'বন্যা নিরাপত্তার সাধারণ নির্দেশনা'}
              </p>
              <p className="text-amber-300/80">
                {language === 'en'
                  ? 'Always carry potable water and dry food. Disconnect house electrical mains before water reaches plinth level. Never touch fallen electric wires submerged in floodwater.'
                  : 'সবসময় বিশুদ্ধ পানি ও শুকনো খাবার সাথে রাখুন। ঘরের ভেতর পানি প্রবেশের আগেই মেইন সুইচ বন্ধ করুন। পানিতে নিমজ্জিত বৈদ্যুতিক তার বা খুঁটি কখনো স্পর্শ করবেন না।'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            {tr.close}
          </button>
        </div>
      </div>
    </div>
  );
};
