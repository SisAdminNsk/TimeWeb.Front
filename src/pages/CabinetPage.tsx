import { useState, useEffect } from 'react';
import { useCabinet } from '../context/CabinetContext';
import { FriendsProvider } from '../context/FriendsContext';
import { FriendsWidget } from '../components/FriendsWidget';
import { theme } from '../styles/theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return false;
  return emailRegex.test(email.trim());
};

export const CabinetPage = () => {
  const { userData, isLoading, updateUserData } = useCabinet();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    birthDate: '',
    gender: '',
  });
  const [emailError, setEmailError] = useState<string>('');
  const [isEmailTouched, setIsEmailTouched] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
      setEmailError('');
      setIsEmailTouched(false);
    }
  }, [userData]);

  useEffect(() => {
    if (isEmailTouched && formData.email) {
      if (!isValidEmail(formData.email)) {
        setEmailError('Введите корректный email адрес');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [formData.email, isEmailTouched]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 80px)' 
      }}>
        <div className="spinner" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleEditClick = () => {
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
    }
    setIsEditing(true);
    setEmailError('');
    setIsEmailTouched(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
    }
    setEmailError('');
    setIsEmailTouched(false);
  };

  const handleSaveClick = async () => {
    if (!isValidEmail(formData.email)) {
      setEmailError('Введите корректный email адрес');
      setIsEmailTouched(true);
      return;
    }

    await updateUserData(formData);
    setIsEditing(false);
    setEmailError('');
    setIsEmailTouched(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email' && !isEmailTouched) {
      setIsEmailTouched(true);
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    if (formData.email && !isValidEmail(formData.email)) {
      setEmailError('Введите корректный email адрес');
    }
  };

  const isSaveDisabled = isEditing && (!isValidEmail(formData.email) || emailError !== '');

  const containerStyle: React.CSSProperties = {
    animation: 'fadeIn 0.4s ease-out',
    minHeight: 'calc(100vh - 80px)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: spacing.lg,
    alignItems: 'start',
    minHeight: 'calc(100vh - 200px)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    boxShadow: shadows.md,
    animation: 'fadeIn 0.5s ease-out',
    transition: `box-shadow ${transitions.normal}`,
  };

  const cardTitleStyle: React.CSSProperties = {
    margin: `0 0 ${spacing.lg} 0`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.gray200}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const infoItemStyle: React.CSSProperties = {
    marginBottom: spacing.md,
  };

  const infoLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: typography.fontWeight.semibold,
  };

  const fieldStyle: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray300}`,
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
    margin: 0,
    lineHeight: 1.5,
    fontFamily: typography.fontFamily,
    backgroundColor: colors.white,
    cursor: 'default',
    opacity: 1,
    WebkitTextFillColor: colors.gray900,
    outline: 'none',
    userSelect: 'none',
    transition: `all ${transitions.fast}`,
  };

  const fieldDisabledStyle: React.CSSProperties = {
    ...fieldStyle,
    backgroundColor: colors.gray50,
    color: colors.gray500,
    opacity: 0.7,
  };

  const fieldErrorStyle: React.CSSProperties = {
    ...fieldStyle,
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  };

  const selectStyle: React.CSSProperties = {
    ...fieldStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${colors.gray500}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    outline: 'none',
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTop: `1px solid ${colors.gray200}`,
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    backgroundColor: colors.gray300,
    cursor: 'not-allowed',
    opacity: 0.6,
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.sm,
    backgroundColor: 'transparent',
    color: colors.gray700,
    border: `1px solid ${colors.gray300}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: `all ${transitions.normal}`,
  };

  const widgetContainerStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.5s ease-out 0.1s backwards',
  };

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Мои данные</h2>

          <div style={infoItemStyle}>
            <label style={infoLabelStyle}>Имя пользователя</label>
            <div style={isEditing ? fieldDisabledStyle : fieldStyle}>
              {userData?.name || 'Не указано'}
            </div>
          </div>

          <div style={infoItemStyle}>
            <label style={infoLabelStyle}>Email</label>
            <input
              type="email"
              name="email"
              value={isEditing ? formData.email : (userData?.email || 'Не указан')}
              onChange={handleInputChange}
              onBlur={handleEmailBlur}
              readOnly={!isEditing}
              placeholder="example@mail.com"
              style={isEditing && emailError ? fieldErrorStyle : fieldStyle}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.borderColor = emailError ? colors.error : colors.primary;
              }}
              disabled={!isEditing}
            />
            {isEditing && emailError && (
              <div style={errorTextStyle}>
                {emailError}
              </div>
            )}
          </div>

          <div style={infoItemStyle}>
            <label style={infoLabelStyle}>Дата рождения</label>
            {isEditing ? (
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                style={fieldStyle}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.gray300;
                }}
              />
            ) : (
              <div style={fieldStyle}>
                {formatDate(userData?.birthDate || '')}
              </div>
            )}
          </div>

          <div style={infoItemStyle}>
            <label style={infoLabelStyle}>Пол</label>
            {isEditing ? (
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={selectStyle}
                onFocus={(e) => {
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.gray300;
                }}
              >
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            ) : (
              <div style={fieldStyle}>
                {userData?.gender === 'male' ? 'Мужской' : 
                 userData?.gender === 'female' ? 'Женский' : 'Не указан'}
              </div>
            )}
          </div>

          <div style={infoItemStyle}>
            <label style={infoLabelStyle}>Дата регистрации</label>
            <div style={isEditing ? fieldDisabledStyle : fieldStyle}>
              {formatDate(userData?.registrationDate || '')}
            </div>
          </div>

          <div style={buttonGroupStyle}>
            {isEditing ? (
              <>
                <button 
                  onClick={handleSaveClick}
                  disabled={isSaveDisabled}
                  style={isSaveDisabled ? buttonDisabledStyle : buttonPrimaryStyle}
                  onMouseEnter={(e) => {
                    if (!isSaveDisabled) {
                      e.currentTarget.style.backgroundColor = colors.primaryDark;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaveDisabled) {
                      e.currentTarget.style.backgroundColor = colors.primary;
                    }
                  }}
                >
                  Сохранить
                </button>
                <button 
                  onClick={handleCancelClick}
                  style={buttonSecondaryStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.gray100;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Отмена
                </button>
              </>
            ) : (
              <button 
                onClick={handleEditClick}
                style={buttonPrimaryStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                }}
              >
                Редактировать
              </button>
            )}
          </div>
        </div>

        <div style={widgetContainerStyle}>
          <FriendsProvider>
            <FriendsWidget />
          </FriendsProvider>
        </div>
      </div>
    </div>
  );
};

export default CabinetPage;