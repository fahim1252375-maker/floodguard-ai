import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  PhoneCall,
  ShieldAlert,
  User,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Language, ChatMessage } from '../types';
import { t } from '../utils/translations';

interface AssistantViewProps {
  language: Language;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ language }) => {
  const tr = t[language];

  const initialGreeting =
    language === 'en'
      ? "Hello! I am FloodGuard AI, your specialized disaster preparedness and flood resilience assistant for Bangladesh, focusing on the Sylhet and Sunamganj Haor Basin. How can I assist you with river levels, family evacuation kits, drinking water safety, or emergency response today?"
      : "নমস্কার/সালাম! আমি ফ্লাডগার্ড এআই। সিলেট ও সুনামগঞ্জের বন্যা প্রস্তুতি, নদী অববাহিকার পানির স্তর বুঝতে সহায়তা, পরিবারের জন্য জরুরি প্রস্তুতি ও জীবন সুরক্ষার দিকনির্দেশনা দিতে আমি প্রস্তুত। আপনি কী জানতে চান?";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: initialGreeting,
      timestamp: 'Just now',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickQuestions = [
    {
      en: 'How do I understand flood risk in Sylhet & Surma river?',
      bn: 'সিলেটে বন্যার ঝুঁকি ও সুরমার বিপদসীমা কীভাবে বুঝব?',
    },
    {
      en: 'What should my family prepare before a flood arrives?',
      bn: 'বন্যার সময় পরিবারের কী কী প্রস্তুতি নেওয়া উচিত?',
    },
    {
      en: 'What are the official Bangladesh emergency flood helplines?',
      bn: 'জরুরি উদ্ধার ও সহায়তার জন্য সরকারি হটলাইন নম্বরগুলো কী কী?',
    },
    {
      en: 'How to purify drinking water during a severe flood in Haor?',
      bn: 'হাওরে বন্যার সময় খাবার পানি কীভাবে বিশুদ্ধ করব?',
    },
    {
      en: 'How does Cherrapunji hill runoff trigger flash floods?',
      bn: 'চেরাপুঞ্জির পাহাড়ি ঢল কীভাবে আকস্মিক বন্যা সৃষ্টি করে?',
    },
  ];

  const handleSendMessage = async (textToSend?: unknown) => {
    const rawText = typeof textToSend === 'string' ? textToSend : inputPrompt;
    const text = (rawText || '').trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages
            .filter((m) => m && typeof m.content === 'string')
            .map((m) => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const replyContent =
        data?.reply ||
        (language === 'en'
          ? 'Emergency flood guidance: Ensure family members have safe drinking water, dry rations, and know their nearest flood shelter. Call 1090 (Flood Alert) or 999 for emergency rescue.'
          : 'জরুরি নির্দেশনা: পরিবারের জন্য বিশুদ্ধ পানি ও শুকনো খাবার প্রস্তুত রাখুন। নিকটস্থ আশ্রয়কেন্দ্রের সন্ধান জেনে রাখুন। যেকোনো জরুরি উদ্ধারে ১০৯০ অথবা ৯৯৯ নম্বরে কল করুন।');

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'en'
            ? 'Emergency flood guidance: Ensure family members have safe drinking water, dry rations, and know their nearest flood shelter. Call 1090 (Flood Alert) or 999 for rescue.'
            : 'জরুরি নির্দেশনা: পরিবারের জন্য বিশুদ্ধ পানি ও শুকনো খাবার প্রস্তুত রাখুন। নিকটস্থ আশ্রয়কেন্দ্রের সন্ধান জেনে রাখুন। যেকোনো জরুরি উদ্ধারে ১০৯০ অথবা ৯৯৯ নম্বরে কল করুন।',
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: initialGreeting,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-cyan-400" />
              <span>{tr.navAssistant}</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Gemini Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'AI-guided flood preparedness, hydrological interpretation, and family safety planning in English & বাংলা'
              : 'বাংলা ও ইংরেজিতে তাৎক্ষণিক দুর্যোগ প্রস্তুতি ও জীবন রক্ষার নির্দেশনাকারী এআই সহকারী'}
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Reset Conversation' : 'নতুন কথোপকথন'}</span>
        </button>
      </div>

      {/* Main Grid: Chat Thread (8 cols) + Preparedness Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Thread Container (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[650px] bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Thread Header */}
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-bold text-white tracking-wide">
                FloodGuard AI Active Thread
              </span>
            </div>
            <span className="text-[11px] font-mono text-cyan-300">
              Trained on Haor Hydrology Guidelines
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[88%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    <div>{msg.content}</div>
                    <div
                      className={`text-[10px] text-right font-mono ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 max-w-[88%] mr-auto">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center font-bold text-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>
                    {language === 'en'
                      ? 'Analyzing haor hydrological models and crafting response...'
                      : 'তথ্য বিশ্লেষণ করে উত্তর তৈরি করা হচ্ছে...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-6 py-2.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
              Suggestions:
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(language === 'en' ? q.en : q.bn)}
                className="inline-block px-3 py-1 rounded-full text-[11px] bg-slate-900 border border-slate-700/80 text-cyan-300 hover:border-cyan-500 hover:bg-slate-800 transition"
              >
                {language === 'en' ? q.en : q.bn}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            <input
              type="text"
              placeholder={
                language === 'en'
                  ? 'Ask about flood safety, river danger marks, or family preparedness...'
                  : 'বন্যা সতর্কতা, নদী বিপদসীমা বা পারিবারিক প্রস্তুতি সম্পর্কে জানতে প্রশ্ন করুন...'
              }
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            >
              <span>{language === 'en' ? 'Send' : 'পাঠান'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Emergency Knowledge Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Official Hotlines Quick Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
              <PhoneCall className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>{language === 'en' ? 'Emergency Rescue Hotlines' : 'জরুরি উদ্ধার হটলাইন'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">1090</span>
                  <span className="text-[11px] text-slate-400">Flood Alert IVR (Toll-Free)</span>
                </div>
                <a
                  href="tel:1090"
                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold hover:bg-rose-500/30 text-[11px]"
                >
                  Call
                </a>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-rose-500/20 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">999</span>
                  <span className="text-[11px] text-slate-400">Police & Boat Rescue</span>
                </div>
                <a
                  href="tel:999"
                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold hover:bg-rose-500/30 text-[11px]"
                >
                  Call
                </a>
              </div>
            </div>
          </div>

          {/* Crucial Family Preparedness Checklist */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'en' ? 'Essential Family Emergency Kit' : 'পারিবারিক জরুরি সুরক্ষা কিট'}</span>
            </h3>

            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Safe Water:</strong> Alum/Halazone water purification tablets + 5 days bottled water.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Dry Rations:</strong> Flattened rice (chira), molasses (gur), biscuits, puffed rice.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Medical Supplies:</strong> Oral Rehydration Salts (ORS saline), antiseptic, band-aids.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Vital Papers:</strong> NID cards, deeds, birth certificates wrapped in polythene.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Lighting:</strong> Charged waterproof torch, candles, matchbox in zip pouch.
                </span>
              </li>
            </ul>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <strong className="text-slate-300 block">Civic Safety Note:</strong>
            <p>
              FloodGuard AI provides emergency advisory assistance. Always follow directives from your local
              Upazila Nirbahi Officer (UNO) and official FFWC bulletins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
