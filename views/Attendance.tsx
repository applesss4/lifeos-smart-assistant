
import React, { useState, useEffect, useCallback } from 'react';
import * as attendanceService from '../src/services/attendanceService';
import { AttendanceRecord, MonthlyStats } from '../src/services/attendanceService';
import * as salaryService from '../src/services/salaryService';

interface AttendanceProps {
  onNotify: (msg: string) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ onNotify }) => {
  const [time, setTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalHours: 0,
    attendanceDays: 0,
    targetDays: 22,
    targetHours: 176
  });
  const [yesterdayStats, setYesterdayStats] = useState({
    hours: 0,
    salary: 0
  });

  // Form state for manual entry
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [formType, setFormType] = useState<'上班' | '下班'>('上班');

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [recentRecordsData, statsData, statusData, settings] = await Promise.all([
        attendanceService.getRecentRecords(),
        attendanceService.getMonthlyStats(),
        attendanceService.getTodayPunchStatus(),
        salaryService.getSalarySettings()
      ]);

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const yesterdayAtt = await attendanceService.getDailyStats(yesterday);

      const hourlyRate = settings ? settings.hourly_rate : 0; // Default or 0

      setYesterdayStats({
        hours: yesterdayAtt.totalHours,
        salary: yesterdayAtt.totalHours * hourlyRate
      });

      setRecords(recentRecordsData);
      setMonthlyStats(statsData);
      setIsClockedIn(statusData.isClockedIn);
    } catch (error) {
      console.error('加载打卡数据失败:', error);
      onNotify('加载数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handlePunch = async () => {
    if (isPunching) return;

    try {
      setIsPunching(true);
      const punchType = isClockedIn ? '下班' : '上班';

      const newRecord = isClockedIn
        ? await attendanceService.punchOut()
        : await attendanceService.punchIn();

      setRecords([newRecord, ...records]);
      setIsClockedIn(!isClockedIn);

      // 刷新月度统计
      const stats = await attendanceService.getMonthlyStats();
      setMonthlyStats(stats);

      onNotify(isClockedIn ? "下班打卡成功！辛苦了。" : "上班打卡成功！加油。");
    } catch (error) {
      console.error('打卡失败:', error);
      onNotify('打卡失败，请稍后重试');
    } finally {
      setIsPunching(false);
    }
  };

  const handleAddManualRecord = async (e: React.FormEvent) => {
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
  };

  const period = time.getHours() < 12 ? '上午' : '下午';
  const dateStr = time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + ' 星期' + ['日', '一', '二', '三', '四', '五', '六'][time.getDay()];

  // 计算本周信息
  const now = new Date();
  const currentDay = now.getDay() || 7; // 将周日转换为7
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDay + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getDate()}日`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-8 pb-12 space-y-10 relative">
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
        <div className={`absolute inset-0 blur-3xl rounded-full animate-pulse transition-colors ${isClockedIn ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}></div>
        <button
          onClick={handlePunch}
          disabled={isPunching}
          className={`relative w-64 h-64 rounded-full bg-gradient-to-br shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-all duration-300 border-4 border-white/10 ${isClockedIn ? 'from-orange-500 to-orange-700' : 'from-blue-500 to-blue-700'
            } ${isPunching ? 'opacity-70' : ''}`}
        >
          {isPunching ? (
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
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

      <div className="flex items-center gap-4">
        <p className="text-gray-500 text-sm font-medium">
          当前状态: <span className={`font-bold ${isClockedIn ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
            {isClockedIn ? '已上班' : '已下班'}
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
            {now.getMonth() + 1}月汇总
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
            <span className="text-[10px] text-gray-400">{weekLabel}</span>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex justify-between items-center">
            {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => {
              const isToday = idx + 1 === currentDay;
              const isPast = idx + 1 < currentDay;
              return (
                <div key={day} className={`flex flex-col items-center gap-2 ${!isPast && !isToday ? 'opacity-40' : ''}`}>
                  <span className="text-[10px] font-bold text-gray-400">{day}</span>
                  {isToday ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/30 animate-bounce">{now.getDate()}</div>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Cards (Yesterday's Salary) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-surface-dark dark:to-surface-dark/80 p-5 rounded-2xl border border-orange-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <span className="absolute -right-4 -top-4 material-symbols-outlined text-[100px] text-orange-200/30">paid</span>
            <div className="flex justify-between items-end relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-orange-500">account_balance_wallet</span>
                  <span className="text-xs font-bold dark:text-gray-300">昨日工资</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-gray-400">¥</span>
                  <span className="text-3xl font-black dark:text-white">{Math.floor(yesterdayStats.salary).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-medium uppercase">计薪时长</p>
                <p className="text-xl font-bold dark:text-white">{yesterdayStats.hours} <span className="text-xs font-normal text-gray-400">h</span></p>
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.type === '上班' ? 'bg-green-50 text-green-500 dark:bg-green-900/20' : 'bg-orange-50 text-orange-500 dark:bg-orange-900/20'}`}>
                      <span className="material-symbols-outlined">{record.type === '上班' ? 'login' : 'logout'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white">{record.type}打卡</p>
                      <p className="text-[10px] text-gray-400">{record.date}</p>
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold dark:text-white">{record.time}</p>
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
                  <div className="grid grid-cols-2 gap-3">
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
