import { supabase } from '../lib/supabase';

// 打卡记录类型
export interface AttendanceRecord {
    id: string;
    date: string;
    time: string;
    type: '上班' | '下班';
}

// 数据库中的打卡记录类型
interface DbAttendanceRecord {
    id: string;
    user_id: string;
    record_date: string;
    record_time: string;
    record_type: '上班' | '下班';
    created_at: string;
}

// 月度统计类型
export interface MonthlyStats {
    totalHours: number;
    attendanceDays: number;
    targetDays: number;
    targetHours: number;
}

// 每日统计类型
export interface DailyStats {
    totalHours: number;
    overtimeHours: number;
}

// 将数据库记录转换为前端类型
function dbToRecord(db: DbAttendanceRecord): AttendanceRecord {
    return {
        id: db.id,
        date: db.record_date,
        time: db.record_time.slice(0, 5), // HH:MM 格式
        type: db.record_type,
    };
}

/**
 * 获取打卡记录（默认最近7天）
 */
export async function getAttendanceRecords(days: number = 7): Promise<AttendanceRecord[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate.toISOString().split('T')[0])
        .order('record_date', { ascending: false })
        .order('record_time', { ascending: false });

    if (error) {
        console.error('获取打卡记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToRecord);
}

/**
 * 获取最近两天的打卡记录
 */
export async function getRecentRecords(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .in('record_date', [today, yesterday])
        .order('record_date', { ascending: false })
        .order('record_time', { ascending: false });

    if (error) {
        console.error('获取最近打卡记录失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToRecord);
}

/**
 * 打卡（上班或下班）
 */
export async function punch(type: '上班' | '下班'): Promise<AttendanceRecord> {
    const now = new Date();
    const recordDate = now.toISOString().split('T')[0];
    const recordTime = now.toTimeString().slice(0, 5);

    const { data, error } = await supabase
        .from('attendance_records')
        .insert({
            record_date: recordDate,
            record_time: recordTime,
            record_type: type,
        })
        .select()
        .single();

    if (error) {
        console.error('打卡失败:', error.message);
        throw error;
    }

    return dbToRecord(data);
}

/**
 * 上班打卡
 */
export async function punchIn(): Promise<AttendanceRecord> {
    return punch('上班');
}

/**
 * 下班打卡
 */
export async function punchOut(): Promise<AttendanceRecord> {
    return punch('下班');
}

/**
 * 手动补卡
 */
export async function addManualRecord(
    date: string,
    time: string,
    type: '上班' | '下班'
): Promise<AttendanceRecord> {
    const { data, error } = await supabase
        .from('attendance_records')
        .insert({
            record_date: date,
            record_time: time,
            record_type: type,
        })
        .select()
        .single();

    if (error) {
        console.error('补卡失败:', error.message);
        throw error;
    }

    return dbToRecord(data);
}

/**
 * 获取月度统计
 */
export async function getMonthlyStats(year?: number, month?: number): Promise<MonthlyStats> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // 计算月份的开始和结束日期
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: true })
        .order('record_time', { ascending: true });

    if (error) {
        console.error('获取月度统计失败:', error.message);
        throw error;
    }

    // 计算工作时长和出勤天数
    const records = data || [];
    const workDays = new Set<string>();
    let totalMinutes = 0;

    // 按日期分组计算每天的工作时长
    const recordsByDate = new Map<string, DbAttendanceRecord[]>();
    records.forEach(record => {
        const date = record.record_date;
        if (!recordsByDate.has(date)) {
            recordsByDate.set(date, []);
        }
        recordsByDate.get(date)!.push(record);
    });

    recordsByDate.forEach((dayRecords, date) => {
        const clockIn = dayRecords.find(r => r.record_type === '上班');
        const clockOut = dayRecords.find(r => r.record_type === '下班');

        if (clockIn) {
            workDays.add(date);

            if (clockOut) {
                // 计算工作时长
                const inTime = clockIn.record_time.split(':').map(Number);
                const outTime = clockOut.record_time.split(':').map(Number);

                const inMinutes = inTime[0] * 60 + inTime[1];
                const outMinutes = outTime[0] * 60 + outTime[1];

                if (outMinutes > inMinutes) {
                    totalMinutes += outMinutes - inMinutes;
                }
            }
        }
    });

    // 计算本月工作日目标（假设周一到周五）
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let targetDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth - 1, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            targetDays++;
        }
    }

    return {
        totalHours: Math.round((totalMinutes / 60) * 10) / 10, // 保留一位小数
        attendanceDays: workDays.size,
        targetDays,
        targetHours: targetDays * 8, // 假设每天8小时
    };
}

/**
 * 检查今日打卡状态
 */
export async function getTodayPunchStatus(): Promise<{ isClockedIn: boolean; lastRecord?: AttendanceRecord }> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('record_date', today)
        .order('record_time', { ascending: false })
        .limit(1);

    if (error) {
        console.error('获取今日打卡状态失败:', error.message);
        throw error;
    }

    if (!data || data.length === 0) {
        return { isClockedIn: false };
    }

    const lastRecord = dbToRecord(data[0]);
    return {
        isClockedIn: lastRecord.type === '上班',
        lastRecord,
    };
}

/**
 * 获取特定日期的统计数据
 */
export async function getDailyStats(date: string): Promise<DailyStats> {
    const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('record_date', date)
        .order('record_time', { ascending: true });

    if (error) {
        console.error('获取每日记录失败:', error.message);
        throw error;
    }

    const records = data || [];
    let totalMinutes = 0;
    const clockIn = records.find(r => r.record_type === '上班');
    const clockOut = records.find(r => r.record_type === '下班');

    if (clockIn && clockOut) {
        const inTime = clockIn.record_time.split(':').map(Number);
        const outTime = clockOut.record_time.split(':').map(Number);
        const inMinutes = inTime[0] * 60 + inTime[1];
        const outMinutes = outTime[0] * 60 + outTime[1];

        if (outMinutes > inMinutes) {
            totalMinutes = outMinutes - inMinutes;
        }
    }

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const standardHours = 8;
    const overtimeHours = Math.max(0, totalHours - standardHours);

    return {
        totalHours,
        overtimeHours,
    };
}
