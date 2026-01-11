/**
 * 路由守卫配置
 * 根据设计文档中的 RouteGuardConfig 接口定义
 * 
 * 定义了应用中不同类型的路由：
 * - 公开路由：无需认证即可访问
 * - 受保护路由：需要认证才能访问
 * - 管理员路由：需要管理员权限才能访问
 */

export interface RouteGuardConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  loginRoute: string;
  defaultRoute: string;
}

/**
 * 默认路由守卫配置
 */
export const defaultRouteGuardConfig: RouteGuardConfig = {
  // 公开路由 - 无需认证
  publicRoutes: [
    'LOGIN',
    'SIGNUP'
  ],
  
  // 受保护路由 - 需要认证
  protectedRoutes: [
    'HOME',
    'ATTENDANCE',
    'TASKS',
    'FINANCE'
  ],
  
  // 管理员路由 - 需要管理员权限
  adminRoutes: [
    'ADMIN'
  ],
  
  // 登录路由
  loginRoute: 'LOGIN',
  
  // 默认路由（登录后）
  defaultRoute: 'HOME'
};

/**
 * 检查路由是否需要认证
 */
export function isProtectedRoute(route: string, config: RouteGuardConfig = defaultRouteGuardConfig): boolean {
  return config.protectedRoutes.includes(route) || config.adminRoutes.includes(route);
}

/**
 * 检查路由是否需要管理员权限
 */
export function isAdminRoute(route: string, config: RouteGuardConfig = defaultRouteGuardConfig): boolean {
  return config.adminRoutes.includes(route);
}

/**
 * 检查路由是否为公开路由
 */
export function isPublicRoute(route: string, config: RouteGuardConfig = defaultRouteGuardConfig): boolean {
  return config.publicRoutes.includes(route);
}
