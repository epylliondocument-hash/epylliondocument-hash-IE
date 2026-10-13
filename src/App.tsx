import React, { useState, useEffect } from 'react';
import { GarmentStyle, ViewTab, AndroidDeviceMode, Operation } from './types';
import { PRESET_GARMENT_STYLES, LADDER_PRESETS } from './ladders';
import { calculateLineMetrics } from './engine';
import { AndroidFrame } from './components/AndroidFrame';
import { AndroidTopBar } from './components/AndroidTopBar';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { LadderPlanTab } from './components/LadderPlanTab';
import { OperationsTab } from './components/OperationsTab';
import { LineBalanceTab } from './components/LineBalanceTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { TaktStopwatchModal } from './components/TaktStopwatchModal';
import { PWAInstallDialog } from './components/PWAInstallDialog';
import { PublishFreeModal } from './components/PublishFreeModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [currentStyle, setCurrentStyle] = useState<GarmentStyle>(() => {
    // Try restoring saved draft if any
    try {
      const saved = localStorage.getItem('smv_ladder_style');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return PRESET_GARMENT_STYLES[0];
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('ladder');
  const [deviceMode, setDeviceMode] = useState<AndroidDeviceMode>('pixel');
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [stopwatchTargetOpId, setStopwatchTargetOpId] = useState<string | undefined>(undefined);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const { isInstallable } = usePWAInstall();

  // Save current style to local storage
  useEffect(() => {
    try {
      localStorage.setItem('smv_ladder_style', JSON.stringify(currentStyle));
    } catch {
      // Ignore
    }
  }, [currentStyle]);

  // If on actual mobile device screen, auto switch to full screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setDeviceMode('fullscreen');
    }
  }, []);

  const metrics = calculateLineMetrics(currentStyle);

  const handleUpdateOperations = (newOps: Operation[]) => {
    setCurrentStyle((prev) => ({
      ...prev,
      operations: newOps,
    }));
  };

  const handleUpdateEfficiencies = (efficiencies: number[], presetId: string) => {
    setCurrentStyle((prev) => ({
      ...prev,
      activeLadderPresetId: presetId,
      customLadderEfficiencies: efficiencies,
    }));
  };

  const handleOpenTimeStudy = (opId?: string) => {
    setStopwatchTargetOpId(opId || currentStyle.operations[0]?.id);
    setIsStopwatchOpen(true);
  };

  const handleApplyStopwatchSMV = (opId: string, measuredSMV: number) => {
    setCurrentStyle((prev) => {
      const updatedOps = prev.operations.map((op) => {
        if (op.id === opId) {
          const cap = Math.round((60 / measuredSMV) * op.operatorAssigned * (prev.targetEfficiencyPct / 100));
          return {
            ...op,
            smv: measuredSMV,
            targetCapacityPerHour: cap,
          };
        }
        return op;
      });
      return {
        ...prev,
        operations: updatedOps,
      };
    });
  };

  return (
    <AndroidFrame
      deviceMode={deviceMode}
      onDeviceModeChange={setDeviceMode}
    >
      <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
        {/* Android Material 3 Top App Bar */}
        <AndroidTopBar
          currentStyle={currentStyle}
          onSelectStyle={setCurrentStyle}
          onOpenStopwatch={() => handleOpenTimeStudy()}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
          isInstallable={isInstallable}
        />

        {/* Tab View Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'ladder' && (
            <LadderPlanTab
              style={currentStyle}
              metrics={metrics}
              onUpdateEfficiencies={handleUpdateEfficiencies}
            />
          )}

          {activeTab === 'operations' && (
            <OperationsTab
              style={currentStyle}
              metrics={metrics}
              onUpdateOperations={handleUpdateOperations}
              onOpenTimeStudy={handleOpenTimeStudy}
            />
          )}

          {activeTab === 'balance' && (
            <LineBalanceTab
              style={currentStyle}
              metrics={metrics}
              onUpdateStyle={setCurrentStyle}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              style={currentStyle}
              metrics={metrics}
              onUpdateStyle={setCurrentStyle}
            />
          )}
        </main>

        {/* Android Material 3 Bottom Navigation Bar */}
        <AndroidBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          bottleneckCount={metrics.bottleneckCount}
        />

        {/* Takt Time Study Modal */}
        {isStopwatchOpen && (
          <TaktStopwatchModal
            style={currentStyle}
            initialOpId={stopwatchTargetOpId}
            onClose={() => setIsStopwatchOpen(false)}
            onApplySMV={handleApplyStopwatchSMV}
          />
        )}

        {/* Android PWA Install Dialog */}
        {isInstallModalOpen && (
          <PWAInstallDialog onClose={() => setIsInstallModalOpen(false)} />
        )}

        {/* Free Publish & Share Modal */}
        {isPublishModalOpen && (
          <PublishFreeModal onClose={() => setIsPublishModalOpen(false)} />
        )}
      </div>
    </AndroidFrame>
  );
}
