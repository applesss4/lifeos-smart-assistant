import React, { useState } from 'react';
import { LoginFormData } from '../src/types/auth';
import { validateEmail, validatePassword, ValidationError } from '../src/utils/authErrors';
import { ButtonLoading } from '../src/components/UIFeedback';
import './LoginForm.css';

interface LoginFormProps {
  onSubmit: (formData: LoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onNavigateToSignup?: () => void;
}

export function LoginForm({ onSubmit, loading = false, error, onNavigateToSignup }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 实时验证函数
  const validateField = (field: keyof LoginFormData, value: string): ValidationError | null => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return null;
    }
  };

  // 验证所有字段
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors[emailError.field] = emailError.message;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) errors[passwordError.field] = passwordError.message;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 如果字段已经被触摸过，进行实时验证
    if (touched[field] && typeof value === 'string') {
      const error = validateField(field as 'email' | 'password', value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error ? error.message : ''
      }));
    }
  };

  // 处理字段失焦
  const handleBlur = (field: keyof LoginFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (typeof formData[field] === 'string') {
      const error = validateField(field as 'email' | 'password', formData[field] as string);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error ? error.message : ''
      }));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 标记所有字段为已触摸
    setTouched({
      email: true,
      password: true
    });
    
    // 验证所有字段
    if (!validateAllFields()) {
      return;
    }
    
    await onSubmit(formData);
  };

  // 检查表单是否有效
  const isFormValid = () => {
    return formData.email && 
           formData.password &&
           Object.values(validationErrors).every(error => !error);
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2>欢迎回来</h2>
          <p>登录智能生活管家，继续管理您的生活</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* 全局错误消息 */}
          {error && (
            <div className="error-message global-error">
              {error}
            </div>
          )}

          {/* 邮箱字段 */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              邮箱地址 *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="请输入您的邮箱地址"
              disabled={loading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <div className="error-message field-error">
                {validationErrors.email}
              </div>
            )}
          </div>

          {/* 密码字段 */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              密码 *
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="请输入密码"
              disabled={loading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <div className="error-message field-error">
                {validationErrors.password}
              </div>
            )}
          </div>

          {/* 记住我选项 */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                disabled={loading}
              />
              <span>记住我</span>
            </label>
            <a href="/forgot-password" className="forgot-password-link">
              忘记密码？
            </a>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            className={`submit-button ${!isFormValid() || loading ? 'disabled' : ''}`}
            disabled={!isFormValid() || loading}
          >
            <ButtonLoading loading={loading} loadingText="登录中...">
              登录
            </ButtonLoading>
          </button>

          {/* 注册链接 */}
          <div className="form-footer">
            <p>
              还没有账户？
              {onNavigateToSignup ? (
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="link-button"
                  disabled={loading}
                >
                  立即注册
                </button>
              ) : (
                <a href="/signup" className="link">
                  立即注册
                </a>
              )}
            </p>
          </div>
        </form>
      </div>


    </div>
  );
}
