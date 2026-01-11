# Supabase认证系统快速入门指南

## 概述
本指南帮助开发者快速理解和使用已集成的Supabase认证系统。

## 环境配置

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```bash
# 从 Supabase Dashboard -> Settings -> API 获取
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 应用数据库迁移
在Supabase SQL编辑器中执行：
```sql
-- 执行所有迁移文件
-- supabase/migrations/006_user_profiles_and_rls.sql
-- supabase/migrations/007_existing_tables_rls.sql
```

### 4. 创建管理员账户
```sql
-- 注册一个用户后，在Supabase SQL编辑器中执行
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

## 使用认证系统

### 在组件中使用认证

#### 获取认证状态
```typescript
import { useAuth } from './src/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  
  if (loading) {
    return <div>加载中...</div>;
  }
  
  if (!user) {
    return <div>请登录</div>;
  }
  
  return (
    <div>
      <p>欢迎, {user.email}</p>
      <button onClick={signOut}>登出</button>
    </div>
  );
}
```

#### 用户登录
```typescript
import { useAuth } from './src/contexts/AuthContext';

function LoginComponent() {
  const { signIn } = useAuth();
  
  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('登录失败:', error.message);
    } else {
      console.log('登录成功');
    }
  };
  
  return <button onClick={handleLogin}>登录</button>;
}
```

#### 用户注册
```typescript
import { useAuth } from './src/contexts/AuthContext';

function SignupComponent() {
  const { signUp } = useAuth();
  
  const handleSignup = async () => {
    const { error } = await signUp(email, password);
    
    if (error) {
      console.error('注册失败:', error.message);
    } else {
      console.log('注册成功');
    }
  };
  
  return <button onClick={handleSignup}>注册</button>;
}
```

### 保护路由

#### 保护用户路由
```typescript
import { ProtectedRoute } from './src/components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute>
      <YourProtectedComponent />
    </ProtectedRoute>
  );
}
```

#### 保护管理员路由
```typescript
import { AdminProtectedRoute } from './admin/src/components/AdminProtectedRoute';

function AdminApp() {
  return (
    <AdminProtectedRoute>
      <YourAdminComponent />
    </AdminProtectedRoute>
  );
}
```

### 访问用户数据

#### 使用服务层
```typescript
import { getTasks } from './src/services/taskService';

// RLS会自动过滤，只返回当前用户的任务
const tasks = await getTasks();
```

#### 直接使用Supabase客户端
```typescript
import { supabase } from './src/lib/supabase';

// RLS会自动应用用户ID过滤
const { data, error } = await supabase
  .from('tasks')
  .select('*');
```

### 检查管理员权限

#### 在组件中
```typescript
import { useAdminAuth } from './src/hooks/useAdminAuth';

function AdminComponent() {
  const { isAdmin, loading } = useAdminAuth();
  
  if (loading) return <div>加载中...</div>;
  if (!isAdmin) return <div>权限不足</div>;
  
  return <div>管理员功能</div>;
}
```

#### 在代码中
```typescript
import { sessionManager } from './src/utils/sessionManager';

const isAdmin = await sessionManager.isAdmin();
if (isAdmin) {
  // 执行管理员操作
}
```

## 常见场景

### 场景1: 用户注册和登录流程
```typescript
// 1. 用户访问注册页面
<Signup onSuccess={handleSuccess} />

// 2. 注册成功后自动登录或跳转到登录页
const handleSuccess = () => {
  // 重定向到主页或登录页
};

// 3. 用户登录
<Login onSuccess={handleLoginSuccess} />

// 4. 登录成功后重定向
const handleLoginSuccess = () => {
  // 重定向到用户原本想访问的页面
};
```

### 场景2: 会话过期处理
```typescript
import { useSessionExpiryRedirect } from './src/hooks/useSessionExpiry';

function App() {
  // 会话过期时自动重定向到登录页
  useSessionExpiryRedirect(() => {
    console.log('会话过期，重定向到登录页');
    // 显示通知
    toast.warning('您的登录已过期，请重新登录');
  });
  
  return <YourApp />;
}
```

### 场景3: 显示加载状态和错误
```typescript
import { useToast } from './src/hooks/useToast';
import { FullPageLoading } from './src/components/UIFeedback';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const handleAction = async () => {
    setLoading(true);
    try {
      await someAsyncOperation();
      toast.success('操作成功');
    } catch (error) {
      toast.error('操作失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <FullPageLoading message="处理中..." />;
  }
  
  return <button onClick={handleAction}>执行操作</button>;
}
```

### 场景4: 网络错误处理
```typescript
import { networkErrorHandler } from './src/utils/networkErrorHandler';

// 自动重试的网络请求
const result = await networkErrorHandler.executeWithRetry(
  async () => {
    // 你的异步操作
    return await someApiCall();
  },
  'operation-name',
  { maxRetries: 3, retryable: true }
);
```

## 关键API参考

### AuthContext
```typescript
interface AuthContextType {
  user: User | null;              // 当前用户
  session: Session | null;        // 当前会话
  loading: boolean;               // 加载状态
  signIn: (email, password, rememberMe?) => Promise<AuthResponse>;
  signUp: (email, password) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email) => Promise<AuthResponse>;
}
```

### SessionManager
```typescript
interface SessionManager {
  getCurrentSession: () => Promise<Session | null>;
  refreshSession: () => Promise<Session | null>;
  clearSession: () => Promise<void>;
  onSessionChange: (callback) => () => void;
  isSessionValid: () => Promise<boolean>;
  hasRole: (role: string) => Promise<boolean>;
  isAdmin: () => Promise<boolean>;
}
```

### Toast系统
```typescript
interface ToastHook {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}
```

## 数据隔离说明

### Row Level Security (RLS)
所有数据表都启用了RLS策略，确保：
- 用户只能访问自己的数据
- 创建数据时自动关联用户ID
- 管理员可以访问所有数据（需要admin角色）

### 自动应用的策略
```sql
-- 用户只能查看自己的任务
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建属于自己的任务
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有任务
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
```

## 调试技巧

### 查看认证状态
```typescript
import { useAuth } from './src/contexts/AuthContext';

function DebugAuth() {
  const { user, session, loading } = useAuth();
  
  console.log('User:', user);
  console.log('Session:', session);
  console.log('Loading:', loading);
  
  return null;
}
```

### 查看会话信息
```typescript
import { sessionManager, sessionUtils } from './src/utils/sessionManager';

const session = await sessionManager.getCurrentSession();
console.log(sessionUtils.formatSessionInfo(session));
console.log('Time remaining:', sessionUtils.getSessionTimeRemaining(session));
```

### 查看错误日志
```typescript
import { errorLogger } from './src/utils/errorLogger';

// 错误会自动记录到控制台
// 在生产环境中，可以配置发送到远程日志服务
```

## 常见问题

### Q: 如何检查用户是否已登录？
```typescript
const { user } = useAuth();
const isLoggedIn = user !== null;
```

### Q: 如何在应用启动时恢复会话？
会话会自动恢复，AuthContext在初始化时会检查localStorage中的会话。

### Q: 如何处理会话过期？
使用 `useSessionExpiryRedirect` Hook，它会自动监听会话过期事件并重定向。

### Q: 如何创建管理员账户？
先注册一个普通用户，然后在Supabase SQL编辑器中执行：
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-id-here', 'admin');
```

### Q: 如何测试数据隔离？
1. 创建两个用户账户
2. 分别登录并创建数据
3. 验证每个用户只能看到自己的数据

### Q: 如何自定义错误消息？
在 `src/utils/authErrors.ts` 中修改错误消息映射。

## 性能优化建议

### 1. 避免不必要的会话检查
```typescript
// ❌ 不好 - 每次渲染都检查
function MyComponent() {
  const session = await sessionManager.getCurrentSession();
  // ...
}

// ✅ 好 - 使用AuthContext
function MyComponent() {
  const { user, session } = useAuth();
  // ...
}
```

### 2. 使用React.memo优化组件
```typescript
const MyComponent = React.memo(({ user }) => {
  // 只在user变化时重新渲染
  return <div>{user.email}</div>;
});
```

### 3. 批量数据操作
```typescript
// ❌ 不好 - 多次查询
for (const id of ids) {
  await deleteTask(id);
}

// ✅ 好 - 批量删除
await deleteTasks(ids);
```

## 安全最佳实践

### 1. 永远不要在客户端存储敏感信息
```typescript
// ❌ 不要这样做
localStorage.setItem('password', password);

// ✅ 只存储会话令牌（Supabase自动处理）
```

### 2. 验证用户输入
```typescript
// ✅ 使用验证函数
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### 3. 使用HTTPS
确保生产环境使用HTTPS，保护会话令牌传输。

### 4. 定期刷新会话
Supabase会自动刷新会话，但可以手动触发：
```typescript
await sessionManager.refreshSession();
```

## 下一步

### 完成密码重置功能
参考任务9的要求，创建密码重置UI组件。

### 添加集成测试
参考任务13.2的建议，编写自动化测试。

### 增强功能
考虑添加：
- 双因素认证 (2FA)
- 社交登录
- 用户配置文件编辑
- 邮箱验证提醒

## 相关文档
- 集成验证报告: `INTEGRATION_VERIFICATION.md`
- 任务13总结: `TASK_13_SUMMARY.md`
- 需求文档: `requirements.md`
- 设计文档: `design.md`
- Supabase文档: https://supabase.com/docs

## 获取帮助
- 查看错误日志: 浏览器控制台
- 查看Supabase日志: Supabase Dashboard -> Logs
- 检查RLS策略: Supabase Dashboard -> Authentication -> Policies
