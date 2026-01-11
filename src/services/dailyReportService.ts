import { supabase } from '../lib/supabase';

// 日报数据类型
export interface DailyReport {
    id?: string;
    reportDate: string;
    totalHours: number;
    overtimeHours: number;
    totalEarned: number;
    completedTasksCount: number;
    pendingTasksCount: number;
    completedTasksTitles: string[];
    pendingTasksTitles: string[];
    totalSpent: number;
    expenseCount: number;
    biggestExpenseName?: string;
    biggestExpenseAmount?: number;
    narrative: string;
    createdAt?: string;
}

// 数据库记录类型
interface DbDailyReport {
    id: string;
    user_id: string;
    report_date: string;
    total_hours: number;
    overtime_hours: number;
    total_earned: number;
    completed_tasks_count: number;
    pending_tasks_count: number;
    completed_tasks_titles: string[];
    pending_tasks_titles: string[];
    total_spent: number;
    expense_count: number;
    biggest_expense_name: string | null;
    biggest_expense_amount: number | null;
    narrative: string;
    created_at: string;
}

// 转换数据库记录为前端类型
function dbToReport(db: DbDailyReport): DailyReport {
    return {
        id: db.id,
        reportDate: db.report_date,
        totalHours: db.total_hours,
        overtimeHours: db.overtime_hours,
        totalEarned: db.total_earned,
        completedTasksCount: db.completed_tasks_count,
        pendingTasksCount: db.pending_tasks_count,
        completedTasksTitles: db.completed_tasks_titles || [],
        pendingTasksTitles: db.pending_tasks_titles || [],
        totalSpent: db.total_spent,
        expenseCount: db.expense_count,
        biggestExpenseName: db.biggest_expense_name || undefined,
        biggestExpenseAmount: db.biggest_expense_amount || undefined,
        narrative: db.narrative,
        createdAt: db.created_at,
    };
}

/**
 * 保存日报到数据库
 */
export async function saveDailyReport(report: Omit<DailyReport, 'id' | 'createdAt'>): Promise<DailyReport> {
    const dbData = {
        report_date: report.reportDate,
        total_hours: report.totalHours,
        overtime_hours: report.overtimeHours,
        total_earned: report.totalEarned,
        completed_tasks_count: report.completedTasksCount,
        pending_tasks_count: report.pendingTasksCount,
        completed_tasks_titles: report.completedTasksTitles,
        pending_tasks_titles: report.pendingTasksTitles,
        total_spent: report.totalSpent,
        expense_count: report.expenseCount,
        biggest_expense_name: report.biggestExpenseName || null,
        biggest_expense_amount: report.biggestExpenseAmount || null,
        narrative: report.narrative,
    };

    // 使用 upsert 来处理同一天的多次保存
    const { data, error } = await supabase
        .from('daily_reports')
        .upsert(dbData, { onConflict: 'report_date' })
        .select()
        .single();

    if (error) {
        console.error('保存日报失败:', error.message);
        throw error;
    }

    return dbToReport(data);
}

/**
 * 获取指定日期的日报
 */
export async function getDailyReport(date: string): Promise<DailyReport | null> {
    const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('report_date', date)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // 没有找到记录
            return null;
        }
        console.error('获取日报失败:', error.message);
        throw error;
    }

    return dbToReport(data);
}

/**
 * 获取日报列表（分页）
 */
export async function getDailyReports(limit: number = 30, offset: number = 0): Promise<DailyReport[]> {
    const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('获取日报列表失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToReport);
}

/**
 * 检查今日日报是否已存档
 */
export async function isTodayReportArchived(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const report = await getDailyReport(today);
    return report !== null;
}

/**
 * 删除日报存档
 */
export async function deleteDailyReport(id: string): Promise<void> {
    const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除日报失败:', error.message);
        throw error;
    }
}
