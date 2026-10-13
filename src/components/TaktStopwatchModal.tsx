import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Flag, Check, X, Sparkles } from 'lucide-react';
import { GarmentStyle, Operation } from '../types';
import { calculateSMVStudy } from '../engine';
import { useHaptics } from '../hooks/useHaptics';

interface TaktStopwatchModalProps {
  style: GarmentStyle;
  initialOpId?: string;
  onClose: () => void;
  onApplySMV: (opId: string, smv: number) => void;
}

export const TaktStopwatchModal: React.FC<TaktStopwatchModalProps> = ({
  style,
  initialOpId,
  onClose,
  onApplySMV,
}) => {
  const [selectedOpId, setSelectedOpId] = useState<string>(
    initialOpId || style.operations[0]?.id || ''
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [ratingFactor, setRatingFactor] = useState<number>(100);
  const [allowancePct, setAllowancePct] = useState<number>(12);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const { trigger } = useHaptics();

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedMs;
      timerRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startTimeRef.current);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    trigger('tap');
    setIsRunning(!isRunning);
  };

  const handleLap = () => {
    trigger('tap');
    const lapSeconds = elapsedMs / 1000;
    if (lapSeconds > 1) {
      setLaps([lapSeconds, ...laps]);
      setElapsedMs(0);
      startTimeRef.current = performance.now();
    }
  };

  const handleReset = () => {
    trigger('tap');
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
  };

  const formatTimer = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  };

  const study = calculateSMVStudy(laps, ratingFactor, allowancePct);
  const targetOp = style.operations.find((o) => o.id === selectedOpId);

  const handleApply = () => {
    if (!targetOp || study.standardSMV <= 0) return;
    trigger('success');
    onApplySMV(selectedOpId, study.standardSMV);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl space-y-3 flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">Floor Time-Study Stopwatch</h3>
              <p className="text-[10px] text-slate-400">Measure actual sewing cycle SMV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operation Target Selector */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Target Operation to Calibrate</label>
          <select
            value={selectedOpId}
            onChange={(e) => setSelectedOpId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 truncate"
          >
            {style.operations.map((op) => (
              <option key={op.id} value={op.id}>
                #{op.seq} {op.name} (Current SMV: {op.smv}m)
              </option>
            ))}
          </select>
        </div>

        {/* Digital Stopwatch Display */}
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center shadow-inner">
          <div className="font-mono text-4xl font-black text-amber-400 tracking-wider">
            {formatTimer(elapsedMs)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {laps.length} Samples Recorded
          </div>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleStartStop}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          <button
            onClick={handleLap}
            disabled={!isRunning && elapsedMs === 0}
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Flag className="w-3.5 h-3.5 text-blue-400" />
            <span>Record Lap</span>
          </button>

          <button
            onClick={handleReset}
            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Rating Factor & Allowance Sliders */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Operator Performance Rating:</span>
            <span className="font-mono font-bold text-blue-400">{ratingFactor}%</span>
          </div>
          <input
            type="range"
            min="70"
            max="130"
            value={ratingFactor}
            onChange={(e) => setRatingFactor(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 accent-blue-500 rounded cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">IE Factory Allowance (Fatigue/Delay):</span>
            <span className="font-mono font-bold text-amber-400">{allowancePct}%</span>
          </div>
          <input
            type="range"
            min="8"
            max="25"
            value={allowancePct}
            onChange={(e) => setAllowancePct(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {/* Computed SMV Results Card */}
        <div className="bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Avg Observed Cycle:</span>
            <span className="font-mono font-bold text-slate-200">{study.averageObservedSec}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Calculated Standard SMV:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">
              {study.standardSMV.toFixed(2)} min
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleApply}
          disabled={study.standardSMV <= 0}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition"
        >
          <Check className="w-4 h-4" />
          <span>Apply {study.standardSMV.toFixed(2)} min to Operation #{targetOp?.seq}</span>
        </button>

      </div>
    </div>
  );
};
