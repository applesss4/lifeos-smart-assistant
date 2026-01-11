import React, { useState } from 'react';
import { SignupFormData } from '../src/types/auth';
import { validateEmail, validatePassword, validatePasswordConfirmation, ValidationError } from '../src/utils/authErrors';
import { ButtonLoading } from '../src/components/UIFeedback';
import './SignupForm.css';

interface SignupFormProps {
  onSubmit: (formData: SignupFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onNavigateToLogin?: () => void;
}

export function SignupForm({ onSubmit, loading = false, error, onNavigateToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 实时验证函数
  const validateField = (field: keyof SignupFormData, value: string): ValidationError | null => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validatePasswordConfirmation(formData.password, value);
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
    
    const confirmPasswordError = validatePasswordConfirmation(formData.password, formData.confirmPassword);
    if (confirmPasswordError) errors[confirmPasswordError.field] = confirmPasswordError.message;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 如果字段已经被触摸过，进行实时验证
    if (touched[field]) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error ? error.message : ''
      }));
      
      // 特殊处理确认密码字段，当密码改变时也要重新验证确认密码
      if (field === 'password' && touched.confirmPassword) {
        const confirmError = validatePasswordConfirmation(value, formData.confirmPassword);
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: confirmError ? confirmError.message : ''
        }));
      }
    }
  };

  // 处理字段失焦
  const handleBlur = (field: keyof SignupFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const error = validateField(field, formData[field]);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error ? error.message : ''
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 标记所有字段为已触摸
    setTouched({
      email: true,
      password: true,
      confirmPassword: true
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
           formData.confirmPassword &&
           Object.values(validationErrors).every(error => !error);
  };

  return (
    <div className="signup-form-container">
      <div className="signup-form-card">
        <div className="signup-form-header">
          <h2>创建账户</h2>
          <p>注册智能生活管家，开始管理您的生活</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
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
              placeholder="请输入密码（至少8个字符）"
              disabled={loading}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <div className="error-message field-error">
                {validationErrors.password}
              </div>
            )}
            <div className="password-requirements">
              <small>密码要求：至少8个字符，包含字母和数字</small>
            </div>
          </div>

          {/* 确认密码字段 */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              确认密码 *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
              placeholder="请再次输入密码"
              disabled={loading}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <div className="error-message field-error">
                {validationErrors.confirmPassword}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            className={`submit-button ${!isFormValid() || loading ? 'disabled' : ''}`}
            disabled={!isFormValid() || loading}
          >
            <ButtonLoading loading={loading} loadingText="注册中...">
              创建账户
            </ButtonLoading>
          </button>

          {/* 登录链接 */}
          <div className="form-footer">
            <p>
              已有账户？
              {onNavigateToLogin ? (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="link-button"
                  disabled={loading}
                >
                  立即登录
                </button>
              ) : (
                <a href="/login" className="link">
                  立即登录
                </a>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}