import React from 'react';

/**
 * Loading spinner component with customizable message
 */
const LoadingSpinner = ({ message, className = '' }) => {
  return (
    <div className={`loading ${className}`}>
      <div className="loading-spinner"></div>
      {message && <span>{message}</span>}
    </div>
  );
};

export default LoadingSpinner;