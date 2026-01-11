import { AuthError } from '@supabase/supabase-js';
import { AuthErrorInfo } from '../types/auth';

// 错误恢复策略
export interface ErrorRecoveryStrategy {
  retryable: boolean;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential';
  fallbackAction?: () => void;
  userMessage: string;
  logLevel: 'error' | 'warn' | 'info';
}

// 认证错误映射
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'invalid_credentials': '邮箱或密码错误',
  'email_not_confirmed': '请先验证您的邮箱地址',
  'user_not_found': '用户不存在',
  'weak_password': '密码强度不足，请使用至少8个字符',
  'email_address_invalid': '邮箱格式无效，请使用真实的邮箱地址',
  'signup_disabled': '注册功能暂时关闭',
  'email_address_not_authorized': '该邮箱地址未被授权',
  'too_many_requests': '请求过于频繁，请稍后再试（约需等待 1 分钟）',
  'session_not_found': '会话已过期，请重新登录',
  'network_error': '网络连接失败，请检查网络设置',
  'service_unavailable': '服务暂时不可用，请稍后再试',
  'unknown_error': '发生未知错误，请稍后再试'
};

// 网络错误检测
export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    error?.code === 'NETWORK_ERROR' ||
    !navigator.onLine
  );
}

// 服务器错误检测
export function isServerError(error: any): boolean {
  return (
    error?.status >= 500 ||
    error?.message?.includes('server') ||
    error?.code === 'SERVICE_UNAVAILABLE'
  );
}

// 认证错误处理
export function handleAuthError(error: AuthError | Error | null): AuthErrorInfo {
  if (!error) {
    return {
      code: 'unknown_error',
      message: AUTH_ERROR_MESSAGES.unknown_error
    };
  }

  // 网络错误处理
  if (isNetworkError(error)) {
    return {
      code: 'network_error',
      message: AUTH_ERROR_MESSAGES.network_error,
      details: error
    };
  }

  // 服务器错误处理
  if (isServerError(error)) {
    return {
      code: 'service_unavailable',
      message: AUTH_ERROR_MESSAGES.service_unavailable,
      details: error
    };
  }

  // Supabase 认证错误
  if ('message' in error) {
    const errorCode = extractErrorCode(error.message);
    return {
      code: errorCode,
      message: AUTH_ERROR_MESSAGES[errorCode] || error.message,
      details: error
    };
  }

  return {
    code: 'unknown_error',
    message: AUTH_ERROR_MESSAGES.unknown_error,
    details: error
  };
}

// 从错误消息中提取错误代码
function extractErrorCode(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('invalid login credentials')) {
    return 'invalid_credentials';
  }
  if (lowerMessage.includes('email not confirmed')) {
    return 'email_not_confirmed';
  }
  if (lowerMessage.includes('user not found')) {
    return 'user_not_found';
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return 'weak_password';
  }
  if (lowerMessage.includes('invalid email') || lowerMessage.includes('email address') && lowerMessage.includes('invalid')) {
    return 'email_address_invalid';
  }
  if (lowerMessage.includes('signup') && lowerMessage.includes('disabled')) {
    return 'signup_disabled';
  }
  if (lowerMessage.includes('too many requests') || lowerMessage.includes('you can only request this after')) {
    return 'too_many_requests';
  }
  if (lowerMessage.includes('session') && lowerMessage.includes('not found')) {
    return 'session_not_found';
  }
  
  return 'unknown_error';
}

// 获取错误恢复策略
export function getErrorRecoveryStrategy(errorCode: string): ErrorRecoveryStrategy {
  switch (errorCode) {
    case 'network_error':
      return {
        retryable: true,
        maxRetries: 3,
        backoffStrategy: 'exponential',
        userMessage: '网络连接失败，正在重试...',
        logLevel: 'warn'
      };
    
    case 'service_unavailable':
      return {
        retryable: true,
        maxRetries: 2,
        backoffStrategy: 'linear',
        userMessage: '服务暂时不可用，正在重试...',
        logLevel: 'error'
      };
    
    case 'too_many_requests':
      return {
        retryable: false, // 不自动重试，因为需要等待时间
        maxRetries: 0,
        backoffStrategy: 'exponential',
        userMessage: '请求过于频繁，请稍后再试（约需等待 1 分钟）',
        logLevel: 'warn'
      };
    
    case 'session_not_found':
      return {
        retryable: false,
        maxRetries: 0,
        backoffStrategy: 'linear',
        userMessage: '会话已过期，请重新登录',
        logLevel: 'info',
        fallbackAction: () => {
          // 重定向到登录页面的逻辑将在路由守卫中实现
        }
      };
    
    default:
      return {
        retryable: false,
        maxRetries: 0,
        backoffStrategy: 'linear',
        userMessage: AUTH_ERROR_MESSAGES[errorCode] || '操作失败，请重试',
        logLevel: 'error'
      };
  }
}

// 错误日志记录
export function logAuthError(error: AuthErrorInfo, context?: string): void {
  const logMessage = `[Auth Error] ${context ? `${context}: ` : ''}${error.code} - ${error.message}`;
  
  const strategy = getErrorRecoveryStrategy(error.code);
  
  // 使用新的错误日志系统
  const { errorLogger } = require('./errorLogger');
  
  switch (strategy.logLevel) {
    case 'error':
      errorLogger.logError(logMessage, 'auth', error, { context });
      break;
    case 'warn':
      errorLogger.warn(logMessage, 'auth', { context }, error.details);
      break;
    case 'info':
      errorLogger.info(logMessage, 'auth', { context });
      break;
  }
}

// 输入验证错误
export interface ValidationError {
  field: string;
  message: string;
}

// 表单验证
export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: 'email', message: '请输入邮箱地址' };
  }
  
  // 更严格的邮箱验证正则表达式
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: '请输入有效的邮箱地址' };
  }
  
  // 检查域名部分是否合理
  const domain = email.split('@')[1];
  if (domain) {
    // 检查域名是否只包含数字（如 123.com）
    const domainParts = domain.split('.');
    const isNumericDomain = domainParts.some(part => /^\d+$/.test(part));
    if (isNumericDomain) {
      return { field: 'email', message: '请输入有效的邮箱地址（域名无效）' };
    }
  }
  
  return null;
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: '请输入密码' };
  }
  
  if (password.length < 8) {
    return { field: 'password', message: '密码至少需要8个字符' };
  }
  
  // 检查密码强度：至少包含一个字母和一个数字
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { field: 'password', message: '密码必须包含至少一个字母和一个数字' };
  }
  
  return null;
}

export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationError | null {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: '请确认密码' };
  }
  
  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: '两次输入的密码不一致' };
  }
  
  return null;
}