import { supabase } from '../lib/supabase';

// 通知类型
export type NotificationType = 'daily_report' | 'monthly_report' | 'custom';

// 通知数据类型
export interface Notification {
    id: string;
    userId: string;
    senderId?: string;
    title: string;
    content: string;
    type: NotificationType;
    referenceId?: string;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

// 数据库记录类型
interface DbNotification {
    id: string;
    user_id: string;
    sender_id: string | null;
    title: string;
    content: string;
    type: NotificationType;
    reference_id: string | null;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
}

// 转换数据库记录为前端类型
function dbToNotification(db: DbNotification): Notification {
    return {
        id: db.id,
        userId: db.user_id,
        senderId: db.sender_id || undefined,
        title: db.title,
        content: db.content,
        type: db.type,
        referenceId: db.reference_id || undefined,
        isRead: db.is_read,
        createdAt: db.created_at,
        readAt: db.read_at || undefined,
    };
}

/**
 * 获取当前用户的通知列表
 * @param limit 每页数量
 * @param offset 偏移量
 * @param unreadOnly 是否只获取未读通知
 */
export async function getNotifications(
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
): Promise<Notification[]> {
    let query = supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (unreadOnly) {
        query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
        console.error('获取通知列表失败:', error.message);
        throw error;
    }

    return (data || []).map(dbToNotification);
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

    if (error) {
        console.error('获取未读通知数量失败:', error.message);
        return 0;
    }

    return count || 0;
}

/**
 * 标记通知为已读
 * @param notificationId 通知ID
 */
export async function markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

    if (error) {
        console.error('标记通知为已读失败:', error.message);
        throw error;
    }
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq('is_read', false);

    if (error) {
        console.error('标记所有通知为已读失败:', error.message);
        throw error;
    }
}

/**
 * 创建通知（管理员功能）
 * @param targetUserId 目标用户ID
 * @param title 标题
 * @param content 内容
 * @param type 类型
 * @param referenceId 关联ID
 */
export async function createNotification(
    targetUserId: string,
    title: string,
    content: string,
    type: NotificationType = 'custom',
    referenceId?: string
): Promise<Notification> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('用户未登录');
    }

    const { data, error } = await supabase
        .from('user_notifications')
        .insert({
            user_id: targetUserId,
            sender_id: user.id,
            title,
            content,
            type,
            reference_id: referenceId || null,
        })
        .select()
        .single();

    if (error) {
        console.error('创建通知失败:', error.message);
        throw error;
    }

    return dbToNotification(data);
}

/**
 * 删除通知
 * @param notificationId 通知ID
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('删除通知失败:', error.message);
        throw error;
    }
}

/**
 * 订阅通知变化（实时更新）
 * @param callback 回调函数
 */
export function subscribeToNotifications(callback: () => void) {
    // Get current user synchronously from session
    const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id;
    };

    let subscription: any = null;

    // Set up subscription asynchronously
    getUserId().then(userId => {
        if (!userId) return;

        subscription = supabase
            .channel('user_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    callback();
                }
            )
            .subscribe();
    });

    return () => {
        if (subscription) {
            subscription.unsubscribe();
        }
    };
}
