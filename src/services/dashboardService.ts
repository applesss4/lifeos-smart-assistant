import * as taskService from './taskService';
import * as transactionService from './transactionService';
import * as attendanceService from './attendanceService';
import * as salaryService from './salaryService';
import * as profileService from './profileService';
import { defaultCache } from '../utils/cacheManager';

/**
 * 首页仪表板数据类型
 */
export interface DashboardData {
  tasks: any[];
  expenses: any[];
  todayStats: {
    hours: number;
    overtime: number;
    income: number;
    expense: number;
    isClockedIn: boolean;
    startTime?: string;
  };
  monthlyStats: {
    expense: number;
    budget: number;
    overtimePay: number;
  };
  profile: {
    username: string;
  };
}

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  DASHBOARD: 2 * 60 * 1000,  // 2 minutes for dashboard data
  PROFILE: 10 * 60 * 1000,   // 10 minutes for profile data
  SALARY: 30 * 60 * 1000,    // 30 minutes for salary settings
};

/**
 * 获取首页仪表板所有数据（优化版 + 缓存）
 * 减少 API 请求数量，提升加载速度
 * 使用缓存减少重复请求
 */
export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = `dashboard:${today}`;

  // Try to get from cache first
  const cached = defaultCache.get<DashboardData>(cacheKey);
  if (cached) {
    // Refresh in background for next request
    defaultCache.refreshInBackground({
      key: cacheKey,
      fetcher: () => fetchDashboardData(today)
    });
    return cached;
  }

  // Fetch fresh data
  const data = await fetchDashboardData(today);
  
  // Cache the result
  defaultCache.set(cacheKey, data, CACHE_TTL.DASHBOARD);
  
  return data;
}

/**
 * Internal function to fetch dashboard data
 */
async function fetchDashboardData(today: string): Promise<DashboardData> {
  const now = new Date();

  // 第一批：关键数据（并行加载）
  const [
    tasksData,
    transactionsData,
    todayAttendance,
    todayFinance,
    todayPunchStatus,
    userProfile
  ] = await Promise.all([
    taskService.getTodayTasks(),
    transactionService.getTodayTransactions(),
    attendanceService.getDailyStats(today),
    transactionService.getDailyStats(today),
    attendanceService.getTodayPunchStatus(),
    getCachedProfile()
  ]);

  // 第二批：月度统计（并行加载）
  const [monthlyFinance, monthlyAttendance, salarySettings] = await Promise.all([
    transactionService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
    attendanceService.getMonthlyStats(),
    getCachedSalarySettings()
  ]);

  // 计算统计数据
  const hourlyRate = salarySettings?.hourly_rate || 105;
  const overtimeRate = salarySettings?.overtime_rate || 150;

  const todayStats = {
    hours: todayAttendance.totalHours,
    overtime: todayAttendance.overtimeHours,
    income: todayAttendance.totalHours * hourlyRate,
    expense: todayFinance.expense,
    isClockedIn: todayPunchStatus.isClockedIn,
    startTime: todayPunchStatus.lastRecord?.time
  };

  const monthlyExpense = parseFloat(monthlyFinance.expense.replace(/,/g, ''));
  const overtimeHours = Math.max(0, monthlyAttendance.totalHours - (monthlyAttendance.attendanceDays * 8));

  const monthlyStats = {
    expense: monthlyExpense,
    budget: 5000 - monthlyExpense,
    overtimePay: overtimeHours * overtimeRate
  };

  const profile = {
    username: userProfile?.username || '用户'
  };

  return {
    tasks: tasksData,
    expenses: transactionsData.filter(t => t.type === 'Expense'),
    todayStats,
    monthlyStats,
    profile
  };
}

/**
 * Get cached profile data
 */
async function getCachedProfile() {
  const cacheKey = 'profile:current';
  
  const cached = defaultCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const profile = await profileService.getCurrentUserProfile();
  defaultCache.set(cacheKey, profile, CACHE_TTL.PROFILE);
  
  return profile;
}

/**
 * Get cached salary settings
 */
async function getCachedSalarySettings() {
  const cacheKey = 'salary:settings';
  
  const cached = defaultCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const settings = await salaryService.getSalarySettings();
  defaultCache.set(cacheKey, settings, CACHE_TTL.SALARY);
  
  return settings;
}

/**
 * 获取昨日统计数据（延迟加载 + 缓存）
 */
export async function getYesterdayStats() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const cacheKey = `yesterday:${yesterday}`;

  // Try to get from cache first
  const cached = defaultCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  const [yesterdayAttendance, salarySettings] = await Promise.all([
    attendanceService.getDailyStats(yesterday),
    getCachedSalarySettings()
  ]);

  const hourlyRate = salarySettings?.hourly_rate || 105;

  const stats = {
    hours: yesterdayAttendance.totalHours,
    income: yesterdayAttendance.totalHours * hourlyRate
  };

  // Cache yesterday's stats for longer (they won't change)
  defaultCache.set(cacheKey, stats, 60 * 60 * 1000); // 1 hour
  
  return stats;
}

/**
 * Clear dashboard cache (useful after data updates)
 */
export function clearDashboardCache(): void {
  const today = new Date().toISOString().split('T')[0];
  defaultCache.clear(`dashboard:${today}`);
  defaultCache.clear('profile:current');
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  defaultCache.clear();
}
