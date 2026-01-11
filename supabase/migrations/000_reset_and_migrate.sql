-- ============================================
-- 完整重置和迁移脚本
-- 警告：此脚本会删除所有现有数据！
-- ============================================

-- ============================================
-- 第一步：删除所有现有表和相关对象
-- ============================================

-- 删除视图
DROP VIEW IF EXISTS admin_user_stats CASCADE;

-- 删除表（按依赖关系倒序删除）
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS salary_deductions CASCADE;
DROP TABLE IF EXISTS salary_settings CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- 第二步：创建辅助函数
-- ============================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 第三步：创建所有表
-- ============================================

-- 1. Tasks 表
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    completed BOOLEAN DEFAULT FALSE,
    date_label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_date_label ON tasks(date_label);

-- 2. Attendance Records 表
CREATE TABLE attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    record_type TEXT CHECK (record_type IN ('上班', '下班')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_date ON attendance_records(record_date);

-- 3. Transactions 表
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('Income', 'Expense')) NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT 'receipt',
    payment_method TEXT,
    transaction_date DATE NOT NULL,
    transaction_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- 4. Daily Reports 表
CREATE TABLE daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    work_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    daily_income DECIMAL(10, 2) DEFAULT 0,
    daily_expense DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, report_date)
);

CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- 5. Salary Settings 表
CREATE TABLE salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 105.00,
    overtime_rate DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    transport_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 2000.00,
    xiaowang_diff DECIMAL(10, 2) DEFAULT 0,
    xiaowang_pension DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TRIGGER update_salary_settings_updated_at
    BEFORE UPDATE ON salary_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_salary_settings_user_id ON salary_settings(user_id);

-- 6. Salary Deductions 表
CREATE TABLE salary_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deduction_month DATE NOT NULL,
    xiaowang_diff DECIMAL(10, 2) DEFAULT 0,
    xiaowang_pension DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, deduction_month)
);

CREATE TRIGGER update_salary_deductions_updated_at
    BEFORE UPDATE ON salary_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_salary_deductions_user_id ON salary_deductions(user_id);
CREATE INDEX idx_salary_deductions_month ON salary_deductions(deduction_month);

-- 7. User Profiles 表
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. User Roles 表
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- 第四步：启用 RLS
-- ============================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第五步：创建 RLS 策略
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

CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (
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

-- Attendance Records 表策略
CREATE POLICY "Users can view own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attendance" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON attendance_records
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance" ON attendance_records
  FOR SELECT USING (
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

-- Transactions 表策略
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
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

-- Daily Reports 表策略
CREATE POLICY "Users can view own daily_reports" ON daily_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_reports" ON daily_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_reports" ON daily_reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily_reports" ON daily_reports
  FOR SELECT USING (
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

-- Salary Settings 表策略
CREATE POLICY "Users can view own salary_settings" ON salary_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_settings" ON salary_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_settings" ON salary_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_settings" ON salary_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all salary_settings" ON salary_settings
  FOR SELECT USING (
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

-- Salary Deductions 表策略
CREATE POLICY "Users can view own salary_deductions" ON salary_deductions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own salary_deductions" ON salary_deductions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary_deductions" ON salary_deductions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary_deductions" ON salary_deductions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all salary_deductions" ON salary_deductions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all salary_deductions" ON salary_deductions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete all salary_deductions" ON salary_deductions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- User Profiles 表策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- User Roles 表策略
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 第六步：创建管理员统计视图
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

GRANT SELECT ON admin_user_stats TO authenticated;

-- ============================================
-- 完成！数据库已重置并重新创建
-- ============================================
