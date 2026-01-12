-- 添加休息日支持
-- 为 attendance_records 表添加"休息"类型支持

-- 修改 record_type 的检查约束，添加"休息"类型
ALTER TABLE attendance_records 
DROP CONSTRAINT IF EXISTS attendance_records_record_type_check;

ALTER TABLE attendance_records 
ADD CONSTRAINT attendance_records_record_type_check 
CHECK (record_type IN ('上班', '下班', '休息'));

-- 添加注释说明
COMMENT ON COLUMN attendance_records.record_type IS '打卡类型：上班、下班、休息';

-- 为休息日记录创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendance_rest_days 
ON attendance_records(user_id, record_date) 
WHERE record_type = '休息';
