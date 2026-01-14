# Implementation Plan: Admin Monthly Report Redesign

## Overview

本实现计划将现有的月末统计页面重新设计为一个完整的月度报告系统。实现将分为以下几个阶段：
1. 创建核心服务类（数据聚合、文本生成、报告导出）
2. 实现各个报告区域组件
3. 集成所有组件到主视图
4. 添加交互功能和导出功能
5. 测试和优化

## Tasks

- [x] 1. 创建数据模型和类型定义
  - 在 `admin/src/types/` 目录下创建 `monthlyReport.ts`
  - 定义所有接口：ReportData, ComparisonData, MonthlyData, SalaryAnalysis, AttendanceAnalysis, FinanceAnalysis, TaskAnalysis, TrendForecast 等
  - 导出所有类型供其他模块使用
  - _Requirements: 所有需求的数据基础_

- [ ]* 1.1 为数据模型编写单元测试
  - 测试类型定义的完整性
  - 测试默认值和边界情况
  - _Requirements: 所有需求的数据基础_

- [x] 2. 实现 DataAggregatorService
  - [x] 2.1 创建 `admin/src/services/dataAggregatorService.ts`
    - 实现 `aggregateMonthlyData()` 方法，并行获取考勤、财务、任务、工资数据
    - 实现 `calculateComparisons()` 方法，计算环比和同比数据
    - 实现 `getHistoricalTrend()` 方法，获取最近6个月的历史数据
    - 实现工资计算逻辑（正常工时 + 加班工时）
    - 实现加班工时识别逻辑（超过8小时的部分）
    - 实现财务汇总逻辑（收入 - 支出 = 结余）
    - 实现任务统计逻辑（总数、完成数、待办数）
    - 添加错误处理，处理数据缺失情况
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 2.1, 2.2, 3.5_

- [ ]* 2.2 为 DataAggregatorService 编写属性测试
  - **Property 7: 环比计算正确性**
  - **Validates: Requirements 2.1, 2.3**
  - _Requirements: 2.1, 2.3_

- [ ]* 2.3 为 DataAggregatorService 编写属性测试
  - **Property 8: 同比计算正确性**
  - **Validates: Requirements 2.2, 2.3**
  - _Requirements: 2.2, 2.3_

- [ ]* 2.4 为 DataAggregatorService 编写属性测试
  - **Property 15: 工资计算正确性**
  - **Validates: Requirements 6.2**
  - _Requirements: 6.2_

- [ ]* 2.5 为 DataAggregatorService 编写属性测试
  - **Property 16: 加班工时识别**
  - **Validates: Requirements 6.3**
  - _Requirements: 6.3_

- [ ]* 2.6 为 DataAggregatorService 编写属性测试
  - **Property 17: 财务汇总正确性**
  - **Validates: Requirements 6.4**
  - _Requirements: 6.4_

- [ ]* 2.7 为 DataAggregatorService 编写属性测试
  - **Property 18: 任务统计正确性**
  - **Validates: Requirements 6.5**
  - _Requirements: 6.5_

- [ ]* 2.8 为 DataAggregatorService 编写属性测试
  - **Property 19: 缺失数据处理**
  - **Validates: Requirements 6.6**
  - _Requirements: 6.6_

- [ ]* 2.9 为 DataAggregatorService 编写单元测试
  - 测试错误处理场景
  - 测试边界情况（空数据、极值）
  - _Requirements: 6.1-6.6_

- [x] 3. 实现 TextGeneratorService
  - [x] 3.1 创建 `admin/src/services/textGeneratorService.ts`
    - 实现 `generateExecutiveSummary()` 方法
    - 实现 `generateSalaryAnalysis()` 方法
    - 实现 `generateAttendanceAnalysis()` 方法
    - 实现 `generateFinanceAnalysis()` 方法
    - 实现 `generateTaskAnalysis()` 方法
    - 实现 `generateTrendForecast()` 方法
    - 实现 `detectAnomalies()` 方法（检测超过20%的波动）
    - 使用模板字符串生成格式化的文本
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 3.2 为 TextGeneratorService 编写属性测试
  - **Property 1: 文本生成完整性**
  - **Validates: Requirements 1.1**
  - _Requirements: 1.1_

- [ ]* 3.3 为 TextGeneratorService 编写属性测试
  - **Property 2: 工资分析文本完整性**
  - **Validates: Requirements 1.2**
  - _Requirements: 1.2_

- [ ]* 3.4 为 TextGeneratorService 编写属性测试
  - **Property 3: 考勤分析文本完整性**
  - **Validates: Requirements 1.3**
  - _Requirements: 1.3_

- [ ]* 3.5 为 TextGeneratorService 编写属性测试
  - **Property 4: 财务分析文本完整性**
  - **Validates: Requirements 1.4**
  - _Requirements: 1.4_

- [ ]* 3.6 为 TextGeneratorService 编写属性测试
  - **Property 5: 任务分析文本完整性**
  - **Validates: Requirements 1.5**
  - _Requirements: 1.5_

- [ ]* 3.7 为 TextGeneratorService 编写属性测试
  - **Property 6: 异常波动检测**
  - **Validates: Requirements 1.6**
  - _Requirements: 1.6_

- [ ]* 3.8 为 TextGeneratorService 编写单元测试
  - 测试文本格式和可读性
  - 测试边界情况（空数据、极值）
  - _Requirements: 1.1-1.6_

- [ ] 4. 实现报告区域组件 - ExecutiveSummarySection
  - [ ] 4.1 创建 `admin/src/components/report/ExecutiveSummarySection.tsx`
    - 接收 ExecutiveSummary 和 KeyMetrics 数据
    - 渲染执行摘要文本
    - 渲染4个关键指标卡片（工资、考勤、财务、任务）
    - 显示对比数据（环比/同比）
    - 使用图标和颜色标识变化方向
    - 支持折叠/展开功能
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 4.1_

- [ ]* 4.2 为 ExecutiveSummarySection 编写单元测试
  - 测试组件渲染
  - 测试折叠/展开交互
  - _Requirements: 1.1, 4.1_

- [ ] 5. 实现报告区域组件 - SalaryAnalysisSection
  - [ ] 5.1 创建 `admin/src/components/report/SalaryAnalysisSection.tsx`
    - 接收 SalaryAnalysis 数据
    - 渲染工资分析文本
    - 渲染堆叠柱状图（基本工资、加班费、补贴、扣除项）
    - 显示工资构成详细数据
    - 显示对比数据
    - 支持折叠/展开功能
    - _Requirements: 1.2, 3.1, 4.1_

- [ ]* 5.2 为 SalaryAnalysisSection 编写属性测试
  - **Property 9: 工资图表数据完整性**
  - **Validates: Requirements 3.1**
  - _Requirements: 3.1_

- [ ]* 5.3 为 SalaryAnalysisSection 编写单元测试
  - 测试组件渲染
  - 测试图表数据准备
  - _Requirements: 1.2, 3.1_

- [ ] 6. 实现报告区域组件 - AttendanceAnalysisSection
  - [ ] 6.1 创建 `admin/src/components/report/AttendanceAnalysisSection.tsx`
    - 接收 AttendanceAnalysis 数据
    - 渲染考勤分析文本
    - 渲染每日工时折线图
    - 渲染工时分布环形图（正常工时 vs 加班工时）
    - 显示考勤统计数据
    - 显示对比数据
    - 支持折叠/展开功能
    - _Requirements: 1.3, 3.2, 3.4, 4.1_

- [ ]* 6.2 为 AttendanceAnalysisSection 编写属性测试
  - **Property 10: 考勤趋势数据完整性**
  - **Validates: Requirements 3.2**
  - _Requirements: 3.2_

- [ ]* 6.3 为 AttendanceAnalysisSection 编写单元测试
  - 测试组件渲染
  - 测试图表数据准备
  - _Requirements: 1.3, 3.2_

- [ ] 7. 实现报告区域组件 - FinanceAnalysisSection
  - [ ] 7.1 创建 `admin/src/components/report/FinanceAnalysisSection.tsx`
    - 接收 FinanceAnalysis 数据
    - 渲染财务分析文本
    - 渲染收支趋势折线图
    - 渲染支出类别饼图
    - 显示财务统计数据
    - 显示对比数据
    - 支持折叠/展开功能
    - _Requirements: 1.4, 3.3, 4.1_

- [ ]* 7.2 为 FinanceAnalysisSection 编写属性测试
  - **Property 11: 财务饼图数据一致性**
  - **Validates: Requirements 3.3**
  - _Requirements: 3.3_

- [ ]* 7.3 为 FinanceAnalysisSection 编写单元测试
  - 测试组件渲染
  - 测试图表数据准备
  - _Requirements: 1.4, 3.3_

- [ ] 8. 实现报告区域组件 - TaskAnalysisSection
  - [ ] 8.1 创建 `admin/src/components/report/TaskAnalysisSection.tsx`
    - 接收 TaskAnalysis 数据
    - 渲染任务分析文本
    - 渲染任务状态环形图
    - 显示待办任务列表
    - 显示任务统计数据
    - 显示对比数据
    - 支持折叠/展开功能
    - _Requirements: 1.5, 3.4, 4.1_

- [ ]* 8.2 为 TaskAnalysisSection 编写属性测试
  - **Property 12: 任务状态数据一致性**
  - **Validates: Requirements 3.4**
  - _Requirements: 3.4_

- [ ]* 8.3 为 TaskAnalysisSection 编写单元测试
  - 测试组件渲染
  - 测试图表数据准备
  - _Requirements: 1.5, 3.4_

- [ ] 9. 实现报告区域组件 - TrendForecastSection
  - [ ] 9.1 创建 `admin/src/components/report/TrendForecastSection.tsx`
    - 接收 TrendForecast 数据
    - 渲染趋势预测文本
    - 渲染6个月趋势折线图（多条线：工资、考勤、结余、任务完成率）
    - 显示预测和建议
    - 支持折叠/展开功能
    - _Requirements: 3.5, 4.1_

- [ ]* 9.2 为 TrendForecastSection 编写属性测试
  - **Property 13: 历史趋势数据长度**
  - **Validates: Requirements 3.5**
  - _Requirements: 3.5_

- [ ]* 9.3 为 TrendForecastSection 编写单元测试
  - 测试组件渲染
  - 测试图表数据准备
  - _Requirements: 3.5_

- [x] 10. 实现 ReportHeader 组件
  - 创建 `admin/src/components/report/ReportHeader.tsx`
  - 实现月份选择器
  - 实现年份选择器
  - 实现导出按钮（显示格式选项）
  - 实现重置布局按钮
  - 添加加载状态指示
  - _Requirements: 5.1, 8.3_

- [ ] 11. 实现 ReportExporterService
  - [ ] 11.1 创建 `admin/src/services/reportExporterService.ts`
    - 安装依赖：`html2canvas`, `jspdf`, `xlsx`
    - 实现 `exportToPDF()` 方法，使用 html2canvas + jspdf
    - 实现 `exportToExcel()` 方法，使用 xlsx
    - 实现 `exportToImage()` 方法，使用 html2canvas
    - 添加文件命名逻辑（包含日期和用户名）
    - 添加错误处理
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 11.2 为 ReportExporterService 编写单元测试
  - 测试文件命名逻辑
  - 测试错误处理
  - 模拟导出功能（不实际生成文件）
  - _Requirements: 5.1-5.4_

- [x] 12. 实现主视图 MonthlyReportView
  - [x] 12.1 重构 `admin/src/views/MonthlyStatsView.tsx`
    - 重命名为 `MonthlyReportView.tsx`
    - 集成 DataAggregatorService
    - 集成 TextGeneratorService
    - 集成 ReportExporterService
    - 实现状态管理（loading, reportData, sectionVisibility）
    - 实现数据加载逻辑
    - 渲染 ReportHeader
    - 渲染所有报告区域组件
    - 实现月份/年份切换逻辑
    - 实现导出功能
    - 实现分区折叠/展开逻辑
    - 添加骨架屏加载状态
    - _Requirements: 4.1, 4.4, 7.5, 8.1, 8.4, 8.5_

- [ ]* 12.2 为 MonthlyReportView 编写属性测试
  - **Property 14: 报告结构完整性**
  - **Validates: Requirements 4.1**
  - _Requirements: 4.1_

- [ ]* 12.3 为 MonthlyReportView 编写单元测试
  - 测试组件渲染
  - 测试数据加载流程
  - 测试用户交互（月份切换、折叠展开）
  - _Requirements: 4.1, 8.1, 8.4, 8.5_

- [ ] 13. 实现用户偏好持久化
  - [ ] 13.1 创建 `admin/src/utils/reportPreferences.ts`
    - 实现 `savePreferences()` 方法，保存到 localStorage
    - 实现 `loadPreferences()` 方法，从 localStorage 读取
    - 实现 `resetPreferences()` 方法，清除偏好设置
    - 定义偏好数据结构（分区可见性）
    - _Requirements: 8.2, 8.3_

- [ ]* 13.2 为用户偏好功能编写属性测试
  - **Property 20: 用户偏好持久化**
  - **Validates: Requirements 8.2**
  - _Requirements: 8.2_

- [ ]* 13.3 为用户偏好功能编写单元测试
  - 测试保存和加载逻辑
  - 测试重置功能
  - _Requirements: 8.2, 8.3_

- [ ] 14. 集成到管理端应用
  - 更新 `admin/src/App.tsx` 中的路由，使用新的 MonthlyReportView
  - 确保导航正确指向新页面
  - 测试与其他管理端页面的集成
  - _Requirements: 所有需求_

- [ ] 15. 响应式设计优化
  - 为所有报告组件添加响应式样式
  - 测试移动端布局（单列）
  - 测试平板布局（两列）
  - 测试桌面布局（多列）
  - 优化图表在小屏幕上的显示
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 16. 性能优化
  - 实现图表懒加载（使用 Intersection Observer）
  - 优化数据加载（缓存策略）
  - 优化大数据量渲染
  - 添加进度指示器（超过2秒显示）
  - _Requirements: 7.4, 7.6_

- [x] 17. Checkpoint - 功能验证
  - 确保所有测试通过
  - 手动测试所有功能
  - 验证响应式设计
  - 验证导出功能
  - 询问用户是否有问题或需要调整

- [ ]* 18. 集成测试
  - 编写端到端测试，测试完整的报告生成流程
  - 测试导出功能的完整流程
  - 测试错误场景和边界情况
  - _Requirements: 所有需求_

- [ ] 19. 最终优化和文档
  - 添加代码注释
  - 创建使用文档
  - 优化性能瓶颈
  - 修复发现的 bug
  - _Requirements: 所有需求_

- [ ] 20. Final Checkpoint - 确保所有测试通过
  - 运行所有单元测试
  - 运行所有属性测试
  - 运行集成测试
  - 询问用户是否满意，是否需要进一步调整

## Notes

- 任务标记 `*` 的为可选测试任务，可以根据需要跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- 属性测试使用 fast-check 库，每个测试至少运行100次迭代
- 单元测试使用 Vitest 框架
- 图表使用现有的 LazyChart 组件（Recharts）
- 导出功能需要安装新的依赖包
