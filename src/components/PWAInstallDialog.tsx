import React from 'react';
import { Smartphone, Download, X, CheckCircle, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useHaptics } from '../hooks/useHaptics';

interface PWAInstallDialogProps {
  onClose: () => void;
}

export const PWAInstallDialog: React.FC<PWAInstallDialogProps> = ({ onClose }) => {
  const { isInstallable, isIOS, isAndroid, install } = usePWAInstall();
  const { trigger } = useHaptics();

  const handleInstallClick = async () => {
    trigger('success');
    const installed = await install();
    if (installed) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">Install Android WebAPK</h3>
              <p className="text-[10px] text-slate-400">Offline Industrial Engineering App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Benefits list */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Works 100% offline on sewing factory shop floors</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Full-screen Android experience without browser address bars</span>
          </div>
          <div className="flex items-start gap-2 text-slate-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <span>Fast touch haptics and instant PDF bulletin generation</span>
          </div>
        </div>

        {/* Action Button */}
        {isInstallable ? (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition"
          >
            <Download className="w-4 h-4" />
            <span>Install on Device Home Screen</span>
          </button>
        ) : isIOS ? (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200">How to install on iOS Safari:</p>
            <p>1. Tap the <strong>Share</strong> button at bottom of Safari.</p>
            <p>2. Select <strong>Add to Home Screen</strong>.</p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200">How to install on Android Chrome:</p>
            <p>1. Tap the <strong>Three Dots (&vellip;)</strong> menu in Chrome.</p>
            <p>2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 text-center"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
