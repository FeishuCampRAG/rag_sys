import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  startIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm',
  secondary: 'bg-gray-800 text-white hover:bg-gray-700',
  outline: 'border border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-600 bg-white',
  ghost: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
  danger: 'bg-red-600 text-white hover:bg-red-500 shadow-sm'
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-base'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, startIcon, className = '', type = 'button', disabled, children, ...rest },
  ref
) {
  const contentMuted = loading ? 'text-transparent' : '';
  const mergedDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={mergedDisabled}
      className={`inline-flex items-center justify-center gap-1 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {!loading && startIcon ? (
        <span className="flex h-4 w-4 items-center justify-center">{startIcon}</span>
      ) : null}
      <span className={`leading-none ${contentMuted}`}>{children}</span>
    </button>
  );
});

export default Button;
