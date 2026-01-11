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
 * Get salary settings (assumes single row for single user mode)
 */
export async function getSalarySettings(): Promise<SalarySettings> {
    const { data, error } = await supabase
        .from('salary_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        // If no rows found, return defaults (though migration creates one)
        if (error.code === 'PGRST116') {
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
        console.error('Failed to fetch salary settings:', error.message);
        throw error;
    }

    return data;
}

/**
 * Update salary settings
 */
export async function updateSalarySettings(settings: Omit<SalarySettings, 'id'>): Promise<SalarySettings> {
    // Check if a row exists first
    const { data: existing } = await supabase
        .from('salary_settings')
        .select('id')
        .limit(1)
        .single();

    let query;
    if (existing) {
        query = supabase
            .from('salary_settings')
            .update(settings)
            .eq('id', existing.id);
    } else {
        query = supabase
            .from('salary_settings')
            .insert(settings);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error('Failed to update salary settings:', error.message);
        throw error;
    }

    return data;
}
