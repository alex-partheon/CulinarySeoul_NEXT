'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 메트릭 카드 스켈레톤
export const MetricCardsSkeleton = React.memo(function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

// 시스템 상태 그리드 스켈레톤
export const SystemStatusSkeleton = React.memo(function SystemStatusSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

// 문서 섹션 스켈레톤
export const DocumentsSkeleton = React.memo(function DocumentsSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
});

// 차트 스켈레톤
export const ChartsSkeleton = React.memo(function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="h-[200px] flex items-end justify-between space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-full" />
          ))}
        </div>
      </Card>
    </div>
  );
});

// 빠른 작업 스켈레톤
export const QuickActionsSkeleton = React.memo(function QuickActionsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-6 w-24 mb-1" />
          <div className="flex items-center">
            <Skeleton className="h-3 w-3 mr-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
});

// 전체 대시보드 스켈레톤
export const DashboardSkeleton = React.memo(function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* 메트릭 카드 */}
      <MetricCardsSkeleton />

      {/* 차트 */}
      <Card className="h-[400px] p-6">
        <Skeleton className="h-full w-full" />
      </Card>

      {/* 그리드 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DocumentsSkeleton />
        <ChartsSkeleton />
        <QuickActionsSkeleton />
      </div>

      {/* 시스템 상태 */}
      <SystemStatusSkeleton />
    </div>
  );
});

export default DashboardSkeleton;