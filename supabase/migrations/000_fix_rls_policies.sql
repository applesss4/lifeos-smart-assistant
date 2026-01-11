-- ============================================
-- 修复 RLS 策略 - 移除无限递归问题
-- 此脚本不会删除任何数据，只更新策略
-- ============================================

-- ============================================
-- 删除所有现有策略
-- ============================================

-- Tasks 表
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete all tasks" ON tasks;

-- Attendance Records 表
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can update all attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admins can delete all attendance" ON attendance_records;

-- Transactions 表
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can delete all transactions" ON transactions;

-- Daily Reports 表
DROP POLICY IF EXISTS "Users can view own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can create own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can update own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete own daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can view all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can update all daily_reports" ON daily_reports;
DROP POLICY IF EXISTS "Admins can delete all daily_reports" ON daily_reports;

-- Salary Settings 表
DROP POLICY IF EXISTS "Users can view own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can create own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can update own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Users can delete own salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can view all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can update all salary_settings" ON salary_settings;
DROP POLICY IF EXISTS "Admins can delete all salary_settings" ON salary_settings;

-- Salary Deductions 表
DROP POLICY IF EXISTS "Users can view own salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Users can create own salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Users can update own salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Users can delete own salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Admins can view all salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Admins can update all salary_deductions" ON salary_deductions;
DROP POLICY IF EXISTS "Admins can delete all salary_deductions" ON salary_deductions;

-- User Profiles 表
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- User Roles 表
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- ============================================
-- 创建新的 RLS 策略（无递归）
-- ============================================

-- Tasks 表策略
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Attendance Records 表策略
CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attendance" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON attendance_records
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions 表策略
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Reports 表策略
CREATE POLICY "Users can view own daily_reports" ON daily_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_reports" ON daily_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_reports" ON daily_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Salary Settings 表策略
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Salary Deductions 表策略
CREATE POLICY "Users can view own salary_deductions" ON salary_deductions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_deductions" ON salary_deductions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_deductions" ON salary_deductions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_deductions" ON salary_deductions
  FOR DELETE USING (auth.uid() = user_id);

-- User Profiles 表策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Roles 表策略（简化，避免递归）
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own roles" ON user_roles
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 完成！RLS 策略已修复
-- ============================================
