import React, { useState, useEffect } from 'react';
import * as attendanceService from '../../../src/services/attendanceService';
import * as transactionService from '../../../src/services/transactionService';
import * as taskService from '../../../src/services/taskService';
import * as salaryService from '../../../src/services/salaryService';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const MonthlyStatsView: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [currentMonth, currentYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [
                salarySettings,
                attStats,
                financeStats,
                allTasks
            ] = await Promise.all([
                salaryService.getSalarySettings(),
                attendanceService.getMonthlyStats(currentYear, currentMonth),
                transactionService.getMonthlyStats(currentYear, currentMonth),
                taskService.getTasks() // Note: taskService doesn't have getMonthlyTasks yet, using all for now or filtering in memory
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

            // Prepare Chart Data (Income vs Expense vs Salary)
            setChartData([
                { name: '收入', value: parseFloat(financeStats.income.replace(/,/g, '')) },
                { name: '支出', value: parseFloat(financeStats.expense.replace(/,/g, '')) },
                { name: '预计工资', value: salary }
            ]);

        } catch (error) {
            console.error('获取月度统计失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(parseInt(e.target.value));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">月末综合统计</h2>
                <div className="flex items-center gap-3 bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 rounded-xl p-1 pr-4 shadow-sm">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                    </div>
                    <select
                        value={currentMonth}
                        onChange={handleMonthChange}
                        className="bg-transparent border-none font-bold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{m}月</option>
                        ))}
                    </select>
                    <span className="font-bold text-gray-400">{currentYear}年</span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Salary Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <span className="material-symbols-outlined text-white">payments</span>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">预估</span>
                    </div>
                    <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">本月预计工资</p>
                    <h3 className="text-3xl font-black tracking-tight">{Math.floor(stats.salary).toLocaleString()} 円</h3>
                </div>

                {/* Work Time Card */}

                {/* Work Time Card */}
                <div className="bg-white dark:bg-[#1c2127] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                            <span className="material-symbols-outlined text-blue-500">schedule</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">总工时 / 加班</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black dark:text-white">{stats.totalHours}h</h3>
                        <span className="text-sm font-bold text-orange-500">({stats.overtimeHours}h 加班)</span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2">出勤 {stats.attendanceDays} 天</p>
                </div>

                {/* Finance Card */}
                <div className="bg-white dark:bg-[#1c2127] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                            <span className="material-symbols-outlined text-emerald-500">account_balance_wallet</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">收支结余</p>
                    <h3 className={`text-2xl font-black ${stats.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stats.balance >= 0 ? '+' : ''}{stats.balance.toLocaleString()} 円
                    </h3>
                    <div className="flex gap-3 mt-2 text-xs font-bold">
                        <span className="text-emerald-500">收 {stats.income.toLocaleString()} 円</span>
                        <span className="text-red-500">支 {stats.expense.toLocaleString()} 円</span>
                    </div>
                </div>

                {/* Task Card */}

                {/* Task Card */}
                <div className="bg-white dark:bg-[#1c2127] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl">
                            <span className="material-symbols-outlined text-orange-500">check_circle</span>
                        </div>
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.tasksCompleted}/{stats.tasksTotal}</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">任务完成情况</p>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Analysis Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Overview */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-bold text-lg dark:text-white mb-6">财务概览分析</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Work vs Life Balance (Concept) */}
                <div className="bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-bold text-lg dark:text-white mb-6">工时分析</h3>
                    <div className="h-64 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: '正常工时', value: stats.totalHours - stats.overtimeHours, color: '#3b82f6' },
                                        { name: '加班工时', value: stats.overtimeHours, color: '#f59e0b' }
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[
                                        { name: '正常工时', value: stats.totalHours - stats.overtimeHours, color: '#3b82f6' },
                                        { name: '加班工时', value: stats.overtimeHours, color: '#f59e0b' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyStatsView;
