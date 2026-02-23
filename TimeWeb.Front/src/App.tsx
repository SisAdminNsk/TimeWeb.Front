import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { LayoutPage } from './LayoutPage'; // Импортируем Layout
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage'; // Импортируем Events

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f7fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#666', fontSize: '14px' }}>Загрузка...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          
          {/* Защищенные маршруты с Layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <LayoutPage />
              </ProtectedRoute>
            }
          >
            {/* Дочерние маршруты для LayoutPage (рендерятся в Outlet) */}
            <Route index element={<DashboardPage />} /> {/* По умолчанию /dashboard */}
            <Route path="events" element={<EventsPage />} /> {/* /dashboard/events */}
          </Route>
          
          {/* Редирект на dashboard если кто-то попытается зайти на корень уже авторизованным (опционально) */}
          {/* <Route path="/" element={<Navigate to="/dashboard" />} /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};