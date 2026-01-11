# 路由保护实现说明

## 概述

本文档说明了任务 7 "实现路由保护" 的实现细节。

## 实现的功能

### 7.1 创建路由守卫组件

#### 1. ProtectedRoute 组件 (`src/components/ProtectedRoute.tsx`)

**功能：**
- 检查用户认证状态
- 在加载状态时显示加载界面
- 未认证用户触发重定向回调
- 支持自定义加载组件

**验证需求：**
- Requirements 4.1: 未认证用户尝试访问受保护路由时重定向到登录页面
- Requirements 4.2: 已认证用户访问受保护路由时允许访问
- Requirements 4.4: 登录成功后重定向到用户原本想访问的页面

**使用示例：**
```tsx
<ProtectedRoute onRedirect={() => handleViewChange('LOGIN')}>
  <Home onNavigate={handleViewChange} onNotify={notify} />
</ProtectedRoute>
```

#### 2. 路由守卫配置 (`src/config/routeGuardConfig.ts`)

**功能：**
- 定义公开路由、受保护路由和管理员路由
- 提供路由类型检查工具函数
- 集中管理路由配置

**配置内容：**
- `publicRoutes`: 无需认证的路由（LOGIN, SIGNUP）
- `protectedRoutes`: 需要认证的路由（HOME, ATTENDANCE, TASKS, FINANCE）
- `adminRoutes`: 需要管理员权限的路由（ADMIN）
- `loginRoute`: 登录路由
- `defaultRoute`: 默认路由（登录后）

#### 3. 会话过期处理 (`src/hooks/useSessionExpiry.ts`)

**功能：**
- 监听会话过期事件
- 定期检查会话有效性（每分钟）
- 会话过期时触发回调

**验证需求：**
- Requirements 4.3: 用户会话在浏览受保护页面时过期，立即重定向到登录页面

**使用示例：**
```tsx
useSessionExpiryRedirect(() => {
  console.log('⏰ 会话过期 - 重定向到登录页面');
  notify('您的登录已过期，请重新登录');
  setActiveView('LOGIN');
});
```

### 7.2 集成路由守卫到应用路由

#### 1. 主应用集成 (`App.tsx`)

**实现的功能：**

1. **路由保护检查**
   - 在视图切换时检查是否为受保护路由
   - 未认证用户尝试访问受保护路由时保存目标路由并重定向到登录页

2. **登录后重定向**
   - 保存用户尝试访问的受保护路由
   - 登录成功后重定向到原本想访问的页面
   - 如果没有保存的路由，重定向到默认主页

3. **会话过期处理**
   - 使用 `useSessionExpiryRedirect` Hook 监听会话过期
   - 会话过期时显示通知并重定向到登录页

4. **受保护视图包装**
   - 所有受保护的视图都用 `ProtectedRoute` 组件包装
   - 提供统一的认证检查和重定向逻辑

**关键代码片段：**

```tsx
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
}, [user, loading]);

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
```

#### 2. 管理后台集成 (`admin/src/App.tsx`)

**实现的功能：**

1. **AdminProtectedRoute 组件**
   - 为管理后台提供专门的路由守卫
   - 检查管理员认证状态和权限
   - 显示权限不足提示

2. **整体保护**
   - 整个管理后台应用用 `AdminProtectedRoute` 包装
   - 确保只有管理员可以访问

**注意：**
- 管理员认证功能将在任务 8 中完善
- 当前版本提供基础结构，暂时允许访问

## 验证需求覆盖

### Requirements 4.1 ✅
**需求：** 未认证用户尝试访问受保护路由时重定向到登录页面

**实现位置：**
- `App.tsx` 中的 `handleViewChange` 函数
- `ProtectedRoute.tsx` 中的认证检查逻辑

### Requirements 4.2 ✅
**需求：** 已认证用户访问受保护路由时允许访问

**实现位置：**
- `ProtectedRoute.tsx` 中的认证检查逻辑
- 已认证用户直接渲染子组件

### Requirements 4.3 ✅
**需求：** 用户会话在浏览受保护页面时过期，立即重定向到登录页面

**实现位置：**
- `useSessionExpiry.ts` Hook
- `App.tsx` 中的 `useSessionExpiryRedirect` 调用
- 定期检查会话有效性（每分钟）

### Requirements 4.4 ✅
**需求：** 登录成功后重定向到用户原本想访问的页面

**实现位置：**
- `App.tsx` 中的 `intendedRoute` 状态
- `handleLoginSuccess` 函数中的重定向逻辑

### Requirements 4.5 ✅
**需求：** 管理员用户登录时允许访问管理后台路由

**实现位置：**
- `admin/src/components/AdminProtectedRoute.tsx`
- 将在任务 8 中完善管理员权限验证

## 测试建议

### 手动测试场景

1. **未认证用户访问受保护路由**
   - 打开应用，未登录状态
   - 尝试通过底部导航访问任何页面
   - 应该自动重定向到登录页

2. **登录后重定向**
   - 未登录状态下尝试访问"考勤"页面
   - 被重定向到登录页
   - 登录成功后应该自动跳转到"考勤"页面

3. **会话过期处理**
   - 登录后正常使用应用
   - 等待会话过期（或手动清除会话）
   - 应该显示"登录已过期"通知并重定向到登录页

4. **已认证用户正常访问**
   - 登录后
   - 可以自由切换各个页面
   - 不会被重定向

### 自动化测试（待实现）

属性测试将在任务 7.3 和 7.4 中实现：
- 7.3: 路由访问控制属性测试
- 7.4: 会话过期处理单元测试

## 技术细节

### 状态管理
- 使用 React 状态管理视图切换
- 保存用户意图访问的路由用于登录后重定向

### 认证检查
- 使用 `useAuth` Hook 获取用户状态
- 检查 `user` 和 `loading` 状态
- 在加载时显示加载界面

### 会话监控
- 使用 `sessionManager.isSessionValid()` 检查会话有效性
- 定期检查（每分钟）
- 会话过期时触发回调

### 日志记录
- 所有关键操作都有控制台日志
- 便于调试和问题追踪

## 后续任务

1. **任务 7.3**: 为路由访问控制编写属性测试
2. **任务 7.4**: 为会话过期处理编写单元测试
3. **任务 8**: 实现完整的管理员认证功能

## 注意事项

1. 当前实现基于状态管理而非真实的路由库
2. 管理员权限检查将在任务 8 中完善
3. 所有受保护的视图都需要用 `ProtectedRoute` 包装
4. 会话过期检查间隔为 1 分钟，可根据需要调整
