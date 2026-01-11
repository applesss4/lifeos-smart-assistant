# 应用 RLS 迁移指南

本指南将帮助你安全地应用用户数据隔离的 RLS 策略。

## 前提条件

在应用这些迁移之前，请确保：

- ✅ 已完成任务 1-5（认证基础架构、注册、登录、会话管理）
- ✅ 应用已经可以正常进行用户注册和登录
- ✅ 已备份数据库（重要！）

## 步骤 1: 备份数据库

在 Supabase Dashboard 中：

1. 进入 **Database** → **Backups**
2. 点击 **Create backup** 创建手动备份
3. 等待备份完成

## 步骤 2: 应用迁移 006（用户配置文件）

1. 打开 Supabase Dashboard → **SQL Editor**
2. 创建新查询
3. 复制 `006_user_profiles_and_rls.sql` 的全部内容
4. 点击 **Run** 执行
5. 确认执行成功（应该看到 "Success. No rows returned"）

### 验证迁移 006

运行以下查询验证：

```sql
-- 检查 profiles 表是否创建
SELECT * FROM profiles LIMIT 1;

-- 检查 user_roles 表是否创建
SELECT * FROM user_roles LIMIT 1;

-- 检查触发器是否创建
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 检查辅助函数是否创建
SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'get_user_roles', 'handle_new_user');
```

## 步骤 3: 测试自动配置文件创建

在应用迁移 007 之前，先测试用户注册流程：

1. 在你的应用中注册一个新用户
2. 运行以下查询检查配置文件是否自动创建：

```sql
-- 查看所有用户配置文件
SELECT * FROM profiles;

-- 查看所有用户角色
SELECT * FROM user_roles;
```

如果看到新用户的配置文件和角色，说明触发器工作正常。

## 步骤 4: 迁移现有数据（如果有）

如果你有现有的测试数据，需要将它们关联到真实用户：

```sql
-- 首先，获取一个真实的用户 ID
SELECT id, email FROM auth.users LIMIT 1;

-- 使用该 ID 更新现有数据（替换 'your-user-id-here'）
UPDATE tasks 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NOT NULL;

UPDATE attendance_records 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NOT NULL;

UPDATE transactions 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NOT NULL;

UPDATE daily_reports 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NOT NULL;

UPDATE salary_settings 
SET user_id = 'your-user-id-here' 
WHERE user_id IS NOT NULL;
```

## 步骤 5: 应用迁移 007（RLS 策略）

⚠️ **重要**: 这一步会删除所有公开访问策略，应用后未认证用户将无法访问任何数据。

1. 在 Supabase Dashboard → **SQL Editor** 中创建新查询
2. 复制 `007_existing_tables_rls.sql` 的全部内容
3. 点击 **Run** 执行
4. 确认执行成功

### 验证迁移 007

运行以下查询验证策略：

```sql
-- 查看所有表的 RLS 状态（应该都是 true）
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 查看 tasks 表的所有策略
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'tasks';

-- 应该看到类似这样的策略：
-- Users can view own tasks
-- Users can create own tasks
-- Users can update own tasks
-- Users can delete own tasks
-- Admins can view all tasks
-- Admins can update all tasks
-- Admins can delete all tasks
```

## 步骤 6: 测试数据隔离

### 测试普通用户访问

1. 在你的应用中以用户 A 登录
2. 创建一些任务、考勤记录等
3. 在 SQL Editor 中运行（使用用户 A 的会话）：

```sql
-- 应该只看到用户 A 的数据
SELECT * FROM tasks;
SELECT * FROM attendance_records;
SELECT * FROM transactions;
```

4. 登出，以用户 B 登录
5. 再次运行上述查询
6. 确认只能看到用户 B 的数据，看不到用户 A 的数据

### 测试管理员访问

1. 首先创建一个管理员用户：

```sql
-- 获取要设为管理员的用户 ID
SELECT id, email FROM auth.users;

-- 为该用户添加管理员角色（替换 'admin-user-id'）
INSERT INTO user_roles (user_id, role) 
VALUES ('admin-user-id', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

2. 以管理员用户登录应用
3. 确认可以看到所有用户的数据

## 步骤 7: 更新应用代码

确保你的应用代码在创建数据时使用当前用户的 ID：

```typescript
// ✅ 正确：使用当前认证用户的 ID
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New Task',
    user_id: user.id, // 使用认证用户的 ID
    // ... 其他字段
  });

// ❌ 错误：使用随机生成的 ID
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New Task',
    user_id: crypto.randomUUID(), // 这会导致 RLS 策略拒绝访问
    // ... 其他字段
  });
```

## 步骤 8: 更新服务层代码

检查并更新所有数据服务文件：

- `src/services/taskService.ts`
- `src/services/attendanceService.ts`
- `src/services/transactionService.ts`
- `src/services/dailyReportService.ts`
- `src/services/salaryService.ts`

确保它们都使用 `auth.uid()` 或从认证上下文获取用户 ID。

## 常见问题

### Q: 应用迁移后无法访问任何数据

**A**: 检查以下几点：
1. 确认用户已登录（检查 `supabase.auth.getUser()`）
2. 确认数据的 `user_id` 与当前用户 ID 匹配
3. 在浏览器控制台检查是否有 RLS 策略错误

### Q: 遇到 "trigger already exists" 错误

**A**: 这是正常的，说明触发器已经在之前的迁移中创建了。迁移文件已经更新为使用 `DROP TRIGGER IF EXISTS`，可以安全地重新运行。如果仍然遇到问题：

```sql
-- 手动删除触发器后重试
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

然后重新运行迁移 006。

### Q: 如何临时禁用 RLS 进行调试？

**A**: 在开发环境中，你可以临时禁用特定表的 RLS：

```sql
-- 警告：仅用于调试！
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 调试完成后记得重新启用
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

### Q: 如何回滚这些迁移？

**A**: 如果需要回滚：

1. 恢复之前创建的数据库备份，或
2. 手动删除策略并重新创建公开访问策略（参见 README.md）

### Q: 管理员看不到所有数据

**A**: 确认管理员角色已正确分配：

```sql
-- 检查用户角色
SELECT u.email, ur.role 
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id;

-- 如果缺少管理员角色，添加它
INSERT INTO user_roles (user_id, role) 
VALUES ('admin-user-id', 'admin');
```

## 完成！

如果所有步骤都成功完成，你的应用现在已经实现了完整的用户数据隔离：

- ✅ 每个用户只能访问自己的数据
- ✅ 管理员可以访问所有数据
- ✅ 新用户注册时自动创建配置文件
- ✅ 所有数据操作都受 RLS 策略保护

## 下一步

继续实现任务列表中的下一个任务：
- 任务 7: 实现路由保护
- 任务 8: 实现管理员认证
- 任务 9: 实现密码重置功能
