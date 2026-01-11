/**
 * 错误日志记录和监控系统
 * 提供结构化的错误日志记录、错误监控和报告功能
 * 需求: 9.5
 */

import { AuthErrorInfo } from '../types/auth';

// 日志级别
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

// 日志条目接口
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, any>;
  error?: Error | AuthErrorInfo;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

// 错误统计接口
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByLevel: Record<LogLevel, number>;
  recentErrors: LogEntry[];
}

// 错误监控配置
export interface ErrorMonitorConfig {
  enabled: boolean;
  maxLogEntries: number;
  consoleOutput: boolean;
  remoteLogging: boolean;
  remoteEndpoint?: string;
  sampleRate: number; // 0-1, 采样率
}

// 默认配置
const DEFAULT_CONFIG: ErrorMonitorConfig = {
  enabled: true,
  maxLogEntries: 100,
  consoleOutput: true,
  remoteLogging: false,
  sampleRate: 1.0
};

/**
 * 错误日志记录器类
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private config: ErrorMonitorConfig;
  private logEntries: LogEntry[] = [];
  private errorStats: ErrorStats = {
    totalErrors: 0,
    errorsByCategory: {},
    errorsByLevel: {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0
    },
    recentErrors: []
  };

  private constructor(config: Partial<ErrorMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeErrorMonitoring();
  }

  // 获取单例实例
  public static getInstance(config?: Partial<ErrorMonitorConfig>): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(config);
    }
    return ErrorLogger.instance;
  }

  // 初始化错误监控
  private initializeErrorMonitoring(): void {
    if (!this.config.enabled) {
      return;
    }

    // 捕获全局未处理的错误
    window.addEventListener('error', (event) => {
      this.logError(
        'Uncaught Error',
        'global',
        event.error || new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        'Unhandled Promise Rejection',
        'global',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          promise: event.promise
        }
      );
    });

    console.log('✅ 错误监控系统已初始化');
  }

  // 创建日志条目
  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, any>,
    error?: Error | AuthErrorInfo
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      error,
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  // 获取当前用户ID（从localStorage或session）
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('lifeos-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.id;
      }
    } catch (error) {
      // 忽略解析错误
    }
    return undefined;
  }

  // 获取当前会话ID
  private getCurrentSessionId(): string | undefined {
    try {
      const authData = localStorage.getItem('lifeos-auth-token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.access_token?.substring(0, 16); // 使用token的前16个字符作为会话ID
      }
    } catch (error) {
      // 忽略解析错误
    }
    return undefined;
  }

  // 记录日志
  private log(entry: LogEntry): void {
    if (!this.config.enabled) {
      return;
    }

    // 采样检查
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    // 添加到日志列表
    this.logEntries.push(entry);

    // 限制日志条目数量
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries.shift();
    }

    // 更新统计信息
    this.updateStats(entry);

    // 控制台输出
    if (this.config.consoleOutput) {
      this.outputToConsole(entry);
    }

    // 远程日志记录
    if (this.config.remoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  // 更新统计信息
  private updateStats(entry: LogEntry): void {
    // 更新级别统计
    this.errorStats.errorsByLevel[entry.level]++;

    // 更新分类统计
    if (!this.errorStats.errorsByCategory[entry.category]) {
      this.errorStats.errorsByCategory[entry.category] = 0;
    }
    this.errorStats.errorsByCategory[entry.category]++;

    // 更新总错误数（只统计ERROR和FATAL级别）
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      this.errorStats.totalErrors++;
      
      // 添加到最近错误列表
      this.errorStats.recentErrors.push(entry);
      if (this.errorStats.recentErrors.length > 10) {
        this.errorStats.recentErrors.shift();
      }
    }
  }

  // 输出到控制台
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context, entry.error);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context, entry.error);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.context, entry.error);
        break;
      case LogLevel.FATAL:
        console.error(`🔥 ${message}`, entry.context, entry.error);
        break;
    }
  }

  // 发送到远程服务器
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // 远程日志记录失败时不应该影响应用运行
      console.warn('远程日志记录失败:', error);
    }
  }

  // 公共日志方法
  public debug(message: string, category: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, context);
    this.log(entry);
  }

  public info(message: string, category: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, context);
    this.log(entry);
  }

  public warn(message: string, category: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, context, error);
    this.log(entry);
  }

  public logError(message: string, category: string, error?: Error | AuthErrorInfo, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, context, error);
    this.log(entry);
  }

  public fatal(message: string, category: string, error?: Error | AuthErrorInfo, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, category, message, context, error);
    this.log(entry);
  }

  // 获取日志条目
  public getLogEntries(filter?: {
    level?: LogLevel;
    category?: string;
    limit?: number;
  }): LogEntry[] {
    let entries = [...this.logEntries];

    if (filter?.level) {
      entries = entries.filter(e => e.level === filter.level);
    }

    if (filter?.category) {
      entries = entries.filter(e => e.category === filter.category);
    }

    if (filter?.limit) {
      entries = entries.slice(-filter.limit);
    }

    return entries;
  }

  // 获取错误统计
  public getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  // 清除日志
  public clearLogs(): void {
    this.logEntries = [];
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0
      },
      recentErrors: []
    };
    console.log('✅ 日志已清除');
  }

  // 导出日志（用于调试或报告）
  public exportLogs(): string {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      stats: this.errorStats,
      logs: this.logEntries
    }, null, 2);
  }

  // 更新配置
  public updateConfig(config: Partial<ErrorMonitorConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ 错误监控配置已更新', this.config);
  }
}

// 导出单例实例
export const errorLogger = ErrorLogger.getInstance();

// 便捷函数
export function logAuthError(error: AuthErrorInfo, category: string, context?: Record<string, any>): void {
  errorLogger.logError(
    error.message,
    `auth:${category}`,
    error,
    context
  );
}

export function logNetworkError(message: string, context?: Record<string, any>): void {
  errorLogger.logError(
    message,
    'network',
    undefined,
    context
  );
}

export function logSystemError(message: string, error?: Error, context?: Record<string, any>): void {
  errorLogger.logError(
    message,
    'system',
    error,
    context
  );
}
