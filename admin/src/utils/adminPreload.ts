/**
 * 管理后台智能预加载模块
 * 实现基于用户行为的视图预加载，提升导航响应速度
 * 需求: 2.5 - 预加载用户可能访问的下一个视图
 */

// 存储预加载的模块引用
const preloadedModules = new Map<string, Promise<any>>();

// 管理后台视图导入函数映射
const adminViewImportMap: Record<string, () => Promise<any>> = {
  'salary': () => import('../views/SalaryView'),
  'attendance': () => import('../views/AttendanceView'),
  'finance': () => import('../views/FinanceView'),
  'reports': () => import('../views/ReportsView'),
  'tasks': () => import('../views/TasksView'),
  'monthly_stats': () => import('../views/MonthlyStatsView'),
};

/**
 * 预加载指定管理后台视图
 * 
 * @param viewName - 视图名称
 * @returns Promise<void>
 * 
 * @example
 * // 在导航按钮 hover 时预加载
 * onMouseEnter={() => preloadAdminView('salary')}
 */
export function preloadAdminView(viewName: string): void {
  // 如果已经预加载过，直接返回
  if (preloadedModules.has(viewName)) {
    console.log(`✅ 管理视图 ${viewName} 已预加载`);
    return;
  }

  const importFn = adminViewImportMap[viewName];

  if (!importFn) {
    console.warn(`⚠️ 未找到管理视图 ${viewName} 的导入函数`);
    return;
  }

  console.log(`🔄 开始预加载管理视图: ${viewName}`);
  
  // 执行预加载
  const preloadPromise = importFn()
    .then((module) => {
      console.log(`✅ 管理视图 ${viewName} 预加载成功`);
      return module;
    })
    .catch((error) => {
      console.error(`❌ 管理视图 ${viewName} 预加载失败:`, error);
      // 预加载失败时从缓存中移除，以便下次重试
      preloadedModules.delete(viewName);
      throw error;
    });

  preloadedModules.set(viewName, preloadPromise);
}

/**
 * 批量预加载多个管理后台视图
 * 
 * @param viewNames - 视图名称数组
 */
export function preloadAdminViews(viewNames: string[]): void {
  viewNames.forEach(viewName => preloadAdminView(viewName));
}

/**
 * 基于当前视图预测并预加载下一个可能访问的管理后台视图
 * 根据用户行为模式预测最可能访问的视图
 * 
 * @param currentView - 当前视图
 */
export function predictivePreloadAdmin(currentView: string): void {
  // 管理后台预测逻辑
  const adminPredictions: Record<string, string[]> = {
    'salary': ['attendance', 'finance'],
    'attendance': ['salary', 'reports'],
    'finance': ['salary', 'reports'],
    'reports': ['attendance', 'tasks'],
    'tasks': ['reports', 'monthly_stats'],
    'monthly_stats': ['salary', 'finance'],
  };

  const nextViews = adminPredictions[currentView];
  if (nextViews) {
    console.log(`🔮 预测性预加载: 从 ${currentView} 可能访问 ${nextViews.join(', ')}`);
    preloadAdminViews(nextViews);
  }
}

/**
 * 清除预加载缓存
 * 在内存压力大时可以调用此函数释放资源
 */
export function clearAdminPreloadCache(): void {
  console.log('🗑️ 清除管理后台预加载缓存');
  preloadedModules.clear();
}

/**
 * 获取预加载统计信息
 */
export function getAdminPreloadStats(): { total: number; views: string[] } {
  return {
    total: preloadedModules.size,
    views: Array.from(preloadedModules.keys()),
  };
}
