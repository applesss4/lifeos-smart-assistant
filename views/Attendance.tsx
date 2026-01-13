
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as attendanceService from '../src/services/attendanceService';
import { AttendanceRecord, MonthlyStats } from '../src/services/attendanceService';
import * as salaryService from '../src/services/salaryService';
import AttendanceSkeleton from '../src/components/AttendanceSkeleton';
import { getLocalDateString } from '../src/utils/dateHelper';

interface AttendanceProps {
  onNotify: (msg: string) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ onNotify }) => {
  const [time, setTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [hasClockedOut, setHasClockedOut] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [isMarkingRest, setIsMarkingRest] = useState(false);
  const [isRestDay, setIsRestDay] = useState(false);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalHours: 0,
    attendanceDays: 0,
    targetDays: 22,
    targetHours: 176
  });
  const [todayStats, setTodayStats] = useState({
    hours: 0,
    salary: 0
  });

  // Form state for manual entry
  const [formDate, setFormDate] = useState(getLocalDateString());
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<'上班' | '下班' | '休息'>('上班');

  // 使用 ref 来持久化上一次的日期，避免每次 render 都重置
  const lastDateRef = useRef(new Date().toDateString());

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 获取最新的本地日期（使用本地时区，不是 UTC）
      const today = getLocalDateString();
      console.log('📅 加载数据，当前本地日期:', today);
      console.log('🕐 当前时间:', new Date().toLocaleString('zh-CN'));
      
      // 清除缓存，确保获取最新数据（特别是在日期变化时）
      attendanceService.clearAttendanceCache();
      
      const [recentRecordsData, statsData, statusData, settings] = await Promise.all([
        attendanceService.getRecentRecords(),
        attendanceService.getMonthlyStats(),
        attendanceService.getTodayPunchStatus(),
        salaryService.getSalarySettings()
      ]);

      const todayAtt = await attendanceService.getDailyStats(today);

      const hourlyRate = settings ? settings.hourly_rate : 0; // Default or 0

      setTodayStats({
        hours: todayAtt.totalHours,
        salary: todayAtt.totalHours * hourlyRate
      });

      setRecords(recentRecordsData);
      setMonthlyStats(statsData);
      setIsClockedIn(statusData.isClockedIn);
      setHasClockedIn(statusData.hasClockedIn);
      setHasClockedOut(statusData.hasClockedOut);

      console.log('✅ 打卡状态已更新:', {
        isClockedIn: statusData.isClockedIn,
        hasClockedIn: statusData.hasClockedIn,
        hasClockedOut: statusData.hasClockedOut
      });

      // 检查今天是否为休息日
      const todayRestRecord = recentRecordsData.find(
        record => record.date === today && record.type === '休息'
      );
      setIsRestDay(!!todayRestRecord);
    } catch (error) {
      console.error('❌ 加载打卡数据失败:', error);
      onNotify('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新时间，每秒一次
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 检测日期变化，在新的一天时重新加载数据
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = new Date().toDateString();
      
      // 如果日期发生变化，重新加载数据
      if (currentDate !== lastDateRef.current) {
        console.log('🔄 检测到日期变化:', lastDateRef.current, '->', currentDate);
        console.log('🔄 重新加载打卡数据...');
        lastDateRef.current = currentDate;
        
        // 强制清除所有状态，重置为初始状态
        setIsClockedIn(false);
        setHasClockedIn(false);
        setHasClockedOut(false);
        setIsRestDay(false);
        
        // 重新加载数据
        loadData();
      }
    };

    // 每30秒检查一次日期变化（更频繁，确保及时检测）
    const dateCheckTimer = setInterval(checkDateChange, 30000);
    
    // 组件挂载时也检查一次
    checkDateChange();
    
    return () => clearInterval(dateCheckTimer);
  }, [loadData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handlePunch = useCallback(async () => {
    if (isPunching) return;

    // 检查是否已经打过卡
    if (!isClockedIn && hasClockedIn) {
      onNotify('今天已经打过上班卡了');
      return;
    }
    if (isClockedIn && hasClockedOut) {
      onNotify('今天已经打过下班卡了');
      return;
    }

    try {
      setIsPunching(true);
      const punchType = isClockedIn ? '下班' : '上班';

      const newRecord = isClockedIn
        ? await attendanceService.punchOut()
        : await attendanceService.punchIn();

      // 立即更新本地状态
      setRecords([newRecord, ...records]);
      
      if (punchType === '上班') {
        setHasClockedIn(true);
        setIsClockedIn(true);
      } else {
        setHasClockedOut(true);
        setIsClockedIn(false);
      }

      // 刷新月度统计和今日状态（确保状态同步）
      const [stats, statusData] = await Promise.all([
        attendanceService.getMonthlyStats(),
        attendanceService.getTodayPunchStatus()
      ]);
      
      setMonthlyStats(stats);
      // 使用服务器返回的状态作为最终状态，确保准确性
      setIsClockedIn(statusData.isClockedIn);
      setHasClockedIn(statusData.hasClockedIn);
      setHasClockedOut(statusData.hasClockedOut);

      onNotify(punchType === '下班' ? "下班打卡成功！辛苦了。" : "上班打卡成功！加油。");
    } catch (error: any) {
      console.error('打卡失败:', error);
      onNotify(error.message || '打卡失败，请稍后重试');
      // 打卡失败时重新加载数据，确保状态正确
      await loadData();
    } finally {
      setIsPunching(false);
    }
  }, [isPunching, isClockedIn, hasClockedIn, hasClockedOut, records, onNotify, loadData]);

  const handleMarkRestDay = useCallback(async () => {
    if (isMarkingRest) return;

    try {
      setIsMarkingRest(true);
      const newRecord = await attendanceService.markRestDay();
      setRecords([newRecord, ...records]);
      setIsRestDay(true); // 标记为休息日

      // 刷新月度统计
      const stats = await attendanceService.getMonthlyStats();
      setMonthlyStats(stats);

      onNotify("已标记为休息日，好好休息！");
    } catch (error: any) {
      console.error('标记休息日失败:', error);
      onNotify(error.message || '标记休息日失败，请稍后重试');
    } finally {
      setIsMarkingRest(false);
    }
  }, [isMarkingRest, records, onNotify]);

  const handleAddManualRecord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newRecord = await attendanceService.addManualRecord(formDate, formTime, formType);
      setRecords([newRecord, ...records]);
      setShowManualForm(false);

      // 刷新月度统计
      const stats = await attendanceService.getMonthlyStats();
      setMonthlyStats(stats);

      onNotify(`补卡成功: ${formDate} ${formTime} ${formType}`);
    } catch (error) {
      console.error('补卡失败:', error);
      onNotify('补卡失败，请稍后重试');
    }
  }, [formDate, formTime, formType, records, onNotify]);

  const period = time.getHours() < 12 ? '上午' : '下午';
  const dateStr = time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + ' 星期' + ['日', '一', '二', '三', '四', '五', '六'][time.getDay()];

  // 计算本周信息 - 使用 useMemo 缓存计算，基于 time 状态
  const weekInfo = useMemo(() => {
    const currentDay = time.getDay() || 7; // 将周日转换为7
    const weekStart = new Date(time);
    weekStart.setDate(time.getDate() - currentDay + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getDate()}日`;
    return { currentDay, weekLabel };
  }, [time]);

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="flex flex-col items-center pt-8 pb-12 space-y-10 relative">
      {/* 刷新按钮 - 右上角 */}
      <button
        onClick={() => {
          console.log('🔄 手动刷新打卡数据');
          loadData();
        }}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-surface-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="刷新打卡状态"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Digital Clock */}
      <div className="flex flex-col items-center">
        <h1 className="text-5xl font-black tracking-tighter dark:text-white">
          {formatTime(time)} <span className="text-xl font-medium text-gray-400 ml-1">{period}</span>
        </h1>
        <p className="mt-3 bg-gray-100 dark:bg-surface-dark text-gray-500 dark:text-gray-400 px-4 py-1 rounded-full text-sm font-medium">
          {dateStr}
        </p>
      </div>

      {/* Main Punch Button */}
      <div className="relative group">
        <div className={`absolute inset-0 blur-3xl rounded-full animate-pulse transition-colors ${
          isRestDay ? 'bg-purple-500/20' : 
          (hasClockedIn && hasClockedOut) ? 'bg-gray-500/20' :
          isClockedIn ? 'bg-orange-500/20' : 'bg-blue-500/20'
        }`}></div>
        <button
          onClick={handlePunch}
          disabled={isPunching || isRestDay || (hasClockedIn && hasClockedOut) || (!isClockedIn && hasClockedIn) || (isClockedIn && hasClockedOut)}
          className={`relative w-64 h-64 rounded-full bg-gradient-to-br shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all duration-300 border-4 border-white/10 ${
            isRestDay ? 'from-purple-400 to-purple-600 opacity-60 cursor-not-allowed' :
            (hasClockedIn && hasClockedOut) ? 'from-gray-400 to-gray-600 opacity-60 cursor-not-allowed' :
            (!isClockedIn && hasClockedIn) ? 'from-gray-400 to-gray-600 opacity-60 cursor-not-allowed' :
            (isClockedIn && hasClockedOut) ? 'from-gray-400 to-gray-600 opacity-60 cursor-not-allowed' :
            isClockedIn ? 'from-orange-500 to-orange-700' : 'from-blue-500 to-blue-700'
          } ${isPunching ? 'opacity-70' : ''}`}
        >
          {isPunching ? (
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isRestDay ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                hotel
              </span>
              <span className="text-2xl font-bold tracking-widest">休息日</span>
              <span className="text-purple-100/70 text-sm font-medium mt-1">今天好好休息</span>
            </>
          ) : (hasClockedIn && hasClockedOut) ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-2xl font-bold tracking-widest">打卡完成</span>
              <span className="text-gray-100/70 text-sm font-medium mt-1">今日已完成打卡</span>
            </>
          ) : (!isClockedIn && hasClockedIn) ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                block
              </span>
              <span className="text-2xl font-bold tracking-widest">已打上班卡</span>
              <span className="text-gray-100/70 text-sm font-medium mt-1">请等待下班时间</span>
            </>
          ) : (isClockedIn && hasClockedOut) ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                block
              </span>
              <span className="text-2xl font-bold tracking-widest">已打下班卡</span>
              <span className="text-gray-100/70 text-sm font-medium mt-1">今日打卡已完成</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-6xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isClockedIn ? 'logout' : 'fingerprint'}
              </span>
              <span className="text-2xl font-bold tracking-widest">{isClockedIn ? '下班打卡' : '上班打卡'}</span>
              <span className="text-blue-100/70 text-sm font-medium mt-1">{isClockedIn ? '结束今日任务' : '开始工作'}</span>
            </>
          )}
        </button>
      </div>

      {/* Rest Day Button - 只在非休息日显示 */}
      {!isRestDay && (
        <button
          onClick={handleMarkRestDay}
          disabled={isMarkingRest}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
        >
          {isMarkingRest ? (
            <>
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span>标记中...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">hotel</span>
              <span>今天休息</span>
            </>
          )}
        </button>
      )}

      <div className="flex items-center gap-4">
        <p className="text-gray-500 text-sm font-medium">
          当前状态: <span className={`font-bold ${
            isRestDay ? 'text-purple-500' :
            (hasClockedIn && hasClockedOut) ? 'text-gray-500' :
            isClockedIn ? 'text-green-500' : 
            hasClockedIn ? 'text-orange-500' :
            'text-gray-900 dark:text-white'
          }`}>
            {isRestDay ? '休息中' : 
             (hasClockedIn && hasClockedOut) ? '已完成打卡' :
             isClockedIn ? '已上班' : 
             hasClockedIn ? '等待下班' :
             '未打卡'}
          </span>
        </p>
        <button
          onClick={() => setShowManualForm(true)}
          className="flex items-center gap-1 text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">history_edu</span>
          手动补卡
        </button>
      </div>

      {/* Monthly Statistics Section */}
      <div className="w-full px-4 space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-gray-900 dark:text-white">本月统计</h3>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {time.getMonth() + 1}月汇总
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg material-symbols-outlined text-lg">timelapse</span>
              <span className="text-xs text-gray-500 font-bold">总工时</span>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white">{monthlyStats.totalHours}<span className="text-xs font-normal text-gray-400 ml-1">h</span></p>
              <div className="mt-2 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((monthlyStats.totalHours / monthlyStats.targetHours) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg material-symbols-outlined text-lg">calendar_month</span>
              <span className="text-xs text-gray-500 font-bold">出勤天数</span>
            </div>
            <div>
              <p className="text-2xl font-black dark:text-white">{monthlyStats.attendanceDays}<span className="text-xs font-normal text-gray-400 ml-1">天</span></p>
              <div className="mt-2 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((monthlyStats.attendanceDays / monthlyStats.targetDays) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stats & Info Cards & History List */}
      <div className="w-full px-4 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="font-bold dark:text-white">本周出勤</h3>
            <span className="text-[10px] text-gray-400">{weekInfo.weekLabel}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex justify-between items-center">
            {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => {
              const isToday = idx + 1 === weekInfo.currentDay;
              const isPast = idx + 1 < weekInfo.currentDay;
              return (
                <div key={day} className={`flex flex-col items-center gap-2 ${!isPast && !isToday ? 'opacity-40' : ''}`}>
                  <span className="text-[10px] font-bold text-gray-400">{day}</span>
                  {isToday ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/30 animate-bounce">{new Date().getDate()}</div>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Cards (Today's Salary) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-surface-dark dark:to-surface-dark/80 p-5 rounded-2xl border border-orange-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <span className="absolute -right-4 -top-4 material-symbols-outlined text-[100px] text-orange-200/30">paid</span>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-orange-500">account_balance_wallet</span>
                  <span className="text-xs font-bold dark:text-gray-300">今日工资</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-gray-400">¥</span>
                  <span className="text-3xl font-black dark:text-white">{Math.floor(todayStats.salary).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-medium uppercase">今日计薪时长</p>
                <p className="text-xl font-bold dark:text-white">{todayStats.hours} <span className="text-xs font-normal text-gray-400">h</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* History List - Filtered to 2 days */}
        <div className="space-y-3 pb-12">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-gray-900 dark:text-white">最近记录</h3>
            <span className="text-[10px] text-gray-400">仅显示最近两日</span>
          </div>
          <div className="space-y-2">
            {records.length > 0 ? (
              records.map(record => (
                <div key={record.id} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between animate-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      record.type === '上班' ? 'bg-green-50 text-green-500 dark:bg-green-900/20' : 
                      record.type === '下班' ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' :
                      'bg-purple-50 text-purple-500 dark:bg-purple-900/20'
                    }`}>
                      <span className="material-symbols-outlined">
                        {record.type === '上班' ? 'login' : record.type === '下班' ? 'logout' : 'hotel'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">
                        {record.type === '休息' ? '休息日' : `${record.type}打卡`}
                      </p>
                      <p className="text-[10px] text-gray-400">{record.date}</p>
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold dark:text-white">
                    {record.type === '休息' ? '🌙' : record.time}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">暂无近两日打卡记录</div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-8">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">手动补卡</h3>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <form onSubmit={handleAddManualRecord} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">日期</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">时间</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">类型</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormType('上班')}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${formType === '上班' ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-800 border-transparent dark:text-gray-400'}`}
                    >
                      上班
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('下班')}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${formType === '下班' ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-800 border-transparent dark:text-gray-400'}`}
                    >
                      下班
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('休息')}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${formType === '休息' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-gray-50 dark:bg-gray-800 border-transparent dark:text-gray-400'}`}
                    >
                      休息
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  保存记录
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
