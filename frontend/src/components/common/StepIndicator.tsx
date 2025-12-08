import { CSSProperties } from 'react';

export interface Step {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description?: string;
  duration?: number; // in milliseconds
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep?: string;
  showDuration?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export default function StepIndicator({
  steps,
  currentStep,
  showDuration = false,
  orientation = 'horizontal',
  size = 'md',
  className = '',
  style
}: StepIndicatorProps) {
  const isHorizontal = orientation === 'horizontal';

  const getStepIcon = (step: Step) => {
    const iconSize = iconSizes[size];
    
    if (step.status === 'completed') {
      return (
        <div className={`${iconSize} rounded-full bg-green-500 flex items-center justify-center`}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (step.status === 'error') {
      return (
        <div className={`${iconSize} rounded-full bg-red-500 flex items-center justify-center`}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    if (step.status === 'processing') {
      return (
        <div className={`${iconSize} rounded-full bg-blue-500 flex items-center justify-center`}>
          <svg className={`w-3 h-3 text-white animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className={`${iconSize} rounded-full border-2 border-gray-300 bg-white flex items-center justify-center`}>
        <span className="text-gray-500 font-medium">{steps.indexOf(step) + 1}</span>
      </div>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`${className} ${sizeClasses[size]}`} style={style}>
      <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-start'} gap-4`}>
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.status === 'completed';
          const hasError = step.status === 'error';
          
          return (
            <div
              key={step.id}
              className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-start'} flex-1`}
            >
              <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-start'} gap-3`}>
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className={`font-medium ${
                    isActive ? 'text-blue-600' : 
                    isCompleted ? 'text-green-600' : 
                    hasError ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-gray-500 mt-1">{step.description}</div>
                  )}
                  {showDuration && step.duration && (
                    <div className="text-gray-400 text-xs mt-1">
                      耗时: {formatDuration(step.duration)}
                    </div>
                  )}
                </div>
              </div>
              
              {isHorizontal && index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}