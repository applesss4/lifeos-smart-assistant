import React, { useState } from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { AuthError } from '@supabase/supabase-js';
import { ButtonLoading, Message } from '../../../src/components/UIFeedback';

/**
 * 管理员登录界面
 * 
 * 功能：
 * - 提供专门的管理员登录表单
 * - 验证管理员权限
 * - 处理登录错误和反馈
 * 
 * 实现需求: 6.1, 6.2
 */
const AdminLoginView: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 验证输入
      if (!email.trim() || !password) {
        setError('请输入邮箱和密码');
        setIsSubmitting(false);
        return;
      }

      // 尝试登录
      const response = await signIn(email, password);

      if (response.error) {
        // 处理登录错误
        handleLoginError(response.error);
        setIsSubmitting(false);
        return;
      }

      // 登录成功后，AdminProtectedRoute 会验证管理员权限
      // 如果不是管理员，会显示权限不足的消息
      console.log('✅ 管理员登录成功');
    } catch (err) {
      console.error('❌ 管理员登录失败:', err);
      setError('登录过程中发生错误，请稍后重试');
      setIsSubmitting(false);
    }
  };

  const handleLoginError = (authError: AuthError) => {
    switch (authError.message) {
      case 'Invalid login credentials':
        setError('邮箱或密码错误，请检查后重试');
        break;
      case 'Email not confirmed':
        setError('邮箱尚未验证，请检查您的邮箱');
        break;
      default:
        setError(authError.message || '登录失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#111418] dark:to-[#1c2127] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary rounded-2xl mb-3 sm:mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-2xl sm:text-3xl">shield_person</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            LifeOS <span className="text-primary">Admin</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
            管理后台登录
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-[#1c2127] rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <Message 
                type="error" 
                message={error} 
                onClose={() => setError(null)}
              />
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                管理员邮箱
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg sm:text-xl">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all touch-manipulation"
                  disabled={isSubmitting || loading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg sm:text-xl">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all touch-manipulation"
                  disabled={isSubmitting || loading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full py-3 sm:py-3.5 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
            >
              <ButtonLoading loading={isSubmitting || loading} loadingText="登录中...">
                <>
                  <span className="material-symbols-outlined text-lg sm:text-xl">login</span>
                  <span>管理员登录</span>
                </>
              </ButtonLoading>
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-start gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-sm flex-shrink-0">info</span>
              <p className="leading-relaxed">
                此登录界面仅供管理员使用。登录后系统将验证您的管理员权限。
                如果您不是管理员，请使用普通用户登录界面。
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-4 sm:mt-6">
          <a
            href="/"
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1 touch-manipulation py-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>返回用户登录</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;
