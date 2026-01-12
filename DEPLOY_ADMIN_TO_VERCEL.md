# 部署管理端到 Vercel 指南

本项目包含两个前端应用：
- **用户端**：根目录（已部署）
- **管理端**：`admin/` 目录（待部署）

## 方案一：单独部署管理端（推荐）

### 步骤 1：在 Vercel 创建新项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New" → "Project"
3. 选择你的 GitHub 仓库（同一个仓库）
4. 点击 "Import"

### 步骤 2：配置构建设置

在项目设置页面配置以下内容：

**Framework Preset**: Vite

**Root Directory**: `admin` （重要！）

**Build Command**:
```bash
npm install && npm run build
```

**Output Directory**: `dist`

**Install Command**:
```bash
npm install
```

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加环境变量：

- `VITE_SUPABASE_URL` = `https://rfdyxocmrpofkrwdsipz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `sb_publishable_wzOqJuvvIsGXFC7rUfnSqQ_r6pXc-GD`

### 步骤 4：添加构建脚本

需要在 `admin/` 目录下创建 `package.json`：

```json
{
  "name": "lifeos-admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "recharts": "^3.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### 步骤 5：更新 admin/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    }
});
```

### 步骤 6：部署

1. 提交代码到 GitHub
2. Vercel 会自动检测并开始构建
3. 构建完成后，你会得到一个管理端的 URL，例如：`https://your-admin.vercel.app`

---

## 方案二：使用子路径部署（高级）

如果你想让管理端在主域名的子路径下（如 `yourdomain.com/admin`），需要：

### 1. 修改 Vercel 配置

在根目录创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build && cd admin && npm install && npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/admin/(.*)",
      "dest": "/admin/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 2. 修改根目录 package.json

添加构建脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && npm run build:admin",
    "build:admin": "cd admin && npm install && npm run build",
    "preview": "vite preview"
  }
}
```

### 3. 修改 admin/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/admin/',  // 设置基础路径
    plugins: [react()],
    build: {
        outDir: '../dist/admin',
        emptyOutDir: true,
    }
});
```

---

## 推荐方案

**建议使用方案一**（单独部署），因为：
- 配置简单，易于维护
- 管理端和用户端独立部署，互不影响
- 可以设置不同的域名或子域名（如 `admin.yourdomain.com`）
- 更容易进行独立的版本控制和回滚

## 部署后的访问地址

- 用户端：`https://your-app.vercel.app`
- 管理端：`https://your-admin.vercel.app`

或者使用自定义域名：
- 用户端：`https://yourdomain.com`
- 管理端：`https://admin.yourdomain.com`

## 常见问题

### Q: 环境变量没有生效？
A: 确保在 Vercel 项目设置中添加了所有 `VITE_` 开头的环境变量，并重新部署。

### Q: 构建失败？
A: 检查 `admin/package.json` 是否存在，依赖是否正确安装。

### Q: 页面空白？
A: 检查浏览器控制台错误，通常是环境变量或路由配置问题。

### Q: 如何设置自定义域名？
A: 在 Vercel 项目设置的 "Domains" 选项卡中添加自定义域名。
