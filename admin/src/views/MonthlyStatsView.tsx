import React, { useState, useEffect } from 'react';
import * as attendanceService from '../../../src/services/attendanceService';
import * as transactionService from '../../../src/services/transactionService';
import * as taskService from '../../../src/services/taskService';
import * as salaryService from '../../../src/services/salaryService';
import AdminSkeleton from '../components/AdminSkeleton';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip
} from '../../../src/components/LazyChart';

interface MonthlyStatsViewProps {
    selectedUserId?: string;
}

const MonthlyStatsView: React.FC<MonthlyStatsViewProps> = ({ selectedUserId }) => {
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

    const [stats, setStats] = useState({
        salary: 0,
        attendanceDays: 0,
        totalHours: 0,
        overtimeHours: 0,
        income: 0,
        expense: 0,
        balance: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        tasksPending: 0
    });

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchData();
    }, [currentMonth, selectedUserId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel with selectedUserId
            const [
                salarySettings,
                attStats,
                financeStats,
                allTasks
            ] = await Promise.all([
                salaryService.getSalarySettings(selectedUserId),
                attendanceService.getMonthlyStats(currentYear, currentMonth, selectedUserId),
                transactionService.getMonthlyStats(currentYear, currentMonth, selectedUserId),
                taskService.getTasks(selectedUserId)
            ]);

            // Calculate Salary
            const normalHours = Math.min(attStats.totalHours, attStats.attendanceDays * 8);
            const overtimeHours = Math.max(0, attStats.totalHours - normalHours);

            let salary = 0;
            if (salarySettings) {
                const gross = (normalHours * salarySettings.hourly_rate) +
                    (overtimeHours * salarySettings.overtime_rate) +
                    salarySettings.transport_fee +
                    salarySettings.bonus;
                const deductions = (salarySettings.xiaowang_diff || 0) + (salarySettings.xiaowang_pension || 0);
                salary = gross - deductions;
            }

            // Process Tasks (Filter by month roughly or just show current status as request implies "monthly analysis" but tasks are usually ongoing)
            // For now, let's just count all tasks as a general "Task Health" metric, or filter by created_at/completed_at if available.
            // The task object has `date` (label) and `created_at` (DB). Let's use current status for simplicity as "Month End Review" usually checks backlog.
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(t => t.completed).length;

            setStats({
                salary,
                attendanceDays: attStats.attendanceDays,
                totalHours: attStats.totalHours,
                overtimeHours,
                income: parseFloat(financeStats.income.replace(/,/g, '')),
                expense: parseFloat(financeStats.expense.replace(/,/g, '')),
                balance: parseFloat(financeStats.balance.replace(/,/g, '')),
                tasksTotal: totalTasks,
                tasksCompleted: completedTasks,
                tasksPending: totalTasks - completedTasks
            });

        } catch (error) {
            console.error('获取月度统计失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(parseInt(e.target.value));
    };

    if (loading) {
        return <AdminSkeleton />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight dark:text-white">月末综合统计</h2>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                    <select
                        value={currentMonth}
                        onChange={handleMonthChange}
                        className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                        ))}
                    </select>
                    <span className="text-sm font-semibold text-gray-400">{currentYear}年</span>
                </div>
            </div>

            {/* Key Metrics Grid - 更紧凑的设计 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Salary Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white text-lg">payments</span>
                        </div>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">预估</span>
                    </div>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider mb-1">本月预计工资</p>
                    <h3 className="text-xl font-black tracking-tight">{Math.floor(stats.salary).toLocaleString()} 円</h3>
                </div>

                {/* Work Time Card */}
                <div className="bg-white dark:bg-[#1c2127] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">总工时 / 加班</p>
                    <div className="flex items-baseline gap-1.5">
                        <h3 className="text-xl font-black dark:text-white">{stats.totalHours}h</h3>
                        <span className="text-xs font-bold text-orange-500">+{stats.overtimeHours}h</span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">出勤 {stats.attendanceDays} 天</p>
                </div>

                {/* Finance Card */}
                <div className="bg-white dark:bg-[#1c2127] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">account_balance_wallet</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">收支结余</p>
                    <h3 className={`text-xl font-black ${stats.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stats.balance >= 0 ? '+' : ''}{stats.balance.toLocaleString()} 円
                    </h3>
                    <div className="flex gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-emerald-500">收 {stats.income.toLocaleString()}</span>
                        <span className="text-red-500">支 {stats.expense.toLocaleString()}</span>
                    </div>
                </div>

                {/* Task Card */}
                <div className="bg-white dark:bg-[#1c2127] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                            <span className="material-symbols-outlined text-orange-500 text-lg">check_circle</span>
                        </div>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{stats.tasksCompleted}/{stats.tasksTotal}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">任务完成情况</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Analysis Charts - 现代化设计 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Financial Overview - 卡片式设计 */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-[#1c2127] dark:to-[#252b36] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                                <span className="material-symbols-outlined text-white text-xl">analytics</span>
                            </div>
                            <div>
                                <h3 className="font-black text-base dark:text-white">财务概览分析</h3>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Financial Overview</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* 卡片式数据展示 */}
                    <div className="space-y-4">
                        {/* 收入卡片 */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 group hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                        <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
                                    </div>
                                    <div>
                                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">本月收入</p>
                                        <h4 className="text-3xl font-black text-white tracking-tight">¥{stats.income.toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <span className="text-white text-xs font-bold">+100%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 支出卡片 */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 shadow-lg shadow-red-500/20 group hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                        <span className="material-symbols-outlined text-white text-2xl">trending_down</span>
                                    </div>
                                    <div>
                                        <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1">本月支出</p>
                                        <h4 className="text-3xl font-black text-white tracking-tight">¥{stats.expense.toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <span className="text-white text-xs font-bold">-{stats.expense > 0 ? ((stats.expense / (stats.income || 1)) * 100).toFixed(0) : 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 预计工资卡片 */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-indigo-500/20 group hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                        <span className="material-symbols-outlined text-white text-2xl">payments</span>
                                    </div>
                                    <div>
                                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">预计工资</p>
                                        <h4 className="text-3xl font-black text-white tracking-tight">¥{Math.floor(stats.salary).toLocaleString()}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <span className="text-white text-xs font-bold">{stats.attendanceDays}天</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 底部汇总 */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-lg">account_balance</span>
                                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">本月结余</span>
                            </div>
                            <div className={`text-2xl font-black ${stats.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {stats.balance >= 0 ? '+' : ''}¥{stats.balance.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Work vs Life Balance - 现代化环形图 */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1c2127] dark:to-[#252b36] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                            <span className="material-symbols-outlined text-white text-xl">schedule</span>
                        </div>
                        <div>
                            <h3 className="font-black text-base dark:text-white">工时分析</h3>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Work Hours</p>
                        </div>
                    </div>
                    <div className="h-56 flex justify-center items-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    <linearGradient id="normalHoursGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/>
                                    </linearGradient>
                                    <linearGradient id="overtimeGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={1}/>
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={[
                                        { name: '正常工时', value: stats.totalHours - stats.overtimeHours },
                                        { name: '加班工时', value: stats.overtimeHours }
                                    ]}
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    <Cell fill="url(#normalHoursGradient)" />
                                    <Cell fill="url(#overtimeGradient)" />
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        fontSize: '12px', 
                                        borderRadius: '10px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                        fontWeight: 600,
                                        padding: '10px 14px'
                                    }}
                                    formatter={(value: number | undefined) => value !== undefined ? [`${value}小时`, ''] : ['', '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* 中心数据显示 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-3xl font-black dark:text-white">{stats.totalHours}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">总工时</p>
                        </div>
                    </div>
                    {/* 详细数据 */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"></div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">正常</span>
                            </div>
                            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.totalHours - stats.overtimeHours}h</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400"></div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">加班</span>
                            </div>
                            <p className="text-lg font-black text-orange-600 dark:text-orange-400">{stats.overtimeHours}h</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyStatsView;
