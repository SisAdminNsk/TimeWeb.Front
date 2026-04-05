import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersClient } from '../api/users/UsersClient';

export const KeepAlivePing = () => {
  const { executeWithAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let isTabVisible = !document.hidden;

    const sendPing = () => {
      if (isTabVisible) {
        executeWithAuth((token) => usersClient.ping(token)).catch(() => {
        });
      }
    };

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      
      if (isTabVisible) {
        sendPing();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(sendPing, 30000);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, executeWithAuth]);

  return null;
};