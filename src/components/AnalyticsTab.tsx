import React, { useState } from 'react';
import { FileText, Download, DollarSign, Clock, Users, ShieldAlert, Cpu, Check, RefreshCw } from 'lucide-react';
import { GarmentStyle, LineBalancingMetrics } from '../types';
import { exportLadderPlanPDF } from '../pdf';
import { useHaptics } from '../hooks/useHaptics';

interface AnalyticsTabProps {
  style: GarmentStyle;
  metrics: LineBalancingMetrics;
  onUpdateStyle: (updatedStyle: GarmentStyle) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  style,
  metrics,
  onUpdateStyle,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { trigger } = useHaptics();

  // Machine Breakdown calculation
  const machineCounts: Record<string, number> = {};
  style.operations.forEach((op) => {
    const key = op.machineCode;
    machineCounts[key] = (machineCounts[key] || 0) + op.operatorAssigned;
  });

  const handleExportPDF = async () => {
    trigger('tap');
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const efficiencies = style.customLadderEfficiencies || [32, 48, 62, 72, 80, 86, 90];
      const success = await exportLadderPlanPDF(style, efficiencies);
      if (success) {
        trigger('success');
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
      trigger('warning');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFieldChange = (field: keyof GarmentStyle, val: number | string) => {
    onUpdateStyle({
      ...style,
      [field]: val,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      
      {/* PDF Export Banner Card */}
      <div className="bg-gradient-to-br from-blue-900/60 to-slate-900 rounded-2xl p-4 border border-blue-500/40 shadow-lg">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Official IE Line Bulletin PDF</h2>
            <p className="text-[11px] text-slate-300">Printable line loading &amp; ramp-up sheet</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
          Generates an A4 Industrial Engineering layout report with full Operation Bulletin, Machine Allocation, and Learning Curve Ramp-Up Ladder tables.
        </p>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 ${
            exportSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isExporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Document...</span>
            </>
          ) : exportSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>PDF Downloaded Successfully!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export &amp; Download PDF Bulletin</span>
            </>
          )}
        </button>
      </div>

      {/* Production & Cost Analytics */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Cost &amp; Capacity Projections</span>
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Direct Labor Cost</span>
            <span className="text-base font-black text-emerald-400">
              ${metrics.laborCostPerGarment.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-500 block">per completed garment</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Order Production Time</span>
            <span className="text-base font-black text-slate-200">
              {metrics.estimatedDaysToComplete.toFixed(1)} Days
            </span>
            <span className="text-[9px] text-slate-500 block">@ {metrics.targetPiecesPerDay} pcs/day</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Total Order Labor</span>
            <span className="text-base font-black text-slate-200">
              ${((metrics.laborCostPerGarment * style.orderQuantity) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-slate-500 block">for {style.orderQuantity.toLocaleString()} pcs</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Takt Cycle Time</span>
            <span className="text-base font-black text-blue-400">
              {metrics.cycleTimeSeconds}s
            </span>
            <span className="text-[9px] text-slate-500 block">per unit off line</span>
          </div>
        </div>
      </div>

      {/* Line Setup Parameters Configuration */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Garment Order &amp; Line Parameters</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          {/* Style Header Details (Editable) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Style Name</label>
              <input
                type="text"
                value={style.styleName}
                onChange={(e) => handleFieldChange('styleName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Style Code / PO</label>
              <input
                type="text"
                value={style.styleCode}
                onChange={(e) => handleFieldChange('styleCode', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Buyer / Customer</label>
              <input
                type="text"
                value={style.buyer}
                onChange={(e) => handleFieldChange('buyer', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={style.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Shift Working Hours</label>
              <input
                type="number"
                min="1"
                max="16"
                value={style.workingHours}
                onChange={(e) => handleFieldChange('workingHours', Math.max(1, parseInt(e.target.value) || 8))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Total Operators in Line</label>
              <input
                type="number"
                min="1"
                max="120"
                value={style.totalOperators}
                onChange={(e) => handleFieldChange('totalOperators', Math.max(1, parseInt(e.target.value) || 20))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Target Steady Efficiency (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={style.targetEfficiencyPct}
                onChange={(e) => handleFieldChange('targetEfficiencyPct', Math.max(10, parseInt(e.target.value) || 85))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Hourly Labor Wage ($)</label>
              <input
                type="number"
                step="0.25"
                value={style.hourlyLaborRate}
                onChange={(e) => handleFieldChange('hourlyLaborRate', Math.max(0.1, parseFloat(e.target.value) || 3.5))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Order Quantity (Pieces)</label>
            <input
              type="number"
              step="500"
              value={style.orderQuantity}
              onChange={(e) => handleFieldChange('orderQuantity', Math.max(10, parseInt(e.target.value) || 10000))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Machinery Requirements Floor Summary */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Floor Machinery Requirements</span>
        </h3>
        <p className="text-[10px] text-slate-400 mb-3">
          Total machines required for {style.totalOperators} operators:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(machineCounts).map(([code, count]) => (
            <div
              key={code}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
            >
              <span className="font-mono font-bold text-slate-300">{code}</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 font-mono font-black text-xs">
                {count} {count === 1 ? 'unit' : 'units'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Streamlit Python Application Card */}
      <div className="bg-gradient-to-br from-rose-950/30 to-slate-900 rounded-2xl p-4 border border-rose-500/30 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🐍</span>
            <div>
              <h3 className="text-xs font-bold text-slate-100">Streamlit Python App (streamlit_app.py)</h3>
              <p className="text-[10px] text-rose-300">Ready for Streamlit Community Cloud or local execution</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Python 3
          </span>
        </div>

        <p className="text-[11px] text-slate-300/80 mb-3 leading-relaxed">
          The standalone <code className="text-rose-300 bg-slate-950 px-1 py-0.5 rounded font-mono">streamlit_app.py</code> and <code className="text-slate-300 bg-slate-950 px-1 py-0.5 rounded font-mono">requirements.txt</code> files are configured in the project root.
        </p>

        <div className="bg-slate-950 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-slate-300 flex items-center justify-between mb-3">
          <span className="text-rose-400 select-all">$ streamlit run streamlit_app.py</span>
          <button
            onClick={() => {
              trigger('tap');
              navigator.clipboard?.writeText('streamlit run streamlit_app.py');
            }}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
          >
            Copy
          </button>
        </div>

        <a
          href="/streamlit_app.py"
          download="streamlit_app.py"
          onClick={() => trigger('success')}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
        >
          <Download className="w-3.5 h-3.5 text-rose-400" />
          <span>Download streamlit_app.py</span>
        </a>
      </div>

    </div>
  );
};
