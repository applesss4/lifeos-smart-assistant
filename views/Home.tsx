
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewType, Transaction, Task } from '../types';
import * as transactionService from '../src/services/transactionService';
import * as taskService from '../src/services/taskService';
import * as dailyReportService from '../src/services/dailyReportService';
import * as profileService from '../src/services/profileService';
import * as dashboardService from '../src/services/dashboardService';
import HomeSkeleton from '../src/components/HomeSkeleton';
import { useAuth } from '../src/contexts/AuthContext';
import { useNotifications } from '../src/hooks/useNotifications';

interface HomeProps {
  onNavigate: (view: ViewType) => void;
  onNotify: (msg: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onNotify }) => {
  const { signOut, user } = useAuth();
  const [homeTasks, setHomeTasks] = useState<Task[]>([]);
  const [todayExpenses, setTodayExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [username, setUsername] = useState<string>('用户');
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  // 使用通知 Hook
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

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

  // 加载数据（优化版）
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 使用聚合服务加载关键数据
      const dashboardData = await dashboardService.getDashboardData();
      
      setHomeTasks(dashboardData.tasks);
      setTodayExpenses(dashboardData.expenses);
      setTodayStats(dashboardData.todayStats);
      setMonthlyStats(dashboardData.monthlyStats);
      setUsername(dashboardData.profile.username);

      // 延迟加载昨日数据（非关键）
      setTimeout(async () => {
        try {
          const yesterdayData = await dashboardService.getYesterdayStats();
          setYesterdayStats(yesterdayData as { hours: number; income: number });
        } catch (error) {
          console.error('加载昨日数据失败:', error);
        }
      }, 500);

    } catch (error) {
      console.error('加载首页数据失败:', error);
      onNotify('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

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

  const toggleTask = useCallback(async (taskId: string) => {
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
  }, [homeTasks, onNotify]);

  const handleAddExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpenseAmount);
    if (!newExpenseName.trim() || isNaN(amountNum)) return;

    // 创建临时交易对象用于乐观更新
    const tempId = `temp-${Date.now()}`;
    const optimisticTx: Transaction = {
      id: tempId,
      name: newExpenseName,
      amount: -amountNum,
      category: newExpenseCategory,
      type: 'Expense',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      icon: 'shopping_bag',
      paymentMethod: newExpensePaymentMethod
    };

    // 乐观更新：立即更新UI
    setTodayExpenses([optimisticTx, ...todayExpenses]);
    const savedName = newExpenseName;
    const savedAmount = amountNum;
    setNewExpenseName('');
    setNewExpenseAmount('');
    setNewExpensePaymentMethod('PayPay残高');
    setShowAddExpenseModal(false);
    onNotify(`支出已记录: ${savedName} ¥${savedAmount}`);

    try {
      // 同步到服务器
      const newTx = await transactionService.addExpense(savedName, savedAmount, newExpenseCategory, newExpensePaymentMethod);
      // 用真实数据替换临时数据
      setTodayExpenses(prev => prev.map(tx => tx.id === tempId ? newTx : tx));
    } catch (error) {
      console.error('添加支出失败:', error);
      // 回滚：移除乐观添加的交易
      setTodayExpenses(prev => prev.filter(tx => tx.id !== tempId));
      onNotify('添加支出失败，请稍后重试');
    }
  }, [newExpenseName, newExpenseAmount, newExpenseCategory, newExpensePaymentMethod, todayExpenses, onNotify]);

  const handleSaveUsername = useCallback(async () => {
    if (!newUsername.trim()) {
      onNotify('用户名不能为空');
      return;
    }

    try {
      setIsSavingUsername(true);
      const success = await profileService.updateUsername(newUsername.trim());
      
      if (success) {
        setUsername(newUsername.trim());
        setShowUsernameModal(false);
        setNewUsername('');
        onNotify('用户名已更新');
      } else {
        onNotify('更新用户名失败，请稍后重试');
      }
    } catch (error) {
      console.error('保存用户名失败:', error);
      onNotify('保存用户名失败，请稍后重试');
    } finally {
      setIsSavingUsername(false);
    }
  }, [newUsername, onNotify]);

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

  // 保存日报的处理函数（必须在 dailySummary 之后定义）
  const handleSaveDailyReport = useCallback(async () => {
    try {
      setIsSavingReport(true);
      
      // 构建日报数据
      const reportData: Omit<dailyReportService.DailyReport, 'id' | 'createdAt'> = {
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
      };
      
      await dailyReportService.saveDailyReport(reportData);
      onNotify('今日日报已保存');
      setShowDailyReport(false);
    } catch (error) {
      console.error('保存日报失败:', error);
      onNotify('保存日报失败，请稍后重试');
    } finally {
      setIsSavingReport(false);
    }
  }, [dailySummary, todayExpenses, onNotify]);

  // 获取当前时间信息
  const timeInfo = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const greeting = hours < 12 ? '早上好' : hours < 18 ? '下午好' : '晚上好';
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    const period = hours < 12 ? '上午' : '下午';
    return { greeting, timeStr, period };
  }, []); // Empty deps - will only compute once per render

  if (isLoading) {
    return <HomeSkeleton />;
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
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowUsernameModal(true);
                    setNewUsername(username);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  设置用户名
                </button>
                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
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
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-none mb-1">{timeInfo.greeting}，</p>
            <h2 className="text-gray-900 dark:text-white text-xl font-bold leading-none tracking-tight">{username}</h2>
          </div>
        </div>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative flex items-center justify-center p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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
                <h3 className="text-gray-900 dark:text-white text-3xl font-bold font-display tracking-tight">{timeInfo.timeStr} <span className="text-lg text-gray-400 font-sans font-normal">{timeInfo.period}</span></h3>
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDailyReport(true)}
                className="flex items-center justify-center gap-2 rounded-lg h-12 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span>今日日报</span>
              </button>
              <button
                onClick={() => onNavigate(ViewType.ATTENDANCE)}
                className="flex items-center justify-center gap-2 rounded-lg h-12 bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">fingerprint</span>
                <span>打卡</span>
              </button>
            </div>
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

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">消息通知</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={async () => {
                    try {
                      await markAllAsRead();
                      onNotify('已标记所有消息为已读');
                    } catch (error) {
                      onNotify('操作失败，请稍后重试');
                    }
                  }}
                  className="mt-3 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  全部标记为已读
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {notificationsLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl mb-3">notifications_off</span>
                  <p className="text-gray-400 text-sm">暂无消息</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => {
                    const isExpanded = expandedNotifications.has(notification.id);
                    const isLongContent = notification.content.length > 150;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          !notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            notification.type === 'daily_report'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                              : notification.type === 'monthly_report'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
                          }`}>
                            <span className="material-symbols-outlined text-lg">
                              {notification.type === 'daily_report' ? 'description' : notification.type === 'monthly_report' ? 'summarize' : 'mail'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm dark:text-white truncate">{notification.title}</h4>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <div className="mb-2">
                              <p className={`text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap ${
                                !isExpanded && isLongContent ? 'line-clamp-3' : ''
                              }`}>
                                {notification.content}
                              </p>
                              {isLongContent && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedNotifications);
                                    if (isExpanded) {
                                      newExpanded.delete(notification.id);
                                    } else {
                                      newExpanded.add(notification.id);
                                    }
                                    setExpandedNotifications(newExpanded);
                                  }}
                                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors mt-1"
                                >
                                  {isExpanded ? '收起' : '展开全文'}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-gray-400">
                                {new Date(notification.createdAt).toLocaleString('zh-CN', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <div className="flex gap-2">
                                {!notification.isRead && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await markAsRead(notification.id);
                                      } catch (error) {
                                        onNotify('操作失败');
                                      }
                                    }}
                                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                                  >
                                    标记已读
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    if (confirm('确定要删除这条消息吗？')) {
                                      try {
                                        await deleteNotification(notification.id);
                                        onNotify('消息已删除');
                                      } catch (error) {
                                        onNotify('删除失败');
                                      }
                                    }
                                  }}
                                  className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Username Setting Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">设置用户名</h3>
              <button 
                onClick={() => setShowUsernameModal(false)} 
                className="material-symbols-outlined text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                close
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">用户名</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="请输入用户名"
                  autoFocus
                  maxLength={20}
                  className="w-full h-14 bg-gray-50 dark:bg-gray-800/50 rounded-2xl px-4 text-lg font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
                />
                <p className="text-xs text-gray-400 ml-1">最多20个字符</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUsernameModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold"
              >
                取消
              </button>
              <button
                onClick={handleSaveUsername}
                disabled={isSavingUsername || !newUsername.trim()}
                className={`flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 ${isSavingUsername || !newUsername.trim() ? 'opacity-70' : ''}`}
              >
                {isSavingUsername ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showDailyReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-[#1c2127] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">今日工作日报</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowDailyReport(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 工作时长 */}
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">工作时长</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dailySummary.totalHours} 小时</p>
                {dailySummary.overtimeHours > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    包括 {dailySummary.overtimeHours} 小时加班
                  </p>
                )}
              </div>

              {/* 任务完成情况 */}
              <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-green-500 text-lg">task_alt</span>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">任务完成</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dailySummary.completedTasks.length} / {homeTasks.length}
                </p>
                {dailySummary.completedTasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dailySummary.completedTasks.slice(0, 3).map(task => (
                      <p key={task.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span>
                        {task.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* 财务支出 */}
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-orange-500 text-lg">payments</span>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">今日支出</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">¥{dailySummary.totalSpent.toFixed(2)}</p>
                {dailySummary.biggestExpense && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    最大支出：{dailySummary.biggestExpense.name} ¥{Math.abs(dailySummary.biggestExpense.amount).toFixed(2)}
                  </p>
                )}
              </div>

              {/* 工作总结 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-gray-500 text-lg">description</span>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">工作总结</h4>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {dailySummary.narrative}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setShowDailyReport(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={handleSaveDailyReport}
                disabled={isSavingReport}
                className={`flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all ${isSavingReport ? 'opacity-70' : ''}`}
              >
                {isSavingReport ? '保存中...' : '保存日报'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
