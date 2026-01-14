
import React, { useState, useEffect } from 'react';
import * as attendanceService from '../../../src/services/attendanceService';
import * as salaryService from '../../../src/services/salaryService';
import AdminSkeleton from '../components/AdminSkeleton';

interface SalaryViewProps {
    selectedUserId?: string;
}

const SalaryView: React.FC<SalaryViewProps> = ({ selectedUserId }) => {
    // 薪资设置状态
    const [settingsId, setSettingsId] = useState<string>('');
    const [hourlyRate, setHourlyRate] = useState(105);
    const [overtimeRate, setOvertimeRate] = useState(150); // 加班时薪
    const [transportFee, setTransportFee] = useState(500); // 交通费
    const [bonus, setBonus] = useState(2000); // 奖金
    const [xiaowangDiff, setXiaowangDiff] = useState(0); // 小王工资差额
    const [xiaowangPension, setXiaowangPension] = useState(0); // 小王厚生年金
    const [isSaving, setIsSaving] = useState(false);

    const [stats, setStats] = useState({
        totalHours: 0,
        attendanceDays: 0,
        estimatedSalary: 0,
        targetHours: 0,
        overtimeHours: 0,
        normalHours: 0
    });

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 加载设置和统计数据
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                // 并行加载设置和打卡统计
                const [settings, attStats] = await Promise.all([
                    salaryService.getSalarySettings(selectedUserId),
                    attendanceService.getMonthlyStats(undefined, undefined, selectedUserId)
                ]);

                if (settings) {
                    setSettingsId(settings.id);
                    setHourlyRate(settings.hourly_rate);
                    setOvertimeRate(settings.overtime_rate);
                    setTransportFee(settings.transport_fee);
                    setBonus(settings.bonus);
                    setXiaowangDiff(settings.xiaowang_diff || 0);
                    setXiaowangPension(settings.xiaowang_pension || 0);
                }

                // 计算工资
                const normalHours = Math.min(attStats.totalHours, attStats.attendanceDays * 8);
                const overtimeHours = Math.max(0, attStats.totalHours - normalHours);

                // 使用加载的设置进行计算（如果settings刚加载，state可能还没更新，所以直接用settings变量）
                const currentHourlyRate = settings ? settings.hourly_rate : hourlyRate;
                const currentOvertimeRate = settings ? settings.overtime_rate : overtimeRate;
                const currentTransportFeePerDay = settings ? settings.transport_fee : transportFee;
                const currentBonus = settings ? settings.bonus : bonus;
                const currentDiff = settings ? (settings.xiaowang_diff || 0) : xiaowangDiff;
                const currentPension = settings ? (settings.xiaowang_pension || 0) : xiaowangPension;

                // 交通补贴按工作日天数计算（只有工作日有补贴）
                const totalTransportFee = currentTransportFeePerDay * attStats.attendanceDays;

                const grossSalary = (normalHours * currentHourlyRate) + (overtimeHours * currentOvertimeRate) + totalTransportFee + currentBonus;
                const deductions = currentDiff + currentPension;
                const estimatedSalary = grossSalary - deductions;

                setStats({
                    ...attStats,
                    normalHours,
                    overtimeHours,
                    estimatedSalary
                });
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedUserId]); // 添加 selectedUserId 作为依赖

    // 监听本地变化实时重新计算（仅用于UI展示，不保存）
    useEffect(() => {
        const normalHours = stats.normalHours;
        const overtimeHours = stats.overtimeHours;
        // 交通补贴按工作日天数计算
        const totalTransportFee = transportFee * stats.attendanceDays;
        const grossSalary = (normalHours * hourlyRate) + (overtimeHours * overtimeRate) + totalTransportFee + bonus;
        const deductions = xiaowangDiff + xiaowangPension;
        const estimatedSalary = grossSalary - deductions;
        setStats(prev => ({ ...prev, estimatedSalary }));
    }, [hourlyRate, overtimeRate, transportFee, bonus, xiaowangDiff, xiaowangPension, stats.normalHours, stats.overtimeHours, stats.attendanceDays]);

    const handleSaveSettings = async () => {
        try {
            setIsSaving(true);
            await salaryService.updateSalarySettings({
                hourly_rate: hourlyRate,
                overtime_rate: overtimeRate,
                transport_fee: transportFee,
                bonus: bonus,
                xiaowang_diff: xiaowangDiff,
                xiaowang_pension: xiaowangPension
            }, selectedUserId); // 传入 selectedUserId
            alert('设置已保存');
            setShowSettingsModal(false);
        } catch (error) {
            console.error('保存设置失败:', error);
            alert('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <AdminSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black tracking-tight dark:text-white">工资统计</h2>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">settings</span>
                        工资设置
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">本月预估工资</h3>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black tracking-tight dark:text-white">
                            {Math.floor(stats.estimatedSalary).toLocaleString()}
                        </span>
                        <span className="text-lg font-bold text-gray-400">円</span>
                    </div>
                    <div className="space-y-2 mt-6">
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-400">基本工资 (正常工时 {stats.normalHours}h)</span>
                            <span className="dark:text-gray-300">{(stats.normalHours * hourlyRate).toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-400">加班费 (加班工时 {stats.overtimeHours}h)</span>
                            <span className="dark:text-gray-300">{(stats.overtimeHours * overtimeRate).toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-400">交通补贴 ({stats.attendanceDays} 天)</span>
                            <span className="dark:text-gray-300">{(transportFee * stats.attendanceDays).toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-400">奖金</span>
                            <span className="dark:text-gray-300">{bonus.toLocaleString()} 円</span>
                        </div>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                        <div className="flex justify-between text-sm font-bold text-red-500">
                            <span>扣除: 小王工资差额</span>
                            <span>-{xiaowangDiff.toLocaleString()} 円</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-red-500">
                            <span>扣除: 小王厚生年金</span>
                            <span>-{xiaowangPension.toLocaleString()} 円</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 dark:text-white">明细对比</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                <span>正常工时 ({stats.normalHours}h)</span>
                                <span className="text-blue-500">¥{(stats.normalHours * hourlyRate).toFixed(0)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(stats.normalHours / (stats.totalHours || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                <span>加班工时 ({stats.overtimeHours}h)</span>
                                <span className="text-orange-500">¥{(stats.overtimeHours * overtimeRate).toFixed(0)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${(stats.overtimeHours / (stats.totalHours || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 设置弹窗 */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#1c2127] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold dark:text-white">工资计算设置</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest">基础设置</h4>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">正常时薪 (¥)</label>
                                        <input type="number" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border-none font-bold text-primary focus:ring-2 focus:ring-primary/20 rounded-xl h-10 px-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">加班时薪 (¥)</label>
                                        <input type="number" value={overtimeRate} onChange={e => setOvertimeRate(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border-none font-bold text-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-10 px-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">每日交通补贴 (¥)</label>
                                        <input type="number" value={transportFee} onChange={e => setTransportFee(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border-none font-bold text-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl h-10 px-4" />
                                        <p className="text-[9px] text-gray-400 mt-1">按工作日天数计算，休息日无补贴</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">本月奖金 (¥)</label>
                                        <input type="number" value={bonus} onChange={e => setBonus(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-800 border-none font-bold text-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-4" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest">扣除项设置</h4>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">小王工资差额 (¥)</label>
                                        <input
                                            type="number"
                                            value={xiaowangDiff}
                                            onChange={e => setXiaowangDiff(Number(e.target.value))}
                                            className="w-full h-10 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">小王厚生年金 (¥)</label>
                                        <input
                                            type="number"
                                            value={xiaowangPension}
                                            onChange={e => setXiaowangPension(Number(e.target.value))}
                                            className="w-full h-10 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 font-mono text-[10px] leading-relaxed dark:text-gray-400">
                                        <p className="text-primary font-bold mb-2">// 自动化计算公示</p>
                                        <p>1. 正常工时 = Math.min(总工时, 出勤天数 * 8)</p>
                                        <p>2. 加班工时 = Math.max(0, 总工时 - 正常工时)</p>
                                        <p>3. 基本工资 = 正常工时 * 正常时薪</p>
                                        <p>4. 加班工资 = 加班工时 * 加班时薪</p>
                                        <p>5. 交通补贴 = 每日补贴 * 出勤天数</p>
                                        <p>6. 扣除项 = 小王差额 + 厚生年金</p>
                                        <p className="mt-2 text-gray-900 dark:text-white font-bold">最终实发 = 基本 + 加班 + 补贴 + 奖金 - 扣除</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-[#1c2127]">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="bg-primary text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? '保存中...' : '保存配置'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryView;
