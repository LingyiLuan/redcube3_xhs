import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginButton = ({ className = '', children }) => {
  const { login, loading } = useAuth();

  const handleLogin = () => {
    console.log('LoginButton handleLogin called, loading:', loading);
    if (!loading) {
      console.log('Calling login function...');
      login();
    } else {
      console.log('Login skipped - still loading');
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`login-button ${className} ${loading ? 'loading' : ''}`}
      type="button"
    >
      {loading ? (
        <span className="loading-spinner">⏳</span>
      ) : (
        <>
          <span className="google-icon">🔐</span>
          {children || 'Login with Google'}
        </>
      )}
    </button>
  );
};

export default LoginButton;