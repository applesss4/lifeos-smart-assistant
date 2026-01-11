# 管理员认证系统文档

## 概述

本文档描述了管理后台的认证和权限管理系统实现。该系统确保只有具有管理员权限的用户才能访问管理后台，并提供完整的会话管理和权限验证功能。

## 实现的需求

- **需求 6.1**: 管理员访问管理后台时显示专门的管理员登录界面
- **需求 6.2**: 管理员登录成功后验证管理员权限并允许访问管理功能
- **需求 6.3**: 非管理员用户尝试访问管理后台时拒绝访问并显示权限不足消息
- **需求 6.4**: 管理员会话过期时自动登出并重定向到管理员登录页面
- **需求 6.5**: 管理员在管理后台操作时持续验证管理员权限
- **需求 8.5**: 管理员可以查看所有用户数据（通过RLS策略实现）

## 核心组件

### 1. AdminLoginView (admin/src/views/AdminLoginView.tsx)

专门为管理后台设计的登录界面。

**功能：**
- 提供管理员专用的登录表单
- 显示清晰的管理员身份标识
- 处理登录错误并提供友好的错误消息
- 登录成功后由 AdminProtectedRoute 验证管理员权限

**特点：**
- 使用 Material Symbols 图标增强视觉识别
- 响应式设计，适配各种设备
- 实时表单验证
- 加载状态指示器

### 2. AdminProtectedRoute (admin/src/components/AdminProtectedRoute.tsx)

管理后台的路由守卫组件。

**功能：**
- 检查用户认证状态
- 验证管理员权限（从数据库查询 user_roles 表）
- 处理未认证用户（显示登录界面）
- 处理非管理员用户（显示权限不足消息）
- 监听会话过期并自动登出

**工作流程：**
```
1. 检查用户是否已登录
   ├─ 未登录 → 显示 AdminLoginView
   └─ 已登录 → 继续

2. 查询数据库验证管理员权限
   ├─ 是管理员 → 允许访问管理后台
   └─ 非管理员 → 显示权限不足消息

3. 持续监听会话状态
   └─ 会话过期 → 自动登出并返回登录界面
```

### 3. adminAuth 工具函数 (src/utils/adminAuth.ts)

提供管理员权限检查的核心功能。

**主要函数：**

#### `isUserAdmin(): Promise<boolean>`
检查当前用户是否具有管理员权限。

```typescript
const isAdmin = await isUserAdmin();
if (isAdmin) {
  // 允许访问管理功能
}
```

**实现逻辑：**
1. 获取当前用户会话
2. 查询 `user_roles` 表
3. 检查是否存在 `role = 'admin'` 的记录
4. 返回布尔值结果

#### `getUserRoles(): Promise<string[]>`
获取当前用户的所有角色。

```typescript
const roles = await getUserRoles();
console.log('用户角色:', roles); // ['user', 'admin']
```

### 4. useAdminAuth Hook (src/hooks/useAdminAuth.ts)

React Hook，简化管理员认证状态的使用。

**用法：**

```typescript
import { useAdminAuth } from '../../../src/hooks/useAdminAuth';

function MyAdminComponent() {
  const { isAdmin, roles, loading, user } = useAdminAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!isAdmin) {
    return <div>权限不足</div>;
  }

  return <div>管理员功能</div>;
}
```

**返回值：**
- `isAdmin`: 是否为管理员
- `roles`: 用户角色列表
- `loading`: 是否正在加载
- `user`: 当前用户对象

## 数据库结构

### user_roles 表

存储用户角色信息。

```sql
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

**角色类型：**
- `user`: 普通用户（默认）
- `admin`: 管理员

### 如何授予管理员权限

在 Supabase SQL Editor 中执行：

```sql
-- 为用户添加管理员角色
INSERT INTO user_roles (user_id, role)
VALUES ('用户的UUID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

或者使用用户邮箱：

```sql
-- 通过邮箱查找用户并添加管理员角色
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Row Level Security (RLS) 策略

管理员可以访问所有用户的数据，这通过 RLS 策略实现。

### 示例：tasks 表的管理员策略

```sql
-- 管理员可以查看所有任务
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

**所有表都有类似的管理员策略：**
- tasks
- attendance_records
- transactions
- daily_reports
- salary_settings

## 会话管理

### 会话过期处理

AdminProtectedRoute 使用 `useSessionExpiry` Hook 监听会话过期：

```typescript
useSessionExpiry(() => {
  console.log('⏰ 管理员会话已过期 - 自动登出');
  signOut().catch(error => {
    console.error('❌ 自动登出失败:', error);
  });
});
```

**会话过期时的行为：**
1. 检测到会话过期
2. 自动调用 signOut() 清除会话
3. AuthContext 更新状态
4. AdminProtectedRoute 检测到用户未登录
5. 显示 AdminLoginView 登录界面

## 安全特性

### 1. 多层权限验证

- **前端验证**: AdminProtectedRoute 检查管理员权限
- **数据库验证**: RLS 策略在数据库层面强制执行权限
- **会话验证**: 持续监听会话状态，过期自动登出

### 2. 数据隔离

- 普通用户只能访问自己的数据
- 管理员可以访问所有用户的数据
- 所有数据访问都通过 RLS 策略控制

### 3. 错误处理

- 网络错误：显示友好的错误消息
- 认证错误：提供具体的错误说明
- 权限错误：明确告知用户权限不足

## 使用指南

### 开发环境设置

1. **应用 RLS 迁移**

```bash
# 确保已应用所有迁移
# 参考 supabase/apply-migrations.md
```

2. **创建测试管理员账户**

```sql
-- 在 Supabase SQL Editor 中执行
-- 1. 首先注册一个用户账户（通过应用注册）
-- 2. 然后添加管理员角色
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-admin@example.com';
```

3. **启动管理后台**

```bash
# 管理后台运行在单独的端口
npm run dev:admin
```

### 测试管理员认证

1. **测试未认证访问**
   - 访问 `/admin`
   - 应该看到管理员登录界面

2. **测试非管理员访问**
   - 使用普通用户账户登录
   - 应该看到"权限不足"消息

3. **测试管理员访问**
   - 使用管理员账户登录
   - 应该成功进入管理后台

4. **测试会话过期**
   - 登录后等待会话过期（或手动清除会话）
   - 应该自动返回登录界面

## 故障排查

### 问题：登录后仍显示权限不足

**可能原因：**
- 用户没有 admin 角色
- user_roles 表查询失败
- RLS 策略阻止了角色查询

**解决方案：**
```sql
-- 检查用户角色
SELECT * FROM user_roles WHERE user_id = '用户UUID';

-- 确保 user_roles 表的 RLS 策略允许用户查看自己的角色
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### 问题：管理员无法查看其他用户数据

**可能原因：**
- RLS 策略未正确应用
- 管理员策略配置错误

**解决方案：**
```sql
-- 检查表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- 重新应用 RLS 迁移
-- 参考 supabase/migrations/007_existing_tables_rls.sql
```

### 问题：会话过期后没有自动登出

**可能原因：**
- useSessionExpiry Hook 未正确配置
- 会话检查间隔太长

**解决方案：**
- 检查 AdminProtectedRoute 是否正确使用 useSessionExpiry
- 查看浏览器控制台的日志输出

## 最佳实践

### 1. 管理员账户管理

- 使用强密码
- 定期审查管理员列表
- 及时撤销离职人员的管理员权限

```sql
-- 撤销管理员权限
DELETE FROM user_roles 
WHERE user_id = '用户UUID' AND role = 'admin';
```

### 2. 日志和监控

- 所有管理员操作都有控制台日志
- 建议在生产环境中集成日志服务
- 监控异常的管理员访问模式

### 3. 安全建议

- 不要在前端代码中硬编码管理员邮箱
- 使用环境变量管理敏感配置
- 定期更新依赖包
- 启用 Supabase 的审计日志

## 相关文件

- `admin/src/views/AdminLoginView.tsx` - 管理员登录界面
- `admin/src/components/AdminProtectedRoute.tsx` - 路由守卫
- `admin/src/App.tsx` - 管理后台主应用
- `admin/src/main.tsx` - 应用入口（包含 AuthProvider）
- `src/utils/adminAuth.ts` - 管理员权限检查工具
- `src/hooks/useAdminAuth.ts` - 管理员认证 Hook
- `src/contexts/AuthContext.tsx` - 认证上下文
- `supabase/migrations/006_user_profiles_and_rls.sql` - 用户角色表
- `supabase/migrations/007_existing_tables_rls.sql` - 管理员 RLS 策略

## 总结

管理员认证系统提供了完整的权限管理和访问控制功能：

✅ 专门的管理员登录界面
✅ 基于数据库的权限验证
✅ 自动会话过期处理
✅ 多层安全防护
✅ 友好的用户体验
✅ 完整的错误处理

系统已经过充分测试，可以安全地用于生产环境。
