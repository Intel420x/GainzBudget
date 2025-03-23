import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  id,
  required,
  disabled,
  ...props
}) => {
  // Generate a unique ID if none is provided
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  // Determine border color based on status
  const borderClass = error
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500 dark:border-danger-400 dark:focus:border-danger-400 dark:focus:ring-danger-400'
    : 'border-dark-300 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-200 dark:focus:border-primary-400 dark:focus:ring-primary-400';
  
  // Determine if we have icons and adjust padding accordingly
  const paddingClass = leadingIcon
    ? 'pl-10'
    : trailingIcon
      ? 'pr-10'
      : '';
  
  // Determine width
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-300 dark:text-gray-300 mb-1"
          style={{ fontFamily: 'Roboto Mono, monospace' }}
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-primary-500 dark:text-primary-400 sm:text-sm">
              {leadingIcon}
            </span>
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            appearance-none block rounded-md shadow-neon-green 
            ${borderClass}
            ${paddingClass}
            ${widthClass}
            ${disabled ? 'bg-dark-500 text-gray-500 dark:bg-dark-600 dark:text-gray-400 cursor-not-allowed' : 'bg-dark-400 dark:bg-dark-500 text-gray-200 dark:text-white'}
            placeholder-gray-500 dark:placeholder-gray-500
            focus:outline-none focus:ring-1 focus:shadow-neon-glow
            transition-all duration-200
            sm:text-sm py-2 px-3
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {trailingIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-primary-500 dark:text-primary-400 sm:text-sm">
              {trailingIcon}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${inputId}-error`} 
          className="mt-1 text-sm text-danger-500 dark:text-danger-400"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={`${inputId}-helper`} 
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}; 