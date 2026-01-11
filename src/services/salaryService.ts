import { supabase } from '../lib/supabase';

export interface SalarySettings {
    id: string;
    hourly_rate: number;
    overtime_rate: number;
    transport_fee: number;
    bonus: number;
    xiaowang_diff: number;
    xiaowang_pension: number;
}

/**
 * Get salary settings for a specific user or current user
 * @param userId 可选的用户ID,如果提供则获取该用户的工资设置
 */
export async function getSalarySettings(userId?: string): Promise<SalarySettings> {
    const defaultSettings = {
        id: '',
        hourly_rate: 105,
        overtime_rate: 150,
        transport_fee: 500,
        bonus: 2000,
        xiaowang_diff: 0,
        xiaowang_pension: 0
    };

    // 如果提供了 userId，直接使用它
    let targetUserId = userId;
    
    // 如果没有提供 userId，获取当前用户
    if (!targetUserId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('获取用户信息失败:', userError?.message);
            return defaultSettings;
        }
        
        targetUserId = user.id;
    }

    const { data, error } = await supabase
        .from('salary_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(1)
        .single();

    if (error) {
        // If no rows found or table not accessible (406), return defaults
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
            console.warn('工资设置表不可用或未找到记录，使用默认值');
            return defaultSettings;
        }
        console.error('获取工资设置失败:', error.message, error.code);
        return defaultSettings;
    }

    return data;
}

/**
 * Update salary settings for a specific user or current user
 * @param settings 工资设置
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户更新工资设置
 */
export async function updateSalarySettings(settings: Omit<SalarySettings, 'id'>, targetUserId?: string): Promise<SalarySettings> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        console.error('获取用户信息失败:', userError?.message);
        throw userError || new Error('用户未登录');
    }

    // 如果提供了 targetUserId，使用它；否则使用当前用户ID
    const userId = targetUserId || user.id;

    // Check if a row exists for this user
    const { data: existing } = await supabase
        .from('salary_settings')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

    let data, error;
    if (existing) {
        // Update existing record
        const result = await supabase
            .from('salary_settings')
            .update(settings)
            .eq('id', existing.id)
            .select()
            .single();
        data = result.data;
        error = result.error;
    } else {
        // Insert new record with user_id
        const result = await supabase
            .from('salary_settings')
            .insert({
                ...settings,
                user_id: userId
            })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
        console.error('更新工资设置失败:', error.message);
        throw error;
    }

    return data;
}
