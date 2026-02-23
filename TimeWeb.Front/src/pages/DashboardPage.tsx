import { useAuth } from '../AuthContext';
import { FriendsProvider } from '../FriendsContext';
import { FriendsWidget } from '../FriendsWidget';

export const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      {/* Заголовок внутри контента (опционально, можно убрать совсем) */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
          Личный кабинет
        </h1>
        <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
          Добро пожаловать, <strong>{user.name}</strong>!
        </p>
      </div>

      {/* Основной контент с виджетом */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Левая колонка - основная информация */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          minHeight: '400px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
            Информация о профиле
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Имя пользователя
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                {user.name}
              </div>
            </div>
            
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Токен авторизации
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontFamily: 'monospace', 
                color: '#666',
                wordBreak: 'break-all'
              }}>
                {user.token.substring(0, 50)}...
              </div>
            </div>
            
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '6px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '4px' }}>
                Статус аккаунта
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#2e7d32' }}>
                Активен
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка - виджет друзей */}
        <FriendsProvider>
          <FriendsWidget />
        </FriendsProvider>
      </div>
    </div>
  );
};