import React, { useState, useEffect } from 'react';
import { GarmentStyle, ViewTab, AndroidDeviceMode, Operation, CustomLadderDay } from './types';
import { PRESET_GARMENT_STYLES } from './ladders';
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
import { NewStyleModal } from './components/NewStyleModal';
import { EditStyleModal } from './components/EditStyleModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  // Styles list management with local storage persistence
  const [allStyles, setAllStyles] = useState<GarmentStyle[]>(() => {
    try {
      const savedStyles = localStorage.getItem('smv_ladder_all_styles');
      if (savedStyles) {
        const parsed = JSON.parse(savedStyles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return PRESET_GARMENT_STYLES;
  });

  const [currentStyle, setCurrentStyle] = useState<GarmentStyle>(() => {
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
  const [isNewStyleModalOpen, setIsNewStyleModalOpen] = useState(false);
  const [isEditStyleModalOpen, setIsEditStyleModalOpen] = useState(false);

  const { isInstallable } = usePWAInstall();

  // Save current style and all styles to local storage
  useEffect(() => {
    try {
      localStorage.setItem('smv_ladder_style', JSON.stringify(currentStyle));
      localStorage.setItem('smv_ladder_all_styles', JSON.stringify(allStyles));
    } catch {
      // Ignore
    }
  }, [currentStyle, allStyles]);

  // If on actual mobile device screen, auto switch to full screen
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setDeviceMode('fullscreen');
    }
  }, []);

  const metrics = calculateLineMetrics(currentStyle);

  const handleUpdateCurrentStyle = (updated: GarmentStyle) => {
    setCurrentStyle(updated);
    setAllStyles((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleUpdateOperations = (newOps: Operation[]) => {
    handleUpdateCurrentStyle({
      ...currentStyle,
      operations: newOps,
    });
  };

  const handleUpdateLadder = (days: CustomLadderDay[], efficiencies: number[], presetId: string) => {
    handleUpdateCurrentStyle({
      ...currentStyle,
      activeLadderPresetId: presetId,
      customLadderEfficiencies: efficiencies,
      customLadderDays: days,
    });
  };

  const handleCreateNewStyle = (newStyle: GarmentStyle) => {
    setAllStyles((prev) => [newStyle, ...prev]);
    setCurrentStyle(newStyle);
  };

  const handleDeleteStyle = (styleId: string) => {
    const remaining = allStyles.filter((s) => s.id !== styleId);
    const fallback = remaining.length > 0 ? remaining[0] : PRESET_GARMENT_STYLES[0];
    setAllStyles(remaining.length > 0 ? remaining : PRESET_GARMENT_STYLES);
    setCurrentStyle(fallback);
  };

  const handleOpenTimeStudy = (opId?: string) => {
    setStopwatchTargetOpId(opId || currentStyle.operations[0]?.id);
    setIsStopwatchOpen(true);
  };

  const handleApplyStopwatchSMV = (opId: string, measuredSMV: number) => {
    const updatedOps = currentStyle.operations.map((op) => {
      if (op.id === opId) {
        return {
          ...op,
          smv: measuredSMV,
        };
      }
      return op;
    });
    handleUpdateOperations(updatedOps);
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
          allStyles={allStyles}
          onSelectStyle={(s) => setCurrentStyle(s)}
          onOpenNewStyleModal={() => setIsNewStyleModalOpen(true)}
          onOpenEditStyleModal={() => setIsEditStyleModalOpen(true)}
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
              onUpdateLadder={handleUpdateLadder}
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
              onUpdateStyle={handleUpdateCurrentStyle}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              style={currentStyle}
              metrics={metrics}
              onUpdateStyle={handleUpdateCurrentStyle}
            />
          )}
        </main>

        {/* Android Material 3 Bottom Navigation Bar */}
        <AndroidBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          bottleneckCount={metrics.bottleneckCount}
        />

        {/* Create New Garment Style Entry Modal */}
        {isNewStyleModalOpen && (
          <NewStyleModal
            currentStyle={currentStyle}
            onClose={() => setIsNewStyleModalOpen(false)}
            onCreateStyle={handleCreateNewStyle}
          />
        )}

        {/* Edit Style Info & Parameters Modal */}
        {isEditStyleModalOpen && (
          <EditStyleModal
            style={currentStyle}
            onClose={() => setIsEditStyleModalOpen(false)}
            onSaveStyle={handleUpdateCurrentStyle}
            onDeleteStyle={handleDeleteStyle}
          />
        )}

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
