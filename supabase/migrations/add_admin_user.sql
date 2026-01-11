-- 为用户添加管理员角色
-- 用户 ID: e86201b4-b104-4959-a7ed-29cfe988e2cb
-- 邮箱: linhaining168@gmail.com

INSERT INTO user_roles (user_id, role)
VALUES ('e86201b4-b104-4959-a7ed-29cfe988e2cb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 验证插入
SELECT * FROM user_roles WHERE user_id = 'e86201b4-b104-4959-a7ed-29cfe988e2cb';
