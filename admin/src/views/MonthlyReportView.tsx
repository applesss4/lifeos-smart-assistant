import React, { useState, useEffect } from 'react';
import { dataAggregatorService } from '../services/dataAggregatorService';
import { textGeneratorService } from '../services/textGeneratorService';
import * as notificationService from '../../../src/services/notificationService';
import AdminSkeleton from '../components/AdminSkeleton';
import ReportHeader, { type ExportFormat } from '../components/report/ReportHeader';
import UserSelector from '../components/UserSelector';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    LineChart,
    Line,
} from '../../../src/components/LazyChart';
import type { MonthlyData, HistoricalTrendData } from '../types/monthlyReport';

interface MonthlyReportViewProps {
    selectedUserId?: string;
}

const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({ selectedUserId }) => {
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [exportInProgress, setExportInProgress] = useState(false);
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showShareButton, setShowShareButton] = useState(false);
    
    const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
    const [executiveSummary, setExecutiveSummary] = useState<string>('');
    const [salaryAnalysis, setSalaryAnalysis] = useState<string>('');
    const [attendanceAnalysis, setAttendanceAnalysis] = useState<string>('');
    const [financeAnalysis, setFinanceAnalysis] = useState<string>('');
    const [taskAnalysis, setTaskAnalysis] = useState<string>('');
    const [trendForecast, setTrendForecast] = useState<any>(null);
    const [historicalTrend, setHistoricalTrend] = useState<HistoricalTrendData[]>([]);

    // 分区可见性状态
    const [sectionVisibility, setSectionVisibility] = useState({
        executiveSummary: true,
        salaryAnalysis: true,
        attendanceAnalysis: true,
        financeAnalysis: true,
        taskAnalysis: true,
        trendForecast: true,
    });

    useEffect(() => {
        fetchData();
    }, [currentMonth, currentYear, selectedUserId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 获取月度数据
            const data = await dataAggregatorService.aggregateMonthlyData(
                currentYear,
                currentMonth,
                selectedUserId
            );
            setMonthlyData(data);

            // 生成文本分析
            const summary = textGeneratorService.generateExecutiveSummary(data);
            setExecutiveSummary(summary.overallText);

            // 获取对比数据并生成各项分析
            const salaryComparison = await dataAggregatorService.calculateComparisons(
                data.salary.calculatedSalary,
                currentYear,
                currentMonth,
                selectedUserId,
                'salary'
            );
            setSalaryAnalysis(
                textGeneratorService.generateSalaryAnalysis(data.salary, salaryComparison)
            );

            const attendanceComparison = await dataAggregatorService.calculateComparisons(
                data.attendance.totalHours,
                currentYear,
                currentMonth,
                selectedUserId,
                'attendance'
            );
            setAttendanceAnalysis(
                textGeneratorService.generateAttendanceAnalysis(data.attendance, attendanceComparison)
            );

            const financeComparison = await dataAggregatorService.calculateComparisons(
                data.finance.balance,
                currentYear,
                currentMonth,
                selectedUserId,
                'balance'
            );
            setFinanceAnalysis(
                textGeneratorService.generateFinanceAnalysis(data.finance, financeComparison)
            );

            const taskCompletionRate = data.tasks.total > 0
                ? (data.tasks.completed / data.tasks.total) * 100
                : 0;
            const taskComparison = await dataAggregatorService.calculateComparisons(
                taskCompletionRate,
                currentYear,
                currentMonth,
                selectedUserId,
                'tasks'
            );
            setTaskAnalysis(
                textGeneratorService.generateTaskAnalysis(data.tasks, taskComparison)
            );

            // 获取历史趋势
            const trend = await dataAggregatorService.getHistoricalTrend(
                currentYear,
                currentMonth,
                selectedUserId
            );
            setHistoricalTrend(trend);

            // 生成趋势预测
            const forecast = textGeneratorService.generateTrendForecast(trend);
            setTrendForecast(forecast);

            // 数据加载完成后显示分享按钮
            setShowShareButton(true);

        } catch (error) {
            console.error('获取月度报告失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (month: number) => {
        setCurrentMonth(month);
    };

    const handleYearChange = (year: number) => {
        setCurrentYear(year);
    };

    const handleExport = async (format: ExportFormat) => {
        setExportInProgress(true);
        try {
            // TODO: Implement export functionality in task 11
            console.log(`Exporting report as ${format}...`);
            alert(`导出功能将在任务 11 中实现。格式: ${format}`);
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        } finally {
            setExportInProgress(false);
        }
    };

    const handleResetLayout = () => {
        setSectionVisibility({
            executiveSummary: true,
            salaryAnalysis: true,
            attendanceAnalysis: true,
            financeAnalysis: true,
            taskAnalysis: true,
            trendForecast: true,
        });
        // TODO: Clear localStorage preferences in task 13
        alert('布局已重置为默认状态');
    };

    const handleShareReport = () => {
        setShowUserSelector(true);
    };

    const handleSendToUser = async (userId: string) => {
        if (!monthlyData || !selectedUserId) return;

        try {
            // 生成月度报告摘要
            const reportSummary = `
【${currentYear}年${currentMonth}月工资报告】

💰 预计工资: ${Math.floor(monthlyData.salary.calculatedSalary).toLocaleString()} 円
⏰ 总工时: ${monthlyData.attendance.totalHours}h (出勤${monthlyData.attendance.totalDays}天)
💵 收支结余: ${monthlyData.finance.balance >= 0 ? '+' : ''}${monthlyData.finance.balance.toLocaleString()} 円
✅ 任务完成: ${monthlyData.tasks.completed}/${monthlyData.tasks.total}

${executiveSummary}
            `.trim();

            await notificationService.createNotification(
                userId,
                `月度报告 - ${currentYear}年${currentMonth}月`,
                reportSummary,
                'monthly_report'
            );
            alert('月度报告已发送给用户');
            setShowUserSelector(false);
        } catch (error) {
            console.error('发送月度报告失败:', error);
            alert('发送失败，请稍后重试');
        }
    };

    const toggleSection = (section: keyof typeof sectionVisibility) => {
        setSectionVisibility(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) {
        return <AdminSkeleton />;
    }

    if (!monthlyData) {
        return <div className="p-6 text-center text-gray-500">暂无数据</div>;
    }

    const { salary, attendance, finance, tasks } = monthlyData;

    return (
        <div className="space-y-6 pb-8">
            {/* 报告头部 */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <ReportHeader
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        onMonthChange={handleMonthChange}
                        onYearChange={handleYearChange}
                        onExport={handleExport}
                        onResetLayout={handleResetLayout}
                        exportInProgress={exportInProgress}
                    />
                </div>
                {showShareButton && selectedUserId && (
                    <button
                        onClick={handleShareReport}
                        className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg"
                    >
                        <span className="material-symbols-outlined">share</span>
                        <span>分享给用户</span>
                    </button>
                )}
            </div>

            {/* 执行摘要 */}
            {sectionVisibility.executiveSummary && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">summarize</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">执行摘要</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Executive Summary</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('executiveSummary')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        {executiveSummary}
                    </p>
                </div>
            )}

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 工资卡片 */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white text-xl">payments</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm">预估</span>
                    </div>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">本月预计工资</p>
                    <h3 className="text-2xl font-black tracking-tight">{Math.floor(salary.calculatedSalary).toLocaleString()} 円</h3>
                    <p className="text-xs text-indigo-100 mt-2">出勤 {attendance.totalDays} 天</p>
                </div>

                {/* 工时卡片 */}
                <div className="bg-white dark:bg-[#1c2127] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-blue-500 text-xl">schedule</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">总工时 / 加班</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black dark:text-white">{attendance.totalHours}h</h3>
                        <span className="text-sm font-bold text-orange-500">
                            +{dataAggregatorService.calculateOvertimeHours(attendance.totalHours, attendance.totalDays)}h
                        </span>
                    </div>
                </div>

                {/* 财务卡片 */}
                <div className="bg-white dark:bg-[#1c2127] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-emerald-500 text-xl">account_balance_wallet</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">收支结余</p>
                    <h3 className={`text-2xl font-black ${finance.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {finance.balance >= 0 ? '+' : ''}{finance.balance.toLocaleString()} 円
                    </h3>
                    <div className="flex gap-2 mt-2 text-xs font-semibold">
                        <span className="text-emerald-500">收 {finance.income.toLocaleString()}</span>
                        <span className="text-red-500">支 {finance.expense.toLocaleString()}</span>
                    </div>
                </div>

                {/* 任务卡片 */}
                <div className="bg-white dark:bg-[#1c2127] p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-orange-500 text-xl">check_circle</span>
                        </div>
                        <span className="text-xl font-black text-gray-900 dark:text-white">{tasks.completed}/{tasks.total}</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">任务完成情况</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* 工资分析 */}
            {sectionVisibility.salaryAnalysis && salary.settings && (
                <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">payments</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">工资分析</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Salary Analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('salaryAnalysis')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                        {salaryAnalysis}
                    </p>
                    
                    {/* 工资构成图表 */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: '基本工资', value: salary.breakdown.basePay },
                                    { name: '加班费', value: salary.breakdown.overtimePay },
                                    { name: '补贴', value: salary.breakdown.transportFee + salary.breakdown.bonus },
                                    { name: '扣除', value: -salary.breakdown.deductions },
                                ]}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 考勤分析 */}
            {sectionVisibility.attendanceAnalysis && (
                <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">schedule</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">考勤分析</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Attendance Analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('attendanceAnalysis')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                        {attendanceAnalysis}
                    </p>
                    
                    {/* 工时分布图 */}
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: '正常工时', value: attendance.totalDays * 8 },
                                        { name: '加班工时', value: dataAggregatorService.calculateOvertimeHours(attendance.totalHours, attendance.totalDays) }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 财务分析 */}
            {sectionVisibility.financeAnalysis && (
                <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">财务分析</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Finance Analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('financeAnalysis')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {financeAnalysis}
                    </p>
                </div>
            )}

            {/* 任务分析 */}
            {sectionVisibility.taskAnalysis && (
                <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">check_circle</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">任务分析</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Task Analysis</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('taskAnalysis')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {taskAnalysis}
                    </p>
                </div>
            )}

            {/* 趋势预测 */}
            {sectionVisibility.trendForecast && trendForecast && historicalTrend.length > 0 && (
                <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg">
                                <span className="material-symbols-outlined text-white text-xl">trending_up</span>
                            </div>
                            <div>
                                <h3 className="font-black text-lg dark:text-white">趋势预测</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Trend Forecast</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSection('trendForecast')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <span className="material-symbols-outlined">expand_less</span>
                        </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                        {trendForecast.textSummary}
                    </p>
                    
                    {/* 趋势图表 */}
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="salary" stroke="#6366f1" name="工资" />
                                <Line type="monotone" dataKey="balance" stroke="#10b981" name="结余" />
                                <Line type="monotone" dataKey="taskCompletion" stroke="#f59e0b" name="任务完成率" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 建议 */}
                    {trendForecast.recommendations.length > 0 && (
                        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                            <h4 className="font-bold text-sm text-purple-900 dark:text-purple-100 mb-2">💡 建议</h4>
                            <ul className="space-y-1">
                                {trendForecast.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="text-sm text-purple-700 dark:text-purple-300">
                                        • {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            
            {/* User Selector Modal */}
            {showUserSelector && (
                <UserSelector
                    onSelect={handleSendToUser}
                    onCancel={() => setShowUserSelector(false)}
                />
            )}
        </div>
    );
};

export default MonthlyReportView;
