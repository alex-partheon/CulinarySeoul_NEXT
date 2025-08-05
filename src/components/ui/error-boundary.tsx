/**
 * ERP 시스템용 에러 경계 컴포넌트
 * 권한 관련 에러와 일반 에러를 구분하여 처리
 */

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorType: 'permission' | 'network' | 'data' | 'unknown';
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 에러 타입 분류
    let errorType: ErrorBoundaryState['errorType'] = 'unknown';
    
    if (error.message.includes('권한') || error.message.includes('permission') || error.message.includes('access')) {
      errorType = 'permission';
    } else if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('connection')) {
      errorType = 'network';
    } else if (error.message.includes('database') || error.message.includes('supabase') || error.message.includes('data')) {
      errorType = 'data';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 에러 리포팅 (실제 환경에서는 Sentry 등 사용)
    if (typeof window !== 'undefined') {
      // TODO: 에러 리포팅 서비스에 전송
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: 'unknown'
    });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorDisplay 
        error={this.state.error}
        errorType={this.state.errorType}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
      />;
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error?: Error;
  errorType: ErrorBoundaryState['errorType'];
  onRetry: () => void;
  onGoHome: () => void;
}

function ErrorDisplay({ error, errorType, onRetry, onGoHome }: ErrorDisplayProps) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'permission':
        return {
          icon: Shield,
          title: '접근 권한 없음',
          description: '이 페이지에 접근할 권한이 없습니다. 관리자에게 문의하세요.',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          actions: [
            { label: '대시보드로 돌아가기', onClick: onGoHome, variant: 'default' as const }
          ]
        };

      case 'network':
        return {
          icon: AlertTriangle,
          title: '네트워크 연결 오류',
          description: '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          actions: [
            { label: '다시 시도', onClick: onRetry, variant: 'default' as const },
            { label: '대시보드로 돌아가기', onClick: onGoHome, variant: 'outline' as const }
          ]
        };

      case 'data':
        return {
          icon: AlertTriangle,
          title: '데이터 오류',
          description: '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          actions: [
            { label: '새로고침', onClick: onRetry, variant: 'default' as const },
            { label: '대시보드로 돌아가기', onClick: onGoHome, variant: 'outline' as const }
          ]
        };

      default:
        return {
          icon: AlertTriangle,
          title: '예기치 못한 오류',
          description: '알 수 없는 오류가 발생했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          actions: [
            { label: '새로고침', onClick: onRetry, variant: 'default' as const },
            { label: '대시보드로 돌아가기', onClick: onGoHome, variant: 'outline' as const }
          ]
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className={`max-w-md w-full p-8 ${config.bgColor} ${config.borderColor} border-2`}>
        <div className="text-center">
          <div className={`${config.color} mb-4`}>
            <Icon className="w-16 h-16 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {config.description}
          </p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-6 p-4 bg-white rounded border">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                개발자 정보 (개발 환경에서만 표시)
              </summary>
              <div className="text-xs text-gray-600 font-mono">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          )}
          
          <div className="space-y-3">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant}
                className="w-full"
              >
                {action.label === '새로고침' && <RefreshCw className="w-4 h-4 mr-2" />}
                {action.label === '대시보드로 돌아가기' && <Home className="w-4 h-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * 간단한 인라인 에러 컴포넌트
 */
export function InlineError({ 
  message = "오류가 발생했습니다", 
  onRetry,
  className = ""
}: { 
  message?: string; 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
}