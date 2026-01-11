import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { isUserAdmin } from '../../../src/utils/adminAuth';
import { useSessionExpiry } from '../../../src/hooks/useSessionExpiry';
import AdminLoginView from '../views/AdminLoginView';

/**
 * 管理员路由守卫组件属性接口
 */
interface AdminProtectedRouteProps {
  children: ReactNode;
  fallback?: React.ComponentType;
}

/**
 * 管理员路由守卫组件
 * 
 * 功能：
 * - 检查管理员认证状态
 * - 验证管理员权限
 * - 处理未认证管理员的重定向
 * - 处理管理员会话过期
 * 
 * 实现需求: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  fallback: FallbackComponent
}) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);

  // 处理管理员会话过期 - 实现需求 6.4
  useSessionExpiry(() => {
    console.log('⏰ 管理员会话已过期 - 自动登出');
    signOut().catch(error => {
      console.error('❌ 自动登出失败:', error);
    });
  });

  // 检查管理员权限
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) {
        // 等待认证状态加载完成
        return;
      }

      if (!user) {
        // 用户未登录
        console.log('ℹ️ 用户未登录 - 显示管理员登录界面');
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      // 用户已登录，检查是否为管理员
      console.log('🔍 用户已登录，检查管理员权限:', user.email);
      setIsCheckingAdmin(true);
      
      try {
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          console.log('✅ 管理员权限验证通过 - 允许访问管理后台');
        } else {
          console.log('🚫 非管理员用户 - 拒绝访问管理后台');
        }
      } catch (error) {
        console.error('❌ 检查管理员权限失败:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  // 如果正在加载认证状态或检查管理员权限，显示加载界面
  if (authLoading || isCheckingAdmin) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f8f5] dark:bg-[#111418]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">验证管理员身份中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，显示管理员登录界面
  if (!user) {
    console.log('🔐 显示管理员登录界面');
    return <AdminLoginView />;
  }

  // 检查管理员权限
  if (!isAdmin) {
    console.log('🚫 非管理员用户尝试访问管理后台');
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f8f5] dark:bg-[#111418]">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">block</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">权限不足</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            您没有访问管理后台的权限。请使用管理员账户登录。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/admin'}
              className="w-full px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              返回登录
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 管理员已认证，允许访问
  console.log('✅ 管理员已认证 - 允许访问管理后台');
  return <>{children}</>;
};

/**
 * 管理员加载组件
 */
export const AdminLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f8f5] dark:bg-[#111418]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">加载管理后台...</p>
      </div>
    </div>
  );
};
