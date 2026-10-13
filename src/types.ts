export type SectionType = 'prep' | 'assembly' | 'finishing';

export interface MachineTypeInfo {
  code: string;
  name: string;
  shortName: string;
  icon: string;
  category: 'sewing' | 'special' | 'pressing' | 'manual';
}

export interface Operation {
  id: string;
  seq: number;
  name: string;
  section: SectionType;
  machineCode: string;
  machineName: string;
  smv: number; // Standard Minute Value
  operatorAssigned: number;
  theoreticalOperators: number;
  targetCapacityPerHour: number;
  isBottleneck: boolean;
  notes?: string;
}

export interface LadderCurvePreset {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  dailyEfficiencies: number[]; // e.g. [35, 50, 65, 75, 85, 90, 90]
  recommendedFor: string;
}

export interface CustomLadderDay {
  dayNumber: number;
  dayLabel: string;
  efficiencyPct: number;
  customTargetPcs?: number; // Manual override without formula
  customHourlyBreakdown?: number[];
}

export interface LadderDayPlan {
  dayNumber: number;
  dayLabel: string;
  efficiencyPct: number;
  targetDailyPcs: number;
  cumulativeTargetPcs: number;
  remainingOrderPcs: number;
  hourlyBreakdown: number[]; // 8 or 10 hours
  targetHourlyAverage: number;
  isManualTarget?: boolean; // Flag if manually set without formula
}

export interface LineBalancingMetrics {
  totalSMV: number;
  totalOperators: number;
  totalHelpers: number;
  workingHours: number;
  pitchTimeMinutes: number; // totalSMV / totalOperators
  maxStationSMV: number;
  lineBalanceEfficiencyPct: number; // totalSMV / (maxStationSMV * stations) * 100
  targetEfficiencyPct: number;
  targetPiecesPerHour: number;
  targetPiecesPerDay: number;
  cycleTimeSeconds: number;
  bottleneckCount: number;
  bottleneckOperations: string[];
  estimatedDaysToComplete: number;
  laborCostPerGarment: number;
}

export interface GarmentStyle {
  id: string;
  styleName: string;
  styleCode: string;
  buyer: string;
  category: string;
  orderQuantity: number;
  targetEfficiencyPct: number;
  workingHours: number;
  totalOperators: number;
  totalHelpers: number;
  hourlyLaborRate: number; // in USD or local currency
  activeLadderPresetId: string;
  customLadderEfficiencies: number[];
  customLadderDays?: CustomLadderDay[];
  operations: Operation[];
  isUserCreated?: boolean;
}

export type ViewTab = 'ladder' | 'operations' | 'balance' | 'analytics';

export type AndroidDeviceMode = 'pixel' | 'fullscreen' | 'tablet';
