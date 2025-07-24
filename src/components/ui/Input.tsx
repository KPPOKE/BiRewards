import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = false,
      className = '',
      leftIcon,
      rightIcon,
      onRightIconClick,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label ? label?.toLowerCase().replace(/\s+/g, '-') : undefined;

    const baseInputStyles = `
      block rounded-md border border-white/20 shadow-sm px-4 py-2 bg-black/20 text-white placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#b9956f] focus:border-[#b9956f]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' : ''}
      ${fullWidth ? 'w-full' : 'w-auto'}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${className}
    `;

    return (
      <div className={fullWidth ? 'w-full' : 'w-auto'}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-200 mb-1 text-shadow"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-300">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            className={baseInputStyles}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && (
            <div 
              className={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 ${onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
              onClick={onRightIconClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onRightIconClick?.();
              }}
              role={onRightIconClick ? "button" : undefined}
              tabIndex={onRightIconClick ? 0 : -1}
              aria-label={onRightIconClick ? "Toggle password visibility" : undefined}
            >
               {rightIcon}
             </div>
           )}
        </div>
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;