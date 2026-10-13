import React, { useState } from 'react';
import { X, Plus, Shirt, Copy, Sparkles, Check } from 'lucide-react';
import { GarmentStyle, Operation } from '../types';
import { PRESET_GARMENT_STYLES } from '../ladders';
import { useHaptics } from '../hooks/useHaptics';

interface NewStyleModalProps {
  currentStyle: GarmentStyle;
  onClose: () => void;
  onCreateStyle: (newStyle: GarmentStyle) => void;
}

export const NewStyleModal: React.FC<NewStyleModalProps> = ({
  currentStyle,
  onClose,
  onCreateStyle,
}) => {
  const { trigger } = useHaptics();

  const [styleName, setStyleName] = useState('');
  const [styleCode, setStyleCode] = useState('');
  const [buyer, setBuyer] = useState('');
  const [category, setCategory] = useState('Knitwear');
  const [orderQuantity, setOrderQuantity] = useState('10000');
  const [workingHours, setWorkingHours] = useState('8');
  const [totalOperators, setTotalOperators] = useState('24');
  const [targetEfficiencyPct, setTargetEfficiencyPct] = useState('80');
  const [hourlyLaborRate, setHourlyLaborRate] = useState('3.50');
  const [templateChoice, setTemplateChoice] = useState<'blank' | 'clone' | string>('clone');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) return;

    trigger('success');

    let initialOps: Operation[] = [];
    if (templateChoice === 'clone') {
      initialOps = currentStyle.operations.map((op, idx) => ({
        ...op,
        id: `op-${Date.now()}-${idx}`,
      }));
    } else if (templateChoice !== 'blank') {
      const preset = PRESET_GARMENT_STYLES.find((p) => p.id === templateChoice);
      if (preset) {
        initialOps = preset.operations.map((op, idx) => ({
          ...op,
          id: `op-${Date.now()}-${idx}`,
        }));
      }
    }

    const newStyle: GarmentStyle = {
      id: `style-custom-${Date.now()}`,
      styleName: styleName.trim(),
      styleCode: styleCode.trim() || `STY-${Date.now().toString().slice(-4)}`,
      buyer: buyer.trim() || 'Internal Factory Line',
      category: category,
      orderQuantity: Math.max(100, parseInt(orderQuantity, 10) || 5000),
      workingHours: Math.max(1, parseInt(workingHours, 10) || 8),
      totalOperators: Math.max(1, parseInt(totalOperators, 10) || 24),
      totalHelpers: 3,
      targetEfficiencyPct: Math.max(10, Math.min(100, parseInt(targetEfficiencyPct, 10) || 80)),
      hourlyLaborRate: Math.max(0.1, parseFloat(hourlyLaborRate) || 3.5),
      activeLadderPresetId: 'standard-7',
      customLadderEfficiencies: [30, 45, 60, 72, 80, 85, 90],
      customLadderDays: [
        { dayNumber: 1, dayLabel: 'Day 1', efficiencyPct: 30 },
        { dayNumber: 2, dayLabel: 'Day 2', efficiencyPct: 45 },
        { dayNumber: 3, dayLabel: 'Day 3', efficiencyPct: 60 },
        { dayNumber: 4, dayLabel: 'Day 4', efficiencyPct: 72 },
        { dayNumber: 5, dayLabel: 'Day 5', efficiencyPct: 80 },
        { dayNumber: 6, dayLabel: 'Day 6', efficiencyPct: 85 },
        { dayNumber: 7, dayLabel: 'Day 7', efficiencyPct: 90 },
      ],
      operations: initialOps,
      isUserCreated: true,
    };

    onCreateStyle(newStyle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Create New Garment Style Entry</h2>
              <p className="text-[10px] text-slate-400">Add a new factory order or line bulletin</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* Style Name & Code */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Style Name / Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Cargo Jogger Pants, Ladies Knit Blouse"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Style Code / PO #</label>
              <input
                type="text"
                placeholder="e.g., PO-2026-X8"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Buyer / Brand</label>
              <input
                type="text"
                placeholder="e.g., Apex, Nike, Zara"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Knitwear">Knitwear</option>
                <option value="Woven Tops">Woven Tops</option>
                <option value="Bottoms & Chinos">Bottoms &amp; Chinos</option>
                <option value="Denim Jeans">Denim Jeans</option>
                <option value="Outerwear & Jackets">Outerwear &amp; Jackets</option>
                <option value="Sportswear">Sportswear</option>
                <option value="Undergarments">Undergarments</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Order Quantity (Pcs)</label>
              <input
                type="number"
                step="500"
                min="100"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Line Setup Details */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 block">Line Engineering Defaults</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Shift Hours</label>
                <input
                  type="number"
                  min="4"
                  max="12"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Operators in Line</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={totalOperators}
                  onChange={(e) => setTotalOperators(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Target Eff %</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={targetEfficiencyPct}
                  onChange={(e) => setTargetEfficiencyPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Operations Template Starter Choice */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">Initial Operations Breakdown</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateChoice('clone')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                  templateChoice === 'clone'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Copy className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Copy Current Style</div>
                  <div className="text-[9px] opacity-75">{currentStyle.operations.length} operations</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplateChoice('blank')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                  templateChoice === 'blank'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[11px]">Blank Sheet</div>
                  <div className="text-[9px] opacity-75">Add custom ops from scratch</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 font-medium text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Style Entry</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
