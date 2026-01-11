import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * 路由守卫组件属性接口
 * 根据设计文档中的 ProtectedRouteProps 接口定义
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ComponentType;
  redirectTo?: string;
  onRedirect?: () => void;
}

/**
 * 路由守卫组件
 * 
 * 功能：
 * - 检查用户认证状态
 * - 验证管理员权限（如果需要）
 * - 处理未认证用户的重定向
 * - 在加载状态时显示加载界面
 * 
 * 验证需求: Requirements 4.1, 4.2, 4.4
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallback: FallbackComponent,
  onRedirect
}) => {
  const { user, loading } = useAuth();

  // 如果正在加载认证状态，显示加载界面
  if (loading) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">验证身份中...</p>
        </div>
      </div>
    );
  }

  // 需求 4.1: 未认证用户尝试访问受保护路由时重定向到登录页面
  if (requireAuth && !user) {
    console.log('🚫 未认证用户尝试访问受保护内容 - 触发重定向');
    
    // 触发重定向回调
    if (onRedirect) {
      onRedirect();
    }
    
    // 返回null，让父组件处理重定向逻辑
    return null;
  }

  // 需求 4.2: 已认证用户访问受保护路由时允许访问
  // 需求 4.5: 管理员用户登录时允许访问管理后台路由
  if (requireAdmin && user) {
    // TODO: 实现管理员权限检查
    // 这将在任务 8.2 中实现
    console.log('⚠️ 管理员权限检查尚未实现');
  }

  // 需求 4.2: 已认证用户可以访问受保护内容
  console.log('✅ 用户已认证 - 允许访问受保护内容');
  return <>{children}</>;
};

/**
 * 默认加载组件
 */
export const DefaultLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">加载中...</p>
      </div>
    </div>
  );
};
