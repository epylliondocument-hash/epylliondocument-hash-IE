import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Sliders,
  Plus,
  Trash2,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CustomLadderDay, GarmentStyle, LadderDayPlan, LineBalancingMetrics } from '../types';
import { LADDER_PRESETS } from '../ladders';
import { calculateLadderPlan } from '../engine';
import { useHaptics } from '../hooks/useHaptics';

interface LadderPlanTabProps {
  style: GarmentStyle;
  metrics: LineBalancingMetrics;
  onUpdateLadder: (days: CustomLadderDay[], efficiencies: number[], presetId: string) => void;
}

export const LadderPlanTab: React.FC<LadderPlanTabProps> = ({
  style,
  metrics,
  onUpdateLadder,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const { trigger } = useHaptics();

  // Initialize or get custom ladder days from style
  const currentEfficiencies = style.customLadderEfficiencies || [32, 48, 62, 72, 80, 86, 90];
  
  const currentCustomDays: CustomLadderDay[] = (style.customLadderDays && style.customLadderDays.length > 0)
    ? style.customLadderDays
    : currentEfficiencies.map((eff, idx) => ({
        dayNumber: idx + 1,
        dayLabel: `Day ${idx + 1}`,
        efficiencyPct: eff,
      }));

  const ladderPlans: LadderDayPlan[] = calculateLadderPlan(style, currentEfficiencies, currentCustomDays);
  const selectedPlan = ladderPlans[selectedDayIndex] || ladderPlans[0];

  // Select a preset curve
  const handlePresetSelect = (presetId: string) => {
    trigger('tap');
    const preset = LADDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const newDays: CustomLadderDay[] = preset.dailyEfficiencies.map((eff, idx) => ({
        dayNumber: idx + 1,
        dayLabel: `Day ${idx + 1}`,
        efficiencyPct: eff,
      }));
      onUpdateLadder(newDays, [...preset.dailyEfficiencies], preset.id);
      setSelectedDayIndex(0);
    }
  };

  // Direct edit of Target Daily Pieces (WITHOUT FORMULA)
  const handleTargetPcsChange = (dayIdx: number, newPcs: number) => {
    const updatedDays = currentCustomDays.map((d, idx) => {
      if (idx === dayIdx) {
        return {
          ...d,
          customTargetPcs: Math.max(0, newPcs),
        };
      }
      return d;
    });
    onUpdateLadder(updatedDays, updatedDays.map((d) => d.efficiencyPct), 'custom');
  };

  // Direct edit of Efficiency %
  const handleEfficiencyChange = (dayIdx: number, newEff: number) => {
    const clampedEff = Math.max(5, Math.min(100, newEff));
    const updatedDays = currentCustomDays.map((d, idx) => {
      if (idx === dayIdx) {
        return {
          ...d,
          efficiencyPct: clampedEff,
        };
      }
      return d;
    });
    const updatedEffs = updatedDays.map((d) => d.efficiencyPct);
    onUpdateLadder(updatedDays, updatedEffs, 'custom');
  };

  // Direct edit of Day Label
  const handleDayLabelChange = (dayIdx: number, newLabel: string) => {
    const updatedDays = currentCustomDays.map((d, idx) => {
      if (idx === dayIdx) {
        return {
          ...d,
          dayLabel: newLabel,
        };
      }
      return d;
    });
    onUpdateLadder(updatedDays, currentEfficiencies, style.activeLadderPresetId);
  };

  // NEW ENTRY: Add Day Entry
  const handleAddDay = () => {
    trigger('success');
    const nextDayNum = currentCustomDays.length + 1;
    const lastDayEff = currentCustomDays[currentCustomDays.length - 1]?.efficiencyPct || 85;
    const newDay: CustomLadderDay = {
      dayNumber: nextDayNum,
      dayLabel: `Day ${nextDayNum}`,
      efficiencyPct: Math.min(100, lastDayEff + 3),
    };
    const updatedDays = [...currentCustomDays, newDay];
    const updatedEffs = updatedDays.map((d) => d.efficiencyPct);
    onUpdateLadder(updatedDays, updatedEffs, 'custom');
    setSelectedDayIndex(updatedDays.length - 1);
  };

  // Delete Day Entry
  const handleDeleteDay = (dayIdx: number) => {
    trigger('warning');
    if (currentCustomDays.length <= 1) return;
    const updatedDays = currentCustomDays
      .filter((_, idx) => idx !== dayIdx)
      .map((d, idx) => ({
        ...d,
        dayNumber: idx + 1,
        dayLabel: d.dayLabel.startsWith('Day ') ? `Day ${idx + 1}` : d.dayLabel,
      }));
    const updatedEffs = updatedDays.map((d) => d.efficiencyPct);
    onUpdateLadder(updatedDays, updatedEffs, 'custom');
    if (selectedDayIndex >= updatedDays.length) {
      setSelectedDayIndex(updatedDays.length - 1);
    }
  };

  // Reset / Recalculate all days with standard IE Formula
  const handleResetToFormula = () => {
    trigger('success');
    const updatedDays = currentCustomDays.map((d) => {
      const copy = { ...d };
      delete copy.customTargetPcs; // Remove manual override so formula takes over
      return copy;
    });
    onUpdateLadder(updatedDays, currentEfficiencies, style.activeLadderPresetId);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 pb-24">
      
      {/* Top Banner KPI Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 rounded-2xl p-3 sm:p-4 border border-slate-700/70 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Ramp-Up Learning Curve Ladder</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Targets Editable
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">Ramp targets, day efficiencies &amp; shift hourly profile</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            {currentCustomDays.length}-Day Plan
          </span>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/70 rounded-xl p-2 sm:p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Total SMV</span>
            <span className="text-sm sm:text-base font-black text-slate-100">{metrics.totalSMV.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500 block">min / garment</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2 sm:p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Pitch Time</span>
            <span className="text-sm sm:text-base font-black text-blue-400">{metrics.pitchTimeMinutes.toFixed(2)}m</span>
            <span className="text-[9px] text-slate-500 block">@ {metrics.totalOperators} ops</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2 sm:p-2.5 border border-slate-800">
            <span className="text-[10px] font-medium text-slate-400 block">Steady Target</span>
            <span className="text-sm sm:text-base font-black text-emerald-400">{metrics.targetPiecesPerDay.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">pcs / day</span>
          </div>
        </div>
      </div>

      {/* Preset Curve Selector & Formula Reset Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300">Curve Presets</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToFormula}
              className="text-[10px] font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
              title="Reset all targets to textbook IE formula"
            >
              <Wand2 className="w-3 h-3 text-amber-400" />
              <span>Reset to Formula</span>
            </button>
            <button
              onClick={() => {
                trigger('tap');
                setIsEditingCustom(!isEditingCustom);
              }}
              className="text-[11px] font-semibold text-blue-400 flex items-center gap-1 hover:text-blue-300"
            >
              <Sliders className="w-3 h-3" />
              <span>{isEditingCustom ? 'Close Sliders' : 'Quick Sliders'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LADDER_PRESETS.map((preset) => {
            const isActive = style.activeLadderPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-2 rounded-xl text-left border transition text-xs relative ${
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

      {/* Quick Slider Drawer if toggled */}
      {isEditingCustom && (
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-700/80 space-y-2.5 animate-in fade-in">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>Adjust Daily Target Efficiencies (%)</span>
            <span className="text-[10px] text-slate-400">Drag to adjust target efficiency</span>
          </div>
          <div className="space-y-1.5">
            {currentCustomDays.map((d, idx) => (
              <div key={d.dayNumber} className="flex items-center gap-2 text-xs">
                <span className="w-14 font-medium text-slate-400 text-[11px] truncate">{d.dayLabel}</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={d.efficiencyPct}
                  onChange={(e) => handleEfficiencyChange(idx, Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="w-10 text-right font-mono font-bold text-blue-400 text-xs">
                  {d.efficiencyPct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAMP-UP SCHEDULE DAYS LIST (ALL TARGETS FREELY EDITABLE & NEW ENTRY BUTTON) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Daily Production Ramp Schedule</span>
            <span className="text-[10px] text-slate-500">
              Type directly in Target Pcs or Eff % to override without formula
            </span>
          </div>

          {/* NEW ENTRY BUTTON: Add Day */}
          <button
            onClick={handleAddDay}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Day</span>
          </button>
        </div>

        {/* Days List Cards */}
        <div className="space-y-2">
          {ladderPlans.map((plan, idx) => {
            const isSelected = selectedDayIndex === idx;
            const customDay = currentCustomDays[idx];
            const isManual = plan.isManualTarget;
            const progressRatio = style.orderQuantity > 0
              ? Math.min(100, Math.round((plan.cumulativeTargetPcs / style.orderQuantity) * 100))
              : 0;

            return (
              <div
                key={plan.dayNumber}
                onClick={() => {
                  trigger('tap');
                  setSelectedDayIndex(idx);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-950/40 to-slate-900 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  {/* Left: Day Label & Efficiency Input */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {plan.dayNumber}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Day Label Input (Editable) */}
                        <input
                          type="text"
                          value={customDay?.dayLabel || plan.dayLabel}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleDayLabelChange(idx, e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none w-28 sm:w-36 py-0.5"
                        />

                        {/* Status tag */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            isManual
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isManual ? 'Manual Target' : 'Formula'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <span>Eff:</span>
                          <input
                            type="number"
                            min="5"
                            max="100"
                            value={plan.efficiencyPct}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleEfficiencyChange(idx, parseInt(e.target.value, 10) || 50)
                            }
                            className="w-11 text-center font-mono font-bold text-blue-400 bg-slate-950 border border-slate-800 rounded px-1 py-0.2 text-[10px] focus:outline-none focus:border-blue-500"
                          />
                          <span>%</span>
                        </span>
                        <span>&bull;</span>
                        <span>~{plan.targetHourlyAverage} pcs/hr</span>
                        <span>&bull;</span>
                        <span>Cum: {plan.cumulativeTargetPcs.toLocaleString()} ({progressRatio}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Direct Target Daily Pcs Input (WITHOUT FORMULA) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block">Daily Target:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={plan.targetDailyPcs}
                            onChange={(e) =>
                              handleTargetPcsChange(idx, parseInt(e.target.value, 10) || 0)
                            }
                            className="w-20 text-right font-mono font-black text-sm text-slate-100 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2 py-0.5 focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400">pcs</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Day Button */}
                    {currentCustomDays.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDay(idx);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete Day Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar towards order */}
                <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
        <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-200">
                  {selectedPlan.dayLabel} Shift Hourly Output Profile
                </h3>
                <p className="text-[10px] text-slate-400">
                  Ergonomic curve scaled to daily target of {selectedPlan.targetDailyPcs} pcs
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {selectedPlan.targetDailyPcs} pcs / day
            </span>
          </div>

          {/* Hourly Bar Visualizer */}
          <div className="grid grid-cols-8 gap-1 pt-1">
            {selectedPlan.hourlyBreakdown.map((pcs, hIdx) => {
              const maxPcs = Math.max(...selectedPlan.hourlyBreakdown, 1);
              const heightPct = Math.round((pcs / maxPcs) * 100);

              return (
                <div key={hIdx} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono font-semibold text-slate-300">{pcs}</span>
                  <div className="w-full bg-slate-800 rounded-md h-16 flex items-end p-0.5">
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

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Shift Target: {style.workingHours} Hours</span>
            <span className="text-emerald-400 font-medium">Order Target: {style.orderQuantity.toLocaleString()} pcs</span>
          </div>
        </div>
      )}

    </div>
  );
};
