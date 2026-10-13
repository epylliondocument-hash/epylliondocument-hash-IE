import React from 'react';
import { TrendingUp, ListTodo, GitCommit, FileText, AlertTriangle } from 'lucide-react';
import { ViewTab } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidBottomNavProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  bottleneckCount: number;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
  bottleneckCount,
}) => {
  const { trigger } = useHaptics();

  const navItems = [
    {
      id: 'ladder' as ViewTab,
      label: 'Ladder Ramp',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'operations' as ViewTab,
      label: 'Operations',
      icon: ListTodo,
      badge: null,
    },
    {
      id: 'balance' as ViewTab,
      label: 'Line Balance',
      icon: GitCommit,
      badge: bottleneckCount > 0 ? bottleneckCount : null,
    },
    {
      id: 'analytics' as ViewTab,
      label: 'Report & PDF',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-3 py-2 z-30 shrink-0">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                trigger('tap');
                onTabChange(item.id);
              }}
              className="flex flex-col items-center relative py-1 px-3 group transition"
            >
              {/* MD3 Active Indicator Pill */}
              <div
                className={`relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/25 text-blue-400 font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400 stroke-[2.4]' : 'stroke-[1.8]'}`} />

                {/* Badge for Bottlenecks */}
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Tab Label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition ${
                  isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
