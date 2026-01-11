import { User, Session, AuthError } from '@supabase/supabase-js';
import { ReactNode, ComponentType } from 'react';

// 认证响应类型
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

// 认证上下文类型
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
}

// 登录表单数据
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// 注册表单数据
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

// 认证组件属性
export interface AuthComponentProps {
  mode: 'signin' | 'signup' | 'reset';
  onSuccess?: (user: User) => void;
  onError?: (error: AuthError) => void;
  redirectTo?: string;
}

// 会话管理器接口
export interface SessionManager {
  getCurrentSession: () => Promise<Session | null>;
  refreshSession: () => Promise<Session | null>;
  clearSession: () => Promise<void>;
  onSessionChange: (callback: (session: Session | null) => void) => () => void;
}

// 路由守卫属性
export interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ComponentType;
  redirectTo?: string;
}

// 路由守卫配置
export interface RouteGuardConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  loginRoute: string;
  defaultRoute: string;
}

// 认证错误类型
export interface AuthErrorInfo {
  code: string;
  message: string;
  details?: any;
}

// 用户角色类型
export type UserRole = 'user' | 'admin';

// 用户配置文件类型
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}