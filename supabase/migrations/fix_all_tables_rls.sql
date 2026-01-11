-- 修复所有表的 RLS 策略
-- 确保管理员可以对所有用户的数据进行完整的增删改查操作

-- ============================================
-- 1. TASKS 表
-- ============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can insert all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete all tasks" ON tasks;

-- 创建用户策略
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 创建管理员策略
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all tasks" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all tasks" ON tasks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 2. ATTENDANCE_RECORDS 表
-- ============================================
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can insert all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can update all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can delete all attendance" ON attendance_records;

-- 创建用户策略
CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attendance" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON attendance_records
  FOR DELETE USING (auth.uid() = user_id);

-- 创建管理员策略
CREATE POLICY "Admins can view all attendance" ON attendance_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all attendance" ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all attendance" ON attendance_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all attendance" ON attendance_records
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 3. TRANSACTIONS 表
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can insert all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can delete all transactions" ON transactions;

-- 创建用户策略
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- 创建管理员策略
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all transactions" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all transactions" ON transactions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 4. DAILY_REPORTS 表
-- ============================================
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can create own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can view all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can insert all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can update all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can delete all daily_reports" ON daily_reports;

-- 创建用户策略
CREATE POLICY "Users can view own daily_reports" ON daily_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_reports" ON daily_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_reports" ON daily_reports
  FOR DELETE USING (auth.uid() = user_id);

-- 创建管理员策略
CREATE POLICY "Admins can view all daily_reports" ON daily_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all daily_reports" ON daily_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all daily_reports" ON daily_reports
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 5. SALARY_SETTINGS 表
-- ============================================
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can view all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can insert all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can update all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can delete all salary_settings" ON salary_settings;

-- 创建用户策略
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 创建管理员策略
CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert all salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all salary_settings" ON salary_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all salary_settings" ON salary_settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 验证所有策略
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename IN ('tasks', 'attendance_records', 'transactions', 'daily_reports', 'salary_settings')
ORDER BY tablename, cmd, policyname;
