-- LifeOS 智能生活管家 - 数据库初始化脚本
-- 在 Supabase Dashboard 的 SQL Editor 中运行此脚本

-- ============================================
-- 1. 创建任务表 (tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(), -- 简化版本，不使用真实用户认证
    title TEXT NOT NULL,
    scheduled_time TIME NOT NULL DEFAULT '09:00',
    category TEXT NOT NULL DEFAULT '工作',
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    date_label TEXT NOT NULL DEFAULT '今日',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 创建打卡记录表 (attendance_records)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(),
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    record_time TIME NOT NULL DEFAULT CURRENT_TIME,
    record_type TEXT NOT NULL CHECK (record_type IN ('上班', '下班')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以优化按日期查询
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, record_date DESC);

-- ============================================
-- 3. 创建交易记录表 (transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense')),
    category TEXT NOT NULL DEFAULT '其他',
    icon TEXT NOT NULL DEFAULT 'receipt',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以优化按月份查询
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_month ON transactions(user_id, transaction_date DESC);

-- ============================================
-- 4. Row Level Security (RLS) 策略
-- 注意：这里设置为公开访问，生产环境应启用用户认证
-- ============================================

-- 启用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（开发/演示用）
CREATE POLICY "Allow public read access on tasks" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on tasks" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on tasks" ON tasks
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on tasks" ON tasks
    FOR DELETE USING (true);

CREATE POLICY "Allow public read access on attendance_records" ON attendance_records
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on attendance_records" ON attendance_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on attendance_records" ON attendance_records
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on attendance_records" ON attendance_records
    FOR DELETE USING (true);

CREATE POLICY "Allow public read access on transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on transactions" ON transactions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on transactions" ON transactions
    FOR DELETE USING (true);

-- ============================================
-- 5. 插入示例数据
-- ============================================

-- 示例任务
INSERT INTO tasks (title, scheduled_time, category, priority, completed, date_label) VALUES
('提交 Q3 报告', '10:00', '工作', 'High', false, '今日'),
('健身房锻炼', '18:00', '个人', 'Medium', false, '今日'),
('阅读书籍', '21:00', '休闲', 'Low', false, '今日'),
('牙医预约', '14:00', '医疗', 'Low', false, '明天'),
('购买杂货', '12:00', '购物清单', 'Medium', true, '已完成');

-- 示例打卡记录
INSERT INTO attendance_records (record_date, record_time, record_type) VALUES
(CURRENT_DATE, '09:05', '上班'),
(CURRENT_DATE - INTERVAL '1 day', '18:10', '下班'),
(CURRENT_DATE - INTERVAL '1 day', '09:15', '上班');

-- 示例交易记录
INSERT INTO transactions (name, amount, transaction_type, category, icon, transaction_date, transaction_time) VALUES
('Uber Eats', -24.50, 'Expense', '餐饮', 'lunch_dining', CURRENT_DATE, '12:42'),
('公交卡充值', -5.00, 'Expense', '交通', 'directions_bus', CURRENT_DATE - INTERVAL '1 day', '08:15'),
('月度工资', 3500.00, 'Income', '收入', 'work', CURRENT_DATE, '09:00'),
('Apple Store', -120.00, 'Expense', '购物', 'shopping_bag', CURRENT_DATE - INTERVAL '2 days', '14:30'),
('星巴克咖啡', -38.00, 'Expense', '餐饮', 'coffee', CURRENT_DATE - INTERVAL '3 days', '10:15'),
('京东商城', -299.00, 'Expense', '购物', 'shopping_cart', CURRENT_DATE - INTERVAL '4 days', '16:20');

-- ============================================
-- 完成！请确保在 Supabase Dashboard 中成功运行此脚本
-- ============================================
