import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionManager } from '../utils/sessionManager';

/**
 * 会话过期处理Hook
 * 
 * 功能：
 * - 监听会话过期事件
 * - 在会话过期时触发回调
 * - 自动清理订阅
 * 
 * 验证需求: Requirements 4.3
 * 
 * @param onExpiry - 会话过期时的回调函数
 */
export function useSessionExpiry(onExpiry?: () => void) {
  const { user, session } = useAuth();

  const handleSessionExpiry = useCallback(() => {
    console.log('⏰ 会话已过期 - 触发过期处理');
    
    if (onExpiry) {
      onExpiry();
    }
  }, [onExpiry]);

  useEffect(() => {
    // 如果没有会话，不需要监听
    if (!session) {
      return;
    }

    // 检查会话是否即将过期
    const checkSessionExpiry = async () => {
      const isValid = await sessionManager.isSessionValid();
      
      if (!isValid && user) {
        console.log('⚠️ 检测到会话过期');
        handleSessionExpiry();
      }
    };

    // 定期检查会话状态（每分钟检查一次）
    const intervalId = setInterval(checkSessionExpiry, 60000);

    // 立即检查一次
    checkSessionExpiry();

    // 清理定时器
    return () => {
      clearInterval(intervalId);
    };
  }, [session, user, handleSessionExpiry]);

  return {
    isSessionValid: session !== null
  };
}

/**
 * 会话过期重定向Hook
 * 
 * 在会话过期时自动重定向到登录页面
 * 
 * @param onRedirect - 重定向回调函数
 */
export function useSessionExpiryRedirect(onRedirect: () => void) {
  useSessionExpiry(onRedirect);
}
