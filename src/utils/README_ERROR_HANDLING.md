# 错误处理和监控系统

本文档描述了应用的错误处理和监控系统的实现和使用方法。

## 概述

错误处理和监控系统提供以下功能：
- 网络错误检测和自动重试机制
- 离线状态监控和用户提示
- 结构化的错误日志记录
- 错误统计和监控面板（开发环境）
- 全局错误捕获和报告

## 需求映射

- **需求 9.1**: 网络连接失败时显示错误消息并提供重试选项
- **需求 9.2**: Supabase服务不可用时显示服务暂时不可用的消息
- **需求 9.5**: 发生未预期错误时记录错误详情并显示通用错误消息

## 核心组件

### 1. 网络错误处理器 (NetworkErrorHandler)

位置: `src/utils/networkErrorHandler.ts`

**功能**:
- 实时监控网络连接状态（在线/离线/缓慢）
- 自动重试失败的网络请求
- 支持线性和指数退避策略
- 提供网络状态变化通知

**使用示例**:

```typescript
import { networkErrorHandler } from '../utils/networkErrorHandler';

// 检查网络状态
const isOnline = networkErrorHandler.isOnline();

// 监听网络状态变化
const unsubscribe = networkErrorHandler.onNetworkStatusChange((status) => {
  console.log('网络状态:', status);
});

// 带重试的操作执行
const result = await networkErrorHandler.executeWithRetry(
  async () => {
    // 你的异步操作
    return await someApiCall();
  },
  'operation-id',
  {
    retryable: true,
    maxRetries: 3,
    backoffStrategy: 'exponential',
    userMessage: '正在重试...',
    logLevel: 'warn'
  }
);
```

### 2. 网络状态Hook (useNetworkStatus)

位置: `src/hooks/useNetworkStatus.ts`

**功能**:
- React Hook，用于在组件中监控网络状态
- 自动订阅和清理网络状态变化

**使用示例**:

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, networkStatus, isSlowConnection } = useNetworkStatus();

  if (!isOnline) {
    return <div>网络已断开</div>;
  }

  if (isSlowConnection) {
    return <div>网络连接缓慢</div>;
  }

  return <div>正常内容</div>;
}
```

### 3. 离线指示器 (OfflineIndicator)

位置: `src/components/OfflineIndicator.tsx`

**功能**:
- 在页面顶部显示网络状态提示
- 自动检测离线和缓慢连接
- 在线且连接正常时自动隐藏

**集成**:
已在 `App.tsx` 中集成，无需额外配置。

### 4. 错误日志记录器 (ErrorLogger)

位置: `src/utils/errorLogger.ts`

**功能**:
- 结构化的错误日志记录
- 支持多个日志级别（DEBUG, INFO, WARN, ERROR, FATAL）
- 自动捕获全局未处理的错误和Promise拒绝
- 错误统计和分析
- 支持远程日志记录（可配置）
- 日志导出功能

**使用示例**:

```typescript
import { errorLogger } from '../utils/errorLogger';

// 记录不同级别的日志
errorLogger.debug('调试信息', 'category', { data: 'value' });
errorLogger.info('信息消息', 'category', { data: 'value' });
errorLogger.warn('警告消息', 'category', { data: 'value' }, error);
errorLogger.logError('错误消息', 'category', error, { data: 'value' });
errorLogger.fatal('致命错误', 'category', error, { data: 'value' });

// 获取错误统计
const stats = errorLogger.getErrorStats();
console.log('总错误数:', stats.totalErrors);

// 导出日志
const logsJson = errorLogger.exportLogs();
```

**配置选项**:

```typescript
import { ErrorLogger } from '../utils/errorLogger';

const logger = ErrorLogger.getInstance({
  enabled: true,              // 启用/禁用日志记录
  maxLogEntries: 100,         // 最大日志条目数
  consoleOutput: true,        // 是否输出到控制台
  remoteLogging: false,       // 是否发送到远程服务器
  remoteEndpoint: undefined,  // 远程日志端点URL
  sampleRate: 1.0            // 采样率 (0-1)
});
```

### 5. 错误监控面板 (ErrorMonitor)

位置: `src/components/ErrorMonitor.tsx`

**功能**:
- 可视化错误日志和统计信息
- 实时更新错误数据
- 支持按级别过滤日志
- 导出日志到JSON文件
- 清除日志功能
- **仅在开发环境显示**

**使用**:
已在 `App.tsx` 中集成。在开发环境中，点击右下角的浮动按钮打开监控面板。

## 认证系统集成

### 自动重试机制

所有认证操作（登录、注册、密码重置）都已集成网络错误处理和自动重试机制：

```typescript
// 在 AuthContext 中
const signIn = async (email: string, password: string) => {
  // 检查网络连接
  if (!networkErrorHandler.isOnline()) {
    return { error: new Error('网络连接不可用') };
  }

  // 使用重试机制执行登录
  const result = await networkErrorHandler.executeWithRetry(
    async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (error) throw error;
      return data;
    },
    'auth-signin',
    getErrorRecoveryStrategy('network_error')
  );

  return result;
};
```

### 错误日志记录

所有认证错误都会自动记录到错误日志系统：

```typescript
import { logAuthError } from '../utils/authErrors';

// 记录认证错误
const errorInfo = handleAuthError(error);
logAuthError(errorInfo, 'Sign In');
```

## 错误恢复策略

系统为不同类型的错误定义了恢复策略：

| 错误类型 | 可重试 | 最大重试次数 | 退避策略 | 日志级别 |
|---------|--------|------------|---------|---------|
| network_error | 是 | 3 | 指数 | warn |
| service_unavailable | 是 | 2 | 线性 | error |
| too_many_requests | 是 | 1 | 指数 | warn |
| session_not_found | 否 | 0 | - | info |
| 其他错误 | 否 | 0 | - | error |

## 最佳实践

### 1. 使用网络错误处理器包装API调用

```typescript
// 好的做法
const data = await networkErrorHandler.executeWithRetry(
  () => apiCall(),
  'api-call-id',
  strategy
);

// 避免直接调用
const data = await apiCall(); // 没有重试机制
```

### 2. 记录有意义的错误上下文

```typescript
// 好的做法
errorLogger.logError(
  '用户登录失败',
  'auth',
  error,
  { email, attemptCount, timestamp }
);

// 避免缺少上下文
errorLogger.logError('错误', 'general', error);
```

### 3. 使用适当的日志级别

- **DEBUG**: 详细的调试信息
- **INFO**: 一般信息消息
- **WARN**: 警告，但不影响功能
- **ERROR**: 错误，影响功能但可恢复
- **FATAL**: 致命错误，应用无法继续

### 4. 在开发环境使用错误监控面板

在开发过程中，使用错误监控面板查看实时错误和日志，帮助快速定位问题。

## 生产环境配置

在生产环境中，建议：

1. **启用远程日志记录**:
```typescript
errorLogger.updateConfig({
  remoteLogging: true,
  remoteEndpoint: 'https://your-logging-service.com/api/logs'
});
```

2. **调整采样率**（减少日志量）:
```typescript
errorLogger.updateConfig({
  sampleRate: 0.1 // 只记录10%的日志
});
```

3. **减少控制台输出**:
```typescript
errorLogger.updateConfig({
  consoleOutput: false
});
```

## 故障排查

### 网络重试不工作

检查：
1. 网络错误处理器是否正确初始化
2. 错误恢复策略是否设置为可重试
3. 最大重试次数是否大于0

### 错误日志未记录

检查：
1. 错误日志记录器是否启用
2. 采样率是否设置过低
3. 是否正确调用日志方法

### 离线指示器不显示

检查：
1. OfflineIndicator组件是否已添加到App.tsx
2. 浏览器是否支持在线/离线事件
3. 网络状态监控是否正确初始化

## 相关文件

- `src/utils/networkErrorHandler.ts` - 网络错误处理器
- `src/utils/errorLogger.ts` - 错误日志记录器
- `src/utils/authErrors.ts` - 认证错误处理
- `src/hooks/useNetworkStatus.ts` - 网络状态Hook
- `src/components/OfflineIndicator.tsx` - 离线指示器
- `src/components/ErrorMonitor.tsx` - 错误监控面板
- `src/contexts/AuthContext.tsx` - 认证上下文（集成了错误处理）

## 总结

错误处理和监控系统提供了全面的错误管理能力，包括：
- ✅ 自动网络错误检测和重试
- ✅ 离线状态监控和用户提示
- ✅ 结构化的错误日志记录
- ✅ 错误统计和可视化监控
- ✅ 全局错误捕获
- ✅ 与认证系统深度集成

这确保了应用在各种网络条件下都能提供良好的用户体验，并帮助开发者快速定位和解决问题。
