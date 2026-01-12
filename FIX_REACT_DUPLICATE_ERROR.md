# 修复 React useState 错误

## 问题描述

部署后网页出现错误：
```
TypeError: Cannot read properties of null (reading 'useState')
```

## 根本原因

Admin 应用从父目录引用共享代码（如 `AuthContext`），导致在构建时：
1. **React 重复实例**：admin 打包了自己的 React，同时也打包了从父目录引用的代码中的 React
2. **模块解析冲突**：两个 React 实例冲突，导致 hooks 无法正常工作

## 解决方案

### 1. 更新 admin/vite.config.ts

添加了以下配置：
- **resolve.alias**: 强制所有 React 引用指向父目录的 node_modules
- **resolve.dedupe**: 去重 React 和 React-DOM
- **build.rollupOptions.output.manualChunks**: 将 React 分离到独立的 vendor chunk

```typescript
resolve: {
    alias: {
        '@': path.resolve(__dirname, '..'),
        'react': path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
},
build: {
    rollupOptions: {
        output: {
            manualChunks: {
                'react-vendor': ['react', 'react-dom']
            }
        }
    }
}
```

### 2. 更新 admin/package.json

确保构建时先安装 admin 自己的依赖：
```json
"build": "cd .. && npm install && cd admin && npm install && vite build"
```

## 验证

本地构建成功，生成了正确的 chunk：
- `react-vendor-*.js` (12KB) - React 核心库
- `index-*.js` (789KB) - 应用代码

## 部署步骤

1. 提交代码更改
2. 推送到 Git 仓库
3. Vercel 会自动重新部署
4. 验证部署后的应用是否正常工作

## 测试清单

- [ ] 应用能正常加载
- [ ] 登录功能正常
- [ ] 所有视图可以切换
- [ ] 用户选择器工作正常
- [ ] 没有 React 相关的控制台错误
