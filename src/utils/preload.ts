/**
 * 智能预加载模块
 * 实现基于用户行为的视图预加载，提升导航响应速度
 * 需求: 2.5 - 预加载用户可能访问的下一个视图
 */

import { ViewType } from '../../types';

// 存储预加载的模块引用
const preloadedModules = new Map<string, Promise<any>>();

// 视图导入函数映射
const viewImportMap: Record<string, () => Promise<any>> = {
  [ViewType.HOME]: () => import('../../views/Home'),
  [ViewType.ATTENDANCE]: () => import('../../views/Attendance'),
  [ViewType.TASKS]: () => import('../../views/Tasks'),
  [ViewType.FINANCE]: () => import('../../views/Finance'),
};

/**
 * 预加载指定视图
 * 
 * @param viewName - 视图名称
 * @returns Promise<void>
 * 
 * @example
 * // 在导航按钮 hover 时预加载
 * onMouseEnter={() => preloadView(ViewType.TASKS)}
 */
export function preloadView(viewName: string): void {
  // 如果已经预加载过，直接返回
  if (preloadedModules.has(viewName)) {
    console.log(`✅ 视图 ${viewName} 已预加载`);
    return;
  }

  const importFn = viewImportMap[viewName];

  if (!importFn) {
    console.warn(`⚠️ 未找到视图 ${viewName} 的导入函数`);
    return;
  }

  console.log(`🔄 开始预加载视图: ${viewName}`);
  
  // 执行预加载
  const preloadPromise = importFn()
    .then((module) => {
      console.log(`✅ 视图 ${viewName} 预加载成功`);
      return module;
    })
    .catch((error) => {
      console.error(`❌ 视图 ${viewName} 预加载失败:`, error);
      // 预加载失败时从缓存中移除，以便下次重试
      preloadedModules.delete(viewName);
      throw error;
    });

  preloadedModules.set(viewName, preloadPromise);
}

/**
 * 批量预加载多个视图
 * 
 * @param viewNames - 视图名称数组
 */
export function preloadViews(viewNames: string[]): void {
  viewNames.forEach(viewName => preloadView(viewName));
}

/**
 * 基于当前视图预测并预加载下一个可能访问的视图
 * 根据用户行为模式预测最可能访问的视图
 * 
 * @param currentView - 当前视图
 */
export function predictivePreload(currentView: string): void {
  // 用户端预测逻辑
  const predictions: Record<string, ViewType[]> = {
    [ViewType.HOME]: [ViewType.ATTENDANCE, ViewType.TASKS],
    [ViewType.ATTENDANCE]: [ViewType.HOME, ViewType.TASKS],
    [ViewType.TASKS]: [ViewType.HOME, ViewType.FINANCE],
    [ViewType.FINANCE]: [ViewType.HOME, ViewType.TASKS],
  };

  const nextViews = predictions[currentView];
  if (nextViews) {
    console.log(`🔮 预测性预加载: 从 ${currentView} 可能访问 ${nextViews.join(', ')}`);
    preloadViews(nextViews);
  }
}

/**
 * 清除预加载缓存
 * 在内存压力大时可以调用此函数释放资源
 */
export function clearPreloadCache(): void {
  console.log('🗑️ 清除预加载缓存');
  preloadedModules.clear();
}

/**
 * 获取预加载统计信息
 */
export function getPreloadStats(): { total: number; views: string[] } {
  return {
    total: preloadedModules.size,
    views: Array.from(preloadedModules.keys()),
  };
}
