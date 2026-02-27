export const theme = {
  // Цветовая палитра
  colors: {
    // Основные
    primary: '#667eea',
    primaryDark: '#5a67d8',
    primaryLight: '#764ba2',
    
    // Нейтральные
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Семантические
    success: '#10b981',
    successLight: '#d1fae5',
    successDark: '#059669',
    
    error: '#ef4444',
    errorLight: '#fee2e2',
    errorDark: '#dc2626',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningDark: '#d97706',
    
    info: '#3b82f6',
    infoLight: '#dbeafe',
    infoDark: '#2563eb',
    
    // Sidebar
    sidebar: {
      bg: '#1e293b',
      bgDark: '#0f172a',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      hover: '#334155',
      active: '#667eea',
      border: '#334155',
    },
  },
  
  // Типографика
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Отступы и размеры
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  
  // Границы
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Тени
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Переходы
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },
};

// Helper функции для создания стилей
export const createStyles = () => {
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  
  return {
    // Карточка
    card: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.md,
      padding: spacing.lg,
    },
    
    // Кнопка первичная
    buttonPrimary: {
      backgroundColor: colors.primary,
      color: colors.white,
      border: 'none',
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    },
    
    // Кнопка вторичная
    buttonSecondary: {
      backgroundColor: 'transparent',
      color: colors.gray700,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      padding: `${spacing.sm} ${spacing.lg}`,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
    },
    
    // Input
    input: {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      border: `1px solid ${colors.gray300}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      transition: `all ${transitions.fast}`,
      boxSizing: 'border-box' as const,
    },
    
    // Label
    label: {
      display: 'block',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.gray700,
      marginBottom: spacing.xs,
    },
  };
};

export default theme;