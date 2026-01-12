import * as taskService from './taskService';
import * as transactionService from './transactionService';
import * as attendanceService from './attendanceService';
import * as salaryService from './salaryService';
import * as profileService from './profileService';

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

/**
 * 获取首页仪表板所有数据（优化版）
 * 减少 API 请求数量，提升加载速度
 */
export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0];
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
    profileService.getCurrentUserProfile()
  ]);

  // 第二批：月度统计（并行加载）
  const [monthlyFinance, monthlyAttendance, salarySettings] = await Promise.all([
    transactionService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
    attendanceService.getMonthlyStats(),
    salaryService.getSalarySettings()
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
 * 获取昨日统计数据（延迟加载）
 */
export async function getYesterdayStats() {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  const [yesterdayAttendance, salarySettings] = await Promise.all([
    attendanceService.getDailyStats(yesterday),
    salaryService.getSalarySettings()
  ]);

  const hourlyRate = salarySettings?.hourly_rate || 105;

  return {
    hours: yesterdayAttendance.totalHours,
    income: yesterdayAttendance.totalHours * hourlyRate
  };
}
