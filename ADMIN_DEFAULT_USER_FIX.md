# 管理端默认用户优化

## 问题描述

之前管理端打开时，默认显示的是用户列表中的第一个用户的数据，而不是管理员自己的数据。这导致管理员需要手动切换到自己的账号才能查看自己的数据。

## 优化方案

修改管理端的用户选择逻辑，使其默认显示管理员自己的数据。

## 实现细节

### 修改文件
- `admin/src/App.tsx`

### 核心逻辑

```typescript
const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
        console.log('开始加载用户列表...');
        
        // 首先获取当前管理员的资料
        const currentAdminProfile = await profileService.getCurrentUserProfile();
        console.log('当前管理员资料:', currentAdminProfile);
        
        // 加载所有用户
        const allUsers = await profileService.getAllUsers();
        console.log('加载到的用户:', allUsers);
        setUsers(allUsers);
        
        // 默认选择当前管理员自己的数据
        if (currentAdminProfile && !selectedUser) {
            setSelectedUser(currentAdminProfile);
            console.log('默认选择管理员自己:', currentAdminProfile);
        } else if (allUsers.length > 0 && !selectedUser) {
            // 如果无法获取管理员资料，则选择第一个用户
            setSelectedUser(allUsers[0]);
            console.log('默认选择第一个用户:', allUsers[0]);
        } else if (allUsers.length === 0) {
            console.warn('没有找到任何用户!');
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
    } finally {
        setIsLoadingUsers(false);
    }
};
```

## 优化效果

### 优化前
1. 管理员登录后台
2. 默认显示用户列表中第一个用户的数据
3. 管理员需要手动点击用户选择器
4. 从列表中找到并选择自己的账号

### 优化后
1. 管理员登录后台
2. **自动显示管理员自己的数据**
3. 如需查看其他用户，点击用户选择器切换即可

## 降级处理

如果无法获取当前管理员的资料（例如网络问题或权限问题），系统会自动降级到原来的逻辑：选择用户列表中的第一个用户。

## 用户体验提升

- ✅ 管理员打开后台立即看到自己的数据
- ✅ 减少不必要的操作步骤
- ✅ 更符合直觉的默认行为
- ✅ 保留了查看其他用户数据的能力

## 测试验证

### 测试步骤
1. 以管理员身份登录后台
2. 检查页面加载后默认显示的用户
3. 验证显示的是管理员自己的数据
4. 切换到其他用户，验证功能正常
5. 刷新页面，验证仍然默认显示管理员数据

### 预期结果
- 默认显示管理员自己的用户名和邮箱
- 所有页面（工资统计、打卡管理、收支管理等）显示管理员的数据
- 用户选择器中管理员的账号被标记为选中状态

## 部署说明

代码已修改并构建成功。推送后 Vercel 会自动部署。

部署完成后验证：
1. 管理员登录后台
2. 确认默认显示的是管理员自己的数据
3. 测试切换到其他用户功能是否正常

## 技术细节

### 使用的 API
- `profileService.getCurrentUserProfile()` - 获取当前登录用户的资料
- `profileService.getAllUsers()` - 获取所有用户列表（管理员权限）

### 执行顺序
1. 获取当前管理员资料
2. 获取所有用户列表
3. 优先选择管理员自己
4. 降级选择第一个用户

### 日志输出
```
开始加载用户列表...
当前管理员资料: { id: '...', email: 'admin@example.com', ... }
加载到的用户: [...]
默认选择管理员自己: { id: '...', email: 'admin@example.com', ... }
```

## 相关文件

- `admin/src/App.tsx` - 主应用组件，包含用户选择逻辑
- `src/services/profileService.ts` - 用户资料服务
- `ADMIN_DEFAULT_USER_FIX.md` - 本文档

---

**优化完成时间**: 2026-01-12
**影响范围**: 管理端所有页面的默认用户选择
**向后兼容**: 是
