import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginButton from './LoginButton';
import UserProfile from './UserProfile';

const AuthButton = ({ className = '', showUserDropdown = true }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className={`auth-button loading ${className}`}>
        <span className="loading-spinner">⏳</span>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={`auth-button ${className}`}>
      {isAuthenticated ? (
        <UserProfile showDropdown={showUserDropdown} />
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthButton;