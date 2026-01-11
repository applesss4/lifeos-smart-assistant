# Supabase 数据库迁移

本目录包含智能生活管家应用的所有数据库迁移脚本。

## 迁移文件列表

1. **001_initial_schema.sql** - 初始数据库架构（任务、考勤、交易表）
2. **002_daily_reports.sql** - 日报存档表
3. **003_salary_settings.sql** - 薪资设置表
4. **004_salary_deductions.sql** - 薪资扣除字段
5. **005_payment_method.sql** - 支付方式字段
6. **006_user_profiles_and_rls.sql** - 用户配置文件表和RLS策略 ⭐ 新增
7. **007_existing_tables_rls.sql** - 现有表的用户隔离RLS策略 ⭐ 新增

## 如何应用迁移

### 方法 1: 使用 Supabase Dashboard（推荐）

1. 登录到 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 导航到 **SQL Editor**
4. 按顺序复制并执行每个迁移文件的内容
5. 确保每个迁移都成功执行后再继续下一个

### 方法 2: 使用 Supabase CLI

如果你已经安装了 Supabase CLI：

```bash
# 初始化 Supabase 项目（如果还没有）
supabase init

# 链接到你的远程项目
supabase link --project-ref your-project-ref

# 应用所有迁移
supabase db push
```

## 重要说明

### 关于迁移 006 和 007

这两个迁移实现了完整的用户数据隔离：

- **006_user_profiles_and_rls.sql**: 创建用户配置文件表和角色系统
- **007_existing_tables_rls.sql**: 为所有现有表添加基于用户的访问控制

### 迁移前的准备

⚠️ **警告**: 迁移 007 会删除所有现有的公开访问策略，并替换为基于用户的策略。

在应用这些迁移之前：

1. **备份你的数据库**
2. **确保你的应用已经实现了认证系统**（任务 1-5）
3. **更新所有数据操作代码**，确保它们使用认证用户的 ID

### 迁移后的影响

应用迁移 006 和 007 后：

- ✅ 每个用户只能访问自己的数据
- ✅ 管理员可以访问所有用户的数据
- ✅ 新用户注册时自动创建配置文件和默认角色
- ✅ 所有数据操作都会自动应用用户过滤

### 数据迁移

如果你有现有的测试数据，需要将 `user_id` 更新为实际的认证用户 ID：

```sql
-- 示例：将现有数据关联到特定用户
UPDATE tasks SET user_id = 'your-auth-user-id' WHERE user_id IS NOT NULL;
UPDATE attendance_records SET user_id = 'your-auth-user-id' WHERE user_id IS NOT NULL;
UPDATE transactions SET user_id = 'your-auth-user-id' WHERE user_id IS NOT NULL;
UPDATE daily_reports SET user_id = 'your-auth-user-id' WHERE user_id IS NOT NULL;
UPDATE salary_settings SET user_id = 'your-auth-user-id' WHERE user_id IS NOT NULL;
```

## 验证迁移

应用迁移后，你可以运行以下查询来验证 RLS 策略是否正确设置：

```sql
-- 检查所有表的 RLS 状态
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 查看特定表的策略
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- 测试用户数据隔离（需要先登录）
SELECT * FROM tasks; -- 应该只返回当前用户的任务
```

## 回滚迁移

如果需要回滚到公开访问模式（仅用于开发/测试）：

```sql
-- 警告：这会移除所有数据隔离保护！
-- 仅在开发环境中使用

-- 为每个表重新创建公开访问策略
CREATE POLICY "Allow public access" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow public access" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Allow public access" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow public access" ON daily_reports FOR ALL USING (true);
CREATE POLICY "Allow public access" ON salary_settings FOR ALL USING (true);
```

## 故障排除

### 问题：迁移失败，提示 "trigger already exists" 或 "function already exists"

**解决方案**: 迁移文件已经更新为幂等的（可以安全地多次运行）。如果遇到此错误：

1. 确保使用最新版本的迁移文件
2. 迁移文件现在使用 `CREATE OR REPLACE FUNCTION` 和 `DROP TRIGGER IF EXISTS`
3. 可以安全地重新运行迁移

如果问题持续，可以手动清理：

```sql
-- 清理可能冲突的对象
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_roles() CASCADE;
```

然后重新运行迁移。

### 问题：迁移失败，提示 "function update_updated_at_column() does not exist"

**解决方案**: 确保先运行 001_initial_schema.sql，它包含了这个函数的定义。

### 问题：无法访问任何数据

**解决方案**: 
1. 确认用户已登录（`auth.uid()` 不为 null）
2. 检查数据的 `user_id` 是否与当前登录用户匹配
3. 验证 RLS 策略是否正确应用

### 问题：管理员无法访问所有数据

**解决方案**:
1. 确认管理员用户在 `user_roles` 表中有 'admin' 角色
2. 检查管理员策略是否正确创建

```sql
-- 为用户添加管理员角色
INSERT INTO user_roles (user_id, role) 
VALUES ('your-admin-user-id', 'admin');
```

## 联系支持

如果遇到问题，请查看：
- [Supabase 文档 - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase 文档 - 数据库迁移](https://supabase.com/docs/guides/cli/local-development#database-migrations)
