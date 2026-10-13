import React, { useState } from 'react';
import { Shirt, Timer, Download, ChevronDown, Check, Plus, Edit3, Globe, Sparkles } from 'lucide-react';
import { GarmentStyle } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidTopBarProps {
  currentStyle: GarmentStyle;
  allStyles: GarmentStyle[];
  onSelectStyle: (style: GarmentStyle) => void;
  onOpenNewStyleModal: () => void;
  onOpenEditStyleModal: () => void;
  onOpenStopwatch: () => void;
  onOpenInstallModal: () => void;
  onOpenPublishModal: () => void;
  isInstallable: boolean;
}

export const AndroidTopBar: React.FC<AndroidTopBarProps> = ({
  currentStyle,
  allStyles,
  onSelectStyle,
  onOpenNewStyleModal,
  onOpenEditStyleModal,
  onOpenStopwatch,
  onOpenInstallModal,
  onOpenPublishModal,
  isInstallable,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const { trigger } = useHaptics();

  return (
    <div className="relative bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2.5 z-30 shrink-0">
      <div className="flex items-center justify-between gap-1.5">
        
        {/* Style Selector & Quick Edit Pill */}
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => {
              trigger('tap');
              setShowStyleMenu(!showStyleMenu);
            }}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/80 text-left border border-slate-700/70 transition shadow-sm active:scale-95"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Shirt className="w-3.5 h-3.5" />
            </div>
            <div className="max-w-[110px] xs:max-w-[140px] sm:max-w-[180px] truncate">
              <div className="text-xs font-bold text-slate-100 truncate">{currentStyle.styleName}</div>
              <div className="text-[10px] text-slate-400 truncate font-mono">{currentStyle.styleCode}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Quick Edit Current Style Info Button */}
          <button
            onClick={() => {
              trigger('tap');
              onOpenEditStyleModal();
            }}
            className="p-1.5 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
            title="Edit Style Info & Line Defaults"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Style Dropdown Sheet */}
          {showStyleMenu && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              
              {/* Top Action: New Entry */}
              <div className="pb-2 border-b border-slate-800 mb-1">
                <button
                  onClick={() => {
                    trigger('success');
                    setShowStyleMenu(false);
                    onOpenNewStyleModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Create New Style Entry</span>
                </button>
              </div>

              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select Style / Order</span>
                <span className="text-blue-400 font-mono">{allStyles.length} Available</span>
              </div>

              {/* Styles List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                {allStyles.map((styleItem) => {
                  const isSelected = styleItem.id === currentStyle.id;
                  return (
                    <button
                      key={styleItem.id}
                      onClick={() => {
                        trigger('success');
                        onSelectStyle(styleItem);
                        setShowStyleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition ${
                        isSelected
                          ? 'bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                          <span>{styleItem.styleName}</span>
                          {styleItem.isUserCreated && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {styleItem.styleCode} &bull; {styleItem.operations.length} Ops &bull; {styleItem.totalOperators} Line Ops
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
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Quick "+ New Entry" button directly in bar */}
          <button
            onClick={() => {
              trigger('tap');
              onOpenNewStyleModal();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
            title="Create New Garment Style Entry"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">New Entry</span>
          </button>

          {/* Publish Free Button */}
          <button
            onClick={() => {
              trigger('tap');
              onOpenPublishModal();
            }}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition active:scale-95"
            title="Publish Free & Share"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Publish</span>
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
            <span className="hidden md:inline text-[11px]">Time Study</span>
          </button>

          {/* Android PWA Install Button */}
          {isInstallable && (
            <button
              onClick={() => {
                trigger('tap');
                onOpenInstallModal();
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/70 shadow-sm active:scale-95 transition"
              title="Install Android App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Install</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
