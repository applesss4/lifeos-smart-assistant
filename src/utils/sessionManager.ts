import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { SessionManager } from '../types/auth';
import { handleAuthError, logAuthError } from './authErrors';

// 会话管理器实现
class SessionManagerImpl implements SessionManager {
  private sessionChangeCallbacks: ((session: Session | null) => void)[] = [];

  constructor() {
    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      // 通知所有订阅者
      this.sessionChangeCallbacks.forEach(callback => {
        try {
          callback(session);
        } catch (error) {
          console.error('Session change callback error:', error);
        }
      });
    });
  }

  // 获取当前会话
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Get Current Session');
        return null;
      }
      
      return session;
    } catch (error) {
      const errorInfo = handleAuthError(error as Error);
      logAuthError(errorInfo, 'Get Current Session');
      return null;
    }
  }

  // 刷新会话
  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Refresh Session');
        return null;
      }
      
      return session;
    } catch (error) {
      const errorInfo = handleAuthError(error as Error);
      logAuthError(errorInfo, 'Refresh Session');
      return null;
    }
  }

  // 清除会话
  async clearSession(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Clear Session');
        throw error;
      }
    } catch (error) {
      const errorInfo = handleAuthError(error as Error);
      logAuthError(errorInfo, 'Clear Session');
      throw error;
    }
  }

  // 订阅会话变化
  onSessionChange(callback: (session: Session | null) => void): () => void {
    this.sessionChangeCallbacks.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.sessionChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.sessionChangeCallbacks.splice(index, 1);
      }
    };
  }

  // 检查会话是否有效
  async isSessionValid(): Promise<boolean> {
    const session = await this.getCurrentSession();
    
    if (!session) {
      return false;
    }

    // 检查会话是否过期
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    if (expiresAt && now >= expiresAt) {
      console.log('Session expired, attempting refresh...');
      const refreshedSession = await this.refreshSession();
      return refreshedSession !== null;
    }
    
    return true;
  }

  // 获取用户ID
  async getUserId(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.user?.id ?? null;
  }

  // 获取访问令牌
  async getAccessToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.access_token ?? null;
  }

  // 检查用户是否有特定角色
  async hasRole(role: string): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.user) {
        return false;
      }

      // 从用户元数据或数据库查询角色
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', role)
        .single();

      if (error) {
        // 如果表不存在或查询失败，检查用户元数据
        const userRole = session.user.user_metadata?.role || 
                        session.user.app_metadata?.role;
        return userRole === role;
      }

      return data !== null;
    } catch (error) {
      const errorInfo = handleAuthError(error as Error);
      logAuthError(errorInfo, 'Check User Role');
      return false;
    }
  }

  // 检查用户是否为管理员
  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }
}

// 导出单例实例
export const sessionManager = new SessionManagerImpl();

// 会话工具函数
export const sessionUtils = {
  // 格式化会话信息用于调试
  formatSessionInfo(session: Session | null): string {
    if (!session) {
      return 'No active session';
    }

    const expiresAt = session.expires_at 
      ? new Date(session.expires_at * 1000).toLocaleString()
      : 'Unknown';

    return `Session: ${session.user.email} (expires: ${expiresAt})`;
  },

  // 检查会话是否即将过期（5分钟内）
  isSessionExpiringSoon(session: Session | null): boolean {
    if (!session?.expires_at) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = now + (5 * 60);
    
    return session.expires_at <= fiveMinutesFromNow;
  },

  // 计算会话剩余时间（秒）
  getSessionTimeRemaining(session: Session | null): number {
    if (!session?.expires_at) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, session.expires_at - now);
  }
};