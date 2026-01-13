
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from '../src/components/LazyChart';
import { Transaction } from '../types';
import * as transactionService from '../src/services/transactionService';
import { MonthlyData } from '../src/services/transactionService';

const Finance: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    balance: '0.00',
    income: '0',
    expense: '0',
    chartData: [],
    transactions: []
  });
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 生成最近6个月的选项
  const MONTHS = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}年${date.getMonth() + 1}月`);
    }
    return months;
  }, []);

  // 从选中的月份字符串解析年月
  const parseSelectedMonth = useCallback((monthStr: string): { year: number; month: number } => {
    const match = monthStr.match(/(\d+)年(\d+)月/);
    if (match) {
      return { year: parseInt(match[1]), month: parseInt(match[2]) };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  // 加载月度数据
  const loadMonthlyData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { year, month } = parseSelectedMonth(selectedMonth);
      const data = await transactionService.getMonthlyStats(year, month);
      setMonthlyData(data);
    } catch (error) {
      console.error('加载财务数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, parseSelectedMonth]);

  useEffect(() => {
    loadMonthlyData();
  }, [loadMonthlyData]);

  const displayedTransactions = useMemo(() => 
    showAllTransactions
      ? monthlyData.transactions
      : monthlyData.transactions.slice(0, 4),
    [showAllTransactions, monthlyData.transactions]
  );

  const handleAddPocketMoney = useCallback(async () => {
    const amountNum = parseFloat(newIncomeAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    try {
      setIsSaving(true);
      await transactionService.addPocketMoney(amountNum);
      setNewIncomeAmount('');
      setShowAddIncomeModal(false);
      // 重新加载数据
      await loadMonthlyData();
    } catch (error) {
      console.error('增加零花钱失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [newIncomeAmount, loadMonthlyData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 pb-12 relative">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="w-10"></div>
        <h1 className="text-lg font-bold dark:text-white">财务管理</h1>
        <div className="relative">
          <button
            onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            className="bg-gray-100 dark:bg-surface-dark px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {selectedMonth} <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>

          {isMonthPickerOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {MONTHS.map(month => (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(month);
                    setIsMonthPickerOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedMonth === month ? 'text-primary' : 'dark:text-white'}`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Balance Summary */}
      <div className="flex flex-col items-center px-4">
        <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-widest">总余额</p>
        <h2 className="text-4xl font-bold dark:text-white">¥{monthlyData.balance}</h2>
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center material-symbols-outlined text-lg">redeem</span>
              <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">老婆给的零花钱</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">+¥{monthlyData.income}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="size-8 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center material-symbols-outlined text-lg">arrow_upward</span>
              <span className="text-xs text-gray-500 font-medium">支出</span>
            </div>
            <p className="text-xl font-bold text-orange-500">-¥{monthlyData.expense}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-4">
        <h3 className="font-bold text-lg mb-4 dark:text-white">消费明细</h3>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          {monthlyData.chartData.length > 0 ? (
            <>
              <div className="h-48 min-h-[12rem] relative">
                <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                  <PieChart>
                    <Pie
                      data={monthlyData.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {monthlyData.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">总计</span>
                  <span className="text-xl font-bold dark:text-white">¥{monthlyData.expense}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4 mt-4">
                {monthlyData.chartData.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <div>
                      <p className="text-xs font-bold dark:text-white">{d.name}</p>
                      <p className="text-[10px] text-gray-400">{d.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              本月暂无支出记录
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-bold text-lg dark:text-white">近期交易</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddIncomeModal(true)}
              className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              添加零花钱
            </button>
            {monthlyData.transactions.length > 4 && (
              <button
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-primary text-xs font-bold hover:opacity-70 transition-opacity"
              >
                {showAllTransactions ? '收起' : '查看全部'}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-3">
          {displayedTransactions.map(tx => (
            <div key={tx.id} className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 animate-in slide-in-from-bottom-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'Income' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
                }`}>
                <span className="material-symbols-outlined">{tx.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate dark:text-white">{tx.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{tx.time}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'Income' ? 'text-emerald-500' : 'dark:text-white'}`}>
                  {tx.type === 'Income' ? '+' : '-'}¥{Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{tx.category}</p>
              </div>
            </div>
          ))}
          {displayedTransactions.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">暂无交易记录</p>
          )}
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddIncomeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">记录零花钱</h3>
              <button onClick={() => setShowAddIncomeModal(false)} className="material-symbols-outlined text-gray-400">close</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">收到金额 (¥)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">¥</span>
                  <input
                    type="number"
                    value={newIncomeAmount}
                    onChange={(e) => setNewIncomeAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full h-14 bg-gray-50 dark:bg-gray-800/50 rounded-2xl pl-10 pr-4 text-xl font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAddPocketMoney}
              disabled={isSaving || !newIncomeAmount}
              className={`w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? '保存中...' : '确认收下'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
