import { CSSProperties } from 'react';

export interface ProgressIndicatorProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
  style?: CSSProperties;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500'
};

const bgColors = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  yellow: 'bg-yellow-100',
  red: 'bg-red-100'
};

export default function ProgressIndicator({
  value,
  label,
  showPercentage = true,
  size = 'md',
  color = 'blue',
  className = '',
  style
}: ProgressIndicatorProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`} style={style}>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className={`w-full rounded-full ${bgColors[color]} ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}