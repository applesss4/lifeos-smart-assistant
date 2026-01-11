import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContextType, AuthResponse } from '../types/auth';
import { handleAuthError, logAuthError, getErrorRecoveryStrategy } from '../utils/authErrors';
import { sessionManager } from '../utils/sessionManager';
import { networkErrorHandler } from '../utils/networkErrorHandler';

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者属性
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化认证状态 - 实现自动会话恢复
  useEffect(() => {
    // 获取初始会话并自动恢复用户登录状态
    const initializeAuth = async () => {
      try {
        console.log('🔄 应用启动 - 检查现有会话...');
        
        // 使用会话管理器检查是否存在有效会话
        const currentSession = await sessionManager.getCurrentSession();
        
        if (currentSession) {
          console.log('✅ 发现有效会话 - 自动恢复用户登录状态');
          console.log('👤 用户:', currentSession.user.email);
          
          // 验证会话是否仍然有效（未过期）
          const isValid = await sessionManager.isSessionValid();
          
          if (isValid) {
            // 自动恢复用户的登录状态
            setSession(currentSession);
            setUser(currentSession.user);
            console.log('✅ 会话恢复成功 - 用户数据访问权限已设置');
          } else {
            console.log('⚠️ 会话已过期 - 尝试刷新会话');
            // 会话过期，尝试刷新
            const refreshedSession = await sessionManager.refreshSession();
            
            if (refreshedSession) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
              console.log('✅ 会话刷新成功');
            } else {
              console.log('❌ 会话刷新失败 - 需要重新登录');
              setSession(null);
              setUser(null);
            }
          }
        } else {
          console.log('ℹ️ 未发现有效会话 - 用户需要登录');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        const errorInfo = handleAuthError(error as Error);
        logAuthError(errorInfo, 'Initialize Auth');
        console.error('❌ 会话恢复失败:', errorInfo.message);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 监听认证状态变化 - 使用会话管理器
    const unsubscribe = sessionManager.onSessionChange((newSession) => {
      console.log('🔔 会话状态变化:', newSession?.user?.email || '已登出');
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // 处理会话变化事件
      if (newSession) {
        console.log('✅ 用户会话已建立 - 数据访问权限已更新');
      } else {
        console.log('ℹ️ 用户会话已清除');
      }
    });

    // 同时保持 Supabase 原生的状态监听（用于详细事件）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('📡 认证事件:', event, session?.user?.email);

        // 处理不同的认证事件
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ 用户已登录:', session?.user?.email);
            break;
          case 'SIGNED_OUT':
            console.log('👋 用户已登出');
            break;
          case 'TOKEN_REFRESHED':
            console.log('🔄 会话令牌已刷新');
            break;
          case 'USER_UPDATED':
            console.log('📝 用户信息已更新');
            break;
          case 'PASSWORD_RECOVERY':
            console.log('🔑 密码重置邮件已发送');
            break;
        }
      }
    );

    // 清理订阅
    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
  }, []);

  // 用户登录（带网络错误处理和重试机制）
  const signIn = async (email: string, password: string, rememberMe?: boolean): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      // 检查网络连接
      if (!networkErrorHandler.isOnline()) {
        const error = new Error('网络连接不可用，请检查网络设置') as AuthError;
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Sign In');
        return { user: null, session: null, error };
      }

      // 使用网络错误处理器执行登录操作（带重试机制）
      const result = await networkErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });

          if (error) {
            throw error;
          }

          return data;
        },
        'auth-signin',
        getErrorRecoveryStrategy('network_error')
      );

      // Note: Session persistence is controlled by the Supabase client configuration
      // The rememberMe parameter is kept for future implementation if needed
      return { user: result.user, session: result.session, error: null };
    } catch (error) {
      const authError = error as AuthError;
      const errorInfo = handleAuthError(authError);
      logAuthError(errorInfo, 'Sign In');
      return { user: null, session: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // 用户注册（带网络错误处理和重试机制）
  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      // 检查网络连接
      if (!networkErrorHandler.isOnline()) {
        const error = new Error('网络连接不可用，请检查网络设置') as AuthError;
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Sign Up');
        return { user: null, session: null, error };
      }

      // 使用网络错误处理器执行注册操作（带重试机制）
      const result = await networkErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              // 邮箱确认后重定向的URL
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });

          if (error) {
            throw error;
          }

          return data;
        },
        'auth-signup',
        getErrorRecoveryStrategy('network_error')
      );

      return { user: result.user, session: result.session, error: null };
    } catch (error) {
      const authError = error as AuthError;
      const errorInfo = handleAuthError(authError);
      logAuthError(errorInfo, 'Sign Up');
      return { user: null, session: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // 用户登出
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // 使用会话管理器清除会话
      await sessionManager.clearSession();
      
      console.log('✅ 用户已成功登出');
    } catch (error) {
      const errorInfo = handleAuthError(error as Error);
      logAuthError(errorInfo, 'Sign Out');
      console.error('❌ 登出失败:', errorInfo.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 密码重置（带网络错误处理和重试机制）
  const resetPassword = async (email: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      // 检查网络连接
      if (!networkErrorHandler.isOnline()) {
        const error = new Error('网络连接不可用，请检查网络设置') as AuthError;
        const errorInfo = handleAuthError(error);
        logAuthError(errorInfo, 'Reset Password');
        return { user: null, session: null, error };
      }

      // 使用网络错误处理器执行密码重置操作（带重试机制）
      await networkErrorHandler.executeWithRetry(
        async () => {
          const { data, error } = await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo: `${window.location.origin}/auth/reset-password`
            }
          );

          if (error) {
            throw error;
          }

          return data;
        },
        'auth-reset-password',
        getErrorRecoveryStrategy('network_error')
      );

      return { user: null, session: null, error: null };
    } catch (error) {
      const authError = error as AuthError;
      const errorInfo = handleAuthError(authError);
      logAuthError(errorInfo, 'Reset Password');
      return { user: null, session: null, error: authError };
    } finally {
      setLoading(false);
    }
  };

  // 上下文值
  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证上下文的Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// 检查用户是否已认证的Hook
export function useAuthUser(): User | null {
  const { user } = useAuth();
  return user;
}

// 检查用户是否正在加载的Hook
export function useAuthLoading(): boolean {
  const { loading } = useAuth();
  return loading;
}