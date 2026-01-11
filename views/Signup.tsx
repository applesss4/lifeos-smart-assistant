import React, { useState } from 'react';
import { SignupForm } from '../components/SignupForm';
import { useAuth } from '../src/contexts/AuthContext';
import { SignupFormData } from '../src/types/auth';
import { handleAuthError } from '../src/utils/authErrors';
import { useToast } from '../src/hooks/useToast';
import { ToastContainer } from '../src/components/ToastContainer';
import { Message } from '../src/components/UIFeedback';
import './Signup.css';

interface SignupProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export default function Signup({ onSuccess, onNavigateToLogin }: SignupProps) {
  const { signUp, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toast = useToast();

  const handleSignup = async (formData: SignupFormData) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // 调用 AuthContext 的 signUp 方法
      const response = await signUp(formData.email, formData.password);

      if (response.error) {
        // 处理注册错误
        const errorInfo = handleAuthError(response.error);
        setError(errorInfo.message);
        toast.error(errorInfo.message);
        return;
      }

      // 注册成功
      if (response.user) {
        // 检查是否需要邮箱验证
        if (response.user.email_confirmed_at) {
          // 邮箱已验证，直接登录成功
          const message = '注册成功！正在跳转...';
          setSuccessMessage(message);
          toast.success(message);
          setTimeout(() => {
            onSuccess?.();
          }, 1500);
        } else {
          // 需要邮箱验证
          const message = '注册成功！我们已向您的邮箱发送了验证链接，请查收邮件并完成验证。';
          setSuccessMessage(message);
          toast.success(message, 5000);
        }
      }
    } catch (err) {
      const errorInfo = handleAuthError(err as Error);
      setError(errorInfo.message);
      toast.error(errorInfo.message);
    }
  };

  return (
    <div className="signup-view">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {successMessage ? (
        <div className="success-container">
          <div className="success-card animate-scale-in">
            <div className="success-icon">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <h2>注册成功！</h2>
            <Message type="success" message={successMessage} className="mb-6" />
            {onNavigateToLogin && (
              <button onClick={onNavigateToLogin} className="login-button">
                返回登录
              </button>
            )}
          </div>
        </div>
      ) : (
        <SignupForm 
          onSubmit={handleSignup} 
          loading={loading} 
          error={error}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}
    </div>
  );
}
