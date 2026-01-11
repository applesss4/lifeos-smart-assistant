import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 获取当前用户的资料
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('获取用户资料失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取用户资料异常:', error);
    return null;
  }
}

/**
 * 获取所有用户列表 (仅管理员可用)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取用户列表失败:', error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      return [];
    }

    console.log('成功获取用户列表:', data?.length || 0, '个用户');
    return data || [];
  } catch (error) {
    console.error('获取用户列表异常:', error);
    return [];
  }
}

/**
 * 根据用户ID获取用户资料
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户资料失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('获取用户资料异常:', error);
    return null;
  }
}

/**
 * 更新用户名
 */
export async function updateUsername(username: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('用户未登录');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user.id);

    if (error) {
      console.error('更新用户名失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新用户名异常:', error);
    return false;
  }
}

/**
 * 更新头像 URL
 */
export async function updateAvatarUrl(avatarUrl: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('用户未登录');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    if (error) {
      console.error('更新头像失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新头像异常:', error);
    return false;
  }
}
