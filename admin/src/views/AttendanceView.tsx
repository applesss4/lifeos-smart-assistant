
import React, { useState, useEffect } from 'react';
import * as attendanceService from '../../../src/services/attendanceService';
import { AttendanceRecord } from '../../../src/services/attendanceService';

const AttendanceView: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: '上班' as '上班' | '下班'
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(records.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) return;

        try {
            await attendanceService.deleteAttendanceRecords(Array.from(selectedIds));
            setRecords(records.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set());
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败');
        }
    };

    const fetchRecords = async () => {
        try {
            setIsLoading(true);
            const data = await attendanceService.getAttendanceRecords(30); // 获取最近30天
            setRecords(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条打卡记录吗？')) return;
        try {
            await attendanceService.deleteAttendanceRecord(id);
            setRecords(records.filter(r => r.id !== id));
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除记录失败');
        }
    };

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({ date: new Date().toISOString().split('T')[0], time: '09:00', type: '上班' });
        setShowModal(true);
    };

    const handleOpenEdit = (record: AttendanceRecord) => {
        setModalMode('edit');
        setEditingRecord(record);
        setFormData({
            date: record.date,
            time: record.time,
            type: record.type
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (modalMode === 'add') {
                await attendanceService.addManualRecord(formData.date, formData.time, formData.type);
            } else if (editingRecord) {
                await attendanceService.updateAttendanceRecord(editingRecord.id, formData);
            }
            setShowModal(false);
            fetchRecords();
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败，请重试');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">打卡记录管理</h2>
                <div className="flex gap-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900 px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors"
                        >
                            批量删除 ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={handleOpenAdd}
                        className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 px-6 py-2 rounded-xl font-bold shadow-sm dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        手动补卡
                    </button>
                    <button className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">导出 CSV</button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-[#252b36] border-b border-gray-100 dark:border-gray-800">
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={records.length > 0 && selectedIds.size === records.length}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">日期</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">打卡时间</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">类型</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">状态</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(record.id)}
                                        onChange={() => handleSelectOne(record.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-4 font-bold text-sm dark:text-gray-300">{record.date}</td>
                                <td className="px-6 py-4 text-sm dark:text-gray-400 font-mono">{record.time}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${record.type === '上班'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'
                                        }`}>
                                        {record.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="size-1.5 rounded-full bg-green-500"></span>
                                        有效记录
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleOpenEdit(record)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {isLoading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">加载中...</td>
                            </tr>
                        )}
                        {!isLoading && records.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">暂无记录</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                            <h3 className="text-xl font-bold dark:text-white">{modalMode === 'add' ? '手动补卡' : '编辑打卡记录'}</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">日期</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase text-between flex justify-between">
                                        <span>打卡时间</span>
                                        <span className="text-primary normal-case">将自动修整为 00 或 30 分</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">类型</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="上班">上班</option>
                                        <option value="下班">下班</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                                >
                                    {modalMode === 'add' ? '确认补卡' : '保存修改'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AttendanceView;
