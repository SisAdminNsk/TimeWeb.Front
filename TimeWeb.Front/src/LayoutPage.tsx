import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const LayoutPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Стили для ссылок меню
  const navItemStyle = (path: string) => ({
    display: 'block',
    padding: '12px 16px',
    color: location.pathname === path ? '#fff' : '#a0aec0',
    backgroundColor: location.pathname === path ? '#667eea' : 'transparent',
    borderRadius: '8px',
    textDecoration: 'none',
    marginBottom: '8px',
    transition: 'all 0.2s',
    fontWeight: 500,
    fontSize: '15px'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      
      {/* Боковое меню (Sidebar) */}
      <aside style={{
        width: '260px',
        backgroundColor: '#1a202c',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
      }}>
        {/* Логотип или название приложения */}
        <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>MyApp</h2>
          <div style={{ fontSize: '12px', color: '#718096' }}>Версия 1.0</div>
        </div>

        {/* Навигация */}
        <nav style={{ flex: 1 }}>
          <Link to="/dashboard" style={navItemStyle('/dashboard')}>
            👤 Личный кабинет
          </Link>
          <Link to="/dashboard/events" style={navItemStyle('/dashboard/events')}>
            📅 События
          </Link>
          {/* Можно добавить больше ссылок здесь */}
        </nav>

        {/* Профиль пользователя и кнопка выхода внизу */}
        <div style={{ 
          borderTop: '1px solid #2d3748', 
          paddingTop: '20px',
          marginTop: 'auto'
        }}>
          <div style={{ marginBottom: '15px', paddingLeft: '10px' }}>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: 600 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              Онлайн
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #e53e3e',
              color: '#fc8181',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e53e3e';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#fc8181';
            }}
          >
            Выйти из аккаунта
          </button>
        </div>
      </aside>

      {/* Основной контент (справа от меню) */}
      <main style={{
        marginLeft: '260px', // Отступ равен ширине меню
        width: 'calc(100% - 260px)',
        padding: '30px',
        minHeight: '100vh'
      }}>
        {/* Здесь будут рендериться дочерние страницы (Dashboard, Events) */}
        <Outlet />
      </main>
    </div>
  );
};