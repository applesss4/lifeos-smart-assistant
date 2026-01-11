
import React, { useState, useEffect } from 'react';
import * as taskService from '@/services/taskService';
import { Task } from '@/../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const TasksView: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editFormData, setEditFormData] = useState({ title: '', category: '', priority: 'Medium' as 'High' | 'Medium' | 'Low' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(tasks.map(t => t.id)));
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
        if (!confirm(`确定要删除选中的 ${selectedIds.size} 个任务吗？`)) return;

        try {
            await taskService.deleteTasks(Array.from(selectedIds));
            setTasks(tasks.filter(t => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败');
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await taskService.getTasks();
            setTasks(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleTask = async (task: Task) => {
        try {
            await taskService.toggleTaskComplete(task.id, !task.completed);
            setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error('切换任务状态失败:', error);
        }
    };

    const deleteTask = async (id: string) => {
        if (!confirm('确定要删除这个任务吗？')) return;
        try {
            await taskService.deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
        } catch (error) {
            console.error('删除任务失败:', error);
        }
    };

    const handleOpenEdit = (task: Task) => {
        setEditingTask(task);
        setEditFormData({
            title: task.title,
            category: task.category,
            priority: task.priority
        });
        setShowEditModal(true);
    };

    const handleUpdateTask = async () => {
        if (!editingTask) return;
        try {
            await taskService.updateTask(editingTask.id, {
                title: editFormData.title,
                category: editFormData.category,
                priority: editFormData.priority
            });
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error('更新任务失败:', error);
            alert('更新失败');
        }
    };

    const stats = React.useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        // Categorize
        const categoryData: Record<string, number> = {};
        tasks.forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + 1;
        });

        const chartData = [
            { name: '已完成', value: completed, color: '#10b981' },
            { name: '待处理', value: pending, color: '#f59e0b' }
        ];

        const barData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

        return { total, completed, pending, chartData, barData };
    }, [tasks]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">待办统计与管理</h2>
                <span className="bg-primary/10 text-primary text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">总任务 {stats.total}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">任务完成状态</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-4">
                        {stats.chartData.map(d => (
                            <div key={d.name} className="flex items-center gap-2">
                                <div className="size-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-xs font-bold dark:text-gray-300">{d.name} ({d.value})</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1c2127] p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm min-h-[400px] flex flex-col">
                    <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-6">任务类别分布</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.barData}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#FAC638" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Task Management Table */}
            <div className="bg-white dark:bg-[#1c2127] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">任务全量管理</h3>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBatchDelete}
                            className="bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                        >
                            批量删除 ({selectedIds.size})
                        </button>
                    )}
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-[#252b36] border-b border-gray-100 dark:border-gray-800">
                            <th className="px-6 py-4 w-12">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={tasks.length > 0 && selectedIds.size === tasks.length}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">任务名称</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">分类</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">优先级</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">状态</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(task.id)}
                                        onChange={() => handleSelectOne(task.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold text-sm dark:text-gray-300 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                        {task.title}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 uppercase tracking-tight">{task.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase ${task.priority === 'High' ? 'text-red-500' : task.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'
                                        }`}>
                                        {task.priority === 'High' ? '紧急' : task.priority === 'Medium' ? '普通' : '低'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleTask(task)}
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${task.completed
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'
                                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-xs">
                                            {task.completed ? 'check_circle' : 'pending'}
                                        </span>
                                        {task.completed ? '已完成' : '进行中'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleOpenEdit(task)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => deleteTask(task.id)}
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
                        {!isLoading && tasks.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">暂无任务</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="text-xl font-bold dark:text-white">编辑任务</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">任务名称</label>
                                <input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">分类</label>
                                    <select
                                        value={editFormData.category}
                                        onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="工作">工作</option>
                                        <option value="学习">学习</option>
                                        <option value="生活">生活</option>
                                        <option value="健身">健身</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">优先级</label>
                                    <select
                                        value={editFormData.priority}
                                        onChange={e => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="High">紧急</option>
                                        <option value="Medium">普通</option>
                                        <option value="Low">低</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl font-bold"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdateTask}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                            >
                                保存修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksView;
