import React, { useState } from 'react';
import { X, Check, Edit3, Trash2 } from 'lucide-react';
import { GarmentStyle } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface EditStyleModalProps {
  style: GarmentStyle;
  onClose: () => void;
  onSaveStyle: (updated: GarmentStyle) => void;
  onDeleteStyle?: (styleId: string) => void;
}

export const EditStyleModal: React.FC<EditStyleModalProps> = ({
  style,
  onClose,
  onSaveStyle,
  onDeleteStyle,
}) => {
  const { trigger } = useHaptics();

  const [styleName, setStyleName] = useState(style.styleName);
  const [styleCode, setStyleCode] = useState(style.styleCode);
  const [buyer, setBuyer] = useState(style.buyer);
  const [category, setCategory] = useState(style.category);
  const [orderQuantity, setOrderQuantity] = useState(style.orderQuantity.toString());
  const [workingHours, setWorkingHours] = useState(style.workingHours.toString());
  const [totalOperators, setTotalOperators] = useState(style.totalOperators.toString());
  const [totalHelpers, setTotalHelpers] = useState(style.totalHelpers.toString());
  const [targetEfficiencyPct, setTargetEfficiencyPct] = useState(style.targetEfficiencyPct.toString());
  const [hourlyLaborRate, setHourlyLaborRate] = useState(style.hourlyLaborRate.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) return;

    trigger('success');

    const updated: GarmentStyle = {
      ...style,
      styleName: styleName.trim(),
      styleCode: styleCode.trim() || style.styleCode,
      buyer: buyer.trim() || style.buyer,
      category,
      orderQuantity: Math.max(10, parseInt(orderQuantity, 10) || style.orderQuantity),
      workingHours: Math.max(1, parseInt(workingHours, 10) || style.workingHours),
      totalOperators: Math.max(1, parseInt(totalOperators, 10) || style.totalOperators),
      totalHelpers: Math.max(0, parseInt(totalHelpers, 10) || 0),
      targetEfficiencyPct: Math.max(10, Math.min(100, parseInt(targetEfficiencyPct, 10) || style.targetEfficiencyPct)),
      hourlyLaborRate: Math.max(0.1, parseFloat(hourlyLaborRate) || style.hourlyLaborRate),
    };

    onSaveStyle(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Edit Style &amp; Order Parameters</h2>
              <p className="text-[10px] text-slate-400">Update style header, line parameters, and quantity</p>
            </div>
          </div>
          <button
            onClick={() => {
              trigger('tap');
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Style Name</label>
            <input
              type="text"
              required
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Style Code / PO</label>
              <input
                type="text"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Buyer / Client</label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Order Quantity (Pcs)</label>
              <input
                type="number"
                step="500"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">Sewing Line Parameters</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Working Hours</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Total Operators</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={totalOperators}
                  onChange={(e) => setTotalOperators(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Total Helpers</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={totalHelpers}
                  onChange={(e) => setTotalHelpers(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Target Efficiency (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={targetEfficiencyPct}
                  onChange={(e) => setTargetEfficiencyPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Hourly Labor Wage ($)</label>
                <input
                  type="number"
                  step="0.25"
                  value={hourlyLaborRate}
                  onChange={(e) => setHourlyLaborRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            {onDeleteStyle && style.isUserCreated ? (
              <button
                type="button"
                onClick={() => {
                  trigger('warning');
                  onDeleteStyle(style.id);
                  onClose();
                }}
                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Style</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
