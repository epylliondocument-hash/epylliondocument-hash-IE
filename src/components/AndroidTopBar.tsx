import React, { useState } from 'react';
import { Shirt, Timer, Download, ChevronDown, Check, Sparkles, Globe } from 'lucide-react';
import { GarmentStyle } from '../types';
import { PRESET_GARMENT_STYLES } from '../ladders';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidTopBarProps {
  currentStyle: GarmentStyle;
  onSelectStyle: (style: GarmentStyle) => void;
  onOpenStopwatch: () => void;
  onOpenInstallModal: () => void;
  onOpenPublishModal: () => void;
  isInstallable: boolean;
}

export const AndroidTopBar: React.FC<AndroidTopBarProps> = ({
  currentStyle,
  onSelectStyle,
  onOpenStopwatch,
  onOpenInstallModal,
  onOpenPublishModal,
  isInstallable,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const { trigger } = useHaptics();

  return (
    <div className="relative bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 z-30 shrink-0">
      <div className="flex items-center justify-between">
        
        {/* Style Selector Pill (Android MD3 Surface) */}
        <div className="relative">
          <button
            onClick={() => {
              trigger('tap');
              setShowStyleMenu(!showStyleMenu);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/80 text-left border border-slate-700/70 transition shadow-sm active:scale-95"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[130px] sm:max-w-[180px] truncate">
              <div className="text-xs font-bold text-slate-100 truncate">{currentStyle.styleName}</div>
              <div className="text-[10px] text-slate-400 truncate font-mono">{currentStyle.styleCode}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Style Dropdown Sheet */}
          {showStyleMenu && (
            <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select Garment Style</span>
                <span className="text-blue-400 font-mono">IE Presets</span>
              </div>
              <div className="space-y-1">
                {PRESET_GARMENT_STYLES.map((preset) => {
                  const isSelected = preset.id === currentStyle.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        trigger('success');
                        onSelectStyle(preset);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                        isSelected
                          ? 'bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-200">{preset.styleName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {preset.category} &bull; {preset.operations.length} Ops &bull; {preset.totalOperators} Ops Line
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Publish Free Button */}
          <button
            onClick={() => {
              trigger('tap');
              onOpenPublishModal();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition active:scale-95"
            title="Publish Free & Share"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Publish Free</span>
          </button>

          {/* Shop Floor Takt Time Stopwatch Tool */}
          <button
            onClick={() => {
              trigger('tap');
              onOpenStopwatch();
            }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition active:scale-95"
            title="Open IE Floor Time Study Stopwatch"
          >
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">Time Study</span>
          </button>

          {/* Android PWA Install Button */}
          {isInstallable && (
            <button
              onClick={() => {
                trigger('tap');
                onOpenInstallModal();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md active:scale-95 transition"
              title="Install Android App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Install</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
