
import React, { useState, useEffect } from 'react';
import * as transactionService from '../../../src/services/transactionService';
import { Transaction } from '../../../types';

interface FinanceViewProps {
    selectedUserId?: string;
}

const FinanceView: React.FC<FinanceViewProps> = ({ selectedUserId }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', amount: '', type: 'Expense' as 'Income' | 'Expense', category: '餐饮', paymentMethod: 'PayPay残高' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(transactions.map(t => t.id)));
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
            await transactionService.deleteTransactions(Array.from(selectedIds));
            setTransactions(transactions.filter(t => !selectedIds.has(t.id)));
            setSelectedIds(new Set());
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败');
        }
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            console.log('FinanceView: 加载用户交易, userId=', selectedUserId);
            const data = await transactionService.getTransactions(selectedUserId);
            console.log('FinanceView: 获取到', data.length, '条交易记录');
            setTransactions(data);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedUserId]); // 当 selectedUserId 变化时重新加载数据

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这笔记录吗？')) return;
        try {
            await transactionService.deleteTransaction(id);
            setTransactions(transactions.filter(tx => tx.id !== id));
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除记录失败');
        }
    };

    const handleOpenAdd = () => {
        setModalMode('add');
        setFormData({ name: '', amount: '', type: 'Expense', category: '餐饮', paymentMethod: 'PayPay残高' });
        setShowModal(true);
    };

    const handleOpenEdit = (tx: Transaction) => {
        setModalMode('edit');
        setEditingId(tx.id);
        setFormData({
            name: tx.name,
            amount: Math.abs(tx.amount).toString(),
            type: tx.type,
            category: tx.category,
            paymentMethod: tx.paymentMethod || 'PayPay残高'
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.amount) return;

        try {
            if (modalMode === 'add') {
                await transactionService.createTransaction({
                    name: formData.name,
                    amount: Number(formData.amount),
                    type: formData.type,
                    category: formData.category,
                    paymentMethod: formData.paymentMethod
                }, selectedUserId); // 传递 selectedUserId 给服务函数
            } else if (editingId) {
                await transactionService.updateTransaction(editingId, {
                    name: formData.name,
                    amount: Number(formData.amount),
                    category: formData.category
                });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('保存失败:', error);
            alert('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tight dark:text-white">收支记录管理</h2>
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
                        className="bg-white dark:bg-[#1c2127] border border-gray-100 dark:border-gray-800 px-6 py-2 rounded-xl font-bold shadow-sm dark:text-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        添加记录
                    </button>
                    <button className="bg-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">导出数据</button>
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
                                    checked={transactions.length > 0 && selectedIds.size === transactions.length}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">交易名称</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">分类</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">日期时间</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">金额</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(tx.id)}
                                        onChange={() => handleSelectOne(tx.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-400">{tx.icon}</span>
                                        <span className="font-bold text-sm dark:text-gray-300">{tx.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 uppercase tracking-tight">{tx.category}</span>
                                        {tx.type === 'Expense' && tx.paymentMethod && (
                                            <span className="text-[9px] font-medium text-gray-400">{tx.paymentMethod}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm dark:text-gray-400">{tx.time}</td>
                                <td className={`px-6 py-4 text-sm font-black text-right ${tx.type === 'Income' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {tx.type === 'Income' ? '+' : '-'}¥{Math.abs(tx.amount).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleOpenEdit(tx)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tx.id)}
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
                        {!isLoading && transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">暂无记录</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-[#1c2127] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                        <h3 className="text-xl font-bold dark:text-white">{modalMode === 'add' ? '添加收支记录' : '编辑记录'}</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">名称</label>
                                <input
                                    type="text"
                                    placeholder="输入交易名称"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">金额</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">类型</label>
                                    <select
                                        disabled={modalMode === 'edit'}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                    >
                                        <option value="Expense">支出</option>
                                        <option value="Income">收入</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">分类</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="餐饮">餐饮</option>
                                        <option value="购物">购物</option>
                                        <option value="交通">交通</option>
                                        <option value="房租">房租</option>
                                        <option value="收入">收入</option>
                                        <option value="其他">其他</option>
                                    </select>
                                </div>
                            </div>

                            {formData.type === 'Expense' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">支付方式</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 font-bold dark:text-white border-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="PayPay残高">PayPay残高</option>
                                        <option value="现金">现金</option>
                                        <option value="信用卡">信用卡</option>
                                        <option value="积分">积分</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
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
                                {modalMode === 'add' ? '确认添加' : '保存修改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceView;
