# 管理员用户访问权限修复

## 问题描述
管理后台无法获取其他用户的列表,这是因为 Row Level Security (RLS) 策略限制了用户只能查看自己的资料。

## 解决方案
执行 `allow_admin_view_all_profiles.sql` 迁移文件,该文件会更新 RLS 策略,允许管理员查看所有用户的资料。

## 执行步骤

### 方法 1: 使用 Supabase Dashboard (推荐)

1. 打开 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `supabase/migrations/allow_admin_view_all_profiles.sql` 文件的内容
6. 粘贴到 SQL 编辑器中
7. 点击 "Run" 执行

### 方法 2: 使用 Supabase CLI

如果你已经安装了 Supabase CLI:

```bash
# 确保你在项目根目录
cd /path/to/your/project

# 执行迁移
supabase db push
```

## 验证

执行迁移后:

1. 刷新管理后台页面
2. 打开浏览器控制台 (F12)
3. 查看是否有 "成功获取用户列表: X 个用户" 的日志
4. 点击顶部的用户选择器,应该能看到所有用户列表

## 迁移内容

该迁移会创建一个新的 RLS 策略:
- 普通用户仍然只能查看自己的资料
- 管理员可以查看所有用户的资料

## 注意事项

- 确保你的管理员账户已经在 `user_roles` 表中被标记为 'admin' 角色
- 如果还是看不到其他用户,请检查:
  1. 是否有其他用户注册
  2. 管理员角色是否正确设置
  3. 浏览器控制台是否有错误信息
