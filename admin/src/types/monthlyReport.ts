/**
 * 月度报告系统的类型定义
 * 包含所有报告相关的数据结构和接口
 */

// ============================================================================
// 基础类型
// ============================================================================

export type ChangeDirection = 'up' | 'down' | 'stable';
export type ComparisonType = 'mom' | 'yoy'; // month-over-month or year-over-year
export type ExportFormat = 'pdf' | 'excel' | 'image';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'pending';

// ============================================================================
// 变化指示器
// ============================================================================

export interface ChangeIndicator {
  value: number;
  percentage: number;
  direction: ChangeDirection;
  comparisonType: ComparisonType;
}

// ============================================================================
// 对比数据
// ============================================================================

export interface ComparisonData {
  monthOverMonth: {
    value: number;
    percentage: number;
    direction: ChangeDirection;
  };
  yearOverYear: {
    value: number;
    percentage: number;
    direction: ChangeDirection;
  };
}

// ============================================================================
// 报告元数据
// ============================================================================

export interface ReportMetadata {
  year: number;
  month: number;
  userId?: string;
  userName?: string;
  generatedAt: string;
  isDataComplete: boolean;
  missingDataSources?: string[];
}

// ============================================================================
// 执行摘要
// ============================================================================

export interface ExecutiveSummary {
  overallText: string;
  highlights: string[];
  concerns: string[];
}

export interface KeyMetrics {
  salary: number;
  salaryChange: ChangeIndicator;
  attendance: number;
  attendanceChange: ChangeIndicator;
  balance: number;
  balanceChange: ChangeIndicator;
  taskCompletion: number;
  taskCompletionChange: ChangeIndicator;
}

// ============================================================================
// 工资分析
// ============================================================================

export interface SalaryBreakdown {
  baseHours: number;
  baseHourlyRate: number;
  basePay: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  transportFee: number;
  bonus: number;
  deductions: number;
}

export interface SalaryChartData {
  categories: string[];
  values: number[];
}

export interface SalaryAnalysis {
  textSummary: string;
  totalSalary: number;
  breakdown: SalaryBreakdown;
  comparison: ComparisonData;
  chartData: SalaryChartData;
}

// ============================================================================
// 考勤分析
// ============================================================================

export interface DailyTrendData {
  date: string;
  hours: number;
  isOvertime: boolean;
}

export interface HourDistribution {
  normalHours: number;
  overtimeHours: number;
}

export interface AttendanceAnalysis {
  textSummary: string;
  totalDays: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  comparison: ComparisonData;
  dailyTrend: DailyTrendData[];
  hourDistribution: HourDistribution;
}

// ============================================================================
// 财务分析
// ============================================================================

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface TrendData {
  month: string;
  value: number;
}

export interface FinanceAnalysis {
  textSummary: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  comparison: ComparisonData;
  expenseBreakdown: ExpenseCategory[];
  incomeTrend: TrendData[];
  expenseTrend: TrendData[];
}

// ============================================================================
// 任务分析
// ============================================================================

export interface TaskStatusData {
  status: TaskStatus;
  count: number;
  percentage: number;
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
}

export interface TaskAnalysis {
  textSummary: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  comparison: ComparisonData;
  tasksByStatus: TaskStatusData[];
  upcomingTasks: TaskItem[];
}

// ============================================================================
// 趋势预测
// ============================================================================

export interface HistoricalTrendData {
  month: string;
  salary: number;
  attendance: number;
  balance: number;
  taskCompletion: number;
}

export interface TrendForecast {
  textSummary: string;
  predictions: string[];
  recommendations: string[];
  historicalTrend: HistoricalTrendData[];
}

// ============================================================================
// 完整报告数据
// ============================================================================

export interface ReportData {
  metadata: ReportMetadata;
  executiveSummary: ExecutiveSummary;
  keyMetrics: KeyMetrics;
  salaryAnalysis: SalaryAnalysis;
  attendanceAnalysis: AttendanceAnalysis;
  financeAnalysis: FinanceAnalysis;
  taskAnalysis: TaskAnalysis;
  trendForecast: TrendForecast;
}

// ============================================================================
// 原始月度数据（用于数据聚合）
// ============================================================================

export interface DailyAttendanceRecord {
  date: string;
  hours: number;
  startTime?: string;
  endTime?: string;
}

export interface SalarySettings {
  hourly_rate: number;
  overtime_rate: number;
  transport_fee: number;
  bonus: number;
  xiaowang_diff?: number;
  xiaowang_pension?: number;
}

export interface SalaryData {
  settings: SalarySettings | null;
  calculatedSalary: number;
  breakdown: SalaryBreakdown;
}

export interface AttendanceData {
  totalDays: number;
  totalHours: number;
  dailyRecords: DailyAttendanceRecord[];
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface FinanceData {
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export interface TaskData {
  total: number;
  completed: number;
  pending: number;
  tasks: Task[];
}

export interface MonthlyData {
  salary: SalaryData;
  attendance: AttendanceData;
  finance: FinanceData;
  tasks: TaskData;
}

// ============================================================================
// 组件 Props
// ============================================================================

export interface ReportSectionProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export interface ExecutiveSummarySectionProps extends ReportSectionProps {
  summary: ExecutiveSummary;
  keyMetrics: KeyMetrics;
}

export interface SalaryAnalysisSectionProps extends ReportSectionProps {
  analysis: SalaryAnalysis;
}

export interface AttendanceAnalysisSectionProps extends ReportSectionProps {
  analysis: AttendanceAnalysis;
}

export interface FinanceAnalysisSectionProps extends ReportSectionProps {
  analysis: FinanceAnalysis;
}

export interface TaskAnalysisSectionProps extends ReportSectionProps {
  analysis: TaskAnalysis;
}

export interface TrendForecastSectionProps extends ReportSectionProps {
  forecast: TrendForecast;
}

export interface ReportHeaderProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onExport: (format: ExportFormat) => void;
  onResetLayout: () => void;
  exportInProgress: boolean;
}

// ============================================================================
// 用户偏好设置
// ============================================================================

export interface ReportPreferences {
  sectionVisibility: Record<string, boolean>;
  lastUpdated: string;
}

// ============================================================================
// 默认值和常量
// ============================================================================

export const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  executiveSummary: true,
  salaryAnalysis: true,
  attendanceAnalysis: false,
  financeAnalysis: false,
  taskAnalysis: false,
  trendForecast: false,
};

export const ANOMALY_THRESHOLD = 0.2; // 20% 变化阈值

export const STANDARD_WORK_HOURS = 8; // 标准工作时长（小时）

export const TREND_MONTHS = 6; // 趋势分析的月份数
