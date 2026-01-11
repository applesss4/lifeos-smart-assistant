# 管理员增删改查功能 - 快速部署指南

## 🚀 部署步骤

### 1. 修复 Salary Settings 表权限（重要！）

**如果遇到 406 错误，必须先执行此步骤：**

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 复制 supabase/migrations/fix_salary_settings_rls.sql 的内容
-- 在 SQL Editor 中执行
```

这将修复 `salary_settings` 表的 RLS 策略，确保管理员可以正常访问。

### 2. 应用管理员 INSERT 策略

在 Supabase Dashboard 中执行以下 SQL：

```sql
-- 复制 supabase/migrations/add_admin_insert_policies.sql 的内容
-- 在 SQL Editor 中执行
```

或者使用命令行：

```bash
# 如果使用 Supabase CLI
supabase db push
```

### 3. 验证迁移成功

在 Supabase Dashboard 的 SQL Editor 中运行：

```sql
-- 检查策略是否创建成功
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE policyname LIKE '%Admins can insert%'
ORDER BY tablename;
```

应该看到以下策略：
- ✅ Admins can insert all tasks
- ✅ Admins can insert all attendance
- ✅ Admins can insert all transactions
- ✅ Admins can insert all daily_reports
- ✅ Admins can insert all salary_settings

### 3. 测试管理员权限

#### 测试创建任务
```typescript
// 在管理员后端中
import * as taskService from '../../../src/services/taskService';

// 为选中的用户创建任务
const task = await taskService.createTask({
  title: '测试任务',
  time: '14:00',
  category: '工作',
  priority: 'High',
  completed: false,
  date: '今日'
}, selectedUserId);

console.log('任务创建成功:', task);
```

#### 测试创建交易
```typescript
import * as transactionService from '../../../src/services/transactionService';

// 为选中的用户添加支出
const expense = await transactionService.addExpense(
  '测试支出',
  100,
  '其他',
  '现金',
  selectedUserId
);

console.log('支出创建成功:', expense);
```

#### 测试打卡
```typescript
import * as attendanceService from '../../../src/services/attendanceService';

// 为选中的用户打卡
const record = await attendanceService.punchIn(selectedUserId);

console.log('打卡成功:', record);
```

#### 测试工资设置
```typescript
import * as salaryService from '../../../src/services/salaryService';

// 为选中的用户更新工资设置
const settings = await salaryService.updateSalarySettings({
  hourly_rate: 105,
  overtime_rate: 150,
  transport_fee: 500,
  bonus: 2000,
  xiaowang_diff: 0,
  xiaowang_pension: 0
}, selectedUserId);

console.log('工资设置更新成功:', settings);
```

## ✅ 验证清单

- [ ] 数据库迁移已应用
- [ ] 所有 INSERT 策略已创建
- [ ] 管理员可以为其他用户创建任务
- [ ] 管理员可以为其他用户添加交易
- [ ] 管理员可以为其他用户打卡
- [ ] 管理员可以为其他用户保存日报
- [ ] 管理员可以为其他用户更新工资设置
- [ ] 管理员可以删除其他用户的数据
- [ ] 普通用户只能操作自己的数据

## 🔍 故障排查

### 问题：管理员无法创建数据

**检查 1：确认用户是管理员**
```sql
SELECT * FROM user_roles WHERE user_id = 'YOUR_ADMIN_USER_ID';
```

应该看到 `role = 'admin'`

**检查 2：确认 INSERT 策略存在**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'tasks' 
AND policyname = 'Admins can insert all tasks';
```

**检查 3：查看错误日志**
在浏览器控制台查看详细错误信息

### 问题：权限被拒绝

可能原因：
1. 用户不是管理员
2. INSERT 策略未创建
3. RLS 未正确配置

解决方案：
```sql
-- 重新应用迁移
-- 复制 add_admin_insert_policies.sql 的内容并执行
```

## 📝 注意事项

1. **向后兼容：** 所有修改都是向后兼容的
2. **可选参数：** `targetUserId` 是可选的，不传则为当前用户
3. **自动验证：** RLS 会自动验证权限
4. **错误处理：** 非管理员操作会被数据库拒绝

## 🎉 完成

部署完成后，管理员可以：
- ✅ 查看所有用户的数据
- ✅ 为任何用户创建数据
- ✅ 修改任何用户的数据
- ✅ 删除任何用户的数据

普通用户仍然只能操作自己的数据！
