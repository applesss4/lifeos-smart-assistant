# 管理端快速部署指南

## 🚀 快速开始

### 1. 在 Vercel 创建新项目

访问 https://vercel.com/new 并选择你的 GitHub 仓库

### 2. 配置项目设置

```
Framework Preset: Vite
Root Directory: admin
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. 添加环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```
VITE_SUPABASE_URL=https://rfdyxocmrpofkrwdsipz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_wzOqJuvvIsGXFC7rUfnSqQ_r6pXc-GD
```

### 4. 部署

点击 "Deploy" 按钮，等待构建完成！

## 📝 本地测试

在部署前，可以在本地测试构建：

```bash
cd admin
npm install
npm run build
npm run preview
```

## 🔗 访问地址

部署成功后，你会得到类似这样的地址：
- https://your-admin-app.vercel.app

## 🎯 推荐域名设置

- 用户端：`https://yourdomain.com`
- 管理端：`https://admin.yourdomain.com`

在 Vercel 项目设置中可以添加自定义域名。

## ⚠️ 注意事项

1. 确保 GitHub 仓库中包含 `admin/package.json` 文件
2. 环境变量必须以 `VITE_` 开头才能在前端访问
3. 每次修改环境变量后需要重新部署
4. 管理端和用户端是两个独立的 Vercel 项目

## 🐛 常见问题

**Q: 构建失败？**
- 检查 `admin/package.json` 是否存在
- 确认 Root Directory 设置为 `admin`

**Q: 页面空白？**
- 检查浏览器控制台错误
- 确认环境变量已正确配置

**Q: 无法连接数据库？**
- 检查 Supabase URL 和 Key 是否正确
- 确认环境变量名称以 `VITE_` 开头
