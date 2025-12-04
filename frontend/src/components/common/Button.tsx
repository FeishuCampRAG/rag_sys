import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base'
};

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin text-current"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  block = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const composed = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    block ? 'w-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={composed}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && icon}
      <span className="leading-none">{children}</span>
    </button>
  );
}
