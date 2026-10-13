import React from 'react';
import { GitCommit, Sparkles, AlertTriangle, CheckCircle, ArrowRight, Zap, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GarmentStyle, LineBalancingMetrics } from '../types';
import { autoBalanceLine } from '../engine';
import { useHaptics } from '../hooks/useHaptics';

interface LineBalanceTabProps {
  style: GarmentStyle;
  metrics: LineBalancingMetrics;
  onUpdateStyle: (updatedStyle: GarmentStyle) => void;
}

export const LineBalanceTab: React.FC<LineBalanceTabProps> = ({
  style,
  metrics,
  onUpdateStyle,
}) => {
  const { trigger } = useHaptics();

  const handleAutoBalance = () => {
    trigger('success');
    const balanced = autoBalanceLine(style);
    onUpdateStyle(balanced);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3B82F6', '#10B981', '#6366F1'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  };

  const pitchTime = metrics.pitchTimeMinutes;
  const maxStationTime = Math.max(
    pitchTime * 1.5,
    ...style.operations.map((op) => op.smv / Math.max(1, op.operatorAssigned))
  );

  const handleOperatorChange = (opId: string, delta: number) => {
    trigger('tap');
    const updatedOps = style.operations.map((op) => {
      if (op.id === opId) {
        return {
          ...op,
          operatorAssigned: Math.max(1, op.operatorAssigned + delta),
        };
      }
      return op;
    });
    onUpdateStyle({
      ...style,
      operations: updatedOps,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      
      {/* Top Balancing KPI Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 rounded-2xl p-4 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <GitCommit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Line Balance Efficiency (LBE)</h2>
              <p className="text-[11px] text-slate-400">Sewing line pitch distribution</p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-black ${
              metrics.lineBalanceEfficiencyPct >= 85
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : metrics.lineBalanceEfficiencyPct >= 75
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {metrics.lineBalanceEfficiencyPct.toFixed(1)}% LBE
          </span>
        </div>

        {/* 3 Metric Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Pitch Target</span>
            <span className="text-sm font-black text-blue-400">{pitchTime.toFixed(2)}m</span>
            <span className="text-[9px] text-slate-500 block">per station</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Peak Station</span>
            <span className="text-sm font-black text-slate-200">{metrics.maxStationSMV.toFixed(2)}m</span>
            <span className="text-[9px] text-slate-500 block">slowest task</span>
          </div>
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Bottlenecks</span>
            <span
              className={`text-sm font-black ${
                metrics.bottleneckCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {metrics.bottleneckCount}
            </span>
            <span className="text-[9px] text-slate-500 block">operations</span>
          </div>
        </div>

        {/* One-Tap Auto Balance Action Button */}
        <button
          onClick={handleAutoBalance}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md active:scale-98 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Auto-Balance Operators (IE Optimizer)</span>
        </button>
      </div>

      {/* Visual Pitch Diagram */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200">Pitch Time Workstation Diagram</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Line: {pitchTime.toFixed(2)} min target
          </span>
        </div>

        <p className="text-[10px] text-slate-400 mb-4">
          Red line is Pitch Benchmark. Bars crossing above pitch line indicate production bottleneck stations. Adjust operators directly using +/- steppers.
        </p>

        {/* Diagram Area */}
        <div className="space-y-2 pt-2">
          {style.operations.map((op) => {
            const stationTime = op.smv / Math.max(1, op.operatorAssigned);
            const widthPct = Math.min(100, (stationTime / maxStationTime) * 100);
            const pitchPct = Math.min(100, (pitchTime / maxStationTime) * 100);
            const isBottleneck = stationTime > pitchTime * 1.15;

            return (
              <div key={op.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-medium text-slate-300 truncate max-w-[170px] sm:max-w-[240px]">
                    {op.seq}. {op.name}
                  </span>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-slate-400">
                      {stationTime.toFixed(2)}m
                    </span>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => handleOperatorChange(op.id, -1)}
                        disabled={op.operatorAssigned <= 1}
                        className="text-slate-400 hover:text-white px-1 font-bold text-xs disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono font-bold text-blue-400 px-1">
                        {op.operatorAssigned} op
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOperatorChange(op.id, 1)}
                        className="text-slate-400 hover:text-white px-1 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative h-4 bg-slate-950 rounded-md overflow-hidden flex items-center">
                  {/* Pitch Line Indicator Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                    style={{ left: `${pitchPct}%` }}
                  />

                  {/* Station Bar */}
                  <div
                    className={`h-full rounded-r transition-all duration-300 ${
                      isBottleneck
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
            <span>Balanced Station</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
            <span>Bottleneck (&gt; Pitch +15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-rose-500 inline-block" />
            <span>Pitch Line</span>
          </div>
        </div>
      </div>

      {/* Bottleneck Interventions Diagnostic List */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>IE Diagnostic &amp; Floor Actions</span>
        </h3>

        {metrics.bottleneckOperations.length === 0 ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Line is harmoniously balanced! No bottleneck workstations detected.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.bottleneckOperations.slice(0, 4).map((opName, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
              >
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{opName}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Recommended action: Assign 1 additional operator, split sub-bundle, or apply jig/folder attachment to bring cycle below {pitchTime.toFixed(2)} min.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
