import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { LayoutPage } from './pages/LayoutPage';
import { CabinetPage } from './pages/CabinetPage';
import { EventsPage } from './pages/EventsPage';

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
    return <Navigate to="/sign-in" replace />;
  }
  
  return children;
};

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
    return <Navigate to="/cabinet" replace />;
  }
  
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Публичные маршруты */}
          <Route 
            path="/sign-in" 
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
          
          {/* Защищённые маршруты с общим Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <LayoutPage />
              </ProtectedRoute>
            }
          >
            <Route 
              path="cabinet" 
              element={<CabinetPage />} 
            />
            <Route 
              path="events" 
              element={<EventsPage />} 
            />
          </Route>
          
          {/* 404 */}
          <Route 
            path="*" 
            element={<Navigate to="/cabinet" replace />} 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;