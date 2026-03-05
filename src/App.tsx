import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CabinetProvider } from './context/CabinetContext';
import { FriendsProvider } from './context/FriendsContext';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { LayoutPage } from './pages/LayoutPage';
import { CabinetPage } from './pages/CabinetPage';
import { EventsPage } from './pages/EventsPage';
import { FriendsPage } from './pages/FriendsPage';

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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route 
            path="/sign-in" 
            element={
              <PublicRoute>
                <SignInPage />
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
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <LayoutPage />
              </ProtectedRoute>
            }
          >
            <Route 
              index 
              element={<Navigate to="/cabinet" replace />} 
            />
            <Route 
              path="cabinet" 
              element={
                <CabinetProvider>
                  <CabinetPage />
                </CabinetProvider>
              } 
            />
            <Route 
              path="events" 
              element={<EventsPage />} 
            />
            <Route 
              path="friends" 
              element={
                <FriendsProvider>
                  <FriendsPage />
                </FriendsProvider>
              } 
            />
          </Route>
          
          <Route 
            path="*" 
            element={<Navigate to="/cabinet" replace />} 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;