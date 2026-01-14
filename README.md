<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# LifeOS - 智能生活管家

一个高性能的全栈生活管理应用，包含考勤、任务、财务管理等功能。

## ✨ 特性

- 🚀 **高性能**: 代码分割、懒加载、智能缓存
- 📱 **移动优先**: 响应式设计，触摸优化
- 🔒 **安全认证**: Supabase身份验证和RLS
- 📊 **数据可视化**: 图表和统计分析
- 💾 **离线支持**: Service Worker缓存
- ⚡ **快速加载**: LCP < 2.5s, 首屏 < 3s
- 🎨 **流畅动画**: GPU加速，60fps

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装和运行

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd lifeos
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   复制 `.env.example` 到 `.env.local` 并设置：
   ```bash
   cp .env.example .env.local
   ```
   
   编辑 `.env.local` 添加你的配置：
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **运行开发服务器**
   ```bash
   npm run dev
   ```
   
   应用将在 http://localhost:3000 启动

5. **构建生产版本**
   ```bash
   npm run build
   ```

### 管理后台

管理后台位于 `admin/` 目录：

```bash
cd admin
npm install
npm run dev
```

管理后台将在 http://localhost:5173 启动

## 📦 项目结构

```
lifeos/
├── src/                    # 主应用源代码
│   ├── components/         # React组件
│   ├── views/             # 页面视图
│   ├── services/          # API服务
│   ├── hooks/             # 自定义Hooks
│   ├── utils/             # 工具函数
│   ├── contexts/          # React Context
│   └── styles/            # 样式文件
├── admin/                 # 管理后台
│   └── src/              # 管理后台源代码
├── supabase/             # Supabase配置
│   └── migrations/       # 数据库迁移
├── public/               # 静态资源
└── dist/                 # 构建输出

```

## 🎯 核心功能

### 用户功能
- ✅ 用户注册和登录
- 📅 考勤打卡管理
- ✔️ 任务列表管理
- 💰 财务收支记录
- 📊 数据统计和可视化

### 管理功能
- 👥 用户管理
- 📈 月度统计
- 💵 工资管理
- 📋 报表生成

## ⚡ 性能优化

本应用经过全面的性能优化，详见 [性能优化文档](.kiro/specs/frontend-performance-optimization/FINAL_CHECKPOINT.md)

### 关键优化
- **代码分割**: 视图组件按需加载
- **智能缓存**: LRU缓存 + 后台刷新
- **懒加载**: 图片和组件懒加载
- **GPU加速**: 动画使用transform和opacity
- **压缩**: Gzip和Brotli压缩
- **Service Worker**: 离线缓存支持

### 性能指标
- LCP: < 2.5s ✅
- FID: < 100ms ✅
- CLS: < 0.1 ✅
- 首屏渲染: < 3s ✅
- Bundle大小: 110KB (Brotli压缩)

查看 [性能快速参考](.kiro/specs/frontend-performance-optimization/PERFORMANCE_QUICK_REFERENCE.md) 了解更多。

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行性能测试
npm test -- e2e-performance

# 运行属性测试
npm test -- loadingStateVisibility
```

## 📚 文档

- [性能优化最终报告](.kiro/specs/frontend-performance-optimization/FINAL_CHECKPOINT.md)
- [性能优化快速参考](.kiro/specs/frontend-performance-optimization/PERFORMANCE_QUICK_REFERENCE.md)
- [Vite构建优化](VITE_BUILD_OPTIMIZATION.md)
- [动画优化](ANIMATION_OPTIMIZATION_COMPLETE.md)
- [Service Worker指南](SERVICE_WORKER_GUIDE.md)
- [Supabase认证](.kiro/specs/supabase-authentication/QUICK_START_GUIDE.md)

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: React Context + Hooks
- **样式**: CSS + CSS Modules
- **图表**: Recharts (懒加载)

### 后端
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **实时**: Supabase Realtime

### 开发工具
- **测试**: Vitest + React Testing Library
- **代码质量**: ESLint + TypeScript
- **性能分析**: rollup-plugin-visualizer

## 🔧 开发指南

### 添加新视图

1. 在 `views/` 创建新组件
2. 在 `App.tsx` 添加路由
3. 创建对应的骨架屏组件
4. 使用懒加载包装

```typescript
const LazyNewView = lazy(() => import('./views/NewView'));

<Route path="/new" element={
  <Suspense fallback={<NewViewSkeleton />}>
    <LazyNewView />
  </Suspense>
} />
```

### 使用缓存

```typescript
import { cacheManager } from './utils/cacheManager';

// 设置缓存
cacheManager.set('key', data, 5 * 60 * 1000); // 5分钟

// 获取缓存
const cached = cacheManager.get('key');
```

### 优化动画

```css
/* 使用GPU加速的动画类 */
.my-element {
  animation: fadeInGpu 0.3s ease;
}
```

## 📈 Bundle分析

构建后查看bundle分析报告：

```bash
npm run build
open dist/stats.html
```

## 🚀 部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 部署主应用和管理后台

详见 [部署指南](VERCEL_DEPLOYMENT_GUIDE.md)

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 🙏 致谢

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Recharts](https://recharts.org/)

---

**最后更新**: 2026-01-14
