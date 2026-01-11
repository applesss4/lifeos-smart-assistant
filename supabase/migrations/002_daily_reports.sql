-- 日报存档表
-- 在 Supabase Dashboard 的 SQL Editor 中运行此脚本

CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    
    -- 工作统计
    total_hours DECIMAL(4, 1) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(4, 1) NOT NULL DEFAULT 0,
    total_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- 任务统计
    completed_tasks_count INT NOT NULL DEFAULT 0,
    pending_tasks_count INT NOT NULL DEFAULT 0,
    completed_tasks_titles TEXT[] DEFAULT '{}',
    pending_tasks_titles TEXT[] DEFAULT '{}',
    
    -- 支出统计
    total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
    expense_count INT NOT NULL DEFAULT 0,
    biggest_expense_name TEXT,
    biggest_expense_amount DECIMAL(10, 2),
    
    -- AI 生成的叙事总结
    narrative TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user ON daily_reports(user_id, report_date DESC);

-- RLS 策略
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on daily_reports" ON daily_reports
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on daily_reports" ON daily_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on daily_reports" ON daily_reports
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on daily_reports" ON daily_reports
    FOR DELETE USING (true);
