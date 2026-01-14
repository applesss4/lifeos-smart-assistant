/**
 * 文本生成服务
 * 负责根据数据生成智能化的文字描述和分析
 */

import type {
  ExecutiveSummary,
  ComparisonData,
  MonthlyData,
  HistoricalTrendData,
  SalaryData,
  AttendanceData,
  FinanceData,
  TaskData,
  TrendForecast,
} from '../types/monthlyReport';
import { ANOMALY_THRESHOLD } from '../types/monthlyReport';

/**
 * 文本生成服务类
 */
export class TextGeneratorService {
  /**
   * 生成执行摘要文本
   */
  generateExecutiveSummary(data: MonthlyData): ExecutiveSummary {
    const highlights: string[] = [];
    const concerns: string[] = [];

    // 分析工资
    if (data.salary.calculatedSalary > 0) {
      highlights.push(
        `本月预计工资 ¥${data.salary.calculatedSalary.toLocaleString()}，包含基本工资和加班费`
      );
    }

    // 分析考勤
    if (data.attendance.totalDays > 0) {
      highlights.push(
        `出勤 ${data.attendance.totalDays} 天，总工时 ${data.attendance.totalHours} 小时`
      );
    }

    // 分析财务
    if (data.finance.balance >= 0) {
      highlights.push(`本月结余 ¥${data.finance.balance.toLocaleString()}，财务状况良好`);
    } else {
      concerns.push(
        `本月支出超过收入 ¥${Math.abs(data.finance.balance).toLocaleString()}，需要注意控制支出`
      );
    }

    // 分析任务
    const taskCompletionRate =
      data.tasks.total > 0 ? (data.tasks.completed / data.tasks.total) * 100 : 0;
    if (taskCompletionRate >= 80) {
      highlights.push(`任务完成率 ${taskCompletionRate.toFixed(0)}%，执行力优秀`);
    } else if (taskCompletionRate < 50) {
      concerns.push(
        `任务完成率仅 ${taskCompletionRate.toFixed(0)}%，有 ${data.tasks.pending} 个待办任务需要关注`
      );
    }

    // 生成总体文本
    const overallText = this.generateOverallText(data, highlights, concerns);

    return {
      overallText,
      highlights,
      concerns,
    };
  }

  /**
   * 生成总体文本
   */
  private generateOverallText(
    data: MonthlyData,
    highlights: string[],
    concerns: string[]
  ): string {
    const parts: string[] = [];

    parts.push(
      `本月工作表现${highlights.length > concerns.length ? '良好' : '需要改进'}。`
    );

    if (data.salary.calculatedSalary > 0) {
      parts.push(
        `预计工资 ¥${data.salary.calculatedSalary.toLocaleString()}，出勤 ${data.attendance.totalDays} 天。`
      );
    }

    if (data.finance.balance >= 0) {
      parts.push(`财务结余 ¥${data.finance.balance.toLocaleString()}。`);
    } else {
      parts.push(`本月支出超过收入，需要注意财务管理。`);
    }

    const taskCompletionRate =
      data.tasks.total > 0 ? (data.tasks.completed / data.tasks.total) * 100 : 0;
    parts.push(`任务完成率 ${taskCompletionRate.toFixed(0)}%。`);

    return parts.join(' ');
  }

  /**
   * 生成工资分析文本
   */
  generateSalaryAnalysis(salaryData: SalaryData, comparison: ComparisonData): string {
    if (!salaryData.settings) {
      return '本月暂无工资数据。';
    }

    const parts: string[] = [];
    const { breakdown, calculatedSalary } = salaryData;

    // 基本信息
    parts.push(
      `本月预计工资 ¥${calculatedSalary.toLocaleString()}。`
    );

    // 工资构成
    parts.push(
      `其中基本工资 ¥${breakdown.basePay.toLocaleString()}（${breakdown.baseHours}小时 × ¥${breakdown.baseHourlyRate}/小时）`
    );

    if (breakdown.overtimeHours > 0) {
      parts.push(
        `，加班费 ¥${breakdown.overtimePay.toLocaleString()}（${breakdown.overtimeHours}小时 × ¥${breakdown.overtimeRate}/小时）`
      );
    }

    if (breakdown.transportFee > 0) {
      parts.push(`，交通补贴 ¥${breakdown.transportFee.toLocaleString()}`);
    }

    if (breakdown.bonus > 0) {
      parts.push(`，奖金 ¥${breakdown.bonus.toLocaleString()}`);
    }

    if (breakdown.deductions > 0) {
      parts.push(`，扣除项 ¥${breakdown.deductions.toLocaleString()}`);
    }

    parts.push('。');

    // 对比分析
    if (comparison.monthOverMonth.percentage !== 0) {
      const change = this.formatChange(comparison.monthOverMonth);
      parts.push(`较上月${change}。`);

      // 异常检测
      if (this.detectAnomalies(calculatedSalary, calculatedSalary - comparison.monthOverMonth.value, ANOMALY_THRESHOLD)) {
        parts.push(`⚠️ 注意：工资变化幅度较大，可能是由于工时或补贴调整。`);
      }
    }

    return parts.join('');
  }

  /**
   * 生成考勤分析文本
   */
  generateAttendanceAnalysis(
    attendanceData: AttendanceData,
    comparison: ComparisonData
  ): string {
    const parts: string[] = [];
    const { totalDays, totalHours } = attendanceData;

    if (totalDays === 0) {
      return '本月暂无考勤数据。';
    }

    // 基本信息
    parts.push(`本月出勤 ${totalDays} 天，总工时 ${totalHours} 小时。`);

    // 平均工时
    const avgHours = totalHours / totalDays;
    parts.push(`平均每天工作 ${avgHours.toFixed(1)} 小时。`);

    // 加班情况
    const standardHours = totalDays * 8;
    const overtimeHours = Math.max(0, totalHours - standardHours);
    if (overtimeHours > 0) {
      parts.push(`其中加班 ${overtimeHours} 小时。`);
    }

    // 对比分析
    if (comparison.monthOverMonth.percentage !== 0) {
      const change = this.formatChange(comparison.monthOverMonth);
      parts.push(`总工时较上月${change}。`);

      // 异常检测
      if (this.detectAnomalies(totalHours, totalHours - comparison.monthOverMonth.value, ANOMALY_THRESHOLD)) {
        parts.push(`⚠️ 注意：工时变化幅度较大，请确认考勤记录准确性。`);
      }
    }

    return parts.join('');
  }

  /**
   * 生成财务分析文本
   */
  generateFinanceAnalysis(financeData: FinanceData, comparison: ComparisonData): string {
    const parts: string[] = [];
    const { income = 0, expense = 0, balance = 0 } = financeData;

    // 基本信息
    parts.push(
      `本月收入 ¥${income.toLocaleString()}，支出 ¥${expense.toLocaleString()}。`
    );

    // 结余情况
    if (balance >= 0) {
      parts.push(`结余 ¥${balance.toLocaleString()}。`);
    } else {
      parts.push(`支出超过收入 ¥${Math.abs(balance).toLocaleString()}。`);
    }

    // 储蓄率
    if (income > 0) {
      const savingsRate = (balance / income) * 100;
      if (savingsRate >= 30) {
        parts.push(`储蓄率 ${savingsRate.toFixed(0)}%，财务管理良好。`);
      } else if (savingsRate < 0) {
        parts.push(`⚠️ 本月入不敷出，建议控制支出。`);
      }
    }

    // 对比分析
    if (comparison.monthOverMonth.percentage !== 0) {
      const change = this.formatChange(comparison.monthOverMonth);
      parts.push(`结余较上月${change}。`);

      // 异常检测
      if (this.detectAnomalies(balance, balance - comparison.monthOverMonth.value, ANOMALY_THRESHOLD)) {
        parts.push(`⚠️ 注意：财务状况变化较大，请检查大额收支项目。`);
      }
    }

    return parts.join('');
  }

  /**
   * 生成任务分析文本
   */
  generateTaskAnalysis(taskData: TaskData, comparison: ComparisonData): string {
    const parts: string[] = [];
    const { total, completed, pending } = taskData;

    if (total === 0) {
      return '本月暂无任务记录。';
    }

    // 基本信息
    const completionRate = (completed / total) * 100;
    parts.push(
      `本月共有 ${total} 个任务，已完成 ${completed} 个，待办 ${pending} 个。`
    );
    parts.push(`完成率 ${completionRate.toFixed(0)}%。`);

    // 评价
    if (completionRate >= 80) {
      parts.push(`执行力优秀，继续保持！`);
    } else if (completionRate >= 60) {
      parts.push(`执行力良好，还有提升空间。`);
    } else {
      parts.push(`⚠️ 完成率偏低，建议优化时间管理。`);
    }

    // 对比分析
    if (comparison.monthOverMonth.percentage !== 0) {
      const change = this.formatChange(comparison.monthOverMonth);
      parts.push(`完成率较上月${change}。`);
    }

    return parts.join('');
  }

  /**
   * 生成趋势预测文本
   */
  generateTrendForecast(historicalData: HistoricalTrendData[]): TrendForecast {
    const predictions: string[] = [];
    const recommendations: string[] = [];

    if (historicalData.length < 3) {
      return {
        textSummary: '历史数据不足，暂无法生成趋势预测。',
        predictions: [],
        recommendations: ['建议继续记录数据，以便进行趋势分析。'],
        historicalTrend: historicalData,
      };
    }

    // 分析工资趋势
    const salaryTrend = this.analyzeTrend(historicalData.map((d) => d.salary));
    if (salaryTrend === 'up') {
      predictions.push('工资呈上升趋势，收入状况良好');
    } else if (salaryTrend === 'down') {
      predictions.push('工资呈下降趋势，需要关注工时和绩效');
      recommendations.push('建议增加工作时长或寻求绩效提升机会');
    }

    // 分析考勤趋势
    const attendanceTrend = this.analyzeTrend(historicalData.map((d) => d.attendance));
    if (attendanceTrend === 'down') {
      predictions.push('工时呈下降趋势');
      recommendations.push('建议保持稳定的工作时长');
    }

    // 分析财务趋势
    const balanceTrend = this.analyzeTrend(historicalData.map((d) => d.balance));
    if (balanceTrend === 'down') {
      predictions.push('结余呈下降趋势');
      recommendations.push('建议控制支出，增加储蓄');
    } else if (balanceTrend === 'up') {
      predictions.push('结余呈上升趋势，财务状况改善');
    }

    // 分析任务完成率趋势
    const taskTrend = this.analyzeTrend(historicalData.map((d) => d.taskCompletion));
    if (taskTrend === 'down') {
      predictions.push('任务完成率呈下降趋势');
      recommendations.push('建议优化时间管理，提高执行效率');
    }

    const textSummary = predictions.length > 0
      ? `根据最近${historicalData.length}个月的数据分析：${predictions.join('；')}。`
      : '各项指标保持稳定。';

    return {
      textSummary,
      predictions,
      recommendations,
      historicalTrend: historicalData,
    };
  }

  /**
   * 分析趋势
   */
  private analyzeTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    // 简单的线性趋势分析
    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      if (change > 0) increases++;
      else if (change < 0) decreases++;
    }

    if (increases > decreases * 1.5) return 'up';
    if (decreases > increases * 1.5) return 'down';
    return 'stable';
  }

  /**
   * 检测异常波动
   */
  detectAnomalies(current: number, previous: number, threshold: number): boolean {
    if (previous === 0) return false;
    const changeRate = Math.abs((current - previous) / previous);
    return changeRate > threshold;
  }

  /**
   * 格式化变化描述
   */
  private formatChange(change: {
    value: number;
    percentage: number;
    direction: string;
  }): string {
    const direction = change.direction === 'up' ? '增加' : '减少';
    const absValue = Math.abs(change.value);
    const absPercentage = Math.abs(change.percentage);

    return `${direction} ¥${absValue.toLocaleString()}（${absPercentage.toFixed(1)}%）`;
  }
}

// 导出单例实例
export const textGeneratorService = new TextGeneratorService();
