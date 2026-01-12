
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
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ selectedUserId }) => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [dailyRecords, setDailyRecords] = useState<DailyAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingCell, setEditingCell] = useState<{ date: string; type: 'clockIn' | 'clockOut' } | null>(null);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

    // 将打卡记录按日期分组
    const groupRecordsByDate = (records: AttendanceRecord[]): DailyAttendance[] => {
        const grouped = new Map<string, DailyAttendance>();
        
        records.forEach(record => {
            if (!grouped.has(record.date)) {
                grouped.set(record.date, { date: record.date });
            }
            const daily = grouped.get(record.date)!;
            if (record.type === '上班') {
                daily.clockIn = record;
            } else {
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
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败');
        }
    };

    const fetchRecords = async () => {
        try {
            setIsLoading(true);
            console.log('AttendanceView: 加载用户打卡记录, userId=', selectedUserId);
            const data = await attendanceService.getAttendanceRecords(30, selectedUserId);
            console.log('AttendanceView: 获取到', data.length, '条打卡记录');
            setRecords(data);
            setDailyRecords(groupRecordsByDate(data));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [selectedUserId]);

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
            
            setEditingCell(null);
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

    const handleAddDay = async () => {
        const date = prompt('请输入日期 (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (!date) return;

        try {
            // 添加上班打卡
            await attendanceService.addManualRecord(date, '09:00', '上班', selectedUserId);
            await fetchRecords();
        } catch (error) {
            console.error('添加失败:', error);
            alert('添加失败，请重试');
        }
    };

    const TimeInput: React.FC<{
        date: string;
        type: 'clockIn' | 'clockOut';
        value?: string;
        recordId?: string;
    }> = ({ date, type, value, recordId }) => {
        const [localValue, setLocalValue] = useState(value || '');
        const isEditing = editingCell?.date === date && editingCell?.type === type;

        const handleBlur = () => {
            if (localValue && localValue !== value) {
                handleTimeChange(date, type, localValue);
            } else {
                setEditingCell(null);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleBlur();
            } else if (e.key === 'Escape') {
                setLocalValue(value || '');
                setEditingCell(null);
            }
        };

        if (!value && !isEditing) {
            return (
                <button
                    onClick={() => {
                        setEditingCell({ date, type });
                        setLocalValue('09:00');
                    }}
                    className="text-gray-400 hover:text-primary transition-colors text-sm"
                >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                </button>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <input
                    type="time"
                    value={isEditing ? localValue : value}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setEditingCell({ date, type })}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${
                        isEditing
                            ? 'bg-primary/10 border-2 border-primary ring-2 ring-primary/20 dark:bg-primary/20'
                            : 'bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    } dark:text-white focus:outline-none`}
                />
                {recordId && (
                    <button
                        onClick={() => handleDeleteRecord(date, type)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                    {selectedDates.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900 px-4 md:px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors text-sm"
                        >
                            批量删除 ({selectedDates.size})
                        </button>
                    )}
                    <button
                        onClick={handleAddDay}
                        className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 px-4 md:px-6 py-2 rounded-xl font-bold shadow-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        添加日期
                    </button>
                    <button className="bg-primary text-white px-4 md:px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 text-sm">
                        导出 CSV
                    </button>
                </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-xl">info</span>
                    <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-bold mb-1">使用说明</p>
                        <ul className="space-y-1 text-xs">
                            <li>• 点击时间输入框可直接修改打卡时间</li>
                            <li>• 点击 <span className="material-symbols-outlined text-xs align-middle">add_circle</span> 图标可添加缺失的上班或下班记录</li>
                            <li>• 按 Enter 保存，按 Esc 取消编辑</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#252b36] border-b border-gray-100 dark:border-gray-800">
                                <th className="px-4 md:px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={dailyRecords.length > 0 && selectedDates.size === dailyRecords.length}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">日期</th>
                                <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">上班打卡</th>
                                <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">下班打卡</th>
                                <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">工作时长</th>
                                <th className="px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {dailyRecords.map((daily) => {
                                const workHours = daily.clockIn && daily.clockOut
                                    ? calculateWorkHours(daily.clockIn.time, daily.clockOut.time)
                                    : null;

                                return (
                                    <tr key={daily.date} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 md:px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedDates.has(daily.date)}
                                                onChange={() => handleSelectOne(daily.date)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-4 font-bold text-sm dark:text-gray-300 whitespace-nowrap">
                                            {formatDate(daily.date)}
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <TimeInput
                                                date={daily.date}
                                                type="clockIn"
                                                value={daily.clockIn?.time}
                                                recordId={daily.clockIn?.id}
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            <TimeInput
                                                date={daily.date}
                                                type="clockOut"
                                                value={daily.clockOut?.time}
                                                recordId={daily.clockOut?.id}
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            {workHours !== null ? (
                                                <span className="text-sm font-bold text-primary">{workHours.toFixed(1)}h</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-6 py-4">
                                            {daily.clockIn && daily.clockOut ? (
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
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        暂无记录，点击"添加日期"开始添加打卡记录
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 辅助函数：计算工作时长
function calculateWorkHours(clockIn: string, clockOut: string): number {
    const [inHour, inMin] = clockIn.split(':').map(Number);
    const [outHour, outMin] = clockOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    return (outMinutes - inMinutes) / 60;
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
