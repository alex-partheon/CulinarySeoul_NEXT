'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';

// 월별 매출 차트 컴포넌트를 메모이제이션으로 최적화
export const MonthlyBarChart = React.memo(function MonthlyBarChart() {
  const chartData = useMemo(() => [65, 78, 90, 70, 85, 95, 88], []);
  const monthLabels = useMemo(() => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], []);

  return (
    <Card className="p-6">
      <h4 className="text-sm font-medium text-gray-900 mb-4">월별 매출 추이</h4>
      <div className="h-[200px] flex items-end justify-between space-x-2">
        {chartData.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-indigo-500 rounded-t"
              style={{ height: `${height}%` }}
            />
            <span className="text-xs text-gray-500 mt-2">
              {monthLabels[i]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
});

// 파이 차트 컴포넌트
export const CategorySalesChart = React.memo(function CategorySalesChart() {
  const categories = useMemo(() => [
    { name: '밀랍 제품', percentage: 65, color: 'indigo' },
    { name: '베이커리', percentage: 25, color: 'emerald' },
    { name: '기타', percentage: 10, color: 'amber' }
  ], []);

  return (
    <Card className="p-6">
      <h4 className="text-sm font-medium text-gray-900 mb-4">카테고리별 매출</h4>
      <div className="h-[200px] flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-8 border-indigo-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-semibold">65%</p>
              <p className="text-xs text-gray-500">밀랍</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{category.name}</span>
            <span className="font-medium">{category.percentage}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
});

// 차트 섹션 전체 컴포넌트
export const ChartsSection = React.memo(function ChartsSection() {
  return (
    <div className="space-y-6">
      <CategorySalesChart />
      <MonthlyBarChart />
    </div>
  );
});

export default ChartsSection;