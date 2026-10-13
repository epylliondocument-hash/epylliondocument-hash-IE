import { CustomLadderDay, GarmentStyle, LadderDayPlan, LineBalancingMetrics, Operation } from './types';

/**
 * Standard industrial engineering human shift production weight distribution.
 * Factors in bundle feed warmup, mid-morning peak, pre-lunch slowdown, and afternoon peak.
 */
const HOURLY_SHIFT_WEIGHTS_8HR = [0.88, 1.05, 1.08, 0.96, 0.92, 1.06, 1.04, 0.91];

/**
 * Calculates industrial engineering line balancing metrics, pitch times, and bottlenecks.
 */
export function calculateLineMetrics(style: GarmentStyle): LineBalancingMetrics {
  const totalSMV = Number(
    style.operations.reduce((sum, op) => sum + (Number(op.smv) || 0), 0).toFixed(2)
  );

  const totalOps = Math.max(1, style.totalOperators);
  const workingHours = Math.max(1, style.workingHours);
  const targetEff = Math.max(10, Math.min(100, style.targetEfficiencyPct));

  // Pitch Time = Total Garment SMV / Total Assigned Operators
  const pitchTimeMinutes = Number((totalOps > 0 ? totalSMV / totalOps : 0).toFixed(2));

  // Target output per hour = (Operators * 60 * (Efficiency / 100)) / Total SMV
  const targetPiecesPerHour = totalSMV > 0
    ? Math.round((totalOps * 60 * (targetEff / 100)) / totalSMV)
    : 0;

  const targetPiecesPerDay = targetPiecesPerHour * workingHours;

  // Station cycle times: SMV divided by assigned operators for each operation
  let maxStationSMV = 0;
  const bottlenecks: string[] = [];

  style.operations.forEach((op) => {
    const assigned = Math.max(1, op.operatorAssigned);
    const stationSMV = op.smv / assigned;
    if (stationSMV > maxStationSMV) {
      maxStationSMV = stationSMV;
    }

    // Flag as bottleneck if station SMV is more than 12% above pitch time
    // or if its capacity per hour is below target pieces per hour
    const capacityPerHour = op.targetCapacityPerHour > 0
      ? op.targetCapacityPerHour
      : Math.round((60 / Math.max(0.01, op.smv)) * assigned * (targetEff / 100));
    const isBottleneck = stationSMV > pitchTimeMinutes * 1.12 || (capacityPerHour < targetPiecesPerHour * 0.95);
    
    if (isBottleneck) {
      bottlenecks.push(op.name);
    }
  });

  // Balance Efficiency = (Total SMV) / (Max Station SMV * Total Stations) * 100
  const lineBalanceEfficiencyPct = maxStationSMV > 0 && totalOps > 0
    ? Math.min(100, Number(((totalSMV / (maxStationSMV * totalOps)) * 100).toFixed(1)))
    : 75.0;

  const cycleTimeSeconds = targetPiecesPerHour > 0
    ? Math.round((3600 / targetPiecesPerHour))
    : 0;

  // Estimated days to complete order at steady state target
  const estimatedDaysToComplete = targetPiecesPerDay > 0
    ? Number((style.orderQuantity / targetPiecesPerDay).toFixed(1))
    : 0;

  // Direct labor cost per garment = (Operators * Hourly Rate * Working Hours) / Target Pieces Per Day
  const totalDailyLaborCost = (totalOps + style.totalHelpers * 0.75) * style.hourlyLaborRate * workingHours;
  const laborCostPerGarment = targetPiecesPerDay > 0
    ? Number((totalDailyLaborCost / targetPiecesPerDay).toFixed(2))
    : 0;

  return {
    totalSMV,
    totalOperators: totalOps,
    totalHelpers: style.totalHelpers,
    workingHours,
    pitchTimeMinutes,
    maxStationSMV: Number(maxStationSMV.toFixed(2)),
    lineBalanceEfficiencyPct,
    targetEfficiencyPct: targetEff,
    targetPiecesPerHour,
    targetPiecesPerDay,
    cycleTimeSeconds,
    bottleneckCount: bottlenecks.length,
    bottleneckOperations: bottlenecks,
    estimatedDaysToComplete,
    laborCostPerGarment,
  };
}

/**
 * Calculates day-by-day Ramp-Up Learning Curve Ladder targets and hourly outputs.
 * Allows user-defined manual targets WITHOUT formula, or falls back to IE ramp formula.
 */
export function calculateLadderPlan(
  style: GarmentStyle,
  efficiencies: number[],
  customDays?: CustomLadderDay[]
): LadderDayPlan[] {
  const totalSMV = style.operations.reduce((sum, op) => sum + (Number(op.smv) || 0), 0);
  const totalOps = Math.max(1, style.totalOperators);
  const workingHours = Math.max(1, style.workingHours);

  // Use customDays if passed, or from style, or build from efficiencies
  const daysList: CustomLadderDay[] = (customDays && customDays.length > 0)
    ? customDays
    : (style.customLadderDays && style.customLadderDays.length > 0)
    ? style.customLadderDays
    : efficiencies.map((eff, index) => ({
        dayNumber: index + 1,
        dayLabel: `Day ${index + 1}`,
        efficiencyPct: eff,
      }));

  const plans: LadderDayPlan[] = [];
  let runningCumulative = 0;

  daysList.forEach((day, index) => {
    const dayNumber = day.dayNumber || index + 1;
    const dayLabel = day.dayLabel || `Day ${dayNumber}`;
    const eff = day.efficiencyPct ?? (efficiencies[index] ?? 50);
    const effRatio = eff / 100;

    let targetDailyPcs: number;
    let isManualTarget = false;

    // WITHOUT FORMULA: If user explicitly entered customTargetPcs, use it directly!
    if (typeof day.customTargetPcs === 'number' && !isNaN(day.customTargetPcs) && day.customTargetPcs >= 0) {
      targetDailyPcs = Math.round(day.customTargetPcs);
      isManualTarget = true;
    } else {
      // IE Formula: (Hours * 60 * Operators * Efficiency) / Total SMV
      const rawTarget = totalSMV > 0
        ? (workingHours * 60 * totalOps * effRatio) / totalSMV
        : 0;
      targetDailyPcs = Math.round(rawTarget);
    }

    runningCumulative += targetDailyPcs;
    const remainingOrderPcs = Math.max(0, style.orderQuantity - runningCumulative);
    const hourlyAverage = workingHours > 0 ? targetDailyPcs / workingHours : 0;

    // Distribute across shift hours using IE ergonomic curve
    const hourlyBreakdown: number[] = [];
    let sumAssigned = 0;

    for (let h = 0; h < workingHours; h++) {
      const weightIndex = h % HOURLY_SHIFT_WEIGHTS_8HR.length;
      const weight = HOURLY_SHIFT_WEIGHTS_8HR[weightIndex];
      const hourTarget = Math.round(hourlyAverage * weight);
      hourlyBreakdown.push(hourTarget);
      sumAssigned += hourTarget;
    }

    // Adjust slight rounding diff on last hour
    const diff = targetDailyPcs - sumAssigned;
    if (hourlyBreakdown.length > 0) {
      hourlyBreakdown[hourlyBreakdown.length - 1] = Math.max(0, hourlyBreakdown[hourlyBreakdown.length - 1] + diff);
    }

    plans.push({
      dayNumber,
      dayLabel,
      efficiencyPct: eff,
      targetDailyPcs,
      cumulativeTargetPcs: runningCumulative,
      remainingOrderPcs,
      hourlyBreakdown,
      targetHourlyAverage: Math.round(hourlyAverage),
      isManualTarget,
    });
  });

  return plans;
}

/**
 * Formula utility: Recalculates all operation capacities and theoretical operators
 * from textbook IE formulas when user explicitly chooses to auto-calculate.
 */
export function recalculateOperationsWithFormula(
  operations: Operation[],
  totalOperators: number,
  targetEfficiencyPct: number
): Operation[] {
  const totalSMV = operations.reduce((sum, op) => sum + (Number(op.smv) || 0), 0);
  const pitchTimeMinutes = totalSMV > 0 && totalOperators > 0 ? totalSMV / totalOperators : 1.0;
  const effRatio = targetEfficiencyPct / 100;

  return operations.map((op) => {
    const smv = Math.max(0.01, op.smv);
    const assigned = Math.max(1, op.operatorAssigned);
    const theoretical = Number(((smv / pitchTimeMinutes)).toFixed(2));
    const capacity = Math.round((60 / smv) * assigned * effRatio);
    const stationCycle = smv / assigned;
    const isBottleneck = stationCycle > pitchTimeMinutes * 1.15;

    return {
      ...op,
      theoreticalOperators: theoretical,
      targetCapacityPerHour: capacity,
      isBottleneck,
    };
  });
}

/**
 * Auto-balances line operator assignment to maximize Line Balancing Efficiency (LBE)
 * and eliminate bottleneck workstations.
 */
export function autoBalanceLine(style: GarmentStyle): GarmentStyle {
  const totalSMV = style.operations.reduce((s, op) => s + (Number(op.smv) || 0), 0);
  if (totalSMV <= 0) return style;

  const targetOps = style.totalOperators;
  const updatedOperations: Operation[] = style.operations.map((op) => {
    // Theoretical operator = op.smv / pitchTime = (op.smv * targetOps) / totalSMV
    const theoretical = (op.smv * targetOps) / totalSMV;
    // Initial assigned: round to nearest integer, minimum 1
    const initialAssigned = Math.max(1, Math.round(theoretical));
    return {
      ...op,
      theoreticalOperators: Number(theoretical.toFixed(2)),
      operatorAssigned: initialAssigned,
    };
  });

  // Adjust total assigned to match style.totalOperators
  let assignedSum = updatedOperations.reduce((s, o) => s + o.operatorAssigned, 0);
  
  while (assignedSum < targetOps) {
    // Find operation with highest station cycle time (highest smv / assigned)
    let highestIdx = 0;
    let highestCycle = 0;
    updatedOperations.forEach((op, idx) => {
      const cycle = op.smv / op.operatorAssigned;
      if (cycle > highestCycle) {
        highestCycle = cycle;
        highestIdx = idx;
      }
    });
    updatedOperations[highestIdx].operatorAssigned += 1;
    assignedSum += 1;
  }

  while (assignedSum > targetOps) {
    // Find operation with lowest station cycle time where assigned > 1
    let lowestIdx = -1;
    let lowestCycle = Infinity;
    updatedOperations.forEach((op, idx) => {
      if (op.operatorAssigned > 1) {
        const cycle = op.smv / op.operatorAssigned;
        if (cycle < lowestCycle) {
          lowestCycle = cycle;
          lowestIdx = idx;
        }
      }
    });
    if (lowestIdx >= 0) {
      updatedOperations[lowestIdx].operatorAssigned -= 1;
      assignedSum -= 1;
    } else {
      break;
    }
  }

  // Recalculate capacity & bottlenecks
  const pitch = totalSMV / targetOps;
  const effRatio = style.targetEfficiencyPct / 100;

  const finalOps = updatedOperations.map((op) => {
    const stationSMV = op.smv / op.operatorAssigned;
    const capacity = Math.round((60 / Math.max(0.01, op.smv)) * op.operatorAssigned * effRatio);
    return {
      ...op,
      targetCapacityPerHour: capacity,
      isBottleneck: stationSMV > pitch * 1.15,
    };
  });

  return {
    ...style,
    operations: finalOps,
  };
}

/**
 * Stopwatch Takt / SMV Study Calculator.
 * Basic Time = Average Observed Time * (Rating Factor / 100)
 * Standard Allowed Minutes (SAM / SMV) = Basic Time * (1 + Allowance / 100) / 60
 */
export function calculateSMVStudy(
  lapsInSeconds: number[],
  ratingFactorPct: number = 100,
  allowancePct: number = 12
): {
  averageObservedSec: number;
  basicTimeSec: number;
  allowanceSec: number;
  standardSMV: number;
} {
  if (lapsInSeconds.length === 0) {
    return { averageObservedSec: 0, basicTimeSec: 0, allowanceSec: 0, standardSMV: 0 };
  }

  const sumSec = lapsInSeconds.reduce((a, b) => a + b, 0);
  const avgSec = sumSec / lapsInSeconds.length;
  const basicTimeSec = avgSec * (ratingFactorPct / 100);
  const allowanceSec = basicTimeSec * (allowancePct / 100);
  const standardTimeSec = basicTimeSec + allowanceSec;
  const standardSMV = Number((standardTimeSec / 60).toFixed(2));

  return {
    averageObservedSec: Number(avgSec.toFixed(2)),
    basicTimeSec: Number(basicTimeSec.toFixed(2)),
    allowanceSec: Number(allowanceSec.toFixed(2)),
    standardSMV,
  };
}
