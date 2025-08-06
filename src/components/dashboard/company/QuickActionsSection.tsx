'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Store,
  Package,
  Settings,
  Building2,
  ChefHat,
  Users,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import type { CompanyStats } from '@/lib/react-query/api/company-dashboard';

interface QuickActionsSectionProps {
  stats: CompanyStats | undefined;
}

export const QuickActionsSection = React.memo<QuickActionsSectionProps>(function QuickActionsSection({ stats }) {
  return (
    <div className="space-y-6">
      {/* Total Revenue Card */}
      <Card className="p-6 gradient-premium text-white shadow-premium border-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium opacity-90">총 매출</h4>
          <DollarSign className="w-5 h-5 opacity-80" />
        </div>
        <p className="text-2xl font-semibold mb-1">₩15,231,890</p>
        <div className="flex items-center text-sm">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+20.1% 지난달 대비</span>
        </div>
      </Card>

      {/* Active Stores Card */}
      <Card className="card-premium hover-lift p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">활성 매장</h4>
          <Store className="w-5 h-5 text-indigo-600" />
        </div>
        <p className="text-2xl font-semibold text-gray-900 mb-1">{stats?.total_stores || 0}</p>
        <div className="flex items-center text-sm text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>모든 매장 정상 운영중</span>
        </div>
      </Card>

      {/* Total Inventory Value */}
      <Card className="card-premium hover-lift p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">재고 가치</h4>
          <Package className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-2xl font-semibold text-gray-900 mb-1">₩{stats?.total_inventory_value.toLocaleString() || 0}</p>
        <div className="flex items-center text-sm text-blue-600">
          <BarChart3 className="w-4 h-4 mr-1" />
          <span>FIFO 관리 최적화</span>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="card-premium p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <Settings className="w-4 h-4 mr-2 text-gray-600" />
          빠른 작업
        </h4>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start hover-lift transition-all"
          >
            <Building2 className="h-4 w-4 mr-2" />
            신규 브랜드 등록
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start hover-lift transition-all"
          >
            <Store className="h-4 w-4 mr-2" />
            신규 매장 승인
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start hover-lift transition-all"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            레시피 승인 대기
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start hover-lift transition-all"
          >
            <Users className="h-4 w-4 mr-2" />
            직원 권한 관리
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start hover-lift transition-all"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            보안 설정
          </Button>
        </div>
      </Card>
    </div>
  );
});

export default QuickActionsSection;