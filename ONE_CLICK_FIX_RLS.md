# 一键修复所有表的 RLS 权限问题

## 🚨 问题描述
管理员无法对其他用户的数据进行增删改查操作。

## ✅ 一键修复方案

### 步骤 1：在 Supabase Dashboard 执行 SQL

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制下面的完整 SQL 并执行

```sql
-- 复制 supabase/migrations/fix_all_tables_rls.sql 的全部内容
-- 粘贴到 SQL Editor 并点击 RUN
```

### 步骤 2：验证修复成功

执行以下查询检查策略：

```sql
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
GROUP BY tablename
ORDER BY tablename;
```

**预期结果：**
每个表应该有 8 个策略（4 个用户策略 + 4 个管理员策略）

| tablename | policy_count |
|-----------|--------------|
| attendance_records | 8 |
| daily_reports | 8 |
| salary_settings | 8 |
| tasks | 8 |
| transactions | 8 |

### 步骤 3：测试管理员权限

刷新浏览器，然后测试以下操作：

#### ✅ 查看数据
- 切换到不同用户
- 查看任务、打卡、交易、日报、工资设置
- 应该能看到选中用户的所有数据

#### ✅ 创建数据
- 为选中的用户创建任务
- 为选中的用户添加打卡记录
- 为选中的用户添加交易
- 为选中的用户保存日报
- 为选中的用户更新工资设置

#### ✅ 修改数据
- 修改选中用户的任务
- 修改选中用户的打卡记录
- 修改选中用户的交易
- 修改选中用户的工资设置

#### ✅ 删除数据
- 删除选中用户的任务
- 删除选中用户的打卡记录
- 删除选中用户的交易
- 删除选中用户的日报

## 🔍 详细验证

### 检查每个表的策略

```sql
-- Tasks 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks' ORDER BY cmd, policyname;

-- Attendance Records 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'attendance_records' ORDER BY cmd, policyname;

-- Transactions 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'transactions' ORDER BY cmd, policyname;

-- Daily Reports 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'daily_reports' ORDER BY cmd, policyname;

-- Salary Settings 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'salary_settings' ORDER BY cmd, policyname;
```

### 每个表应该有的策略

**DELETE 操作：**
- Admins can delete all [table_name]
- Users can delete own [table_name]

**INSERT 操作：**
- Admins can insert all [table_name]
- Users can create own [table_name]

**SELECT 操作：**
- Admins can view all [table_name]
- Users can view own [table_name]

**UPDATE 操作：**
- Admins can update all [table_name]
- Users can update own [table_name]

## 🎯 修复内容

这个 SQL 脚本会：

1. ✅ 启用所有表的 RLS
2. ✅ 删除所有旧的策略（避免冲突）
3. ✅ 为每个表创建 4 个用户策略（SELECT, INSERT, UPDATE, DELETE）
4. ✅ 为每个表创建 4 个管理员策略（SELECT, INSERT, UPDATE, DELETE）
5. ✅ 确保管理员可以操作所有用户的数据
6. ✅ 确保普通用户只能操作自己的数据

## 📋 涵盖的表

- ✅ tasks（任务）
- ✅ attendance_records（打卡记录）
- ✅ transactions（交易记录）
- ✅ daily_reports（日报）
- ✅ salary_settings（工资设置）

## ⚠️ 注意事项

1. **执行前备份：** 虽然这个脚本是安全的，但建议先在测试环境执行
2. **管理员账号：** 确保你的账号在 `user_roles` 表中有 `admin` 角色
3. **刷新浏览器：** 执行后需要刷新浏览器清除缓存
4. **检查错误：** 如果执行时有错误，查看 SQL Editor 的错误信息

## 🔧 故障排查

### 问题：执行 SQL 时报错

**可能原因：**
- 表不存在
- 策略名称冲突

**解决方案：**
```sql
-- 检查表是否存在
SELECT tablename FROM pg_tables 
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings');

-- 如果表不存在，需要先创建表
```

### 问题：管理员仍然无法操作

**检查 1：确认是管理员**
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```
应该看到 `role = 'admin'`

**检查 2：确认策略已创建**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'tasks' 
AND policyname LIKE '%Admins%';
```
应该返回 4

**检查 3：清除浏览器缓存**
- 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新

### 问题：普通用户无法操作自己的数据

**检查用户策略：**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'tasks' 
AND policyname LIKE '%Users%';
```
应该看到 4 个用户策略

## 🎉 完成

修复完成后，管理员应该能够：
- ✅ 查看所有用户的数据
- ✅ 为任何用户创建数据
- ✅ 修改任何用户的数据
- ✅ 删除任何用户的数据

普通用户仍然只能操作自己的数据！

## 📞 需要帮助？

如果修复后仍有问题，请提供：
1. 错误信息截图
2. 执行的 SQL 语句
3. 用户角色信息（`SELECT * FROM user_roles WHERE user_id = auth.uid()`）
4. 策略列表（`SELECT * FROM pg_policies WHERE tablename = 'tasks'`）
