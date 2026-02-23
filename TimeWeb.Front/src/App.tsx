import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { LayoutPage } from './pages/LayoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';

// ─────────────────────────────────────────────────────────────────────────────
// Компонент для защиты приватных маршрутов (требует авторизации)
// ─────────────────────────────────────────────────────────────────────────────
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
          <div className="spinner" />
          <div style={{ 
            marginTop: '16px', 
            color: '#666', 
            fontSize: '14px',
            fontWeight: 500
          }}>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// Компонент для публичных маршрутов (редиректит если уже авторизован)
// ─────────────────────────────────────────────────────────────────────────────
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
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
          <div className="spinner" />
          <div style={{ 
            marginTop: '16px', 
            color: '#666', 
            fontSize: '14px',
            fontWeight: 500
          }}>
            Загрузка...
          </div>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// Главный компонент приложения
// ─────────────────────────────────────────────────────────────────────────────
export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ──────────────────────────────────────────────────────────────────
              Публичные маршруты (доступны только неавторизованным)
              ────────────────────────────────────────────────────────────────── */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/sign-up" 
            element={
              <PublicRoute>
                <SignUpPage />
              </PublicRoute>
            } 
          />
          
          {/* ──────────────────────────────────────────────────────────────────
              Защищенные маршруты (требуют авторизации)
              ────────────────────────────────────────────────────────────────── */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <LayoutPage />
              </ProtectedRoute>
            }
          >
            {/* Дочерние маршруты для LayoutPage (рендерятся в Outlet) */}
            <Route 
              index 
              element={<DashboardPage />} 
            />
            <Route 
              path="events" 
              element={<EventsPage />} 
            />
          </Route>
          
          {/* ──────────────────────────────────────────────────────────────────
              Обработка несуществующих маршрутов (404)
              ────────────────────────────────────────────────────────────────── */}
          <Route 
            path="*" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;