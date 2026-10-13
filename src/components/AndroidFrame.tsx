import React, { useEffect, useState } from 'react';
import { Wifi, BatteryMedium, Smartphone, Tablet, Maximize2, ShieldCheck } from 'lucide-react';
import { AndroidDeviceMode } from '../types';

interface AndroidFrameProps {
  deviceMode: AndroidDeviceMode;
  onDeviceModeChange: (mode: AndroidDeviceMode) => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  deviceMode,
  onDeviceModeChange,
  children,
}) => {
  const [currentTime, setCurrentTime] = useState('10:42');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (deviceMode === 'fullscreen') {
    return (
      <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
        {/* Device Mode Switcher Floating Badge */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200">Android Native Mode</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800/60">APK Standalone</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => onDeviceModeChange('pixel')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-400 hover:text-white transition"
              title="Switch to Android Phone Frame"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone</span>
            </button>
            <button
              onClick={() => onDeviceModeChange('tablet')}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-400 hover:text-white transition"
              title="Switch to Android Tablet Frame"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => onDeviceModeChange('fullscreen')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 text-white font-medium"
              title="Full Screen View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full</span>
            </button>
          </div>
        </header>

        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col">{children}</div>
      </div>
    );
  }

  const isTablet = deviceMode === 'tablet';

  return (
    <div className="min-h-screen bg-slate-950 py-4 px-2 sm:px-6 flex flex-col items-center justify-center font-sans antialiased">
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-4xl mb-3 flex items-center justify-between text-xs px-2 text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-300">Android 15 Experience &bull; Material 3</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-lg">
          <button
            onClick={() => onDeviceModeChange('pixel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              deviceMode === 'pixel'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pixel 9</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              deviceMode === 'tablet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tab S9</span>
          </button>
          <button
            onClick={() => onDeviceModeChange('fullscreen')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fill Screen</span>
          </button>
        </div>
      </div>

      {/* Device Bezel Container */}
      <div
        className={`relative transition-all duration-300 rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border-4 border-slate-700/80 bg-slate-900 ${
          isTablet
            ? 'w-full max-w-[960px] h-[780px]'
            : 'w-full max-w-[430px] h-[880px]'
        }`}
      >
        {/* Device Glass Bezel & Screen Wrapper */}
        <div className="relative w-full h-full bg-slate-950 rounded-[34px] overflow-hidden flex flex-col border border-slate-800">
          
          {/* Android Status Bar */}
          <div className="h-10 px-6 pt-2 pb-1 bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-300 select-none z-30 shrink-0">
            <span className="font-mono tracking-tight text-[13px] text-slate-200">{currentTime}</span>

            {/* Front Camera Punch-Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full bg-black border border-slate-800/80 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-950" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-mono tracking-wider font-bold text-slate-300">5G</span>
              <Wifi className="w-3.5 h-3.5 text-slate-300" />
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Android App Screen Viewport */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}
          </div>

          {/* Android System Navigation Gesture Bar */}
          <div className="h-5 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-32 h-1 rounded-full bg-slate-600/70 hover:bg-slate-400 transition" />
          </div>
        </div>
      </div>
    </div>
  );
};
