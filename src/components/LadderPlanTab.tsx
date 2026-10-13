import React, { useState } from 'react';
import { TrendingUp, Calendar, Clock, Award, Sliders, CheckCircle2, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import { GarmentStyle, LadderDayPlan, LineBalancingMetrics } from '../types';
import { LADDER_PRESETS } from '../ladders';
import { calculateLadderPlan } from '../engine';
import { useHaptics } from '../hooks/useHaptics';

interface LadderPlanTabProps {
  style: GarmentStyle;
  metrics: LineBalancingMetrics;
  onUpdateEfficiencies: (efficiencies: number[], presetId: string) => void;
}

export const LadderPlanTab: React.FC<LadderPlanTabProps> = ({
  style,
  metrics,
  onUpdateEfficiencies,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const { trigger } = useHaptics();

  const currentEfficiencies = style.customLadderEfficiencies || [32, 48, 62, 72, 80, 86, 90];
  const ladderPlans: LadderDayPlan[] = calculateLadderPlan(style, currentEfficiencies);
  const activePreset = LADDER_PRESETS.find((p) => p.id === style.activeLadderPresetId) || LADDER_PRESETS[1];

  const selectedPlan = ladderPlans[selectedDayIndex] || ladderPlans[0];

  const handlePresetSelect = (presetId: string) => {
    trigger('tap');
    const preset = LADDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onUpdateEfficiencies([...preset.dailyEfficiencies], preset.id);
      setSelectedDayIndex(0);
    }
  };

  const handleEfficiencyChange = (dayIdx: number, newEff: number) => {
    const updated = [...currentEfficiencies];
    updated[dayIdx] = Math.max(10, Math.min(100, newEff));
    onUpdateEfficiencies(updated, 'custom');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">
      
      {/* Overview Metric Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 rounded-2xl p-4 border border-slate-700/70 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Ramp-Up Learning Ladder</h2>
              <p className="text-[11px] text-slate-400">Garment production ramp curve</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {currentEfficiencies.length}-Day Plan
          </span>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Total SMV</span>
            <span className="text-base font-black text-slate-100">{metrics.totalSMV.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 block">min / piece</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Pitch Time</span>
            <span className="text-base font-black text-blue-400">{metrics.pitchTimeMinutes.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 block">min @ {metrics.totalOperators} ops</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Steady Target</span>
            <span className="text-base font-black text-emerald-400">{metrics.targetPiecesPerDay.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">pcs / day</span>
          </div>
        </div>
      </div>

      {/* Preset Curve Selector Chips */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300">Curve Preset</span>
          <button
            onClick={() => {
              trigger('tap');
              setIsEditingCustom(!isEditingCustom);
            }}
            className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 hover:text-blue-300"
          >
            <Sliders className="w-3 h-3" />
            <span>{isEditingCustom ? 'Done Editing' : 'Fine-Tune Sliders'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LADDER_PRESETS.map((preset) => {
            const isActive = style.activeLadderPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-2.5 rounded-xl text-left border transition text-xs relative ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-[11px] truncate">{preset.name}</div>
                <div className="text-[10px] opacity-75 truncate">{preset.durationDays} Days Ramp</div>
                {isActive && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Slider Drawer (if toggled) */}
      {isEditingCustom && (
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-700/80 space-y-3 animate-in fade-in">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>Adjust Daily Target Efficiencies (%)</span>
            <span className="text-[10px] text-slate-400">Drag to re-curve</span>
          </div>
          <div className="space-y-2">
            {currentEfficiencies.map((eff, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-medium text-slate-400">Day {idx + 1}</span>
                <input
                  type="range"
                  min="15"
                  max="100"
                  value={eff}
                  onChange={(e) => handleEfficiencyChange(idx, Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="w-10 text-right font-mono font-bold text-blue-400">{eff}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Ramp-Up Ladder Cards (Horizontal Scroll or Compact List) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300">Ramp-Up Schedule</span>
          <span className="text-[10px] text-slate-500">Tap day to view hourly profile</span>
        </div>

        <div className="space-y-2">
          {ladderPlans.map((plan, idx) => {
            const isSelected = selectedDayIndex === idx;
            const progressRatio = Math.min(100, Math.round((plan.cumulativeTargetPcs / style.orderQuantity) * 100));

            return (
              <div
                key={plan.dayNumber}
                onClick={() => {
                  trigger('tap');
                  setSelectedDayIndex(idx);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-900/30 to-slate-900 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {plan.dayNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {plan.dayLabel} &bull; Target {plan.efficiencyPct}% Eff.
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{plan.targetHourlyAverage} pcs/hr &bull; Cum: {plan.cumulativeTargetPcs.toLocaleString()} pcs ({progressRatio}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-100 block">
                      {plan.targetDailyPcs.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400">pcs/day</span>
                  </div>
                </div>

                {/* Progress bar towards order */}
                <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, plan.efficiencyPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Hourly Output Distribution */}
      {selectedPlan && (
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-200">
                  {selectedPlan.dayLabel} Hourly Shift Output Distribution
                </h3>
                <p className="text-[10px] text-slate-400">
                  Factoring ergonomic start curve, mid-shift peak &amp; cleanup
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {selectedPlan.targetDailyPcs} pcs total
            </span>
          </div>

          {/* Hourly Bar Visualizer */}
          <div className="grid grid-cols-8 gap-1.5 pt-2">
            {selectedPlan.hourlyBreakdown.map((pcs, hIdx) => {
              const maxPcs = Math.max(...selectedPlan.hourlyBreakdown, 1);
              const heightPct = Math.round((pcs / maxPcs) * 100);

              return (
                <div key={hIdx} className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-mono font-semibold text-slate-300">{pcs}</span>
                  <div className="w-full bg-slate-800 rounded-md h-20 flex items-end p-0.5">
                    <div
                      className={`w-full rounded transition-all duration-300 ${
                        hIdx === 1 || hIdx === 2 || hIdx === 5
                          ? 'bg-blue-500'
                          : 'bg-blue-600/70'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">H{hIdx + 1}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Shift Target: {style.workingHours} Hours</span>
            <span className="text-emerald-400 font-medium">Order Target: {style.orderQuantity.toLocaleString()} pcs</span>
          </div>
        </div>
      )}

    </div>
  );
};
