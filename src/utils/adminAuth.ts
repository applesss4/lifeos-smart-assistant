import { supabase } from '../lib/supabase';

/**
 * 管理员认证工具函数
 * 
 * 功能：
 * - 检查用户是否具有管理员权限
 * - 从数据库查询用户角色
 * 
 * 实现需求: 6.2, 6.3, 6.5
 */

/**
 * 检查当前用户是否为管理员
 * 
 * @returns Promise<boolean> - 如果用户是管理员返回 true，否则返回 false
 */
export async function isUserAdmin(): Promise<boolean> {
  try {
    // 获取当前用户会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ 无法获取用户会话');
      return false;
    }

    const userId = session.user.id;
    console.log('🔍 检查用户管理员权限:', session.user.email);

    // 查询用户角色表，检查是否有 admin 角色
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .limit(1);

    if (rolesError) {
      console.error('❌ 查询用户角色失败:', rolesError);
      return false;
    }

    const isAdmin = roles && roles.length > 0;
    
    if (isAdmin) {
      console.log('✅ 用户具有管理员权限');
    } else {
      console.log('⚠️ 用户不具有管理员权限');
    }

    return isAdmin;
  } catch (error) {
    console.error('❌ 检查管理员权限时发生错误:', error);
    return false;
  }
}

/**
 * 获取当前用户的所有角色
 * 
 * @returns Promise<string[]> - 用户角色列表
 */
export async function getUserRoles(): Promise<string[]> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return [];
    }

    const userId = session.user.id;

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('❌ 查询用户角色失败:', rolesError);
      return [];
    }

    return roles?.map(r => r.role) || [];
  } catch (error) {
    console.error('❌ 获取用户角色时发生错误:', error);
    return [];
  }
}
