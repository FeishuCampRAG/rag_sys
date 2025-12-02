/**
 * Error handling utilities for the chat application
 */

export type ErrorType = 'network' | 'timeout' | 'server' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: unknown;
}

/**
 * Categorizes and formats error messages for better user experience
 */
export function parseError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
        errorMessage.includes('failed to fetch') || errorMessage.includes('connection')) {
      return {
        type: 'network',
        message: error.message,
        userMessage: '网络连接失败，请检查网络后重试。',
        originalError: error
      };
    }
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return {
        type: 'timeout',
        message: error.message,
        userMessage: '请求超时，请稍后重试。',
        originalError: error
      };
    }
    
    // Server errors (5xx status codes)
    if (errorMessage.includes('500') || errorMessage.includes('502') || 
        errorMessage.includes('503') || errorMessage.includes('504')) {
      return {
        type: 'server',
        message: error.message,
        userMessage: '服务器暂时不可用，请稍后重试。',
        originalError: error
      };
    }
    
    // Generic error with message
    return {
      type: 'unknown',
      message: error.message,
      userMessage: error.message || '服务异常，请稍后重试。',
      originalError: error
    };
  }
  
  // String errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
      userMessage: error,
      originalError: error
    };
  }
  
  // Unknown error type
  return {
    type: 'unknown',
    message: 'Unknown error occurred',
    userMessage: '服务异常，请稍后重试。',
    originalError: error
  };
}

/**
 * Logs error details for debugging purposes
 */
export function logError(context: string, errorInfo: ErrorInfo): void {
  console.group(`🚨 Error in ${context}`);
  console.error('Type:', errorInfo.type);
  console.error('Message:', errorInfo.message);
  console.error('Original error:', errorInfo.originalError);
  console.groupEnd();
}

/**
 * Creates a user-friendly error message with optional retry suggestion
 */
export function createUserMessage(errorInfo: ErrorInfo, includeRetry = true): string {
  const baseMessage = errorInfo.userMessage;
  
  if (!includeRetry) {
    return baseMessage;
  }
  
  // Add retry suggestion based on error type
  switch (errorInfo.type) {
    case 'network':
      return `${baseMessage} 请检查网络连接后重试。`;
    case 'timeout':
      return `${baseMessage} 请稍等片刻后重试。`;
    case 'server':
      return `${baseMessage} 服务可能正在维护，请稍后重试。`;
    default:
      return `${baseMessage} 请稍后重试。`;
  }
}