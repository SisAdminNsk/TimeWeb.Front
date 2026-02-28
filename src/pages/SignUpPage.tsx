import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { theme } from '../styles/theme';

export const SignUpPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const { register, lastError, clearError, isSubmitting } = useAuth();
  const navigate = useNavigate();

  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;

  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessNotification(null);
    try {
      await register(name, password);
      setSuccessNotification('✓ Регистрация успешна! Теперь вы можете войти.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const hasFieldError = (field: string) => {
    return lastError && typeof lastError.getFieldError === 'function' && lastError.getFieldError(field);
  };

  const hasGlobalError = () => {
    return lastError && lastError.errorMessage && !lastError.details;
  };

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
    boxSizing: 'border-box' as const,
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
    backgroundColor: isSubmitting ? colors.gray400 : colors.success,
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

  const successNotificationStyle: React.CSSProperties = {
    backgroundColor: colors.successLight,
    color: colors.successDark,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    border: `1px solid ${colors.success}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    animation: 'slideIn 0.3s ease-out',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.md,
          }}>
            <span style={{ fontSize: '28px' }}>👤</span>
          </div>
          <h1 style={titleStyle}>Регистрация</h1>
          <p style={{ color: colors.gray500, fontSize: typography.fontSize.sm }}>
            Создайте аккаунт для начала работы
          </p>
        </div>

        {hasGlobalError() && (
          <div style={globalErrorStyle}>
            ⚠️ {lastError?.errorMessage}
          </div>
        )}

        {successNotification && (
          <div style={successNotificationStyle}>
            <span>{successNotification}</span>
            <button
              onClick={() => setSuccessNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: typography.fontSize.lg,
                padding: '0 4px',
                outline: 'none',
                opacity: 0.7,
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Ваше имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting || successNotification !== null}
              style={inputStyle}
              placeholder="Введите имя"
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.gray300}
            />
            {hasFieldError('name') && (
              <div style={errorStyle}>{lastError?.getFieldError('name')}</div>
            )}
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || successNotification !== null}
              style={inputStyle}
              placeholder="Придумайте пароль"
              onFocus={(e) => e.target.style.borderColor = colors.primary}
              onBlur={(e) => e.target.style.borderColor = colors.gray300}
            />
            {hasFieldError('password') && (
              <div style={errorStyle}>{lastError?.getFieldError('password')}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || successNotification !== null}
            style={buttonStyle}
            onMouseOver={(e) => {
              if (!isSubmitting && !successNotification) e.currentTarget.style.backgroundColor = colors.successDark;
            }}
            onMouseOut={(e) => {
              if (!isSubmitting && !successNotification) e.currentTarget.style.backgroundColor = colors.success;
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderStyle: 'solid', borderColor: `${colors.white} ${colors.white} transparent transparent`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Регистрация...
              </span>
            ) : successNotification ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>✓</span>
                Перенаправление...
              </span>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: spacing.xl, color: colors.gray500, fontSize: typography.fontSize.sm }}>
          Уже есть аккаунт?{' '}
          <Link to="/sign-in" style={linkStyle}>
            Войти
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignUpPage;