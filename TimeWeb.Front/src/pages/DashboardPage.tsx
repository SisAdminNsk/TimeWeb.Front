import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null; // Или редирект через ProtectedRoute

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #4CAF50' }}>
      <h2>Личный кабинет</h2>
      <p>Добро пожаловать, <strong>{user.name}</strong>!</p>
      <p>Ваш токен (начало): <code>{user.token.substring(0, 20)}...</code></p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none' }}>
          Выйти
        </button>
      </div>
    </div>
  );
};