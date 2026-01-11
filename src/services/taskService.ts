import { supabase } from '../lib/supabase';
import { Task } from '../../types';

// 数据库中的任务类型
interface DbTask {
    id: string;
    user_id: string;
    title: string;
    scheduled_time: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    completed: boolean;
    date_label: string;
    created_at: string;
    updated_at: string;
}

// 将数据库记录转换为前端 Task 类型
function dbToTask(dbTask: DbTask): Task {
    return {
        id: dbTask.id,
        title: dbTask.title,
        time: dbTask.scheduled_time.slice(0, 5), // 转换为 HH:MM 格式
        category: dbTask.category,
        priority: dbTask.priority,
        completed: dbTask.completed,
        date: dbTask.date_label,
    };
}

// 将前端 Task 转换为数据库格式
function taskToDb(task: Partial<Task>): Partial<DbTask> {
    const dbTask: Partial<DbTask> = {};

    if (task.title !== undefined) dbTask.title = task.title;
    if (task.time !== undefined) dbTask.scheduled_time = task.time;
    if (task.category !== undefined) dbTask.category = task.category;
    if (task.priority !== undefined) dbTask.priority = task.priority;
    if (task.completed !== undefined) dbTask.completed = task.completed;
    if (task.date !== undefined) dbTask.date_label = task.date;

    return dbTask;
}

/**
 * 获取所有任务
 */
export async function getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取任务失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToTask);
}

/**
 * 创建新任务
 */
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const dbData = {
        title: task.title,
        scheduled_time: task.time,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        date_label: task.date,
    };

    const { data, error } = await supabase
        .from('tasks')
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error('创建任务失败:', error.message);
        throw error;
    }

    return dbToTask(data);
}

/**
 * 更新任务
 */
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const dbUpdates = taskToDb(updates);

    const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('更新任务失败:', error.message);
        throw error;
    }

    return dbToTask(data);
}

/**
 * 切换任务完成状态
 */
export async function toggleTaskComplete(id: string, completed: boolean): Promise<Task> {
    return updateTask(id, { completed });
}

/**
 * 删除任务
 */
export async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除任务失败:', error.message);
        throw error;
    }
}

/**
 * 批量删除任务
 */
export async function deleteTasks(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('批量删除任务失败:', error.message);
        throw error;
    }
}

/**
 * 获取今日任务
 */
export async function getTodayTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('date_label', '今日')
        .order('scheduled_time', { ascending: true });

    if (error) {
        console.error('获取今日任务失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToTask);
}
