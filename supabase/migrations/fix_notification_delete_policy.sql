-- 修复通知删除权限问题
-- 用户应该能够删除自己的通知

-- 添加用户删除自己通知的策略
CREATE POLICY "Users can delete their own notifications"
    ON user_notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 添加管理员删除所有通知的策略（可选）
CREATE POLICY "Admins can delete all notifications"
    ON user_notifications
    FOR DELETE
    USING (
        public.is_admin(auth.uid())
    );

-- 添加注释
COMMENT ON POLICY "Users can delete their own notifications" ON user_notifications IS '用户可以删除自己的通知';
COMMENT ON POLICY "Admins can delete all notifications" ON user_notifications IS '管理员可以删除所有通知';
