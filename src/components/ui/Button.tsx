import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-500 focus:ring-primary-400 shadow-neon-green transform hover:-translate-y-1 dark:bg-primary-500 dark:hover:bg-primary-400',
    secondary: 'bg-dark-400 text-gray-200 hover:bg-dark-300 focus:ring-dark-200 border border-dark-300 transform hover:-translate-y-1 dark:bg-dark-300 dark:text-white dark:hover:bg-dark-200',
    outline: 'border border-primary-500 bg-transparent text-primary-500 hover:bg-primary-500/10 focus:ring-primary-400 transform hover:-translate-y-1 dark:border-primary-400 dark:text-primary-400',
    danger: 'bg-danger-600 text-white hover:bg-danger-500 focus:ring-danger-400 transform hover:-translate-y-1 dark:bg-danger-500 dark:hover:bg-danger-400',
    success: 'bg-success-600 text-white hover:bg-success-500 focus:ring-success-400 transform hover:-translate-y-1 dark:bg-success-500 dark:hover:bg-success-400',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Disabled and loading states
  const isDisabled = disabled || isLoading;
  const stateClasses = isDisabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:shadow-neon-glow active:shadow-none';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${stateClasses}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="mr-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {icon && !isLoading && <span className="mr-2">{icon}</span>}
      
      {children}
    </button>
  );
}; 