
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewType, Transaction, Task } from '../types';
import * as transactionService from '../src/services/transactionService';
import * as taskService from '../src/services/taskService';
import * as attendanceService from '../src/services/attendanceService';
import * as dailyReportService from '../src/services/dailyReportService';
import * as salaryService from '../src/services/salaryService';
import { useAuth } from '../src/contexts/AuthContext';

interface HomeProps {
  onNavigate: (view: ViewType) => void;
  onNotify: (msg: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onNotify }) => {
  const { signOut } = useAuth();
  const [homeTasks, setHomeTasks] = useState<Task[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 统计数据状态
  const [yesterdayStats, setYesterdayStats] = useState({
    hours: 0,
    income: 0
  });
  const [todayStats, setTodayStats] = useState<{
    hours: number;
    overtime: number;
    income: number;
    expense: number;
    isClockedIn: boolean;
    startTime?: string;
  }>({
    hours: 0,
    overtime: 0,
    income: 0,
    expense: 0,
    isClockedIn: false
  });
  const [monthlyStats, setMonthlyStats] = useState({
    expense: 0,
    budget: 5000, // 假设预算为 5000
    overtimePay: 0
  });

  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('其他');
  const [newExpensePaymentMethod, setNewExpensePaymentMethod] = useState('PayPay残高');

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const now = new Date();

      const [
        tasksData,
        expensesData,
        todayAtt,
        todayFin,
        yesterdayAtt,
        yesterdayFin,
        monthFin,
        todayPunch
      ] = await Promise.all([
        taskService.getTodayTasks(),
        transactionService.getTodayTransactions(),
        attendanceService.getDailyStats(today),
        transactionService.getDailyStats(today),
        attendanceService.getDailyStats(yesterday),
        transactionService.getDailyStats(yesterday),
        transactionService.getMonthlyStats(now.getFullYear(), now.getMonth() + 1),
        attendanceService.getTodayPunchStatus()
      ]);

      setHomeTasks(tasksData);
      setTodayExpenses(expensesData.filter(t => t.type === 'Expense'));

      setTodayStats({
        hours: todayAtt.totalHours,
        overtime: todayAtt.overtimeHours,
        income: todayAtt.totalHours * 105,
        expense: todayFin.expense,
        isClockedIn: todayPunch.isClockedIn,
        startTime: todayPunch.lastRecord?.time
      });

      setYesterdayStats({
        hours: yesterdayAtt.totalHours,
        income: yesterdayAtt.totalHours * 105
      });

      setMonthlyStats({
        expense: parseFloat(monthFin.expense.replace(/,/g, '')),
        budget: 5000 - parseFloat(monthFin.expense.replace(/,/g, '')),
        overtimePay: 0 // Will be updated with settings
      });

      // Fetch salary settings for overtime rate
      const salarySettings = await salaryService.getSalarySettings();
      if (salarySettings) {
        // Get monthly stats again to access overtime hours if not available
        const stats = await attendanceService.getMonthlyStats();
        setMonthlyStats(prev => ({
          ...prev,
          overtimePay: stats.totalHours > 0 ? Math.max(0, stats.totalHours - (stats.attendanceDays * 8)) * salarySettings.overtime_rate : 0
        }));
      }

    } catch (error) {
      console.error('加载首页数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const toggleTask = async (taskId: string) => {
    const task = homeTasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // 先更新本地状态（乐观更新）
    setHomeTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    ));
    onNotify(newCompleted ? `已完成: ${task.title}` : `撤销完成: ${task.title}`);

    try {
      // 同步到数据库
      await taskService.toggleTaskComplete(taskId, newCompleted);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      // 回滚本地状态
      setHomeTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !newCompleted } : t
      ));
      onNotify('更新失败，请稍后重试');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpenseAmount);
    if (!newExpenseName.trim() || isNaN(amountNum)) return;

    try {
      const newTx = await transactionService.addExpense(newExpenseName, amountNum, newExpenseCategory, newExpensePaymentMethod);
      setTodayExpenses([newTx, ...todayExpenses]);
      setNewExpenseName('');
      setNewExpenseAmount('');
      setNewExpensePaymentMethod('PayPay残高');
      setShowAddExpenseModal(false);
      onNotify(`支出已记录: ${newExpenseName} ¥${amountNum}`);
    } catch (error) {
      console.error('添加支出失败:', error);
      onNotify('添加支出失败，请稍后重试');
    }
  };

  const dailySummary = useMemo(() => {
    const totalHours = todayStats.hours;
    const overtimeHours = todayStats.overtime;
    const totalEarned = todayStats.income;
    const totalSpent = todayStats.expense;
    const completedTasks = homeTasks.filter(t => t.completed);
    const pendingTasks = homeTasks.filter(t => !t.completed);

    // Find biggest expense
    const biggestExpense = todayExpenses.length > 0
      ? todayExpenses.reduce((prev, current) => (Math.abs(prev.amount) > Math.abs(current.amount)) ? prev : current)
      : null;

    // Narrative generation logic
    let narrative = `今天是充满挑战的一天。你共计投入工作 ${totalHours} 小时${overtimeHours > 0 ? `，其中包括 ${overtimeHours} 小时的额外努力` : ''}。`;

    if (completedTasks.length > 0) {
      narrative += ` 在个人事务上，你成功完成了 ${completedTasks.length} 项任务${pendingTasks.length === 0 ? '，实现了今日事今日毕的完美状态！' : '，表现稳定。'}`;
    } else if (homeTasks.length > 0) {
      narrative += ` 今日待办事项尚待开启，建议稍后优先处理关键任务。`;
    }

    if (totalSpent > 0) {
      narrative += ` 财务方面，今日总计支出 ¥${totalSpent.toFixed(2)}。${biggestExpense ? `最大的单笔花销是来自"${biggestExpense.name}"的 ¥${Math.abs(biggestExpense.amount).toFixed(2)}。` : ''}`;
    } else {
      narrative += ` 今天你在财务控制上做得非常出色，没有任何支出记录。`;
    }

    return { totalHours, overtimeHours, totalEarned, totalSpent, completedTasks, pendingTasks, narrative, biggestExpense };
  }, [todayStats, todayExpenses, homeTasks]);

  // 获取当前时间信息
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? '早上好' : hours < 18 ? '下午好' : '晚上好';
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const period = hours < 12 ? '上午' : '下午';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative user-menu-container">
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="size-12 rounded-full border-2 border-primary/20 bg-cover bg-center cursor-pointer hover:border-primary/40 transition-colors"
              style={{ backgroundImage: `url('https://picsum.photos/seed/alex/200')` }}
            ></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark"></div>
            
            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      onNotify('已成功退出登录');
                    } catch (error) {
                      console.error('退出登录失败:', error);
                      onNotify('退出登录失败，请稍后重试');
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  退出登录
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-none mb-1">{greeting}，</p>
            <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-none tracking-tight">Alex Morgan</h2>
          </div>
        </div>
        <button
          onClick={() => setShowDailyReport(true)}
          className="relative flex items-center justify-center p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-background-light dark:border-background-dark rounded-full"></span>
        </button>
      </div>

      {/* Main Status Card */}
      <div className="rounded-2xl shadow-lg bg-white dark:bg-surface-dark overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="relative h-24 bg-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
          <div className="absolute right-4 top-4 bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 dark:border-gray-700">
            <p className="text-primary text-[10px] font-bold uppercase tracking-wider">工作模式</p>
          </div>
        </div>
        <div className="px-5 pb-5 -mt-6 relative z-10">
          <div className="bg-white dark:bg-[#252b36] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-tight">当前时间</p>
                <h3 className="text-gray-900 dark:text-white text-3xl font-bold font-display tracking-tight">{timeStr} <span className="text-lg text-gray-400 font-sans font-normal">{period}</span></h3>
              </div>
              <div className="text-right">
                <p className={`${todayStats.isClockedIn ? 'text-green-500' : 'text-gray-400'} text-sm font-bold flex items-center justify-end gap-1`}>
                  <span className={`w-2 h-2 rounded-full ${todayStats.isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {todayStats.isClockedIn ? '工作中' : '已下班'}
                </p>
                {todayStats.isClockedIn && todayStats.startTime && (
                  <p className="text-gray-400 text-[10px]">已开始于 {todayStats.startTime}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">payments</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase">昨日工资</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">¥{yesterdayStats.income.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 p-2.5 rounded-lg border border-purple-100 dark:border-purple-800/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500 text-lg">timer</span>
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase">昨日工时</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{yesterdayStats.hours}h</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate(ViewType.ATTENDANCE)}
              className="w-full flex items-center justify-center gap-2 rounded-lg h-12 bg-primary hover:bg-primary/90 text-white text-base font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">fingerprint</span>
              <span>打卡</span>
            </button>
          </div>
        </div>
      </div>

      {/* Finance Brief */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-gray-900 dark:text-white text-lg font-bold">财务简报</h3>
          <button onClick={() => onNavigate(ViewType.FINANCE)} className="text-primary text-sm font-semibold">详情</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 h-28 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 material-symbols-outlined">account_balance_wallet</span>
              <span className="text-xs font-medium text-indigo-400">本月支出</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">¥{monthlyStats.expense.toLocaleString()}</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-2xl border border-teal-100 dark:border-teal-800/30 h-28 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400 material-symbols-outlined">timelapse</span>
              <span className="text-xs font-medium text-teal-400">本月加班费</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">¥{Math.floor(monthlyStats.overtimePay || 0).toLocaleString()}</p>
              <div className="w-full bg-teal-200 dark:bg-teal-800 rounded-full h-1 mt-2">
                {/*  Show a progress bar relative to a target, e.g., 5000 placeholder */}
                <div className="bg-teal-500 h-1 rounded-full" style={{ width: `${Math.min(100, Math.max(0, ((monthlyStats.overtimePay || 0) / 10000) * 100))}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Brief */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-gray-900 dark:text-white text-lg font-bold">今日待办</h3>
          <button onClick={() => onNavigate(ViewType.TASKS)} className="text-primary text-sm font-semibold">查看全部</button>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-2 border border-gray-100 dark:border-gray-800 shadow-sm">
          {homeTasks.length > 0 ? homeTasks.slice(0, 2).map((task, idx) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${idx === 0 && homeTasks.length > 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <div className={`size-5 rounded border-2 transition-colors flex items-center justify-center ${task.completed ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-600'}`}>
                {task.completed && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
              </div>
              <div className="flex-1">
                <p className={`text-gray-900 dark:text-gray-100 text-sm font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                    {task.priority === 'High' ? '高优先级' : task.category}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-400 text-xs italic">暂无待办事项</div>
          )}
        </div>
      </div>

      {/* Today's Expenses Brief */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-gray-900 dark:text-white text-lg font-bold">今日支出</h3>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1 text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            新增支出
          </button>
        </div>
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-2 border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-50 dark:divide-gray-800">
          {todayExpenses.length > 0 ? todayExpenses.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/10 text-orange-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">{tx.icon}</span>
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm font-bold">{tx.name}</p>
                  <p className="text-[10px] text-gray-400">{tx.time} • {tx.category}</p>
                </div>
              </div>
              <p className="text-sm font-display font-bold text-gray-900 dark:text-white">¥{Math.abs(tx.amount).toFixed(2)}</p>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-400 text-xs italic">暂无支出记录</div>
          )}
        </div>
      </div>

      {/* Daily Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 no-scrollbar max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-7">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">今日日报总结</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    {new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日'} • 系统深度分析
                  </p>
                </div>
                <button
                  onClick={() => setShowDailyReport(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Narrated Detailed Summary Section */}
              <div className="bg-primary/10 dark:bg-primary/5 border-l-4 border-primary p-5 rounded-r-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">智能叙事总结</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {dailySummary.narrative}
                </p>
              </div>

              {/* Detailed Progress & Work */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">insights</span>
                    <h4 className="font-bold text-sm dark:text-white">工作与进度</h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                    完成率 {homeTasks.length > 0 ? Math.round((dailySummary.completedTasks.length / homeTasks.length) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-center">
                  <div className="border-r border-gray-200 dark:border-gray-700">
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-tight">投入工时</p>
                    <p className="text-xl font-black dark:text-white">{dailySummary.totalHours} <span className="text-[10px] font-normal opacity-60">h</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 tracking-tight">预计营收</p>
                    <p className="text-xl font-black text-emerald-500">¥{dailySummary.totalEarned.toFixed(0)}</p>
                  </div>
                </div>
                {/* Specific task summary items */}
                <div className="space-y-2">
                  {dailySummary.completedTasks.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">已完成: {dailySummary.completedTasks.map(t => t.title).join(', ')}</span>
                    </div>
                  )}
                  {dailySummary.pendingTasks.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="material-symbols-outlined text-[14px] text-orange-400">hourglass_top</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">待办: {dailySummary.pendingTasks.map(t => t.title).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NEW: Detailed Expense Summary Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">payments</span>
                    <h4 className="font-bold text-sm dark:text-white">今日财务摘要</h4>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{todayExpenses.length} 笔交易</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">单日消费总额</p>
                      <p className="text-2xl font-black text-orange-500">¥{dailySummary.totalSpent.toFixed(2)}</p>
                    </div>
                    {dailySummary.biggestExpense && (
                      <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">最大笔花销</p>
                        <p className="text-xs font-bold dark:text-white">¥{Math.abs(dailySummary.biggestExpense.amount).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                  {/* Category Breakdown list in modal */}
                  {todayExpenses.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      {Array.from(new Set(todayExpenses.map(e => e.category))).map(cat => {
                        const catTotal = todayExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + Math.abs(e.amount), 0);
                        return (
                          <div key={cat} className="flex items-center justify-between bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg shadow-sm">
                            <span className="text-[10px] font-bold dark:text-gray-400">{cat}</span>
                            <span className="text-[10px] font-black text-gray-700 dark:text-gray-200">¥{catTotal.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  if (isSavingReport) return;
                  setIsSavingReport(true);
                  try {
                    await dailyReportService.saveDailyReport({
                      reportDate: new Date().toISOString().split('T')[0],
                      totalHours: dailySummary.totalHours,
                      overtimeHours: dailySummary.overtimeHours,
                      totalEarned: dailySummary.totalEarned,
                      completedTasksCount: dailySummary.completedTasks.length,
                      pendingTasksCount: dailySummary.pendingTasks.length,
                      completedTasksTitles: dailySummary.completedTasks.map(t => t.title),
                      pendingTasksTitles: dailySummary.pendingTasks.map(t => t.title),
                      totalSpent: dailySummary.totalSpent,
                      expenseCount: todayExpenses.length,
                      biggestExpenseName: dailySummary.biggestExpense?.name,
                      biggestExpenseAmount: dailySummary.biggestExpense ? Math.abs(dailySummary.biggestExpense.amount) : undefined,
                      narrative: dailySummary.narrative,
                    });
                    onNotify('日报已成功存入档案！');
                    setShowDailyReport(false);
                  } catch (error) {
                    console.error('保存日报失败:', error);
                    onNotify('保存日报失败，请稍后重试');
                  } finally {
                    setIsSavingReport(false);
                  }
                }}
                disabled={isSavingReport}
                className={`w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform ${isSavingReport ? 'opacity-70' : ''}`}
              >
                {isSavingReport ? '保存中...' : '确认并存入档案'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-8">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">新增今日支出</h3>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">支出项名称</label>
                  <input
                    type="text"
                    placeholder="例如：午餐、打车等"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">金额 (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">分类</label>
                    <select
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none"
                    >
                      <option value="餐饮">餐饮</option>
                      <option value="交通">交通</option>
                      <option value="购物">购物</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">支付方式</label>
                    <select
                      value={newExpensePaymentMethod}
                      onChange={(e) => setNewExpensePaymentMethod(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white appearance-none"
                    >
                      <option value="PayPay残高">PayPay残高</option>
                      <option value="现金">现金</option>
                      <option value="信用卡">信用卡</option>
                      <option value="积分">积分</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  保存支出
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
