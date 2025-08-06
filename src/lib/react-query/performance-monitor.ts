/**
 * React Query 성능 모니터링 시스템
 * 캐시 히트율, 쿼리 성능, 에러율 등을 추적
 */

interface QueryMetrics {
  key: string;
  executionTime: number;
  cacheHit: boolean;
  success: boolean;
  error?: string;
  timestamp: number;
  retryCount?: number;
}

interface PerformanceStats {
  totalQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  successRate: number;
  errorCount: number;
  slowQueries: QueryMetrics[];
  recentErrors: QueryMetrics[];
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly maxMetrics = 1000; // 최대 1000개의 메트릭만 저장
  private readonly slowQueryThreshold = 2000; // 2초 이상이면 느린 쿼리로 간주

  /**
   * 쿼리 실행 메트릭 기록
   */
  recordQuery(metrics: Omit<QueryMetrics, 'timestamp'>) {
    const newMetric: QueryMetrics = {
      ...metrics,
      timestamp: Date.now(),
    };

    this.metrics.push(newMetric);

    // 메트릭 개수 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 개발 환경에서 콘솔 로그
    if (process.env.NODE_ENV === 'development') {
      const logLevel = newMetric.success ? 'log' : 'warn';
      console[logLevel]('Query Performance:', {
        key: newMetric.key,
        time: `${newMetric.executionTime}ms`,
        cacheHit: newMetric.cacheHit ? '✅ Cache Hit' : '🔄 Network',
        success: newMetric.success ? '✅' : '❌',
        error: newMetric.error,
      });
    }
  }

  /**
   * 현재 성능 통계 계산
   */
  getStats(timeWindow?: number): PerformanceStats {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= windowStart);
    
    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        cacheHitRate: 0,
        averageExecutionTime: 0,
        successRate: 0,
        errorCount: 0,
        slowQueries: [],
        recentErrors: [],
      };
    }

    const totalQueries = recentMetrics.length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const successes = recentMetrics.filter(m => m.success).length;
    const errors = recentMetrics.filter(m => !m.success);
    const slowQueries = recentMetrics.filter(m => m.executionTime > this.slowQueryThreshold);
    
    const totalExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0);

    return {
      totalQueries,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      averageExecutionTime: totalExecutionTime / totalQueries,
      successRate: (successes / totalQueries) * 100,
      errorCount: errors.length,
      slowQueries: slowQueries.slice(-10), // 최근 10개의 느린 쿼리
      recentErrors: errors.slice(-5), // 최근 5개의 에러
    };
  }

  /**
   * 특정 쿼리 키의 성능 통계
   */
  getQueryStats(queryKey: string, timeWindow?: number): Partial<PerformanceStats> {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;
    
    const queryMetrics = this.metrics.filter(m => 
      m.key === queryKey && m.timestamp >= windowStart
    );

    if (queryMetrics.length === 0) {
      return {};
    }

    const totalQueries = queryMetrics.length;
    const cacheHits = queryMetrics.filter(m => m.cacheHit).length;
    const successes = queryMetrics.filter(m => m.success).length;
    const totalExecutionTime = queryMetrics.reduce((sum, m) => sum + m.executionTime, 0);

    return {
      totalQueries,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      averageExecutionTime: totalExecutionTime / totalQueries,
      successRate: (successes / totalQueries) * 100,
    };
  }

  /**
   * 메트릭 초기화 (테스트 목적)
   */
  reset() {
    this.metrics = [];
  }

  /**
   * 성능 레포트 생성
   */
  generateReport(timeWindow = 5 * 60 * 1000): string { // 기본 5분
    const stats = this.getStats(timeWindow);
    const timeWindowMinutes = timeWindow / (60 * 1000);

    return `
📊 React Query Performance Report (Last ${timeWindowMinutes}m)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Total Queries: ${stats.totalQueries}
🎯 Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%
⏱️  Average Execution Time: ${stats.averageExecutionTime.toFixed(0)}ms
✅ Success Rate: ${stats.successRate.toFixed(1)}%
❌ Error Count: ${stats.errorCount}

${stats.slowQueries.length > 0 ? `
🐌 Slow Queries (>${this.slowQueryThreshold}ms):
${stats.slowQueries.map(q => 
  `   • ${q.key}: ${q.executionTime}ms`
).join('\n')}
` : ''}

${stats.recentErrors.length > 0 ? `
⚠️  Recent Errors:
${stats.recentErrors.map(e => 
  `   • ${e.key}: ${e.error}`
).join('\n')}
` : ''}
    `.trim();
  }
}

// 싱글톤 인스턴스
export const queryPerformanceMonitor = new QueryPerformanceMonitor();

/**
 * React Query 쿼리 성능을 추적하는 래퍼 함수
 */
export function withPerformanceTracking<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  isCacheHit?: boolean
): Promise<T> {
  const startTime = Date.now();
  
  return queryFn()
    .then((result) => {
      const executionTime = Date.now() - startTime;
      
      queryPerformanceMonitor.recordQuery({
        key: queryKey,
        executionTime,
        cacheHit: isCacheHit || false,
        success: true,
      });
      
      return result;
    })
    .catch((error) => {
      const executionTime = Date.now() - startTime;
      
      queryPerformanceMonitor.recordQuery({
        key: queryKey,
        executionTime,
        cacheHit: false,
        success: false,
        error: error.message,
      });
      
      throw error;
    });
}

/**
 * React Hook으로 성능 통계 모니터링
 */
export function useQueryPerformanceStats(timeWindow?: number) {
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);

  React.useEffect(() => {
    const updateStats = () => {
      setStats(queryPerformanceMonitor.getStats(timeWindow));
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, [timeWindow]);

  return {
    stats,
    generateReport: () => queryPerformanceMonitor.generateReport(timeWindow),
    getQueryStats: (queryKey: string) => queryPerformanceMonitor.getQueryStats(queryKey, timeWindow),
  };
}

// React import 추가 (Next.js 환경에서)
import React from 'react';