
import React, { useState, useEffect } from 'react';
import * as attendanceService from '../../../src/services/attendanceService';
import { AttendanceRecord } from '../../../src/services/attendanceService';
import AdminSkeleton from '../components/AdminSkeleton';

interface AttendanceViewProps {
    selectedUserId?: string;
}

interface DailyAttendance {
    date: string;
    clockIn?: AttendanceRecord;
    clockOut?: AttendanceRecord;
    isRestDay?: boolean;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ selectedUserId }) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [dailyRecords, setDailyRecords] = useState<DailyAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [showBatchMode, setShowBatchMode] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        date: new Date().toISOString().split('T')[0],
        clockInTime: '09:00',
        clockOutTime: '18:00',
        isRestDay: false
    });

    // 月份选择器状态
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    // 将打卡记录按日期分组
    const groupRecordsByDate = (records: AttendanceRecord[]): DailyAttendance[] => {
        const grouped = new Map<string, DailyAttendance>();

        records.forEach(record => {
            if (!grouped.has(record.date)) {
                grouped.set(record.date, { date: record.date, isRestDay: false });
            }
            const daily = grouped.get(record.date)!;

            if (record.type === '休息') {
                daily.isRestDay = true;
                daily.clockIn = record; // 保存休息记录以便删除
            } else if (record.type === '上班') {
                daily.clockIn = record;
            } else if (record.type === '下班') {
                daily.clockOut = record;
            }
        });

        return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedDates(new Set(dailyRecords.map(r => r.date)));
        } else {
            setSelectedDates(new Set());
        }
    };

    const handleSelectOne = (date: string) => {
        const newSelected = new Set(selectedDates);
        if (newSelected.has(date)) {
            newSelected.delete(date);
        } else {
            newSelected.add(date);
        }
        setSelectedDates(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedDates.size === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedDates.size} 天的打卡记录吗？`)) return;

        try {
            const idsToDelete: string[] = [];
            dailyRecords.forEach(daily => {
                if (selectedDates.has(daily.date)) {
                    if (daily.clockIn) idsToDelete.push(daily.clockIn.id);
                    if (daily.clockOut) idsToDelete.push(daily.clockOut.id);
                }
            });

            await attendanceService.deleteAttendanceRecords(idsToDelete);
            setRecords(records.filter(r => !idsToDelete.includes(r.id)));
            setSelectedDates(new Set());
            setShowBatchMode(false); // 删除后退出批量模式
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败');
        }
    };

    const fetchRecords = async () => {
        try {
            setIsLoading(true);
            console.log('AttendanceView: 加载用户打卡记录, userId=', selectedUserId, 'year=', selectedYear, 'month=', selectedMonth);

            // 获取指定月份的所有记录
            const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]; // 月份最后一天

            const data = await attendanceService.getAttendanceRecordsByDateRange(startDate, endDate, selectedUserId);
            console.log('AttendanceView: 获取到', data.length, '条打卡记录');
            setRecords(data);
            setDailyRecords(groupRecordsByDate(data));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [selectedUserId, selectedYear, selectedMonth]);

    useEffect(() => {
        setDailyRecords(groupRecordsByDate(records));
    }, [records]);

    const handleTimeChange = async (date: string, type: 'clockIn' | 'clockOut', newTime: string) => {
        try {
            const daily = dailyRecords.find(d => d.date === date);
            if (!daily) return;

            const record = type === 'clockIn' ? daily.clockIn : daily.clockOut;

            if (record) {
                // 更新现有记录
                await attendanceService.updateAttendanceRecord(record.id, {
                    date,
                    time: newTime,
                    type: type === 'clockIn' ? '上班' : '下班'
                });
                setRecords(records.map(r =>
                    r.id === record.id ? { ...r, time: newTime } : r
                ));
            } else {
                // 创建新记录
                await attendanceService.addManualRecord(
                    date,
                    newTime,
                    type === 'clockIn' ? '上班' : '下班',
                    selectedUserId
                );
                await fetchRecords();
            }
        } catch (error) {
            console.error('更新失败:', error);
            alert('更新失败，请重试');
        }
    };

    const handleDeleteRecord = async (date: string, type: 'clockIn' | 'clockOut') => {
        const daily = dailyRecords.find(d => d.date === date);
        if (!daily) return;

        const record = type === 'clockIn' ? daily.clockIn : daily.clockOut;
        if (!record) return;

        if (!confirm(`确定要删除${type === 'clockIn' ? '上班' : '下班'}打卡记录吗？`)) return;

        try {
            await attendanceService.deleteAttendanceRecord(record.id);
            setRecords(records.filter(r => r.id !== record.id));
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除记录失败');
        }
    };

    const handleAddDay = () => {
        setModalData({
            date: new Date().toISOString().split('T')[0],
            clockInTime: '09:00',
            clockOutTime: '18:00',
            isRestDay: false
        });
        setShowModal(true);
    };

    const handleModalSubmit = async () => {
        try {
            if (modalData.isRestDay) {
                // 添加休息日记录
                await attendanceService.markRestDay(modalData.date, selectedUserId);
            } else {
                // 添加上班打卡
                await attendanceService.addManualRecord(modalData.date, modalData.clockInTime, '上班', selectedUserId);
                // 添加下班打卡
                await attendanceService.addManualRecord(modalData.date, modalData.clockOutTime, '下班', selectedUserId);
            }
            setShowModal(false);
            await fetchRecords();
        } catch (error) {
            console.error('添加失败:', error);
            alert('添加失败，请重试');
        }
    };

    const handleExportCSV = () => {
        if (dailyRecords.length === 0) {
            alert('暂无数据可导出');
            return;
        }

        const headers = ['日期', '上班时间', '下班时间', '工时(小时)', '状态'];
        const csvContent = [
            headers.join(','),
            ...dailyRecords.map(daily => {
                const clockIn = daily.clockIn?.time || '';
                const clockOut = daily.clockOut?.time || '';
                const workHours = !daily.isRestDay && daily.clockIn && daily.clockOut
                    ? calculateWorkHours(daily.clockIn.time, daily.clockOut.time).toFixed(1)
                    : '';

                let status = '不完整';
                if (daily.isRestDay) status = '休息日';
                else if (daily.clockIn && daily.clockOut) status = '完整';

                return [
                    daily.date,
                    clockIn,
                    clockOut,
                    workHours,
                    status
                ].join(',');
            })
        ].join('\n');

        // Add BOM for Excel Chinese support
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `考勤记录_${selectedYear}_${selectedMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TimeInput: React.FC<{
        date: string;
        type: 'clockIn' | 'clockOut';
        value?: string;
        recordId?: string;
    }> = ({ date, type, value, recordId }) => {
        const [localValue, setLocalValue] = useState(value || '');
        const [isEditing, setIsEditing] = useState(false);
        const inputRef = React.useRef<HTMLInputElement>(null);

        // 同步外部value到localValue
        useEffect(() => {
            setLocalValue(value || '');
        }, [value]);

        // 当进入编辑状态时，自动聚焦输入框
        useEffect(() => {
            if (isEditing && inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, [isEditing]);

        const handleSave = async () => {
            if (localValue && localValue !== value) {
                await handleTimeChange(date, type, localValue);
            }
            setIsEditing(false);
        };

        const handleCancel = () => {
            setLocalValue(value || '');
            setIsEditing(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };

        const handleAddClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLocalValue('09:00');
            setIsEditing(true);
        };

        const handleDisplayClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setIsEditing(true);
        };

        const handleBlur = () => {
            // 延迟执行，以便删除按钮的点击事件能够触发
            setTimeout(() => {
                handleSave();
            }, 200);
        };

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLocalValue(e.target.value);
        };

        // 如果没有值且不在编辑状态，显示+号按钮
        if (!value && !isEditing) {
            return (
                <button
                    onClick={handleAddClick}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                    type="button"
                    title="添加打卡时间"
                >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                </button>
            );
        }

        return (
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="HH:MM"
                        maxLength={5}
                        className="w-20 px-3 py-1.5 rounded-lg font-mono text-sm bg-primary/10 border-2 border-primary ring-2 ring-primary/20 dark:bg-primary/20 dark:text-white focus:outline-none"
                    />
                ) : (
                    <button
                        onClick={handleDisplayClick}
                        className="px-3 py-1.5 rounded-lg font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 dark:text-white transition-all cursor-pointer"
                    >
                        {localValue}
                    </button>
                )}
                {recordId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecord(date, type);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        type="button"
                        title="删除此打卡记录"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
            </div>
        );
    };

    if (isLoading) {
        return <AdminSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">打卡记录管理</h2>
                <div className="flex gap-3">
                    {showBatchMode ? (
                        <>
                            {selectedDates.size > 0 && (
                                <button
                                    onClick={handleBatchDelete}
                                    className="bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900 px-4 md:px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
                                >
                                    批量删除 ({selectedDates.size})
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowBatchMode(false);
                                    setSelectedDates(new Set());
                                }}
                                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 md:px-6 py-2 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                取消批量
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowBatchMode(true)}
                                className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 md:px-6 py-2 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                            >
                                批量操作
                            </button>
                            <button
                                onClick={handleAddDay}
                                className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 px-4 md:px-6 py-2 rounded-xl font-bold shadow-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                            >
                                添加记录
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="bg-primary text-white px-4 md:px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 text-sm"
                            >
                                导出 CSV
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!selectedUserId ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                    <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-gray-400">person_search</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">请选择员工</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        请在顶部导航栏选择一位员工，以查看其打卡记录和进行管理操作
                    </p>
                </div>
            ) : (
                <>
                    {/* 月份选择器 */}
                    <div className="bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400">calendar_month</span>
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">查看月份</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* 上一月按钮 */}
                                <button
                                    onClick={() => {
                                        if (selectedMonth === 1) {
                                            setSelectedYear(selectedYear - 1);
                                            setSelectedMonth(12);
                                        } else {
                                            setSelectedMonth(selectedMonth - 1);
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="上一月"
                                >
                                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">chevron_left</span>
                                </button>

                                {/* 年份选择 */}
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-sm dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}年</option>
                                    ))}
                                </select>

                                {/* 月份选择 */}
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-sm dark:text-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month}>{month}月</option>
                                    ))}
                                </select>

                                {/* 下一月按钮 */}
                                <button
                                    onClick={() => {
                                        if (selectedMonth === 12) {
                                            setSelectedYear(selectedYear + 1);
                                            setSelectedMonth(1);
                                        } else {
                                            setSelectedMonth(selectedMonth + 1);
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="下一月"
                                >
                                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">chevron_right</span>
                                </button>

                                {/* 回到当月按钮 */}
                                <button
                                    onClick={() => {
                                        const now = new Date();
                                        setSelectedYear(now.getFullYear());
                                        setSelectedMonth(now.getMonth() + 1);
                                    }}
                                    className="ml-2 px-3 py-2 bg-primary/10 text-primary rounded-lg font-bold text-xs hover:bg-primary/20 transition-colors"
                                >
                                    本月
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#252b36] border-b border-gray-100 dark:border-gray-800">
                                        {showBatchMode && (
                                            <th className="px-4 md:px-6 py-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={dailyRecords.length > 0 && selectedDates.size === dailyRecords.length}
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </th>
                                        )}
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">日期</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">上班打卡</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">下班打卡</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">工作时长</th>
                                        <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {dailyRecords.map((daily) => {
                                        const workHours = !daily.isRestDay && daily.clockIn && daily.clockOut
                                            ? calculateWorkHours(daily.clockIn.time, daily.clockOut.time)
                                            : null;

                                        return (
                                            <tr key={daily.date} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                {showBatchMode && (
                                                    <td className="px-4 md:px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDates.has(daily.date)}
                                                            onChange={() => handleSelectOne(daily.date)}
                                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-4 md:px-6 py-4 font-bold text-sm dark:text-gray-300 whitespace-nowrap">
                                                    {formatDate(daily.date)}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    {daily.isRestDay ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">
                                                                <span className="material-symbols-outlined text-sm">beach_access</span>
                                                                休息日
                                                            </span>
                                                            {daily.clockIn?.id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteRecord(daily.date, 'clockIn');
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    type="button"
                                                                    title="删除休息日记录"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <TimeInput
                                                            date={daily.date}
                                                            type="clockIn"
                                                            value={daily.clockIn?.time}
                                                            recordId={daily.clockIn?.id}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    {daily.isRestDay ? (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    ) : (
                                                        <TimeInput
                                                            date={daily.date}
                                                            type="clockOut"
                                                            value={daily.clockOut?.time}
                                                            recordId={daily.clockOut?.id}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    {daily.isRestDay ? (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    ) : workHours !== null ? (
                                                        <span className="text-sm font-bold text-primary">{workHours.toFixed(1)}h</span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 md:px-6 py-4">
                                                    {daily.isRestDay ? (
                                                        <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                                                            <span className="size-1.5 rounded-full bg-blue-500"></span>
                                                            休息日
                                                        </span>
                                                    ) : daily.clockIn && daily.clockOut ? (
                                                        <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                                            <span className="size-1.5 rounded-full bg-green-500"></span>
                                                            完整
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                                                            <span className="size-1.5 rounded-full bg-orange-500"></span>
                                                            不完整
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!isLoading && dailyRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={showBatchMode ? 6 : 5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                暂无记录，点击"添加记录"开始添加打卡记录
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* 添加打卡记录弹窗 */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="text-xl font-bold dark:text-white">添加打卡记录</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">日期</label>
                                <input
                                    type="date"
                                    value={modalData.date}
                                    onChange={e => setModalData({ ...modalData, date: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* 休息日选项 */}
                            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="restDayCheckbox"
                                    checked={modalData.isRestDay}
                                    onChange={e => setModalData({ ...modalData, isRestDay: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <label htmlFor="restDayCheckbox" className="text-sm font-bold text-blue-700 dark:text-blue-300 cursor-pointer flex-1">
                                    🏖️ 标记为休息日
                                </label>
                            </div>

                            {!modalData.isRestDay && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">上班时间</label>
                                        <input
                                            type="time"
                                            value={modalData.clockInTime}
                                            onChange={e => setModalData({ ...modalData, clockInTime: e.target.value })}
                                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">下班时间</label>
                                        <input
                                            type="time"
                                            value={modalData.clockOutTime}
                                            onChange={e => setModalData({ ...modalData, clockOutTime: e.target.value })}
                                            className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            💡 工作时长将自动扣除1小时午休时间
                                        </p>
                                    </div>
                                </>
                            )}

                            {modalData.isRestDay && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-xl p-3">
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                        ✅ 休息日不计入工作时长，但会记录在考勤中
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleModalSubmit}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                            >
                                确认添加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 辅助函数：计算工作时长（扣除12:00-13:00午休时间）
function calculateWorkHours(clockIn: string, clockOut: string): number {
    const [inHour, inMin] = clockIn.split(':').map(Number);
    const [outHour, outMin] = clockOut.split(':').map(Number);

    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;

    let totalMinutes = outMinutes - inMinutes;

    // 午休扣除逻辑：12:00-13:00
    const lunchStart = 12 * 60; // 12:00 = 720分钟
    const lunchEnd = 13 * 60;   // 13:00 = 780分钟

    // 计算工作时间与午休时间的重叠部分
    const overlapStart = Math.max(inMinutes, lunchStart);
    const overlapEnd = Math.min(outMinutes, lunchEnd);

    // 如果有重叠，扣除重叠的时间
    if (overlapEnd > overlapStart) {
        const lunchDeduction = overlapEnd - overlapStart;
        totalMinutes -= lunchDeduction;
    }

    return totalMinutes / 60;
}

// 辅助函数：格式化日期显示
function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (targetDate.getTime() === dateOnly.getTime()) {
        return '今天 ' + dateStr;
    } else if (targetDate.getTime() === yesterdayOnly.getTime()) {
        return '昨天 ' + dateStr;
    }

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${dateStr} ${weekdays[date.getDay()]}`;
}

export default AttendanceView;
