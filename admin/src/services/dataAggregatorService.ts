/**
 * 数据聚合服务
 * 负责从多个数据源收集数据、计算统计指标和对比数据
 */

import * as attendanceService from '../../../src/services/attendanceService';
import * as transactionService from '../../../src/services/transactionService';
import * as taskService from '../../../src/services/taskService';
import * as salaryService from '../../../src/services/salaryService';
import type {
  ReportData,
  MonthlyData,
  ComparisonData,
  HistoricalTrendData,
  SalaryData,
  SalaryBreakdown,
  AttendanceData,
  FinanceData,
  TaskData,
  ChangeDirection,
} from '../types/monthlyReport';
import { STANDARD_WORK_HOURS, TREND_MONTHS } from '../types/monthlyReport';

/**
 * 数据聚合服务类
 */
export class DataAggregatorService {
  /**
   * 聚合指定月份和用户的所有数据
   */
  async aggregateMonthlyData(
    year: number,
    month: number,
    userId?: string
  ): Promise<MonthlyData> {
    try {
      // 并行请求所有数据源
      const [salarySettings, attStats, financeStats, allTasks] = await Promise.all([
        salaryService.getSalarySettings(userId).catch(() => null),
        attendanceService.getMonthlyStats(year, month, userId).catch(() => ({
          attendanceDays: 0,
          totalHours: 0,
        })),
        transactionService.getMonthlyStats(year, month, userId).catch(() => ({
          income: '0',
          expense: '0',
          balance: '0',
        })),
        taskService.getTasks(userId).catch(() => []),
      ]);

      // 处理工资数据
      const salaryData = this.processSalaryData(salarySettings, attStats);

      // 处理考勤数据
      const attendanceData: AttendanceData = {
        totalDays: attStats.attendanceDays || 0,
        totalHours: attStats.totalHours || 0,
        dailyRecords: [], // 需要从详细考勤记录获取
      };

      // 处理财务数据
      const financeData: FinanceData = {
        income: parseFloat(financeStats.income.replace(/,/g, '')) || 0,
        expense: parseFloat(financeStats.expense.replace(/,/g, '')) || 0,
        balance: parseFloat(financeStats.balance.replace(/,/g, '')) || 0,
        transactions: [], // 需要从详细交易记录获取
      };

      // 处理任务数据
      const taskData = this.processTaskData(allTasks);

      return {
        salary: salaryData,
        attendance: attendanceData,
        finance: financeData,
        tasks: taskData,
      };
    } catch (error) {
      console.error('数据聚合失败:', error);
      throw new Error('无法聚合月度数据');
    }
  }

  /**
   * 处理工资数据
   */
  private processSalaryData(salarySettings: any, attStats: any): SalaryData {
    if (!salarySettings) {
      return {
        settings: null,
        calculatedSalary: 0,
        breakdown: this.getEmptySalaryBreakdown(),
      };
    }

    const totalHours = attStats.totalHours || 0;
    const attendanceDays = attStats.attendanceDays || 0;

    // 计算正常工时和加班工时
    const normalHours = Math.min(totalHours, attendanceDays * STANDARD_WORK_HOURS);
    const overtimeHours = Math.max(0, totalHours - normalHours);

    // 计算工资构成
    const basePay = normalHours * salarySettings.hourly_rate;
    const overtimePay = overtimeHours * salarySettings.overtime_rate;
    // 交通补贴按工作日天数计算（只有工作日有补贴）
    const transportFee = (salarySettings.transport_fee || 0) * attendanceDays;
    const bonus = salarySettings.bonus || 0;
    const deductions =
      (salarySettings.xiaowang_diff || 0) + (salarySettings.xiaowang_pension || 0);

    const calculatedSalary = basePay + overtimePay + transportFee + bonus - deductions;

    const breakdown: SalaryBreakdown = {
      baseHours: normalHours,
      baseHourlyRate: salarySettings.hourly_rate,
      basePay,
      overtimeHours,
      overtimeRate: salarySettings.overtime_rate,
      overtimePay,
      transportFee,
      bonus,
      deductions,
    };

    return {
      settings: salarySettings,
      calculatedSalary,
      breakdown,
    };
  }

  /**
   * 处理任务数据
   */
  private processTaskData(tasks: any[]): TaskData {
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;

    return {
      total: tasks.length,
      completed: completedTasks,
      pending: pendingTasks,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title || t.task || '',
        completed: t.completed || false,
        createdAt: t.created_at || t.date || '',
        completedAt: t.completed_at,
        dueDate: t.due_date || t.date,
        priority: t.priority || 'medium',
      })),
    };
  }

  /**
   * 计算对比数据（环比和同比）
   */
  async calculateComparisons(
    currentValue: number,
    year: number,
    month: number,
    userId?: string,
    dataType: 'salary' | 'attendance' | 'balance' | 'tasks' = 'salary'
  ): Promise<ComparisonData> {
    try {
      // 计算上月数据（环比）
      const lastMonth = month === 1 ? 12 : month - 1;
      const lastMonthYear = month === 1 ? year - 1 : year;
      const lastMonthValue = await this.getHistoricalValue(
        lastMonthYear,
        lastMonth,
        userId,
        dataType
      );

      // 计算去年同月数据（同比）
      const lastYearValue = await this.getHistoricalValue(
        year - 1,
        month,
        userId,
        dataType
      );

      return {
        monthOverMonth: this.calculateChange(currentValue, lastMonthValue),
        yearOverYear: this.calculateChange(currentValue, lastYearValue),
      };
    } catch (error) {
      console.error('对比数据计算失败:', error);
      return {
        monthOverMonth: { value: 0, percentage: 0, direction: 'stable' },
        yearOverYear: { value: 0, percentage: 0, direction: 'stable' },
      };
    }
  }

  /**
   * 获取历史数据值
   */
  private async getHistoricalValue(
    year: number,
    month: number,
    userId?: string,
    dataType: 'salary' | 'attendance' | 'balance' | 'tasks' = 'salary'
  ): Promise<number> {
    try {
      const data = await this.aggregateMonthlyData(year, month, userId);

      switch (dataType) {
        case 'salary':
          return data.salary.calculatedSalary;
        case 'attendance':
          return data.attendance.totalHours;
        case 'balance':
          return data.finance.balance;
        case 'tasks':
          return data.tasks.total > 0
            ? (data.tasks.completed / data.tasks.total) * 100
            : 0;
        default:
          return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  /**
   * 计算变化
   */
  private calculateChange(
    current: number,
    previous: number
  ): { value: number; percentage: number; direction: ChangeDirection } {
    const value = current - previous;
    const percentage = previous !== 0 ? (value / previous) * 100 : 0;

    let direction: ChangeDirection = 'stable';
    if (Math.abs(percentage) > 1) {
      // 超过1%才认为有变化
      direction = value > 0 ? 'up' : 'down';
    }

    return {
      value,
      percentage,
      direction,
    };
  }

  /**
   * 获取历史趋势数据（最近N个月）
   */
  async getHistoricalTrend(
    year: number,
    month: number,
    userId?: string,
    months: number = TREND_MONTHS
  ): Promise<HistoricalTrendData[]> {
    const trends: HistoricalTrendData[] = [];

    try {
      for (let i = months - 1; i >= 0; i--) {
        let targetMonth = month - i;
        let targetYear = year;

        // 处理跨年情况
        while (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        const data = await this.aggregateMonthlyData(targetYear, targetMonth, userId);

        trends.push({
          month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
          salary: data.salary.calculatedSalary,
          attendance: data.attendance.totalHours,
          balance: data.finance.balance,
          taskCompletion:
            data.tasks.total > 0 ? (data.tasks.completed / data.tasks.total) * 100 : 0,
        });
      }
    } catch (error) {
      console.error('历史趋势数据获取失败:', error);
    }

    return trends;
  }

  /**
   * 识别加班工时
   */
  calculateOvertimeHours(totalHours: number, attendanceDays: number): number {
    const standardHours = attendanceDays * STANDARD_WORK_HOURS;
    return Math.max(0, totalHours - standardHours);
  }

  /**
   * 计算财务汇总
   */
  calculateFinanceSummary(transactions: any[]): {
    income: number;
    expense: number;
    balance: number;
  } {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expense += t.amount;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  /**
   * 获取空的工资构成
   */
  private getEmptySalaryBreakdown(): SalaryBreakdown {
    return {
      baseHours: 0,
      baseHourlyRate: 0,
      basePay: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      overtimePay: 0,
      transportFee: 0,
      bonus: 0,
      deductions: 0,
    };
  }
}

// 导出单例实例
export const dataAggregatorService = new DataAggregatorService();
