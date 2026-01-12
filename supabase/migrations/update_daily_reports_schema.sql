-- 更新 daily_reports 表结构以匹配应用代码
-- 添加缺失的字段

-- 1. 重命名现有字段以匹配代码
ALTER TABLE daily_reports 
  RENAME COLUMN work_hours TO total_hours;

ALTER TABLE daily_reports 
  RENAME COLUMN daily_income TO total_earned;

ALTER TABLE daily_reports 
  RENAME COLUMN daily_expense TO total_spent;

-- 2. 添加新字段
ALTER TABLE daily_reports 
  ADD COLUMN IF NOT EXISTS completed_tasks_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_tasks_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_tasks_titles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pending_tasks_titles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expense_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS biggest_expense_name TEXT,
  ADD COLUMN IF NOT EXISTS biggest_expense_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS narrative TEXT DEFAULT '';

-- 3. 更新注释
COMMENT ON TABLE daily_reports IS '用户每日工作报告表';
COMMENT ON COLUMN daily_reports.total_hours IS '总工作时长（小时）';
COMMENT ON COLUMN daily_reports.overtime_hours IS '加班时长（小时）';
COMMENT ON COLUMN daily_reports.total_earned IS '当日总收入';
COMMENT ON COLUMN daily_reports.total_spent IS '当日总支出';
COMMENT ON COLUMN daily_reports.completed_tasks_count IS '已完成任务数量';
COMMENT ON COLUMN daily_reports.pending_tasks_count IS '待办任务数量';
COMMENT ON COLUMN daily_reports.completed_tasks_titles IS '已完成任务标题列表';
COMMENT ON COLUMN daily_reports.pending_tasks_titles IS '待办任务标题列表';
COMMENT ON COLUMN daily_reports.expense_count IS '支出记录数量';
COMMENT ON COLUMN daily_reports.biggest_expense_name IS '最大支出项目名称';
COMMENT ON COLUMN daily_reports.biggest_expense_amount IS '最大支出金额';
COMMENT ON COLUMN daily_reports.narrative IS '日报总结文本';
