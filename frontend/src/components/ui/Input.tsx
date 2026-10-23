'use client';

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', type = 'text', id, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink-body font-display">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-muted-soft pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={`w-full px-3.5 py-2.5 text-sm rounded-md border border-hairline bg-white text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs font-medium text-danger animate-fadeIn">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-xs text-muted-soft font-body">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
