import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { theme } from '../styles/theme';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, lastError, clearError, isSubmitting } = useAuth();
  const navigate = useNavigate();

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

  const hasFieldError = (field: string) => {
    return lastError && typeof lastError.getFieldError === 'function' && lastError.getFieldError(field);
  };

  const hasGlobalError = () => {
    return lastError && lastError.errorMessage && !lastError.details;
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
    marginBottom: spacing.xl,
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
    opacity: isSubmitting ? 0.6 : 1,
  };

  const errorStyle: React.CSSProperties = {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: isSubmitting ? colors.gray400 : colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
    marginTop: spacing.lg,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: typography.fontWeight.medium,
    transition: `color ${transitions.fast}`,
  };

  const globalErrorStyle: React.CSSProperties = {
    backgroundColor: colors.errorLight,
    color: colors.errorDark,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.error}`,
  };

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
            <span style={{ fontSize: '28px' }}>🔐</span>
          </div>
          <h1 style={titleStyle}>Вход в систему</h1>
          <p style={{ color: colors.gray500, fontSize: typography.fontSize.sm }}>
            Введите свои данные для продолжения
          </p>
        </div>

        {hasGlobalError() && (
          <div style={globalErrorStyle}>
            ⚠️ {lastError?.errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              style={inputStyle}
              placeholder="Введите имя пользователя"
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.gray300}
            />
            {hasFieldError('username') && (
              <div style={errorStyle}>{lastError?.getFieldError('username')}</div>
            )}
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              style={inputStyle}
              placeholder="Введите пароль"
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.gray300}
            />
            {hasFieldError('password') && (
              <div style={errorStyle}>{lastError?.getFieldError('password')}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={buttonStyle}
            onMouseOver={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = colors.primaryDark;
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Вход...
              </span>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: spacing.xl, color: colors.gray500, fontSize: typography.fontSize.sm }}>
          Нет аккаунта?{' '}
          <Link to="/sign-up" style={linkStyle}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};