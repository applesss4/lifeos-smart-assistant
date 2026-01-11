
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType } from './types';
import BottomNav from './components/BottomNav';
import Home from './views/Home';
import Attendance from './views/Attendance';
import Tasks from './views/Tasks';
import Finance from './views/Finance';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>(ViewType.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const notify = useCallback((message: string) => {
    setNotification({ message, visible: true });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderView = () => {
    switch (activeView) {
      case ViewType.HOME:
        return <Home onNavigate={setActiveView} onNotify={notify} />;
      case ViewType.ATTENDANCE:
        return <Attendance onNotify={notify} />;
      case ViewType.TASKS:
        return <Tasks onNotify={notify} />;
      case ViewType.FINANCE:
        return <Finance />;
      default:
        return <Home onNavigate={setActiveView} onNotify={notify} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background-light dark:bg-background-dark relative">
      {/* Real-time Notification Overlay */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 transform ${notification.visible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'
          }`}
      >
        <div className="bg-surface-dark/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
          <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      </div>

      <div className="flex-1 pb-32 overflow-x-hidden no-scrollbar">
        {renderView()}
      </div>
      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
};

export default App;
