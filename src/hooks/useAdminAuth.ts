import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isUserAdmin, getUserRoles } from '../utils/adminAuth';

/**
 * 管理员认证 Hook
 * 
 * 功能：
 * - 提供管理员认证状态
 * - 检查管理员权限
 * - 获取用户角色
 * 
 * 实现需求: 6.2, 6.3, 6.5
 */
export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setRoles([]);
        setIsCheckingAdmin(false);
        return;
      }

      setIsCheckingAdmin(true);
      
      try {
        const [adminStatus, userRoles] = await Promise.all([
          isUserAdmin(),
          getUserRoles()
        ]);
        
        setIsAdmin(adminStatus);
        setRoles(userRoles);
      } catch (error) {
        console.error('❌ 检查管理员权限失败:', error);
        setIsAdmin(false);
        setRoles([]);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return {
    isAdmin,
    roles,
    loading: authLoading || isCheckingAdmin,
    user
  };
}

/**
 * 检查用户是否具有特定角色
 */
export function useHasRole(role: string): boolean {
  const { roles } = useAdminAuth();
  return roles.includes(role);
}
