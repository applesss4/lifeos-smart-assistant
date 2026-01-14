-- 创建用户通知表
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily_report', 'monthly_report', 'custom')),
    reference_id TEXT, -- 关联的日报或月报ID
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- 启用 RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的通知
CREATE POLICY "Users can view their own notifications"
    ON user_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- 用户可以更新自己的通知（标记为已读）
CREATE POLICY "Users can update their own notifications"
    ON user_notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 管理员可以创建通知
CREATE POLICY "Admins can create notifications"
    ON user_notifications
    FOR INSERT
    WITH CHECK (
        public.is_admin(auth.uid())
    );

-- 管理员可以查看所有通知
CREATE POLICY "Admins can view all notifications"
    ON user_notifications
    FOR SELECT
    USING (
        public.is_admin(auth.uid())
    );

-- 添加注释
COMMENT ON TABLE user_notifications IS '用户通知表，用于管理端向用户发送消息';
COMMENT ON COLUMN user_notifications.type IS '通知类型：daily_report(日报), monthly_report(月报), custom(自定义)';
COMMENT ON COLUMN user_notifications.reference_id IS '关联的日报或月报ID';
