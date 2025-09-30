import React from 'react';

/**
 * Error message component with optional dismiss functionality
 */
const ErrorMessage = ({ error, onDismiss, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`error ${className}`}>
      <span>错误: {error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="error-dismiss"
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;