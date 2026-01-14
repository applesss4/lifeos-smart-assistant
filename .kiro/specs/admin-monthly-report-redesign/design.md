# Design Document

## Overview

本设计文档描述了管理端月末统计页面重新设计的技术实现方案。系统将现有的数据展示页面升级为一个完整的月度报告系统，包含智能文本总结、多维度图表分析和报告导出功能。

设计采用模块化架构，将数据聚合、文本生成、图表渲染和报告导出分离为独立的服务模块，确保代码的可维护性和可扩展性。

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                   MonthlyReportView (主视图)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Report Header & Controls                 │   │
│  │  (月份选择、员工选择、导出按钮、布局控制)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Executive Summary Section                   │   │
│  │  (智能文本总结 + 关键指标卡片)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Salary Analysis Section                  │   │
│  │  (工资文本分析 + 堆叠柱状图 + 对比数据)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Attendance Analysis Section                 │   │
│  │  (考勤文本分析 + 工时折线图 + 环形图)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Finance Analysis Section                   │   │
│  │  (财务文本分析 + 收支趋势图 + 支出饼图)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Task Analysis Section                    │   │
│  │  (任务文本分析 + 完成率图表 + 任务列表)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Trend Forecast Section                   │   │
│  │  (趋势预测文本 + 6个月趋势图)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Data Aggregator │  │ Text Generator  │  │ Report Exporter │
│                 │  │                 │  │                 │
│ - 数据收集      │  │ - 文本生成      │  │ - PDF导出       │
│ - 数据计算      │  │ - 趋势分析      │  │ - Excel导出     │
│ - 对比计算      │  │ - 异常检测      │  │ - 图片导出      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Services                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Attendance│  │ Finance  │  │  Task    │  │  Salary  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **数据收集阶段**: Data Aggregator 并行调用各个 Service 获取原始数据
2. **数据处理阶段**: Data Aggregator 计算统计指标、对比数据和趋势
3. **文本生成阶段**: Text Generator 根据处理后的数据生成智能文本总结
4. **渲染阶段**: 各个 Section 组件接收数据并渲染 UI 和图表
5. **导出阶段**: Report Exporter 将渲染后的内容导出为指定格式

## Components and Interfaces

### 1. MonthlyReportView (主视图组件)

主视图组件，负责整体布局和状态管理。

```typescript
interface MonthlyReportViewProps {
  selectedUserId?: string;
}

interface MonthlyReportState {
  loading: boolean;
  currentMonth: number;
  currentYear: number;
  reportData: ReportData | null;
  sectionVisibility: Record<string, boolean>;
  exportInProgress: boolean;
}
```

### 2. ReportHeader (报告头部组件)

```typescript
interface ReportHeaderProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onExport: (format: ExportFormat) => void;
  onResetLayout: () => void;
  exportInProgress: boolean;
}

type ExportFormat = 'pdf' | 'excel' | 'image';
```

### 3. ExecutiveSummarySection (执行摘要组件)

```typescript
interface ExecutiveSummarySectionProps {
  summary: ExecutiveSummary;
  keyMetrics: KeyMetrics;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface ExecutiveSummary {
  overallText: string;
  highlights: string[];
  concerns: string[];
}

interface KeyMetrics {
  salary: number;
  salaryChange: ChangeIndicator;
  attendance: number;
  attendanceChange: ChangeIndicator;
  balance: number;
  balanceChange: ChangeIndicator;
  taskCompletion: number;
  taskCompletionChange: ChangeIndicator;
}

interface ChangeIndicator {
  value: number;
  percentage: number;
  direction: 'up' | 'down' | 'stable';
  comparisonType: 'mom' | 'yoy'; // month-over-month or year-over-year
}
```

### 4. SalaryAnalysisSection (工资分析组件)

```typescript
interface SalaryAnalysisSectionProps {
  analysis: SalaryAnalysis;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface SalaryAnalysis {
  textSummary: string;
  totalSalary: number;
  breakdown: SalaryBreakdown;
  comparison: ComparisonData;
  chartData: SalaryChartData;
}

interface SalaryBreakdown {
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

interface SalaryChartData {
  categories: string[];
  values: number[];
}
```

### 5. AttendanceAnalysisSection (考勤分析组件)

```typescript
interface AttendanceAnalysisSectionProps {
  analysis: AttendanceAnalysis;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface AttendanceAnalysis {
  textSummary: string;
  totalDays: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  comparison: ComparisonData;
  dailyTrend: DailyTrendData[];
  hourDistribution: HourDistribution;
}

interface DailyTrendData {
  date: string;
  hours: number;
  isOvertime: boolean;
}

interface HourDistribution {
  normalHours: number;
  overtimeHours: number;
}
```

### 6. FinanceAnalysisSection (财务分析组件)

```typescript
interface FinanceAnalysisSectionProps {
  analysis: FinanceAnalysis;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface FinanceAnalysis {
  textSummary: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  comparison: ComparisonData;
  expenseBreakdown: ExpenseCategory[];
  incomeTrend: TrendData[];
  expenseTrend: TrendData[];
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface TrendData {
  month: string;
  value: number;
}
```

### 7. TaskAnalysisSection (任务分析组件)

```typescript
interface TaskAnalysisSectionProps {
  analysis: TaskAnalysis;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface TaskAnalysis {
  textSummary: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  comparison: ComparisonData;
  tasksByStatus: TaskStatusData[];
  upcomingTasks: TaskItem[];
}

interface TaskStatusData {
  status: 'completed' | 'in-progress' | 'pending';
  count: number;
  percentage: number;
}

interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}
```

### 8. TrendForecastSection (趋势预测组件)

```typescript
interface TrendForecastSectionProps {
  forecast: TrendForecast;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface TrendForecast {
  textSummary: string;
  predictions: string[];
  recommendations: string[];
  historicalTrend: HistoricalTrendData[];
}

interface HistoricalTrendData {
  month: string;
  salary: number;
  attendance: number;
  balance: number;
  taskCompletion: number;
}
```

### 9. DataAggregatorService (数据聚合服务)

```typescript
class DataAggregatorService {
  /**
   * 聚合指定月份和用户的所有数据
   */
  async aggregateMonthlyData(
    year: number,
    month: number,
    userId?: string
  ): Promise<ReportData>;

  /**
   * 计算对比数据（环比和同比）
   */
  async calculateComparisons(
    currentData: MonthlyData,
    year: number,
    month: number,
    userId?: string
  ): Promise<ComparisonData>;

  /**
   * 获取历史趋势数据（最近6个月）
   */
  async getHistoricalTrend(
    year: number,
    month: number,
    userId?: string
  ): Promise<HistoricalTrendData[]>;
}
```

### 10. TextGeneratorService (文本生成服务)

```typescript
class TextGeneratorService {
  /**
   * 生成执行摘要文本
   */
  generateExecutiveSummary(data: ReportData): ExecutiveSummary;

  /**
   * 生成工资分析文本
   */
  generateSalaryAnalysis(salaryData: SalaryData, comparison: ComparisonData): string;

  /**
   * 生成考勤分析文本
   */
  generateAttendanceAnalysis(attendanceData: AttendanceData, comparison: ComparisonData): string;

  /**
   * 生成财务分析文本
   */
  generateFinanceAnalysis(financeData: FinanceData, comparison: ComparisonData): string;

  /**
   * 生成任务分析文本
   */
  generateTaskAnalysis(taskData: TaskData, comparison: ComparisonData): string;

  /**
   * 生成趋势预测文本
   */
  generateTrendForecast(historicalData: HistoricalTrendData[]): TrendForecast;

  /**
   * 检测异常波动
   */
  detectAnomalies(current: number, previous: number, threshold: number): boolean;
}
```

### 11. ReportExporterService (报告导出服务)

```typescript
class ReportExporterService {
  /**
   * 导出为PDF
   */
  async exportToPDF(reportElement: HTMLElement, filename: string): Promise<void>;

  /**
   * 导出为Excel
   */
  async exportToExcel(reportData: ReportData, filename: string): Promise<void>;

  /**
   * 导出为图片
   */
  async exportToImage(reportElement: HTMLElement, filename: string): Promise<void>;
}
```

## Data Models

### ReportData (完整报告数据)

```typescript
interface ReportData {
  metadata: ReportMetadata;
  executiveSummary: ExecutiveSummary;
  salaryAnalysis: SalaryAnalysis;
  attendanceAnalysis: AttendanceAnalysis;
  financeAnalysis: FinanceAnalysis;
  taskAnalysis: TaskAnalysis;
  trendForecast: TrendForecast;
}

interface ReportMetadata {
  year: number;
  month: number;
  userId?: string;
  userName?: string;
  generatedAt: string;
}
```

### ComparisonData (对比数据)

```typescript
interface ComparisonData {
  monthOverMonth: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  yearOverYear: {
    value: number;
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}
```

### MonthlyData (月度原始数据)

```typescript
interface MonthlyData {
  salary: SalaryData;
  attendance: AttendanceData;
  finance: FinanceData;
  tasks: TaskData;
}

interface SalaryData {
  settings: SalarySettings;
  calculatedSalary: number;
  breakdown: SalaryBreakdown;
}

interface AttendanceData {
  totalDays: number;
  totalHours: number;
  dailyRecords: DailyAttendanceRecord[];
}

interface DailyAttendanceRecord {
  date: string;
  hours: number;
  startTime?: string;
  endTime?: string;
}

interface FinanceData {
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface TaskData {
  total: number;
  completed: number;
  pending: number;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}
```

## Correctness Properties

*属性是关于系统应该满足的特征或行为的形式化陈述，这些陈述应该在所有有效执行中都成立。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 文本生成完整性
*For any* 月度数据，当文本生成器生成执行摘要时，返回的文本应包含所有关键指标（工资、考勤、财务、任务）的描述
**Validates: Requirements 1.1**

### Property 2: 工资分析文本完整性
*For any* 工资数据，生成的工资分析文本应包含总额、变化百分比和构成说明
**Validates: Requirements 1.2**

### Property 3: 考勤分析文本完整性
*For any* 考勤数据，生成的考勤分析文本应包含出勤天数、总工时和加班工时信息
**Validates: Requirements 1.3**

### Property 4: 财务分析文本完整性
*For any* 财务数据，生成的财务分析文本应包含收入、支出和结余信息
**Validates: Requirements 1.4**

### Property 5: 任务分析文本完整性
*For any* 任务数据，生成的任务分析文本应包含完成率和待办任务数量
**Validates: Requirements 1.5**

### Property 6: 异常波动检测
*For any* 数据对比，当当前值与前值的变化超过20%时，文本中应包含异常标记或高亮提示
**Validates: Requirements 1.6**

### Property 7: 环比计算正确性
*For any* 两个连续月份的数据，环比计算应返回正确的绝对值差异和百分比变化
**Validates: Requirements 2.1, 2.3**

### Property 8: 同比计算正确性
*For any* 相同月份的跨年数据，同比计算应返回正确的绝对值差异和百分比变化
**Validates: Requirements 2.2, 2.3**

### Property 9: 工资图表数据完整性
*For any* 工资数据，生成的图表数据应包含基本工资、加班费、补贴和扣除项所有类别
**Validates: Requirements 3.1**

### Property 10: 考勤趋势数据完整性
*For any* 月度考勤数据，生成的趋势图数据应包含该月每一天的工时记录
**Validates: Requirements 3.2**

### Property 11: 财务饼图数据一致性
*For any* 支出数据，饼图中所有类别的金额总和应等于总支出金额
**Validates: Requirements 3.3**

### Property 12: 任务状态数据一致性
*For any* 任务数据，完成、进行中和待办任务的数量总和应等于总任务数
**Validates: Requirements 3.4**

### Property 13: 历史趋势数据长度
*For any* 历史趋势查询，返回的数据应包含最近6个月的数据点
**Validates: Requirements 3.5**

### Property 14: 报告结构完整性
*For any* 生成的报告数据，应包含所有必需的区域：执行摘要、工资分析、考勤分析、财务分析、任务分析、趋势预测
**Validates: Requirements 4.1**

### Property 15: 工资计算正确性
*For any* 考勤数据和工资设置，计算的工资应等于（正常工时 × 时薪 + 加班工时 × 加班费率 + 补贴 - 扣除项）
**Validates: Requirements 6.2**

### Property 16: 加班工时识别
*For any* 日考勤记录，当工时超过8小时时，超出部分应被识别为加班工时
**Validates: Requirements 6.3**

### Property 17: 财务汇总正确性
*For any* 交易列表，收入总和减去支出总和应等于结余
**Validates: Requirements 6.4**

### Property 18: 任务统计正确性
*For any* 任务列表，已完成任务数 + 待办任务数应等于总任务数
**Validates: Requirements 6.5**

### Property 19: 缺失数据处理
*For any* 数据聚合请求，当某个数据源返回空值时，系统应使用默认值并在报告元数据中标记数据不完整
**Validates: Requirements 6.6**

### Property 20: 用户偏好持久化
*For any* 分区可见性设置，保存后重新加载时应恢复相同的可见性状态
**Validates: Requirements 8.2**

## Error Handling

### 数据加载错误

1. **网络错误**: 当任何数据服务请求失败时，显示友好的错误消息，并提供重试按钮
2. **部分数据失败**: 当部分数据源失败时，使用可用数据生成报告，并在报告顶部显示警告
3. **完全失败**: 当所有数据源都失败时，显示错误页面，提供返回和重试选项

### 计算错误

1. **除零错误**: 在计算百分比和比率时，检查分母是否为零，使用安全的默认值
2. **数据类型错误**: 验证所有数值字段，处理非数值输入
3. **日期错误**: 验证日期范围的有效性，处理无效日期

### 导出错误

1. **PDF生成失败**: 捕获PDF生成错误，显示错误消息，建议尝试其他格式
2. **Excel生成失败**: 捕获Excel生成错误，提供降级方案（如CSV）
3. **浏览器兼容性**: 检测浏览器支持，对不支持的功能提供替代方案

### 用户输入错误

1. **无效月份**: 验证月份选择在1-12范围内
2. **无效年份**: 验证年份在合理范围内（如2020-2030）
3. **无效用户ID**: 验证用户ID存在，否则显示错误

## Testing Strategy

### 单元测试

使用 Vitest 进行单元测试，覆盖以下模块：

1. **DataAggregatorService**
   - 测试数据聚合逻辑
   - 测试对比计算（环比、同比）
   - 测试历史趋势数据获取
   - 测试错误处理（部分失败、完全失败）

2. **TextGeneratorService**
   - 测试各类文本生成函数
   - 测试异常检测逻辑
   - 测试文本格式和完整性
   - 测试边界情况（空数据、极值）

3. **ReportExporterService**
   - 测试PDF导出功能
   - 测试Excel导出功能
   - 测试图片导出功能
   - 测试文件命名和格式

4. **计算函数**
   - 测试工资计算
   - 测试加班工时计算
   - 测试财务汇总
   - 测试任务统计

### 属性测试

使用 fast-check 进行属性测试，每个测试运行至少100次迭代：

1. **文本生成属性测试**
   - 测试 Property 1-6（文本完整性和异常检测）
   - 生成随机月度数据，验证文本包含必需信息

2. **计算属性测试**
   - 测试 Property 7-8（对比计算）
   - 测试 Property 15-18（工资、加班、财务、任务计算）
   - 生成随机数值，验证计算正确性

3. **数据一致性属性测试**
   - 测试 Property 11-12, 14（数据总和一致性、结构完整性）
   - 验证部分之和等于总和

4. **数据完整性属性测试**
   - 测试 Property 9-10, 13（图表数据完整性）
   - 验证数据包含所有必需字段

### 集成测试

1. **端到端报告生成**
   - 测试完整的报告生成流程
   - 验证所有区域正确渲染
   - 测试用户交互（月份切换、分区折叠）

2. **导出功能集成测试**
   - 测试完整的导出流程
   - 验证导出文件的完整性

3. **性能测试**
   - 测试大数据量下的性能
   - 测试并发数据加载
   - 测试图表渲染性能

### 测试标签格式

每个属性测试必须使用以下标签格式：
```typescript
// Feature: admin-monthly-report-redesign, Property 1: 文本生成完整性
```

