import React, { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../src/contexts/AuthContext';
import { LoginFormData } from '../src/types/auth';
import { handleAuthError } from '../src/utils/authErrors';
import { useToast } from '../src/hooks/useToast';
import { ToastContainer } from '../src/components/ToastContainer';

interface LoginProps {
  onSuccess?: () => void;
  onNavigateToSignup?: () => void;
}

export default function Login({ onSuccess, onNavigateToSignup }: LoginProps) {
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleLogin = async (formData: LoginFormData) => {
    try {
      setError(null);

      // 调用 AuthContext 的 signIn 方法，传递 rememberMe 参数
      const response = await signIn(formData.email, formData.password, formData.rememberMe);

      if (response.error) {
        // 处理登录错误
        const errorInfo = handleAuthError(response.error);
        setError(errorInfo.message);
        toast.error(errorInfo.message);
        return;
      }

      // 登录成功
      if (response.user) {
        console.log('登录成功:', response.user.email);
        toast.success('登录成功！正在跳转...');
        
        // 延迟跳转以显示成功消息
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      }
    } catch (err) {
      const errorInfo = handleAuthError(err as Error);
      setError(errorInfo.message);
      toast.error(errorInfo.message);
    }
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      <LoginForm
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        onNavigateToSignup={onNavigateToSignup}
      />
    </>
  );
}
