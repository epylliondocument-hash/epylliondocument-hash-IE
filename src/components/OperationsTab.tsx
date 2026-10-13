import React, { useState } from 'react';
import { Plus, Scissors, AlertTriangle, Check, Trash2, Timer, Filter, Search } from 'lucide-react';
import { GarmentStyle, LineBalancingMetrics, Operation, SectionType } from '../types';
import { MACHINE_TYPES } from '../ladders';
import { useHaptics } from '../hooks/useHaptics';

interface OperationsTabProps {
  style: GarmentStyle;
  metrics: LineBalancingMetrics;
  onUpdateOperations: (operations: Operation[]) => void;
  onOpenTimeStudy: (operationId: string) => void;
}

export const OperationsTab: React.FC<OperationsTabProps> = ({
  style,
  metrics,
  onUpdateOperations,
  onOpenTimeStudy,
}) => {
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const { trigger } = useHaptics();

  // Add Operation Form State
  const [newOpName, setNewOpName] = useState('');
  const [newOpSection, setNewOpSection] = useState<SectionType>('assembly');
  const [newOpMachine, setNewOpMachine] = useState('SNLS');
  const [newOpSMV, setNewOpSMV] = useState('0.85');
  const [newOpAssigned, setNewOpAssigned] = useState('1');

  const filteredOperations = style.operations.filter((op) => {
    const matchesSection = sectionFilter === 'all' || op.section === sectionFilter;
    const matchesSearch = op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          op.machineCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const handleOperatorChange = (opId: string, delta: number) => {
    trigger('tap');
    const updated = style.operations.map((op) => {
      if (op.id === opId) {
        const newAssigned = Math.max(1, op.operatorAssigned + delta);
        const capacity = Math.round((60 / Math.max(0.01, op.smv)) * newAssigned * (style.targetEfficiencyPct / 100));
        const stationSMV = op.smv / newAssigned;
        return {
          ...op,
          operatorAssigned: newAssigned,
          targetCapacityPerHour: capacity,
          isBottleneck: stationSMV > metrics.pitchTimeMinutes * 1.15,
        };
      }
      return op;
    });
    onUpdateOperations(updated);
  };

  const handleSMVChange = (opId: string, newSMVVal: number) => {
    const validSMV = Math.max(0.05, Number(newSMVVal) || 0.1);
    const updated = style.operations.map((op) => {
      if (op.id === opId) {
        const capacity = Math.round((60 / validSMV) * op.operatorAssigned * (style.targetEfficiencyPct / 100));
        const stationSMV = validSMV / op.operatorAssigned;
        return {
          ...op,
          smv: Number(validSMV.toFixed(2)),
          targetCapacityPerHour: capacity,
          isBottleneck: stationSMV > metrics.pitchTimeMinutes * 1.15,
        };
      }
      return op;
    });
    onUpdateOperations(updated);
  };

  const handleDeleteOperation = (opId: string) => {
    trigger('warning');
    const updated = style.operations
      .filter((op) => op.id !== opId)
      .map((op, idx) => ({ ...op, seq: idx + 1 }));
    onUpdateOperations(updated);
  };

  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;

    trigger('success');
    const machine = MACHINE_TYPES.find((m) => m.code === newOpMachine) || MACHINE_TYPES[0];
    const smvNum = Math.max(0.05, parseFloat(newOpSMV) || 0.85);
    const assignedNum = Math.max(1, parseInt(newOpAssigned, 10) || 1);
    const capacity = Math.round((60 / smvNum) * assignedNum * (style.targetEfficiencyPct / 100));

    const newOp: Operation = {
      id: `op-${Date.now()}`,
      seq: style.operations.length + 1,
      name: newOpName.trim(),
      section: newOpSection,
      machineCode: machine.code,
      machineName: machine.name,
      smv: Number(smvNum.toFixed(2)),
      operatorAssigned: assignedNum,
      theoreticalOperators: Number(((smvNum / Math.max(0.1, metrics.pitchTimeMinutes))).toFixed(2)),
      targetCapacityPerHour: capacity,
      isBottleneck: (smvNum / assignedNum) > metrics.pitchTimeMinutes * 1.15,
    };

    onUpdateOperations([...style.operations, newOp]);
    setNewOpName('');
    setShowAddForm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      
      {/* Header Stat Pill */}
      <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-blue-400" />
            <span>Operation Bulletin (IE Breakdown)</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            {style.operations.length} Operations &bull; Total SMV: {metrics.totalSMV.toFixed(2)} min
          </p>
        </div>

        <button
          onClick={() => {
            trigger('tap');
            setShowAddForm(!showAddForm);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Op</span>
        </button>
      </div>

      {/* Add Operation Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateOperation}
          className="bg-slate-900 rounded-2xl p-4 border border-blue-500/50 space-y-3 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400">Add New Sewing Operation</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Operation Description</label>
              <input
                type="text"
                placeholder="e.g., Placket Box Stitch"
                value={newOpName}
                onChange={(e) => setNewOpName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Section</label>
                <select
                  value={newOpSection}
                  onChange={(e) => setNewOpSection(e.target.value as SectionType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  <option value="prep">Preparation</option>
                  <option value="assembly">Assembly</option>
                  <option value="finishing">Finishing</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Machine Type</label>
                <select
                  value={newOpMachine}
                  onChange={(e) => setNewOpMachine(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                >
                  {MACHINE_TYPES.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target SMV (minutes)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newOpSMV}
                  onChange={(e) => setNewOpSMV(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Assigned Operators</label>
                <input
                  type="number"
                  min="1"
                  value={newOpAssigned}
                  onChange={(e) => setNewOpAssigned(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-98 transition"
          >
            Insert into Operation Bulletin
          </button>
        </form>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search operations or machines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Operations' },
            { id: 'prep', label: 'Prep' },
            { id: 'assembly', label: 'Assembly' },
            { id: 'finishing', label: 'Finishing' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                trigger('tap');
                setSectionFilter(sec.id);
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition text-[11px] font-medium ${
                sectionFilter === sec.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operation Cards List */}
      <div className="space-y-2">
        {filteredOperations.map((op) => {
          const stationCycle = op.smv / op.operatorAssigned;
          const isBottleneck = stationCycle > metrics.pitchTimeMinutes * 1.15;

          return (
            <div
              key={op.id}
              className={`p-3 rounded-2xl border transition-all ${
                isBottleneck
                  ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-600/50 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                
                {/* Seq & Title */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {op.seq}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-200 truncate">{op.name}</span>
                      {isBottleneck && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>BOTTLENECK</span>
                        </span>
                      )}
                    </div>

                    {/* Machine Badge & Details */}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                        {op.machineCode}
                      </span>
                      <span>Cap: {op.targetCapacityPerHour} pcs/hr</span>
                      <span className="text-slate-500">
                        Station: {stationCycle.toFixed(2)}m (Pitch: {metrics.pitchTimeMinutes.toFixed(2)}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operator Allocation Stepper */}
                <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => handleOperatorChange(op.id, -1)}
                    disabled={op.operatorAssigned <= 1}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 flex items-center justify-center font-bold text-xs"
                    title="Decrease assigned operators"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono text-blue-400">
                    {op.operatorAssigned}
                  </span>
                  <button
                    onClick={() => handleOperatorChange(op.id, 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs"
                    title="Increase assigned operators"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom Quick Controls (Inline SMV Input, Time Study trigger, Delete) */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">SMV:</span>
                  <input
                    type="number"
                    step="0.05"
                    value={op.smv}
                    onChange={(e) => handleSMVChange(op.id, parseFloat(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-100 font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500">min</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Shop Floor Time Study Button */}
                  <button
                    onClick={() => {
                      trigger('tap');
                      onOpenTimeStudy(op.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    title="Run stopwatch time study for this operation"
                  >
                    <Timer className="w-3 h-3" />
                    <span>Time Study</span>
                  </button>

                  {/* Delete Op */}
                  <button
                    onClick={() => handleDeleteOperation(op.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Remove operation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
