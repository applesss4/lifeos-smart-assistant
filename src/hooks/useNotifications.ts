import { useState, useEffect, useCallback } from 'react';
import * as notificationService from '../services/notificationService';
import type { Notification } from '../services/notificationService';

/**
 * 通知管理 Hook
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // 加载通知列表
    const loadNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const [notifs, count] = await Promise.all([
                notificationService.getNotifications(50, 0),
                notificationService.getUnreadCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error('加载通知失败:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 标记为已读
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('标记通知为已读失败:', error);
            throw error;
        }
    }, []);

    // 标记所有为已读
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('标记所有通知为已读失败:', error);
            throw error;
        }
    }, []);

    // 删除通知
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            // 如果删除的是未读通知，更新未读数量
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && !notification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('删除通知失败:', error);
            throw error;
        }
    }, [notifications]);

    // 初始加载
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // 订阅实时更新
    useEffect(() => {
        const unsubscribe = notificationService.subscribeToNotifications(() => {
            loadNotifications();
        });

        return () => {
            unsubscribe();
        };
    }, [loadNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}
