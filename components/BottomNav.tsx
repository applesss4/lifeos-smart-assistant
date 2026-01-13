
import React, { memo } from 'react';
import { ViewType } from '../types';
import { preloadView } from '../src/utils/preload';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BottomNav: React.FC<BottomNavProps> = memo(({ activeView, onViewChange }) => {
  const navItems = [
    { type: ViewType.HOME, icon: 'home', label: '首页' },
    { type: ViewType.ATTENDANCE, icon: 'schedule', label: '打卡' },
    { type: ViewType.TASKS, icon: 'checklist', label: '待办' },
    { type: ViewType.FINANCE, icon: 'receipt_long', label: '账单' },
  ];

  // 需求 2.5: 在导航按钮上添加 hover 预加载
  const handleMouseEnter = (viewType: ViewType) => {
    if (viewType !== activeView) {
      preloadView(viewType);
    }
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white/90 dark:bg-background-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 pb-safe pt-2 z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onViewChange(item.type)}
            onMouseEnter={() => handleMouseEnter(item.type)}
            onTouchStart={() => handleMouseEnter(item.type)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
              activeView === item.type ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span 
              className={`material-symbols-outlined ${activeView === item.type ? 'filled' : ''}`}
              style={{ fontVariationSettings: activeView === item.type ? "'FILL' 1" : "" }}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
