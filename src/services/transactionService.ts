import { supabase } from '../lib/supabase';
import { Transaction } from '../../types';

// 数据库中的交易记录类型
interface DbTransaction {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    transaction_type: 'Income' | 'Expense';
    category: string;
    icon: string;
    payment_method?: string;
    transaction_date: string;
    transaction_time: string;
    created_at: string;
}

// 月度数据类型
export interface MonthlyData {
    balance: string;
    income: string;
    expense: string;
    chartData: { name: string; value: number; color: string }[];
    transactions: Transaction[];
}

// 每日金融统计类型
export interface DailyFinancialStats {
    income: number;
    expense: number;
}

// 分类颜色映射
const CATEGORY_COLORS: Record<string, string> = {
    '餐饮': '#FAC638',
    '房租': '#fb923c',
    '交通': '#a855f7',
    '购物': '#3b82f6',
    '收入': '#10b981',
    '其他': '#475569',
};

// 将数据库记录转换为前端类型
function dbToTransaction(db: DbTransaction): Transaction {
    // 格式化时间显示
    const txDate = new Date(db.transaction_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let timeDisplay: string;
    if (db.transaction_date === today.toISOString().split('T')[0]) {
        timeDisplay = `今天 ${db.transaction_time.slice(0, 5)}`;
    } else if (db.transaction_date === yesterday.toISOString().split('T')[0]) {
        timeDisplay = `昨天 ${db.transaction_time.slice(0, 5)}`;
    } else {
        timeDisplay = `${txDate.getMonth() + 1}月${txDate.getDate()}日`;
    }

    return {
        id: db.id,
        name: db.name,
        amount: db.amount,
        type: db.transaction_type,
        category: db.category,
        paymentMethod: db.payment_method,
        time: timeDisplay,
        icon: db.icon,
    };
}

/**
 * 获取所有交易记录
 */
export async function getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false });

    if (error) {
        console.error('获取交易记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToTransaction);
}

/**
 * 获取指定月份的交易记录
 */
export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false })
        .order('transaction_time', { ascending: false });

    if (error) {
        console.error('获取月度交易记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToTransaction);
}

/**
 * 获取今日交易记录
 */
export async function getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_date', today)
        .order('transaction_time', { ascending: false });

    if (error) {
        console.error('获取今日交易记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToTransaction);
}

/**
 * 创建交易记录
 */
export async function createTransaction(transaction: {
    name: string;
    amount: number;
    type: 'Income' | 'Expense';
    category: string;
    icon?: string;
    paymentMethod?: string;
}): Promise<Transaction> {
    const now = new Date();

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            name: transaction.name,
            amount: transaction.type === 'Expense' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
            transaction_type: transaction.type,
            category: transaction.category,
            icon: transaction.icon || 'receipt',
            payment_method: transaction.paymentMethod,
            transaction_date: now.toISOString().split('T')[0],
            transaction_time: now.toTimeString().slice(0, 5),
        })
        .select()
        .single();

    if (error) {
        console.error('创建交易记录失败:', error.message);
        throw error;
    }

    return dbToTransaction(data);
}

/**
 * 添加支出
 */
export async function addExpense(name: string, amount: number, category: string, paymentMethod?: string): Promise<Transaction> {
    // 根据分类确定图标
    const iconMap: Record<string, string> = {
        '餐饮': 'lunch_dining',
        '交通': 'local_taxi',
        '购物': 'shopping_bag',
        '其他': 'receipt',
    };

    return createTransaction({
        name,
        amount,
        type: 'Expense',
        category,
        paymentMethod,
        icon: iconMap[category] || 'receipt',
    });
}

/**
 * 添加老婆给的零花钱（收入）
 */
export async function addPocketMoney(amount: number): Promise<Transaction> {
    return createTransaction({
        name: '老婆给的零花钱',
        amount,
        type: 'Income',
        category: '收入',
        icon: 'redeem' // 使用礼包图标
    });
}

/**
 * 获取月度统计数据
 */
export async function getMonthlyStats(year: number, month: number): Promise<MonthlyData> {
    const transactions = await getTransactionsByMonth(year, month);

    // 计算收入和支出
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(tx => {
        if (tx.type === 'Income') {
            totalIncome += Math.abs(tx.amount);
        } else {
            totalExpense += Math.abs(tx.amount);
            // 统计各分类支出
            if (!categoryTotals[tx.category]) {
                categoryTotals[tx.category] = 0;
            }
            categoryTotals[tx.category] += Math.abs(tx.amount);
        }
    });

    // 生成饼图数据
    const chartData = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['其他'],
    }));

    // 确保百分比总和为100
    if (chartData.length > 0) {
        const totalPercent = chartData.reduce((sum, item) => sum + item.value, 0);
        if (totalPercent !== 100 && totalPercent > 0) {
            chartData[0].value += 100 - totalPercent;
        }
    }

    return {
        balance: (totalIncome - totalExpense).toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
        income: totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 0 }),
        expense: totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 0 }),
        chartData,
        transactions,
    };
}

/**
 * 删除交易记录
 */
export async function deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除交易记录失败:', error.message);
        throw error;
    }
}

/**
 * 批量删除交易记录
 */
export async function deleteTransactions(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('批量删除交易记录失败:', error.message);
        throw error;
    }
}

/**
 * 更新交易记录
 */
export async function updateTransaction(id: string, updates: {
    name?: string;
    amount?: number;
    category?: string;
    icon?: string;
}): Promise<void> {
    const dataToUpdate: any = { ...updates };
    if (updates.amount !== undefined) {
        // 保持金额正负号逻辑
        const { data: current } = await supabase.from('transactions').select('transaction_type').eq('id', id).single();
        if (current) {
            dataToUpdate.amount = current.transaction_type === 'Expense' ? -Math.abs(updates.amount) : Math.abs(updates.amount);
        }
    }

    const { error } = await supabase
        .from('transactions')
        .update(dataToUpdate)
        .eq('id', id);

    if (error) {
        console.error('更新交易记录失败:', error.message);
        throw error;
    }
}

/**
 * 获取特定日期的财务统计数据
 */
export async function getDailyStats(date: string): Promise<DailyFinancialStats> {
    const { data, error } = await supabase
        .from('transactions')
        .select('amount, transaction_type')
        .eq('transaction_date', date);

    if (error) {
        console.error('获取每日交易统计失败:', error.message);
        throw error;
    }

    let income = 0;
    let expense = 0;

    (data || []).forEach(tx => {
        const amount = Math.abs(tx.amount);
        if (tx.transaction_type === 'Income') {
            income += amount;
        } else {
            expense += amount;
        }
    });

    return { income, expense };
}
