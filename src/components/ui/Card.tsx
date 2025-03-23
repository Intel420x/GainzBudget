import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string;
  className?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  footer,
  headerAction,
  onClick,
}) => {
  const hasHeader = title || subtitle || headerAction;
  const isClickable = !!onClick;
  
  return (
    <div 
      className={`
        bg-dark-400 dark:bg-dark-500 
        shadow-neon-green rounded-lg border border-dark-300 dark:border-dark-300
        overflow-hidden transition-all duration-200
        ${isClickable ? 'cursor-pointer hover:shadow-neon-glow transform hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {hasHeader && (
        <div className="px-4 py-4 sm:px-6 border-b border-dark-300 dark:border-dark-300 flex justify-between items-center">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-white dark:text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {typeof title === 'string' ? title : title}
              </h3>
            )}
            
            {subtitle && (
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {headerAction && (
            <div>
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-4 sm:px-6 bg-dark-500/50 dark:bg-dark-600/50 border-t border-dark-300 dark:border-dark-300">
          {footer}
        </div>
      )}
    </div>
  );
}; 