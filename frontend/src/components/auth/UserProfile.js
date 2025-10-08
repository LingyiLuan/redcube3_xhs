import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = ({ showDropdown = true }) => {
  const { user, logout, loading, error, clearError } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  const toggleDropdown = () => {
    if (error) clearError();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-profile">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <div className="user-info" onClick={showDropdown ? toggleDropdown : undefined}>
        <div className="user-avatar">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.display_name} />
          ) : (
            <div className="avatar-placeholder">
              {user.display_name ? user.display_name.charAt(0).toUpperCase() : '👤'}
            </div>
          )}
        </div>

        <div className="user-details">
          <div className="user-name">{user.display_name || user.email}</div>
          <div className="user-role">{user.role || 'user'}</div>
        </div>

        {showDropdown && (
          <div className="dropdown-arrow">
            {isDropdownOpen ? '▲' : '▼'}
          </div>
        )}
      </div>

      {showDropdown && isDropdownOpen && (
        <div className="user-dropdown">
          <div className="dropdown-content">
            <div className="user-info-detailed">
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Role:</span>
                <span className="value">{user.role || 'user'}</span>
              </div>
              <div className="info-row">
                <span className="label">Last Login:</span>
                <span className="value">{formatDate(user.last_login)}</span>
              </div>
              <div className="info-row">
                <span className="label">Member Since:</span>
                <span className="value">{formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="dropdown-actions">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="logout-button"
              >
                {loading ? '⏳ Logging out...' : '🚪 Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;