import React, { useState } from 'react';
import { Globe, Smartphone, Cloud, Copy, Check, ExternalLink, X, QrCode, ShieldCheck, Sparkles, Share2 } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface PublishFreeModalProps {
  onClose: () => void;
}

export const PublishFreeModal: React.FC<PublishFreeModalProps> = ({ onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'streamlit' | 'apk'>('live');
  const { trigger } = useHaptics();

  // Current live app URL
  const liveUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-mbhzmglyh3aztsbent3b56-201314308461.asia-east1.run.app';

  const handleCopyLink = () => {
    trigger('success');
    navigator.clipboard?.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyGitCommand = () => {
    trigger('success');
    const cmd = `git init && git add . && git commit -m "Deploy SMV Ladder Planner"`;
    navigator.clipboard?.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Globe className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Publish Free (100% No Cost)</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FREE
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Zero hosting or developer account fees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              trigger('tap');
              setActiveTab('live');
            }}
            className={`py-1.5 rounded-lg font-medium transition text-[11px] ${
              activeTab === 'live'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Link (Instant)
          </button>
          <button
            onClick={() => {
              trigger('tap');
              setActiveTab('apk');
            }}
            className={`py-1.5 rounded-lg font-medium transition text-[11px] ${
              activeTab === 'apk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Free Android APK
          </button>
          <button
            onClick={() => {
              trigger('tap');
              setActiveTab('streamlit');
            }}
            className={`py-1.5 rounded-lg font-medium transition text-[11px] ${
              activeTab === 'streamlit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Streamlit Cloud
          </button>
        </div>

        {/* TAB 1: INSTANT LIVE WEB & ANDROID SHARE */}
        {activeTab === 'live' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-950 border border-blue-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300">Your Live Published URL</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live On Cloud Run
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                This app is already deployed and hosted online for free! Anyone on Android or desktop can open and use this link immediately.
              </p>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-2 font-mono text-xs text-slate-200">
                <span className="truncate flex-1 select-all">{liveUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Android Install Steps */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>How Factory Workers Install for Free on Android:</span>
              </div>
              <ol className="space-y-1.5 text-[11px] text-slate-300 list-decimal pl-4">
                <li>Send the link above via WhatsApp, email, or QR code.</li>
                <li>Open the link in <strong>Google Chrome on Android</strong>.</li>
                <li>Tap <strong>"Install"</strong> or the 3 dots (&vellip;) &rarr; <strong>"Install app" / "Add to Home screen"</strong>.</li>
                <li>An official standalone Android app icon is created on their home screen with offline capability — <strong>100% Free</strong>!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 2: FREE ANDROID APK BUILDER */}
        {activeTab === 'apk' && (
          <div className="space-y-3 animate-in fade-in text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Generate a Standalone .APK File (No $25 Play Store Fee)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You can turn this web app into an installable Android <code className="text-blue-400 font-mono">.apk</code> file for free using Microsoft's open-source <strong>PWABuilder</strong> tool:
              </p>

              <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Copy your live URL: <code className="text-blue-300 select-all font-mono">{liveUrl}</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Go to <strong className="text-slate-100">pwabuilder.com</strong> (free tool by Microsoft).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Paste the URL and click <strong>"Start"</strong> &rarr; <strong>"Package for Stores"</strong> &rarr; <strong>"Android"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                  <span>Download your generated signed <strong className="text-emerald-400">.apk</strong> package to install or distribute directly to devices!</span>
                </div>
              </div>

              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-98"
              >
                <span>Open PWABuilder (Free)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: STREAMLIT COMMUNITY CLOUD */}
        {activeTab === 'streamlit' && (
          <div className="space-y-3 animate-in fade-in text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-rose-300 block">
                Publish Streamlit App on Streamlit Community Cloud (Free Forever)
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Streamlit offers free public hosting for any Python Streamlit application:
              </p>

              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <span>Create a free GitHub repository and push your project with <code className="text-rose-300 font-mono">streamlit_app.py</code> and <code className="text-rose-300 font-mono">requirements.txt</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <span>Visit <strong className="text-slate-100">share.streamlit.io</strong> and sign in with your GitHub account.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <span>Click <strong>"New app"</strong> &rarr; Select your repository &rarr; Main file path: <code className="text-rose-300 font-mono">streamlit_app.py</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                  <span>Click <strong>"Deploy"</strong>! Streamlit will give you a custom free URL like <code className="text-emerald-400 font-mono">yourapp.streamlit.app</code>.</span>
                </div>
              </div>

              <a
                href="https://share.streamlit.io"
                target="_blank"
                rel="noreferrer"
                className="mt-2 w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-98"
              >
                <span>Go to Streamlit Community Cloud</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs text-center transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
