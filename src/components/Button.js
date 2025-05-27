import React from 'react';

const Button = ({ children, onClick, ariaLabel, type = 'button', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
    >
      {children}
    </button>
  );
};

export default Button; 