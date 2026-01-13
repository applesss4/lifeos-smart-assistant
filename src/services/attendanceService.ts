import { supabase } from '../lib/supabase';
import { defaultCache } from '../utils/cacheManager';
import { getLocalDateString, getYesterdayDateString, getDaysAgoDateString } from '../utils/dateHelper';

// Cache TTL for attendance (1 minute)
const ATTENDANCE_CACHE_TTL = 1 * 60 * 1000;

// 打卡记录类型
export interface AttendanceRecord {
    id: string;
    date: string;
    time: string;
    type: '上班' | '下班' | '休息';
}

// 数据库中的打卡记录类型
interface DbAttendanceRecord {
    id: string;
    user_id: string;
    record_date: string;
    record_time: string;
    record_type: '上班' | '下班' | '休息';
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
 * 将时间舍入到最近的整点或整点30分
 * 例如：08:14 -> 08:00, 08:15 -> 08:30, 08:44 -> 08:30, 08:45 -> 09:00
 */
export function roundTimeToNearestHalfHour(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let roundedHours = hours;
    let roundedMinutes = 0;

    if (minutes >= 15 && minutes < 45) {
        roundedMinutes = 30;
    } else if (minutes >= 45) {
        roundedMinutes = 0;
        roundedHours = (hours + 1) % 24;
    }

    return `${String(roundedHours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

/**
 * 获取打卡记录（默认最近7天）
 * @param days 获取最近几天的记录
 * @param userId 可选的用户ID,如果提供则只获取该用户的记录
 */
export async function getAttendanceRecords(days: number = 7, userId?: string): Promise<AttendanceRecord[]> {
    const startDate = getDaysAgoDateString(days);

    let query = supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
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
 * @param userId 可选的用户ID,如果提供则只获取该用户的记录
 */
export async function getRecentRecords(userId?: string): Promise<AttendanceRecord[]> {
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();

    let query = supabase
        .from('attendance_records')
        .select('*')
        .in('record_date', [today, yesterday]);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
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
 * @param type 打卡类型
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户打卡
 */
export async function punch(type: '上班' | '下班', targetUserId?: string): Promise<AttendanceRecord> {
    // 获取当前登录用户
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error('用户未登录');
    }

    // 如果提供了 targetUserId，使用它；否则使用当前用户ID
    const userId = targetUserId || user.id;

    // 检查今天是否已经打过相同类型的卡
    const today = getLocalDateString();
    const { data: existingRecords } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('record_date', today)
        .eq('record_type', type);

    if (existingRecords && existingRecords.length > 0) {
        throw new Error(type === '上班' ? '今天已经打过上班卡了' : '今天已经打过下班卡了');
    }

    const now = new Date();
    const recordDate = getLocalDateString(now);
    
    // 使用更可靠的方式获取当前时间（兼容移动端）
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // 自动舍入到最近的整点或半点
    const recordTime = roundTimeToNearestHalfHour(currentTime);

    const { data, error } = await supabase
        .from('attendance_records')
        .insert({
            user_id: userId,
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

    // Clear cache after punching
    clearAttendanceCache(userId);

    return dbToRecord(data);
}

/**
 * 记录休息日
 * @param date 可选的日期，默认为今天
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户记录
 */
export async function markRestDay(date?: string, targetUserId?: string): Promise<AttendanceRecord> {
    // 获取当前登录用户
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error('用户未登录');
    }

    // 如果提供了 targetUserId，使用它；否则使用当前用户ID
    const userId = targetUserId || user.id;

    const recordDate = date || getLocalDateString();
    const recordTime = '00:00'; // 休息日使用固定时间

    // 检查当天是否已有休息记录
    const { data: existing } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .eq('record_date', recordDate)
        .eq('record_type', '休息')
        .single();

    if (existing) {
        throw new Error('今天已经标记为休息日了');
    }

    const { data, error } = await supabase
        .from('attendance_records')
        .insert({
            user_id: userId,
            record_date: recordDate,
            record_time: recordTime,
            record_type: '休息',
        })
        .select()
        .single();

    if (error) {
        console.error('记录休息日失败:', error.message);
        throw error;
    }

    // Clear cache after marking rest day
    clearAttendanceCache(userId);

    return dbToRecord(data);
}

/**
 * 上班打卡
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户打卡
 */
export async function punchIn(targetUserId?: string): Promise<AttendanceRecord> {
    return punch('上班', targetUserId);
}

/**
 * 下班打卡
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户打卡
 */
export async function punchOut(targetUserId?: string): Promise<AttendanceRecord> {
    return punch('下班', targetUserId);
}

/**
 * 手动补卡
 * @param date 日期
 * @param time 时间
 * @param type 打卡类型
 * @param targetUserId 可选的目标用户ID，管理员可以为其他用户补卡
 */
export async function addManualRecord(
    date: string,
    time: string,
    type: '上班' | '下班' | '休息',
    targetUserId?: string
): Promise<AttendanceRecord> {
    // 获取当前登录用户
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        throw new Error('用户未登录');
    }

    // 如果提供了 targetUserId，使用它；否则使用当前用户ID
    const userId = targetUserId || user.id;

    // 休息日使用固定时间，其他类型舍入时间
    const recordTime = type === '休息' ? '00:00' : roundTimeToNearestHalfHour(time);
    
    const { data, error } = await supabase
        .from('attendance_records')
        .insert({
            user_id: userId,
            record_date: date,
            record_time: recordTime,
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
/**
 * Calculate work minutes between start and end time, deducting lunch break (12:00-13:00) on weekdays
 */
function calculateNetWorkMinutes(inTimeStr: string, outTimeStr: string, dateStr: string): number {
    const inTime = inTimeStr.split(':').map(Number);
    const outTime = outTimeStr.split(':').map(Number);

    const inMinutes = inTime[0] * 60 + inTime[1];
    const outMinutes = outTime[0] * 60 + outTime[1];

    if (inMinutes >= outMinutes) return 0;

    let duration = outMinutes - inMinutes;

    // 午休扣除逻辑：每日 12:00-13:00
    // Previous logic excluded weekends, but user req indicates it applies generally.
    const lunchStart = 12 * 60; // 12:00
    const lunchEnd = 13 * 60;   // 13:00

    // Calculate overlap
    const overlapStart = Math.max(inMinutes, lunchStart);
    const overlapEnd = Math.min(outMinutes, lunchEnd);

    if (overlapEnd > overlapStart) {
        duration -= (overlapEnd - overlapStart);
    }

    return duration;
}

/**
 * 获取月度统计
 * @param year 年份
 * @param month 月份
 * @param userId 可选的用户ID,如果提供则只获取该用户的数据
 */
export async function getMonthlyStats(year?: number, month?: number, userId?: string): Promise<MonthlyStats> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // 计算月份的开始和结束日期
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0);
    const endDate = getLocalDateString(lastDay);

    let query = supabase
        .from('attendance_records')
        .select('*')
        .gte('record_date', startDate)
        .lte('record_date', endDate);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
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
        // Find Earliest In and Latest Out
        // Records are sorted by time ascending
        const clockIns = dayRecords.filter(r => r.record_type === '上班');
        const clockOuts = dayRecords.filter(r => r.record_type === '下班');

        const firstIn = clockIns.length > 0 ? clockIns[0] : null;
        const lastOut = clockOuts.length > 0 ? clockOuts[clockOuts.length - 1] : null;

        if (firstIn) {
            workDays.add(date);

            if (lastOut) {
                totalMinutes += calculateNetWorkMinutes(firstIn.record_time, lastOut.record_time, date);
            }
        }
    });

    // 计算本月工作日目标
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
 * 检查今日打卡状态（带缓存）
 * @param userId 可选的用户ID,如果提供则只检查该用户的状态
 */
export async function getTodayPunchStatus(userId?: string): Promise<{ 
    isClockedIn: boolean; 
    lastRecord?: AttendanceRecord;
    hasClockedIn: boolean;
    hasClockedOut: boolean;
}> {
    const today = getLocalDateString();
    const cacheKey = `punch-status:${today}:${userId || 'current'}`;

    // Try to get from cache first (short TTL for punch status)
    const cached = defaultCache.get<{ 
        isClockedIn: boolean; 
        lastRecord?: AttendanceRecord;
        hasClockedIn: boolean;
        hasClockedOut: boolean;
    }>(cacheKey);
    if (cached) {
        return cached;
    }

    let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('record_date', today);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query
        .order('record_time', { ascending: false });

    if (error) {
        console.error('获取今日打卡状态失败:', error.message);
        throw error;
    }

    if (!data || data.length === 0) {
        const result = { 
            isClockedIn: false,
            hasClockedIn: false,
            hasClockedOut: false
        };
        defaultCache.set(cacheKey, result, ATTENDANCE_CACHE_TTL);
        return result;
    }

    // 检查今天是否有上班和下班记录
    const hasClockedIn = data.some(r => r.record_type === '上班');
    const hasClockedOut = data.some(r => r.record_type === '下班');
    
    const lastRecord = dbToRecord(data[0]);
    const result = {
        isClockedIn: lastRecord.type === '上班',
        lastRecord,
        hasClockedIn,
        hasClockedOut
    };

    // Cache with short TTL since punch status changes frequently
    defaultCache.set(cacheKey, result, ATTENDANCE_CACHE_TTL);
    
    return result;
}

/**
 * Clear attendance cache (call after punching in/out)
 */
export function clearAttendanceCache(userId?: string): void {
    const today = getLocalDateString();
    const yesterday = getYesterdayDateString();
    
    // 清除今天和昨天的缓存，确保日期变化时能正确更新
    defaultCache.clear(`punch-status:${today}:${userId || 'current'}`);
    defaultCache.clear(`daily-attendance:${today}:${userId || 'current'}`);
    defaultCache.clear(`punch-status:${yesterday}:${userId || 'current'}`);
    defaultCache.clear(`daily-attendance:${yesterday}:${userId || 'current'}`);
}

/**
 * 获取特定日期的统计数据（带缓存）
 * @param date 日期字符串
 * @param userId 可选的用户ID,如果提供则只获取该用户的数据
 */
export async function getDailyStats(date: string, userId?: string): Promise<DailyStats> {
    const cacheKey = `daily-attendance:${date}:${userId || 'current'}`;

    // Try to get from cache first
    const cached = defaultCache.get<DailyStats>(cacheKey);
    if (cached) {
        return cached;
    }

    let query = supabase
        .from('attendance_records')
        .select('*')
        .eq('record_date', date);
    
    if (userId) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('record_time', { ascending: true });

    if (error) {
        console.error('获取每日记录失败:', error.message);
        throw error;
    }

    const records = data || [];
    let totalMinutes = 0;

    // Find Earliest In and Latest Out
    const clockIns = records.filter(r => r.record_type === '上班');
    const clockOuts = records.filter(r => r.record_type === '下班');

    const firstIn = clockIns.length > 0 ? clockIns[0] : null;
    const lastOut = clockOuts.length > 0 ? clockOuts[clockOuts.length - 1] : null;

    if (firstIn && lastOut) {
        totalMinutes = calculateNetWorkMinutes(firstIn.record_time, lastOut.record_time, date);
    }

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const standardHours = 8;
    const overtimeHours = Math.max(0, totalHours - standardHours);

    const stats = {
        totalHours,
        overtimeHours,
    };

    // Cache the result (longer TTL for past dates)
    const today = getLocalDateString();
    const ttl = date === today ? ATTENDANCE_CACHE_TTL : 10 * 60 * 1000; // 10 minutes for past dates
    defaultCache.set(cacheKey, stats, ttl);

    return stats;
}

/**
 * 删除打卡记录
 */
export async function deleteAttendanceRecord(id: string): Promise<void> {
    const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('删除打卡记录失败:', error.message);
        throw error;
    }
}

/**
 * 批量删除打卡记录
 */
export async function deleteAttendanceRecords(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('attendance_records')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('批量删除打卡记录失败:', error.message);
        throw error;
    }
}

/**
 * 更新打卡记录
 */
export async function updateAttendanceRecord(
    id: string,
    updates: {
        date?: string;
        time?: string;
        type?: '上班' | '下班';
    }
): Promise<AttendanceRecord> {
    const dbUpdates: any = {};
    if (updates.date) dbUpdates.record_date = updates.date;
    if (updates.time) dbUpdates.record_time = roundTimeToNearestHalfHour(updates.time);
    if (updates.type) dbUpdates.record_type = updates.type;

    const { data, error } = await supabase
        .from('attendance_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('更新打卡记录失败:', error.message);
        throw error;
    }

    return dbToRecord(data);
}
