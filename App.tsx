
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { ViewType } from './types';
import BottomNav from './components/BottomNav';
import Signup from './views/Signup';
import Login from './views/Login';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoadingStateProvider } from './src/contexts/LoadingStateContext';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import { isProtectedRoute, defaultRouteGuardConfig } from './src/config/routeGuardConfig';
import { useSessionExpiryRedirect } from './src/hooks/useSessionExpiry';
import { useToast } from './src/hooks/useToast';
import { ToastContainer } from './src/components/ToastContainer';
import { FullPageLoading } from './src/components/UIFeedback';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { ErrorMonitor } from './src/components/ErrorMonitor';
import { createLazyComponent, LoadingFallback } from './src/utils/lazyLoad';
import { predictivePreload } from './src/utils/preload';
import HomeSkeleton from './src/components/HomeSkeleton';
import AttendanceSkeleton from './src/components/AttendanceSkeleton';
import TasksSkeleton from './src/components/TasksSkeleton';
import FinanceSkeleton from './src/components/FinanceSkeleton';

// 懒加载视图组件 - 需求 2.3: 使用懒加载技术按需加载视图组件
const Home = createLazyComponent(() => import('./views/Home'), '加载首页...', <HomeSkeleton />);
const Attendance = createLazyComponent(() => import('./views/Attendance'), '加载打卡...', <AttendanceSkeleton />);
const Tasks = createLazyComponent(() => import('./views/Tasks'), '加载任务...', <TasksSkeleton />);
const Finance = createLazyComponent(() => import('./views/Finance'), '加载财务...', <FinanceSkeleton />);

type AppView = ViewType | 'SIGNUP' | 'LOGIN';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<AppView>(ViewType.HOME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toast = useToast();
  // 保存用户尝试访问的受保护路由，用于登录后重定向
  const [intendedRoute, setIntendedRoute] = useState<AppView | null>(null);

  // 需求 4.3: 会话过期时自动重定向到登录页面
  useSessionExpiryRedirect(() => {
    console.log('⏰ 会话过期 - 重定向到登录页面');
    toast.warning('您的登录已过期，请重新登录');
    setActiveView('LOGIN');
  });

  // 需求 4.4: 登录成功后重定向到用户原本想访问的页面
  const handleLoginSuccess = useCallback(() => {
    console.log('✅ 登录成功 - 检查重定向目标');
    
    if (intendedRoute && isProtectedRoute(intendedRoute, defaultRouteGuardConfig)) {
      console.log(`🔄 重定向到原本想访问的页面: ${intendedRoute}`);
      setActiveView(intendedRoute);
      setIntendedRoute(null);
    } else {
      console.log(`🔄 重定向到默认主页: ${defaultRouteGuardConfig.defaultRoute}`);
      setActiveView(defaultRouteGuardConfig.defaultRoute as AppView);
    }
  }, [intendedRoute]);

  // 处理视图切换，包含路由保护逻辑
  const handleViewChange = useCallback((view: AppView) => {
    // 需求 4.1: 检查是否为受保护路由
    if (isProtectedRoute(view, defaultRouteGuardConfig) && !user && !loading) {
      console.log(`🚫 尝试访问受保护路由 ${view} - 保存目标并重定向到登录页`);
      // 保存用户想访问的路由
      setIntendedRoute(view);
      // 重定向到登录页
      setActiveView('LOGIN');
      return;
    }
    
    setActiveView(view);
    
    // 需求 2.5: 实现基于用户行为的预测预加载
    if (view !== 'LOGIN' && view !== 'SIGNUP') {
      predictivePreload(view);
    }
  }, [user, loading]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 如果正在加载认证状态，显示加载界面
  if (loading) {
    return <FullPageLoading message="加载中..." />;
  }

  // 如果用户未登录，显示登录或注册页面
  if (!user) {
    if (activeView === 'SIGNUP') {
      return (
        <>
          <Signup
            onSuccess={handleLoginSuccess}
            onNavigateToLogin={() => setActiveView('LOGIN')}
          />
          <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        </>
      );
    }
    
    // 默认显示登录页面
    return (
      <>
        <Login
          onSuccess={handleLoginSuccess}
          onNavigateToSignup={() => setActiveView('SIGNUP')}
        />
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      </>
    );
  }

  const renderView = () => {
    const notify = (message: string) => toast.info(message);
    
    switch (activeView) {
      case ViewType.HOME:
        return (
          <ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
            <Home onNavigate={handleViewChange} onNotify={notify} />
          </ProtectedRoute>
        );
      case ViewType.ATTENDANCE:
        return (
          <ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
            <Attendance onNotify={notify} />
          </ProtectedRoute>
        );
      case ViewType.TASKS:
        return (
          <ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
            <Tasks onNotify={notify} />
          </ProtectedRoute>
        );
      case ViewType.FINANCE:
        return (
          <ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
            <Finance />
          </ProtectedRoute>
        );
      default:
        return (
          <ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
            <Home onNavigate={handleViewChange} onNotify={notify} />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-background-light dark:bg-background-dark relative">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Error Monitor (Development Only) */}
      <ErrorMonitor />
      
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="flex-1 pb-32 overflow-x-hidden no-scrollbar">
        {renderView()}
      </div>
      <BottomNav activeView={activeView as ViewType} onViewChange={handleViewChange} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LoadingStateProvider>
        <AppContent />
      </LoadingStateProvider>
    </AuthProvider>
  );
};

export default App;
