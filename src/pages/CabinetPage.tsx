import { useState, useEffect } from 'react';
import { useCabinet } from '../context/CabinetContext';
import { FriendsProvider } from '../context/FriendsContext';
import { FriendsWidget } from '../components/FriendsWidget';
import { theme } from '../styles/theme';

export const CabinetPage = () => {
  const { userData, isLoading, updateUserData } = useCabinet();
  const { colors, typography, spacing, borderRadius, shadows, transitions } = theme;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    birthDate: '',
    gender: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        email: userData.email || '',
        birthDate: userData.birthDate || '',
        gender: userData.gender || '',
      });
    }
  }, [userData]);

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
  };

  const handleSaveClick = async () => {
    await updateUserData(formData);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray200}`,
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
    margin: 0,
    lineHeight: 1.5,
    fontFamily: 'inherit',
    backgroundColor: colors.white,
    cursor: 'default',
    opacity: 1,
    WebkitTextFillColor: colors.gray900,
    outline: 'none',
    userSelect: 'none',
    transition: `all ${transitions.normal}`,
  };

  const fieldDisabledStyle: React.CSSProperties = {
    ...fieldStyle,
    backgroundColor: colors.gray50,
    color: colors.gray500,
    opacity: 0.7,
  };

  const selectStyle: React.CSSProperties = {
    ...fieldStyle,
    cursor: 'default',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${colors.gray500}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    outline: 'none',
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
              readOnly={!isEditing}
              placeholder="example@mail.com"
              style={fieldStyle}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.borderColor = colors.gray200;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.gray200;
              }}
            />
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
                  e.currentTarget.style.borderColor = colors.gray200;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.gray200;
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
                  e.currentTarget.style.borderColor = colors.gray200;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.gray200;
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
                  style={buttonPrimaryStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
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