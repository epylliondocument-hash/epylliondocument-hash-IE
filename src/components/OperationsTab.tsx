import React, { useState } from 'react';
import {
  Plus,
  Scissors,
  AlertTriangle,
  Check,
  Trash2,
  Timer,
  Search,
  Copy,
  Table as TableIcon,
  LayoutList,
  Wand2,
  Sparkles,
  ArrowUpDown,
  Sliders,
} from 'lucide-react';
import { GarmentStyle, LineBalancingMetrics, Operation, SectionType } from '../types';
import { MACHINE_TYPES } from '../ladders';
import { recalculateOperationsWithFormula } from '../engine';
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const { trigger } = useHaptics();

  // Add Operation Form State
  const [newOpName, setNewOpName] = useState('');
  const [newOpSection, setNewOpSection] = useState<SectionType>('assembly');
  const [newOpMachine, setNewOpMachine] = useState('SNLS');
  const [newOpSMV, setNewOpSMV] = useState('0.85');
  const [newOpAssigned, setNewOpAssigned] = useState('1');
  const [newOpTheor, setNewOpTheor] = useState('1.0');
  const [newOpCapacity, setNewOpCapacity] = useState('70');
  const [autoCalcCapacityOnAdd, setAutoCalcCapacityOnAdd] = useState(true);

  const filteredOperations = style.operations.filter((op) => {
    const matchesSection = sectionFilter === 'all' || op.section === sectionFilter;
    const matchesSearch =
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.machineCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  // Direct cell / field editing without formula restriction
  const handleUpdateField = <K extends keyof Operation>(opId: string, field: K, value: Operation[K]) => {
    const updated = style.operations.map((op) => {
      if (op.id === opId) {
        return {
          ...op,
          [field]: value,
        };
      }
      return op;
    });
    onUpdateOperations(updated);
  };

  // Stepper for assigned operators
  const handleOperatorStepper = (opId: string, delta: number) => {
    trigger('tap');
    const updated = style.operations.map((op) => {
      if (op.id === opId) {
        const newAssigned = Math.max(1, op.operatorAssigned + delta);
        return {
          ...op,
          operatorAssigned: newAssigned,
        };
      }
      return op;
    });
    onUpdateOperations(updated);
  };

  // Toggle bottleneck status directly
  const handleToggleBottleneck = (opId: string) => {
    trigger('tap');
    const updated = style.operations.map((op) => {
      if (op.id === opId) {
        return {
          ...op,
          isBottleneck: !op.isBottleneck,
        };
      }
      return op;
    });
    onUpdateOperations(updated);
  };

  // Delete operation
  const handleDeleteOperation = (opId: string) => {
    trigger('warning');
    const updated = style.operations
      .filter((op) => op.id !== opId)
      .map((op, idx) => ({ ...op, seq: idx + 1 }));
    onUpdateOperations(updated);
  };

  // Duplicate / Clone operation (instant new entry)
  const handleDuplicateOperation = (op: Operation) => {
    trigger('success');
    const newOp: Operation = {
      ...op,
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      seq: op.seq + 1,
      name: `${op.name} (Copy)`,
    };

    // Insert right after current operation and renumber
    const currentIndex = style.operations.findIndex((o) => o.id === op.id);
    const newOps = [...style.operations];
    newOps.splice(currentIndex + 1, 0, newOp);
    const renumbered = newOps.map((o, idx) => ({ ...o, seq: idx + 1 }));
    onUpdateOperations(renumbered);
  };

  // Quick Add Row (appends new editable row at the bottom)
  const handleQuickAddRow = () => {
    trigger('tap');
    const nextSeq = style.operations.length + 1;
    const newOp: Operation = {
      id: `op-${Date.now()}`,
      seq: nextSeq,
      name: `New Operation ${nextSeq}`,
      section: 'assembly',
      machineCode: 'SNLS',
      machineName: 'Single Needle Lockstitch',
      smv: 0.85,
      operatorAssigned: 1,
      theoreticalOperators: 1.0,
      targetCapacityPerHour: 60,
      isBottleneck: false,
    };
    onUpdateOperations([...style.operations, newOp]);
  };

  // Optional: Recalculate all operations using IE textbook formula
  const handleRecalculateFormulas = () => {
    trigger('success');
    const recalculated = recalculateOperationsWithFormula(
      style.operations,
      style.totalOperators,
      style.targetEfficiencyPct
    );
    onUpdateOperations(recalculated);
  };

  // Create new operation from drawer
  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;

    trigger('success');
    const machine = MACHINE_TYPES.find((m) => m.code === newOpMachine) || MACHINE_TYPES[0];
    const smvNum = Math.max(0.01, parseFloat(newOpSMV) || 0.85);
    const assignedNum = Math.max(1, parseInt(newOpAssigned, 10) || 1);
    
    // Capacity: either user manual input or formula calculation
    let capacity = parseInt(newOpCapacity, 10);
    if (autoCalcCapacityOnAdd || isNaN(capacity) || capacity <= 0) {
      capacity = Math.round((60 / smvNum) * assignedNum * (style.targetEfficiencyPct / 100));
    }

    const theorNum = parseFloat(newOpTheor) || Number(((smvNum / Math.max(0.1, metrics.pitchTimeMinutes))).toFixed(2));

    const newOp: Operation = {
      id: `op-${Date.now()}`,
      seq: style.operations.length + 1,
      name: newOpName.trim(),
      section: newOpSection,
      machineCode: machine.code,
      machineName: machine.name,
      smv: Number(smvNum.toFixed(2)),
      operatorAssigned: assignedNum,
      theoreticalOperators: Number(theorNum.toFixed(2)),
      targetCapacityPerHour: capacity,
      isBottleneck: (smvNum / assignedNum) > metrics.pitchTimeMinutes * 1.15,
    };

    onUpdateOperations([...style.operations, newOp]);
    setNewOpName('');
    setShowAddForm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 pb-24">
      
      {/* Header Banner & Action Bar */}
      <div className="bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Operation Bulletin</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  All Fields Editable
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {style.operations.length} Operations &bull; Total SMV: {metrics.totalSMV.toFixed(2)} min &bull; Pitch: {metrics.pitchTimeMinutes.toFixed(2)}m
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-0.5 flex items-center">
              <button
                onClick={() => {
                  trigger('tap');
                  setViewMode('table');
                }}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  trigger('tap');
                  setViewMode('cards');
                }}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Card View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Recalculate Formulas Button */}
            <button
              onClick={handleRecalculateFormulas}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 text-[11px] font-semibold transition active:scale-95"
              title="Recalculate capacities & theoretical operators using standard IE formulas"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Auto-Calc Formulas</span>
            </button>

            {/* Add Op Button */}
            <button
              onClick={() => {
                trigger('tap');
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Entry</span>
            </button>
          </div>
        </div>

        {/* Informational Subtext */}
        <div className="text-[10px] text-slate-400/90 bg-slate-950/60 rounded-xl px-2.5 py-1.5 border border-slate-800 flex items-center justify-between">
          <span>💡 Direct entry mode active: Edit SMV, Capacity, Ops &amp; descriptions directly without formula lock.</span>
          <span className="text-blue-400 font-mono hidden md:inline">{style.totalOperators} Line Operators</span>
        </div>
      </div>

      {/* Add New Operation Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateOperation}
          className="bg-slate-900 rounded-2xl p-4 border border-blue-500/60 shadow-xl space-y-3 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Operation Entry</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-semibold">
                Operation Description / Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Placket Box Stitch, Sleeve Join Overlock"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                >
                  {MACHINE_TYPES.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SMV (minutes)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newOpSMV}
                  onChange={(e) => setNewOpSMV(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Assigned Ops</label>
                <input
                  type="number"
                  min="1"
                  value={newOpAssigned}
                  onChange={(e) => setNewOpAssigned(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Theoretical Ops</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={newOpTheor}
                  onChange={(e) => setNewOpTheor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-300 font-semibold">
                  Target Capacity (pcs/hour)
                </label>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalcCapacityOnAdd}
                    onChange={(e) => setAutoCalcCapacityOnAdd(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <span>Formula calc ({style.targetEfficiencyPct}%)</span>
                </label>
              </div>
              <input
                type="number"
                min="1"
                placeholder={autoCalcCapacityOnAdd ? 'Auto-calculated' : 'Custom capacity (e.g. 85)'}
                disabled={autoCalcCapacityOnAdd}
                value={newOpCapacity}
                onChange={(e) => setNewOpCapacity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 disabled:opacity-50 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert New Operation Entry</span>
          </button>
        </form>
      )}

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search operations, machine codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs shrink-0">
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
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition text-[11px] font-medium ${
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

      {/* VIEW MODE 1: SPREADSHEET TABLE VIEW (ALL CELLS EDITABLE WITHOUT FORMULA) */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                  <th className="py-2.5 px-2 text-center w-12">Seq</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Operation Name</th>
                  <th className="py-2.5 px-2 w-28">Section</th>
                  <th className="py-2.5 px-2 w-28">Machine</th>
                  <th className="py-2.5 px-2 text-center w-20">SMV (m)</th>
                  <th className="py-2.5 px-2 text-center w-20">Ops</th>
                  <th className="py-2.5 px-2 text-center w-20">Theo.</th>
                  <th className="py-2.5 px-2 text-center w-24">Cap (pcs/h)</th>
                  <th className="py-2.5 px-2 text-center w-20">Status</th>
                  <th className="py-2.5 px-2 text-right w-24 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOperations.map((op) => {
                  const stationCycle = op.smv / Math.max(1, op.operatorAssigned);
                  const isOverPitch = stationCycle > metrics.pitchTimeMinutes * 1.15;

                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        op.isBottleneck || isOverPitch ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      {/* Seq */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={op.seq}
                          onChange={(e) =>
                            handleUpdateField(op.id, 'seq', parseInt(e.target.value, 10) || op.seq)
                          }
                          className="w-10 text-center font-mono font-bold text-slate-300 bg-slate-950 border border-slate-800 rounded-md py-1 text-[11px] focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Operation Name */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={op.name}
                          onChange={(e) => handleUpdateField(op.id, 'name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 font-medium text-xs focus:outline-none focus:border-blue-500 hover:border-slate-700"
                        />
                      </td>

                      {/* Section */}
                      <td className="py-2 px-2">
                        <select
                          value={op.section}
                          onChange={(e) =>
                            handleUpdateField(op.id, 'section', e.target.value as SectionType)
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                        >
                          <option value="prep">Prep</option>
                          <option value="assembly">Assembly</option>
                          <option value="finishing">Finishing</option>
                        </select>
                      </td>

                      {/* Machine */}
                      <td className="py-2 px-2">
                        <select
                          value={op.machineCode}
                          onChange={(e) => {
                            const found = MACHINE_TYPES.find((m) => m.code === e.target.value);
                            handleUpdateField(op.id, 'machineCode', e.target.value);
                            if (found) handleUpdateField(op.id, 'machineName', found.name);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                        >
                          {MACHINE_TYPES.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.code}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* SMV */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={op.smv}
                          onChange={(e) =>
                            handleUpdateField(op.id, 'smv', parseFloat(e.target.value) || 0.1)
                          }
                          className="w-16 text-center font-mono text-slate-100 bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Assigned Operators */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleOperatorStepper(op.id, -1)}
                            disabled={op.operatorAssigned <= 1}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-[10px] flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={op.operatorAssigned}
                            onChange={(e) =>
                              handleUpdateField(
                                op.id,
                                'operatorAssigned',
                                Math.max(1, parseInt(e.target.value, 10) || 1)
                              )
                            }
                            className="w-8 text-center font-mono font-bold text-blue-400 bg-slate-950 border border-slate-800 rounded-md py-0.5 text-xs focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleOperatorStepper(op.id, 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Theoretical Operators */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.1"
                          value={op.theoreticalOperators}
                          onChange={(e) =>
                            handleUpdateField(
                              op.id,
                              'theoreticalOperators',
                              parseFloat(e.target.value) || 0.1
                            )
                          }
                          className="w-14 text-center font-mono text-slate-400 bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Target Capacity (PCS/HR) - DIRECT MANUAL EDIT WITHOUT FORMULA */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={op.targetCapacityPerHour}
                          onChange={(e) =>
                            handleUpdateField(
                              op.id,
                              'targetCapacityPerHour',
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="w-16 text-center font-mono font-bold text-emerald-400 bg-slate-950 border border-slate-800 rounded-lg py-1 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Bottleneck Badge */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBottleneck(op.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition ${
                            op.isBottleneck || isOverPitch
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700/60'
                          }`}
                          title="Click to toggle bottleneck flag"
                        >
                          {op.isBottleneck || isOverPitch ? 'ALERT' : 'OK'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-2 text-right pr-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              trigger('tap');
                              onOpenTimeStudy(op.id);
                            }}
                            className="p-1 rounded-md text-amber-400 hover:bg-amber-500/10"
                            title="Stopwatch Time Study"
                          >
                            <Timer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateOperation(op)}
                            className="p-1 rounded-md text-blue-400 hover:bg-blue-500/10"
                            title="Duplicate Entry (New Row)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOperation(op.id)}
                            className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Delete Operation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Add Row Button in Table footer */}
          <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleQuickAddRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Quick Add Row (New Entry)</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              Total SMV: {metrics.totalSMV.toFixed(2)} min &bull; {filteredOperations.length} items
            </span>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: CARD VIEW WITH DIRECT INLINE EDITING */
        <div className="space-y-2.5">
          {filteredOperations.map((op) => {
            const stationCycle = op.smv / Math.max(1, op.operatorAssigned);
            const isBottleneck = op.isBottleneck || stationCycle > metrics.pitchTimeMinutes * 1.15;

            return (
              <div
                key={op.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isBottleneck
                    ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-600/50 shadow-sm'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Seq & Name Input */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {op.seq}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={op.name}
                      onChange={(e) => handleUpdateField(op.id, 'name', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Duplicate & Delete quick action */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDuplicateOperation(op)}
                      className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10"
                      title="Duplicate Operation"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOperation(op.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Operation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Middle Row: Machine & Section Selectors */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 shrink-0">Machine:</span>
                    <select
                      value={op.machineCode}
                      onChange={(e) => {
                        const found = MACHINE_TYPES.find((m) => m.code === e.target.value);
                        handleUpdateField(op.id, 'machineCode', e.target.value);
                        if (found) handleUpdateField(op.id, 'machineName', found.name);
                      }}
                      className="w-full bg-transparent text-slate-200 text-[11px] font-mono focus:outline-none"
                    >
                      {MACHINE_TYPES.map((m) => (
                        <option key={m.code} value={m.code} className="bg-slate-900">
                          {m.code} ({m.shortName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 shrink-0">Sec:</span>
                    <select
                      value={op.section}
                      onChange={(e) =>
                        handleUpdateField(op.id, 'section', e.target.value as SectionType)
                      }
                      className="w-full bg-transparent text-slate-200 text-[11px] focus:outline-none"
                    >
                      <option value="prep" className="bg-slate-900">Preparation</option>
                      <option value="assembly" className="bg-slate-900">Assembly</option>
                      <option value="finishing" className="bg-slate-900">Finishing</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Row: Editable SMV, Assigned Ops Stepper, Editable Capacity */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                  {/* SMV */}
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">SMV (min)</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={op.smv}
                      onChange={(e) =>
                        handleUpdateField(op.id, 'smv', parseFloat(e.target.value) || 0.1)
                      }
                      className="w-full text-center font-mono font-bold text-xs text-slate-100 bg-transparent focus:outline-none focus:text-blue-400"
                    />
                  </div>

                  {/* Assigned Operators */}
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">Assigned Ops</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => handleOperatorStepper(op.id, -1)}
                        disabled={op.operatorAssigned <= 1}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold text-[10px] flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs text-blue-400 px-1">
                        {op.operatorAssigned}
                      </span>
                      <button
                        onClick={() => handleOperatorStepper(op.id, 1)}
                        className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Target Capacity per hour (Direct editable without formula) */}
                  <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                    <span className="text-[9px] text-slate-400">Cap (pcs/h)</span>
                    <input
                      type="number"
                      min="1"
                      value={op.targetCapacityPerHour}
                      onChange={(e) =>
                        handleUpdateField(
                          op.id,
                          'targetCapacityPerHour',
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className="w-full text-center font-mono font-bold text-xs text-emerald-400 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Floor Stopwatch & Bottleneck Status Bar */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">
                    Station: {stationCycle.toFixed(2)}m (Pitch: {metrics.pitchTimeMinutes.toFixed(2)}m)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBottleneck(op.id)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${
                        isBottleneck
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isBottleneck ? 'Bottleneck' : 'Station OK'}
                    </button>

                    <button
                      onClick={() => {
                        trigger('tap');
                        onOpenTimeStudy(op.id);
                      }}
                      className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <Timer className="w-3 h-3" />
                      <span>Time Study</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {/* Quick Add Row in Card View */}
          <button
            onClick={handleQuickAddRow}
            className="w-full py-2.5 rounded-2xl bg-slate-900 border border-dashed border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>+ Quick Add Row (New Entry)</span>
          </button>
        </div>
      )}

    </div>
  );
};
