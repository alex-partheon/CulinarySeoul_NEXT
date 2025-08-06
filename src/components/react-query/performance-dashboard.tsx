'use client';

import React from 'react';
import { useQueryPerformanceStats } from '@/lib/react-query/performance-monitor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Copy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface PerformanceDashboardProps {
  timeWindow?: number; // milliseconds
  className?: string;
}

export function PerformanceDashboard({ 
  timeWindow = 5 * 60 * 1000, // 기본 5분
  className 
}: PerformanceDashboardProps) {
  const { stats, generateReport } = useQueryPerformanceStats(timeWindow);
  const [reportCopied, setReportCopied] = React.useState(false);

  const handleCopyReport = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  if (!stats) {
    return (
      <Card className={`p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center text-sm text-gray-500">
          <Activity className="w-4 h-4 mr-2 animate-pulse" />
          성능 데이터 수집 중...
        </div>
      </Card>
    );
  }

  const getCacheHitColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getExecutionTimeColor = (time: number) => {
    if (time <= 500) return 'text-green-600';
    if (time <= 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`p-6 bg-gradient-to-br from-slate-50 to-white border-0 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">React Query 성능 모니터링</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            최근 {timeWindow / (60 * 1000)}분
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            {reportCopied ? '복사됨!' : '리포트 복사'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 총 쿼리 수 */}
        <div className="flex items-center p-4 bg-white rounded-lg border">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">총 쿼리</p>
            <p className="text-xl font-semibold text-gray-900">{stats.totalQueries}</p>
          </div>
        </div>

        {/* 캐시 히트율 */}
        <div className="flex items-center p-4 bg-white rounded-lg border">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">캐시 히트율</p>
            <div className="flex items-center space-x-2">
              <p className={`text-xl font-semibold ${getCacheHitColor(stats.cacheHitRate)}`}>
                {stats.cacheHitRate.toFixed(1)}%
              </p>
              {stats.cacheHitRate >= 80 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <Progress value={stats.cacheHitRate} className="h-2 mt-1" />
          </div>
        </div>

        {/* 평균 실행 시간 */}
        <div className="flex items-center p-4 bg-white rounded-lg border">
          <div className="p-2 bg-amber-100 rounded-lg mr-3">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">평균 실행 시간</p>
            <p className={`text-xl font-semibold ${getExecutionTimeColor(stats.averageExecutionTime)}`}>
              {stats.averageExecutionTime.toFixed(0)}ms
            </p>
          </div>
        </div>

        {/* 성공률 */}
        <div className="flex items-center p-4 bg-white rounded-lg border">
          <div className="p-2 bg-emerald-100 rounded-lg mr-3">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">성공률</p>
            <div className="flex items-center space-x-2">
              <p className={`text-xl font-semibold ${getSuccessRateColor(stats.successRate)}`}>
                {stats.successRate.toFixed(1)}%
              </p>
              {stats.errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.errorCount}개 에러
                </Badge>
              )}
            </div>
            <Progress value={stats.successRate} className="h-2 mt-1" />
          </div>
        </div>
      </div>

      {/* 느린 쿼리 알림 */}
      {stats.slowQueries.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">느린 쿼리 감지됨</h4>
          </div>
          <div className="space-y-1">
            {stats.slowQueries.slice(0, 3).map((query, index) => (
              <div key={index} className="text-xs text-yellow-700">
                • {query.key}: {query.executionTime}ms
              </div>
            ))}
            {stats.slowQueries.length > 3 && (
              <p className="text-xs text-yellow-600">
                및 {stats.slowQueries.length - 3}개 추가...
              </p>
            )}
          </div>
        </div>
      )}

      {/* 최근 에러 알림 */}
      {stats.recentErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
            <h4 className="text-sm font-medium text-red-800">최근 에러</h4>
          </div>
          <div className="space-y-1">
            {stats.recentErrors.slice(0, 3).map((error, index) => (
              <div key={index} className="text-xs text-red-700">
                • {error.key}: {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 성능 요약 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">성능 등급:</span>
          <Badge 
            variant={stats.cacheHitRate >= 80 && stats.successRate >= 95 && stats.averageExecutionTime <= 500 ? 'default' : 
                   stats.cacheHitRate >= 60 && stats.successRate >= 90 && stats.averageExecutionTime <= 1000 ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {stats.cacheHitRate >= 80 && stats.successRate >= 95 && stats.averageExecutionTime <= 500 ? '우수' : 
             stats.cacheHitRate >= 60 && stats.successRate >= 90 && stats.averageExecutionTime <= 1000 ? '양호' : '개선 필요'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}