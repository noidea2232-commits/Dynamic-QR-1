import React, { forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    id,
    type,
    ...props
  },
  ref
) => {
  const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={generatedId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
          {props.required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={generatedId}
          type={inputType}
          className={twMerge(
            'block w-full rounded-lg border text-sm font-medium transition-colors duration-150 py-2.5 caret-brand-400',
            leftIcon ? 'pl-10' : 'pl-3.5',
            isPassword || rightIcon ? 'pr-10' : 'pr-3.5',
            error
              ? 'border-rose-500 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-rose-400 focus:ring-rose-400'
              : 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:ring-brand-500 hover:border-slate-600',
            'focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {/* Custom right icon (non-password) */}
        {!isPassword && rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none z-10">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
