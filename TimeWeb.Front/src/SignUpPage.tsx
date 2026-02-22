import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const SignUpPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const { register, lastError, clearError, isSubmitting } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(name, password);
      alert('Регистрация успешна! Теперь войдите.');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const hasFieldError = (field: string) => {
    return lastError && typeof lastError.getFieldError === 'function' && lastError.getFieldError(field);
  };

  const hasGlobalError = () => {
    return lastError && lastError.errorMessage && !lastError.details;
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      width: '100%'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%',
        padding: '40px', 
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Регистрация</h2>
        
        {lastError && typeof lastError.getFieldError !== 'function' && (
          <div style={{ 
            color: 'white', 
            backgroundColor: '#dc3545', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            ⚠️ {lastError.errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Ваше имя</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={isSubmitting}
              style={{ 
                width: '100%', 
                padding: '10px', 
                boxSizing: 'border-box',
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'text'
              }}
            />
            {hasFieldError('name') && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                {lastError?.getFieldError('name')}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isSubmitting}
              style={{ 
                width: '100%', 
                padding: '10px', 
                boxSizing: 'border-box',
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'text'
              }}
            />
            {hasFieldError('password') && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                {lastError?.getFieldError('password')}
              </div>
            )}
          </div>

          {hasGlobalError() && (
            <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
              {lastError?.errorMessage}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: isSubmitting ? '#ccc' : '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Уже есть аккаунт? <a href="/" style={{ color: '#007bff' }}>Войти</a>
        </p>
      </div>
    </div>
  );
};