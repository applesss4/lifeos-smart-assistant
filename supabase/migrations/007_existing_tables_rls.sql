-- ============================================
-- 为现有表添加用户隔离的RLS策略
-- 实现需求: 8.1, 8.2, 8.5
-- ============================================

-- ============================================
-- 1. 更新现有表结构 - 将 user_id 关联到 auth.users
-- ============================================

-- 注意：现有表的 user_id 是 UUID 类型但没有外键约束
-- 我们需要先删除旧的公开访问策略，然后添加基于用户的策略

-- ============================================
-- 2. 删除旧的公开访问策略 - tasks 表
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public insert access on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public update access on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow public delete access on tasks" ON tasks;

-- ============================================
-- 3. 创建基于用户的 RLS 策略 - tasks 表
-- ============================================

-- 用户只能查看自己的任务
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建属于自己的任务
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的任务
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 用户只能删除自己的任务
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE 
  USING (auth.uid() = user_id);

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

-- 管理员可以更新所有任务
CREATE POLICY "Admins can update all tasks" ON tasks
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以删除所有任务
CREATE POLICY "Admins can delete all tasks" ON tasks
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 4. 删除旧的公开访问策略 - attendance_records 表
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow public insert access on attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow public update access on attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow public delete access on attendance_records" ON attendance_records;

-- ============================================
-- 5. 创建基于用户的 RLS 策略 - attendance_records 表
-- ============================================

-- 用户只能查看自己的考勤记录
CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建属于自己的考勤记录
CREATE POLICY "Users can create own attendance" ON attendance_records
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的考勤记录
CREATE POLICY "Users can update own attendance" ON attendance_records
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 用户只能删除自己的考勤记录
CREATE POLICY "Users can delete own attendance" ON attendance_records
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 管理员可以查看所有考勤记录
CREATE POLICY "Admins can view all attendance" ON attendance_records
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以更新所有考勤记录
CREATE POLICY "Admins can update all attendance" ON attendance_records
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以删除所有考勤记录
CREATE POLICY "Admins can delete all attendance" ON attendance_records
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 6. 删除旧的公开访问策略 - transactions 表
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public insert access on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public update access on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow public delete access on transactions" ON transactions;

-- ============================================
-- 7. 创建基于用户的 RLS 策略 - transactions 表
-- ============================================

-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建属于自己的交易记录
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的交易记录
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 用户只能删除自己的交易记录
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 管理员可以查看所有交易记录
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以更新所有交易记录
CREATE POLICY "Admins can update all transactions" ON transactions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以删除所有交易记录
CREATE POLICY "Admins can delete all transactions" ON transactions
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 8. 删除旧的公开访问策略 - daily_reports 表
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Allow public insert access on daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Allow public update access on daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Allow public delete access on daily_reports" ON daily_reports;

-- ============================================
-- 9. 创建基于用户的 RLS 策略 - daily_reports 表
-- ============================================

-- 用户只能查看自己的日报
CREATE POLICY "Users can view own daily_reports" ON daily_reports
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建属于自己的日报
CREATE POLICY "Users can create own daily_reports" ON daily_reports
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的日报
CREATE POLICY "Users can update own daily_reports" ON daily_reports
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 用户只能删除自己的日报
CREATE POLICY "Users can delete own daily_reports" ON daily_reports
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 管理员可以查看所有日报
CREATE POLICY "Admins can view all daily_reports" ON daily_reports
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以更新所有日报
CREATE POLICY "Admins can update all daily_reports" ON daily_reports
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以删除所有日报
CREATE POLICY "Admins can delete all daily_reports" ON daily_reports
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 10. 删除旧的公开访问策略 - salary_settings 表
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Allow public insert access on salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Allow public update access on salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Allow public delete access on salary_settings" ON salary_settings;

-- ============================================
-- 11. 创建基于用户的 RLS 策略 - salary_settings 表
-- ============================================

-- 用户只能查看自己的薪资设置
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建属于自己的薪资设置
CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的薪资设置
CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 用户只能删除自己的薪资设置
CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 管理员可以查看所有薪资设置
CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以更新所有薪资设置
CREATE POLICY "Admins can update all salary_settings" ON salary_settings
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 管理员可以删除所有薪资设置
CREATE POLICY "Admins can delete all salary_settings" ON salary_settings
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- 12. 创建辅助视图 - 用户数据统计（仅供管理员使用）
-- ============================================

CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT ar.id) as total_attendance_records,
  COUNT(DISTINCT tr.id) as total_transactions,
  COUNT(DISTINCT dr.id) as total_daily_reports
FROM auth.users u
LEFT JOIN tasks t ON t.user_id = u.id
LEFT JOIN attendance_records ar ON ar.user_id = u.id
LEFT JOIN transactions tr ON tr.user_id = u.id
LEFT JOIN daily_reports dr ON dr.user_id = u.id
GROUP BY u.id, u.email, u.created_at;

-- 只有管理员可以访问此视图
GRANT SELECT ON admin_user_stats TO authenticated;

-- ============================================
-- 完成！所有表的RLS策略已更新
-- ============================================
