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
 * Get salary settings for current user
 */
export async function getSalarySettings(): Promise<SalarySettings> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        console.error('获取用户信息失败:', userError?.message);
        // Return defaults if user not found
        return {
            id: '',
            hourly_rate: 105,
            overtime_rate: 150,
            transport_fee: 500,
            bonus: 2000,
            xiaowang_diff: 0,
            xiaowang_pension: 0
        };
    }

    const { data, error } = await supabase
        .from('salary_settings')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    if (error) {
        // If no rows found or table not accessible (406), return defaults
        if (error.code === 'PGRST116' || error.code === 'PGRST301') {
            console.warn('工资设置表不可用，使用默认值');
            return {
                id: '',
                hourly_rate: 105,
                overtime_rate: 150,
                transport_fee: 500,
                bonus: 2000,
                xiaowang_diff: 0,
                xiaowang_pension: 0
            };
        }
        console.error('获取工资设置失败:', error.message, error.code);
        // Return defaults instead of throwing
        return {
            id: '',
            hourly_rate: 105,
            overtime_rate: 150,
            transport_fee: 500,
            bonus: 2000,
            xiaowang_diff: 0,
            xiaowang_pension: 0
        };
    }

    return data;
}

/**
 * Update salary settings for current user
 */
export async function updateSalarySettings(settings: Omit<SalarySettings, 'id'>): Promise<SalarySettings> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        console.error('获取用户信息失败:', userError?.message);
        throw userError || new Error('用户未登录');
    }

    // Check if a row exists for this user
    const { data: existing } = await supabase
        .from('salary_settings')
        .select('id')
        .eq('user_id', user.id)
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
                user_id: user.id
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
