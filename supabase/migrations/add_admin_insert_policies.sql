-- 添加管理员 INSERT 策略
-- 允许管理员代表其他用户创建数据

-- 先删除可能存在的旧策略，避免冲突
DROP POLICY IF EXISTS "Admins can insert all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can insert all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can insert all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can insert all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can insert all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can insert all salary_deductions" ON salary_deductions;

-- Tasks 表
CREATE POLICY "Admins can insert all tasks" ON tasks
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Attendance Records 表
CREATE POLICY "Admins can insert all attendance" ON attendance_records
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Transactions 表
CREATE POLICY "Admins can insert all transactions" ON transactions
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Daily Reports 表
CREATE POLICY "Admins can insert all daily_reports" ON daily_reports
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Salary Settings 表
CREATE POLICY "Admins can insert all salary_settings" ON salary_settings
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Salary Deductions 表 (如果存在)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_deductions') THEN
    EXECUTE 'CREATE POLICY "Admins can insert all salary_deductions" ON salary_deductions
      FOR INSERT 
      WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;

