import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ApiError } from '../api/ApiError';
import { useNavigate, Link } from 'react-router-dom';
import { theme } from '../styles/theme';
import { usersClient } from '../api/users/UsersClient';
import { config } from '../config/env';
import type { 
  RecoverAccountRequest, 
  EndRecoverAccountRequest, 
  ResetPasswordRequest 
} from '../api/users/UsersContracts';
import ReCAPTCHA from 'react-google-recaptcha';

const captchaSiteKey = config.captchaSiteKey;

const getRecoveryErrorMessage = (statusCode: number, method: 'recover' | 'verify' | 'reset'): string => {
  switch (statusCode) {
    case 429:
      return method === 'recover' 
        ? 'Слишком много запросов. Пожалуйста, подождите несколько минут и попробуйте снова.'
        : 'Превышено количество попыток. Попробуйте позже.';
    
    case 400:
      if (method === 'recover') return 'Некорректный email или ошибка валидации. Проверьте данные и попробуйте снова.';
      if (method === 'verify') return 'Ошибка валидации кода. Проверьте данные и попробуйте снова.';
      return 'Ошибка валидации данных. Проверьте введённые значения.';
    
    case 403:
      if (method === 'verify') return 'Неверный код подтверждения. Проверьте письмо или запросите новый код.';
      if (method === 'reset') return 'Ссылка для сброса пароля истекла. Запросите восстановление заново.';
      return 'Сессия истекла или код невалиден. Начните процесс восстановления заново.';
    
    case 404:
      return method === 'recover' 
        ? 'Аккаунт с таким email не найден. Проверьте адрес или зарегистрируйтесь.'
        : 'Ресурс не найден. Попробуйте начать процесс заново.';
    
    case 500:
      return 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.';
    case 502:
    case 503:
    case 504:
      return 'Сервер временно недоступен. Проверьте подключение и попробуйте позже.';
    
    default:
      return 'Произошла ошибка. Попробуйте снова.';
  }
};

// Простой хелпер для создания объекта ошибки
const createApiError = (message: string, statusCode: number): ApiError => ({
  errorCode: `HTTP_${statusCode}`,
  errorMessage: message,
  statusCode,
  details: undefined,
  traceId: undefined,
  timestamp: undefined,
  stackTrace: undefined,
  getFieldError: () => undefined,
  getFieldErrors: () => undefined,
});

const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8) {
    return 'Пароль должен содержать не менее 8 символов';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну заглавную букву';
  }
  if (!/[a-z]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну строчную букву';
  }
  if (!/[0-9]/.test(password)) {
    return 'Пароль должен содержать хотя бы одну цифру';
  }
  return null;
};

export const SignInPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, lastError, clearError, isSubmitting } = useAuth();
  const navigate = useNavigate();

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);
  const [recoveryError, setRecoveryError] = useState<ApiError | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // 🔐 reCAPTCHA state
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  const isAnySubmitting = isSubmitting || isRecoverySubmitting;

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (newPassword && passwordError) {
      setPasswordError(null);
    }
  }, [newPassword, passwordError]);

  // 🔐 Сброс капчи при смене шага восстановления
  useEffect(() => {
    if (recoveryStep !== 'email') {
      setCaptchaToken(null);
      captchaRef.current?.reset();
    }
  }, [recoveryStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
      navigate('/cabinet');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleRecoveryError = (error: any, method: 'recover' | 'verify' | 'reset') => {
    const statusCode = error?.status || error?.response?.status || error?.statusCode || 500;
    const message = getRecoveryErrorMessage(statusCode, method);
    setRecoveryError(createApiError(message, statusCode));
    
    if (statusCode === 429) {
      setResendTimer(180);
    }
    
    if (statusCode === 403 && method === 'reset') {
      setRecoveryStep('email');
      setVerificationId(null);
      setResetToken(null);
    }
    
    // 🔐 Сброс капчи при ошибке валидации
    if (statusCode === 400) {
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const handleRecoverAccount = async () => {
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      setRecoveryError(createApiError('Пожалуйста, введите корректный email-адрес', 400));
      return;
    }

    // 🔐 Валидация CAPTCHA
    if (!captchaToken) {
      setRecoveryError(createApiError('Пожалуйста, подтвердите, что вы не робот', 400));
      return;
    }

    setIsRecoverySubmitting(true);
    setRecoveryError(null);

    try {
      const request: RecoverAccountRequest = { 
        email: recoveryEmail,
        captchaToken
      };
      const response = await usersClient.recoverAccount(request);
      
      setVerificationId(response.verificationId);
      setRecoveryStep('code');
      setResendTimer(180);
      
      captchaRef.current?.reset();
      setCaptchaToken(null);
      
    } catch (err: any) {
      if (err?.statusCode === 400) {
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
      handleRecoveryError(err, 'recover');
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleEndRecoverAccount = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setRecoveryError(createApiError('Введите 6-значный код из письма', 400));
      return;
    }
    if (!verificationId) {
      setRecoveryError(createApiError('Сессия восстановления истекла. Начните заново.', 403));
      setRecoveryStep('email');
      return;
    }

    setIsRecoverySubmitting(true);
    setRecoveryError(null);

    try {
      const request: EndRecoverAccountRequest = {
        verificationId,
        confirmationCode: verificationCode
      };
      const response = await usersClient.endRecoverAccount(request);
      
      setResetToken(response.resetToken);
      setRecoveryStep('password');
    } catch (err: any) {
      handleRecoveryError(err, 'verify');
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }
    if (!resetToken) {
      setRecoveryError(createApiError('Сессия восстановления истекла. Начните заново.', 403));
      setRecoveryStep('email');
      return;
    }

    setIsRecoverySubmitting(true);
    setRecoveryError(null);
    setPasswordError(null);

    try {
      const request: ResetPasswordRequest = {
        resetToken,
        newPassword
      };
      await usersClient.resetPassword(request);
      
      setRecoveryStep('success');
    } catch (err: any) {
      handleRecoveryError(err, 'reset');
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    
    switch (recoveryStep) {
      case 'email':
        handleRecoverAccount();
        break;
      case 'code':
        handleEndRecoverAccount();
        break;
      case 'password':
        handleResetPassword();
        break;
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !recoveryEmail) return;
    
    if (!captchaToken) {
      setRecoveryError(createApiError('Пожалуйста, пройдите проверку безопасности', 400));
      return;
    }
    
    await handleRecoverAccount();
  };

  const toggleForm = () => {
    setShowRecovery(prev => !prev);
    clearError();
    resetRecoveryState();
  };

  const resetRecoveryState = useCallback(() => {
    setRecoveryStep('email');
    setRecoveryEmail('');
    setVerificationCode('');
    setVerificationId(null);
    setNewPassword('');
    setResetToken(null);
    setRecoveryError(null);
    setResendTimer(0);
    setPasswordError(null);
    setIsRecoverySubmitting(false);
    setCaptchaToken(null);
    captchaRef.current?.reset();
  }, []);

  const handleBackToLogin = () => {
    setShowRecovery(false);
    resetRecoveryState();
    clearError();
  };

  const hasFieldError = (field: string): boolean => {
    return !showRecovery && !!lastError?.details?.[field]?.[0];
  };

  const getFieldErrorMessage = (field: string): string | undefined => {
    return lastError?.details?.[field]?.[0];
  };

  const hasGlobalError = (): boolean => {
    return !showRecovery && !!lastError?.errorMessage && !lastError?.details;
  };

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
    padding: spacing.md,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    boxShadow: shadows.xl,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: '420px',
    animation: 'fadeIn 0.4s ease-out',
  };

  const titleStyle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.md,
  };

  const inputGroupStyle: React.CSSProperties = {
    marginBottom: spacing.lg,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.xs,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    transition: `all ${transitions.fast}`,
    boxSizing: 'border-box',
    opacity: isAnySubmitting ? 0.6 : 1,
  };

  // 🔧 ИСПРАВЛЕННЫЙ СТИЛЬ ДЛЯ ПОЛЯ ВВОДА КОДА
  const codeInputStyle: React.CSSProperties = {
    // Базовые стили (без width: 100% чтобы избежать конфликта)
    padding: `${spacing.sm} ${spacing.md}`,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.xl,
    transition: `all ${transitions.fast}`,
    boxSizing: 'border-box',
    opacity: isRecoverySubmitting ? 0.6 : 1,
    
    // Центрирование и форматирование кода
    textAlign: 'center' as const,
    letterSpacing: '12px',
    width: '200px', // Фиксированная ширина вместо maxWidth
    margin: '0 auto',
    display: 'block',
    
    // Компенсация letter-spacing для корректного отображения первого/последнего символа
    paddingLeft: '24px',
    paddingRight: '24px',
  };

  const errorStyle: React.CSSProperties = {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: isAnySubmitting ? colors.gray400 : colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: isAnySubmitting ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
    marginTop: spacing.lg,
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: colors.gray200,
    color: colors.gray700,
    marginTop: spacing.sm,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: typography.fontWeight.medium,
    transition: `color ${transitions.fast}`,
    cursor: 'pointer',
  };

  const messageBoxStyle: React.CSSProperties = {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    border: '1px solid',
  };

  const getPasswordStrength = (pwd: string): { width: string; color: string; label: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { width: '33%', color: colors.error, label: 'Слабый' };
    if (strength <= 4) return { width: '66%', color: colors.warning || '#f59e0b', label: 'Средний' };
    return { width: '100%', color: colors.success || '#22c55e', label: 'Надёжный' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.md,
          }}>
            <span style={{ fontSize: '28px' }}>
              {showRecovery 
                ? recoveryStep === 'success' ? '✅' 
                : recoveryStep === 'password' ? '🔑'
                : recoveryStep === 'code' ? '📬' 
                : '📧'
                : '🔐'}
            </span>
          </div>
          <h1 style={titleStyle}>
            {showRecovery 
              ? recoveryStep === 'success' ? 'Готово!'
              : recoveryStep === 'password' ? 'Новый пароль'
              : recoveryStep === 'code' ? 'Код подтверждения'
              : 'Восстановление пароля'
              : 'Вход в систему'}
          </h1>
          <p style={{ color: colors.gray500, fontSize: typography.fontSize.sm }}>
            {showRecovery
              ? recoveryStep === 'success'
                ? 'Пароль успешно изменён. Теперь вы можете войти.'
                : recoveryStep === 'password'
                  ? 'Придумайте надёжный пароль для вашего аккаунта'
                  : recoveryStep === 'code'
                    ? `Введите 6-значный код из письма на ${recoveryEmail}`
                    : 'Введите email, привязанный к вашему аккаунту'
              : 'Введите свои данные для продолжения'}
          </p>
        </div>

        {/* Глобальная ошибка авторизации */}
        {hasGlobalError() && (
          <div style={{
            ...messageBoxStyle,
            backgroundColor: colors.errorLight,
            color: colors.errorDark,
            borderColor: colors.error,
          }}>
            ⚠️ {lastError?.errorMessage}
          </div>
        )}

        {/* Ошибки восстановления */}
        {showRecovery && recoveryError?.errorMessage && (
          <div style={{
            ...messageBoxStyle,
            backgroundColor: colors.errorLight,
            color: colors.errorDark,
            borderColor: colors.error,
          }}>
            ⚠️ {recoveryError.errorMessage}
          </div>
        )}

        {/* Успешный сброс пароля */}
        {showRecovery && recoveryStep === 'success' && (
          <div style={{
            ...messageBoxStyle,
            backgroundColor: colors.successLight || '#dcfce7',
            color: colors.successDark || '#166534',
            borderColor: colors.success || '#22c55e',
          }}>
            ✅ Пароль успешно изменён!
          </div>
        )}

        {/* Форма */}
        <form onSubmit={showRecovery ? handleRecoverySubmit : handleSubmit}>
          {!showRecovery ? (
            // === ФОРМА ВХОДА ===
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isAnySubmitting}
                  style={inputStyle}
                  placeholder="Введите имя пользователя"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray300}
                />
                {hasFieldError('username') && (
                  <div style={errorStyle}>{getFieldErrorMessage('username')}</div>
                )}
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isAnySubmitting}
                  style={inputStyle}
                  placeholder="Введите пароль"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray300}
                />
                {hasFieldError('password') && (
                  <div style={errorStyle}>{getFieldErrorMessage('password')}</div>
                )}
                <div style={{ textAlign: 'right', marginTop: spacing.xs }}>
                  <span 
                    style={{ 
                      ...linkStyle, 
                      fontSize: typography.fontSize.xs,
                      display: 'inline-block',
                    }} 
                    onClick={toggleForm}
                  >
                    Забыли пароль?
                  </span>
                </div>
              </div>
            </>
          ) : recoveryStep === 'email' ? (
            // === ШАГ 1: Ввод email + CAPTCHA ===
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  disabled={isRecoverySubmitting}
                  style={inputStyle}
                  placeholder="example@mail.com"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray300}
                />
              </div>
              
              {/* 🔐 reCAPTCHA виджет */}
              <div style={{ 
                marginBottom: spacing.lg, 
                display: 'flex', 
                justifyContent: 'center',
                opacity: isRecoverySubmitting ? 0.6 : 1,
                pointerEvents: isRecoverySubmitting ? 'none' : 'auto'
              }}>
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={captchaSiteKey || ''}
                  onChange={setCaptchaToken}
                  onExpired={() => setCaptchaToken(null)}
                  onErrored={() => {
                    setRecoveryError(createApiError('Ошибка загрузки CAPTCHA. Обновите страницу.', 500));
                  }}
                  size="normal"
                  theme="light"
                  tabIndex={0}
                />
              </div>
              
              {/* Ошибка, если капча не пройдена */}
              {!captchaToken && recoveryError?.errorCode === 'CAPTCHA_REQUIRED' && (
                <div style={{ ...errorStyle, textAlign: 'center', marginBottom: spacing.sm }}>
                  ⚠️ Пожалуйста, подтвердите, что вы не робот
                </div>
              )}
            </>
          ) : recoveryStep === 'code' ? (
            // === ШАГ 2: Ввод кода — ИСПРАВЛЕННАЯ ВЕРСИЯ ===
            <div style={inputGroupStyle}>
              <label style={{ ...labelStyle, textAlign: 'center', display: 'block' }}>
                Код из письма
              </label>
              
              {/* Контейнер для идеального центрирования инпута */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                width: '100%',
                marginBottom: spacing.sm
              }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isRecoverySubmitting}
                  style={codeInputStyle}
                  placeholder="000000"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray300}
                  autoFocus
                />
              </div>
              
              <div style={{ textAlign: 'center', marginTop: spacing.sm }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.gray500 }}>
                  Не получили код?{' '}
                  {resendTimer > 0 ? (
                    <span style={{ color: colors.gray400 }}>
                      Отправить повторно через {Math.ceil(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <span 
                      style={{ ...linkStyle, fontSize: typography.fontSize.xs }}
                      onClick={handleResendCode}
                    >
                      Отправить повторно
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : recoveryStep === 'password' ? (
            // === ШАГ 3: Новый пароль ===
            <>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isRecoverySubmitting}
                  style={inputStyle}
                  placeholder="Придумайте пароль"
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.gray300}
                />
                {passwordError && <div style={errorStyle}>{passwordError}</div>}
                
                {/* Индикатор надёжности пароля */}
                {newPassword && (
                  <div style={{ marginTop: spacing.sm }}>
                    <div style={{ 
                      height: '4px', 
                      backgroundColor: colors.gray200, 
                      borderRadius: '2px',
                      overflow: 'hidden',
                      marginBottom: spacing.xs
                    }}>
                      <div style={{
                        height: '100%',
                        width: passwordStrength.width,
                        backgroundColor: passwordStrength.color,
                        transition: `width ${transitions.fast}, background-color ${transitions.fast}`
                      }} />
                    </div>
                    <span style={{ fontSize: typography.fontSize.xs, color: colors.gray500 }}>
                      Надёжность: <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                    </span>
                  </div>
                )}
              </div>
              
              {/* Требования к паролю */}
              <div style={{ 
                fontSize: typography.fontSize.xs, 
                color: colors.gray500, 
                marginBottom: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.gray50,
                borderRadius: borderRadius.md
              }}>
                <strong>Требования:</strong>
                <ul style={{ margin: `${spacing.xs} 0 0`, paddingLeft: spacing.lg }}>
                  <li>Минимум 8 символов</li>
                  <li>Заглавная и строчная буквы</li>
                  <li>Хотя бы одна цифра</li>
                </ul>
              </div>
            </>
          ) : null}

          {/* === КНОПКИ ДЕЙСТВИЙ === */}
          {showRecovery && recoveryStep === 'success' ? null : (
            <button
              type="submit"
              disabled={
                isAnySubmitting || 
                (showRecovery && recoveryStep === 'email' && !captchaToken) ||
                (showRecovery && recoveryStep === 'password' && !newPassword)
              }
              style={buttonStyle}
              onMouseOver={(e) => {
                if (!isAnySubmitting && recoveryStep !== 'success') {
                  e.currentTarget.style.backgroundColor = colors.primaryDark;
                }
              }}
              onMouseOut={(e) => {
                if (!isAnySubmitting && recoveryStep !== 'success') {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }
              }}
            >
              {isRecoverySubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTop: '2px solid white', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }} />
                  {recoveryStep === 'email' ? 'Проверка...' :
                   recoveryStep === 'code' ? 'Проверка...' :
                   'Сохранение...'}
                </span>
              ) : showRecovery ? (
                recoveryStep === 'email' ? 'Отправить код' :
                recoveryStep === 'code' ? 'Подтвердить' :
                recoveryStep === 'password' ? 'Сменить пароль' :
                'Вернуться ко входу'
              ) : (
                'Войти'
              )}
            </button>
          )}

          {/* Вторичная кнопка */}
          {showRecovery && recoveryStep !== 'success' && (
            <button
              type="button"
              onClick={recoveryStep === 'email' ? handleBackToLogin : () => setRecoveryStep('email')}
              disabled={isRecoverySubmitting}
              style={secondaryButtonStyle}
              onMouseOver={(e) => {
                if (!isRecoverySubmitting) {
                  e.currentTarget.style.backgroundColor = colors.gray300;
                }
              }}
              onMouseOut={(e) => {
                if (!isRecoverySubmitting) {
                  e.currentTarget.style.backgroundColor = colors.gray200;
                }
              }}
            >
              {recoveryStep === 'email' ? 'Назад ко входу' : 'Изменить email'}
            </button>
          )}

          {/* Кнопка после успешного сброса */}
          {showRecovery && recoveryStep === 'success' && (
            <button
              type="button"
              onClick={handleBackToLogin}
              style={{ ...buttonStyle, backgroundColor: colors.success }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.successDark}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.success}
            >
              Войти с новым паролем
            </button>
          )}
        </form>

        {/* 🔗 Ссылка на регистрацию */}
        {!showRecovery && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: spacing.xl, 
            color: colors.gray500, 
            fontSize: typography.fontSize.sm 
          }}>
            Нет аккаунта?{' '}
            <Link to="/sign-up" style={linkStyle}>
              Зарегистрироваться
            </Link>
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        /* Стили для reCAPTCHA iframe */
        .g-recaptcha > div {
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default SignInPage;