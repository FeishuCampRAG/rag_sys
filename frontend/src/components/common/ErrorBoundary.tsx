import { Component, ErrorInfo, ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 记录错误到控制台
    console.group('🚨 React Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();

    // 显示用户友好的错误提示
    try {
      const { showToast } = useUIStore.getState();
      showToast({
        type: 'error',
        title: '应用错误',
        message: '应用遇到了一个错误，请刷新页面重试',
        duration: 5000
      });
    } catch (e) {
      // 如果错误处理本身出错，至少在控制台记录
      console.error('Failed to show error toast:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 m-4">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                应用遇到了错误
              </h1>
              <p className="text-gray-600 mb-6">
                很抱歉，应用遇到了一个意外错误。请尝试刷新页面或联系技术支持。
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重试
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  刷新页面
                </button>
              </div>

              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-40">
                    <div className="font-semibold mb-2">错误信息:</div>
                    <div className="mb-3">{this.state.error.toString()}</div>
                    
                    {this.state.errorInfo && (
                      <>
                        <div className="font-semibold mb-2">组件堆栈:</div>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 用于函数组件的错误边界Hook
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}