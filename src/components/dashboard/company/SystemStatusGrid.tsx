'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Building2, Store, Package, Users, ChefHat, ShieldCheck } from 'lucide-react';
import type { CompanyStats } from '@/lib/react-query/api/company-dashboard';

interface SystemStatusGridProps {
  stats: CompanyStats | undefined;
}

export const SystemStatusGrid = React.memo<SystemStatusGridProps>(function SystemStatusGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 브랜드 현황 */}
      <Card className="card-premium card-company hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 gradient-primary rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">브랜드 관리</h4>
            <p className="text-sm text-gray-600 mt-1">전체 브랜드 현황 및 성과</p>
            <div className="mt-3 flex items-center text-sm text-indigo-600">
              <span className="font-medium">{stats?.total_brands || 0}개 브랜드 운영</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 매장 현황 */}
      <Card className="card-premium card-store hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 gradient-secondary rounded-lg">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">매장 관리</h4>
            <p className="text-sm text-gray-600 mt-1">전체 매장 운영 현황</p>
            <div className="mt-3 flex items-center text-sm text-emerald-600">
              <span className="font-medium">{stats?.total_stores || 0}개 매장 운영</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 재고 현황 */}
      <Card className="card-premium card-brand hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 gradient-accent rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">재고 통합</h4>
            <p className="text-sm text-gray-600 mt-1">전사 재고 가치 현황</p>
            <div className="mt-3 flex items-center text-sm text-amber-600">
              <span className="font-medium">₩{stats?.total_inventory_value.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 직원 현황 */}
      <Card className="card-premium hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-violet-600 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">직원 관리</h4>
            <p className="text-sm text-gray-600 mt-1">전사 직원 및 권한 관리</p>
            <div className="mt-3 flex items-center text-sm text-violet-600">
              <span className="font-medium">{stats?.total_users || 0}명 직원</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 레시피 현황 */}
      <Card className="card-premium hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-rose-600 rounded-lg">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">레시피 관리</h4>
            <p className="text-sm text-gray-600 mt-1">전체 메뉴 레시피 현황</p>
            <div className="mt-3 flex items-center text-sm text-rose-600">
              <span className="font-medium">{stats?.active_recipes || 0}개 활성 레시피</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 보안 현황 */}
      <Card className="card-premium hover-lift p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gray-700 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">보안 설정</h4>
            <p className="text-sm text-gray-600 mt-1">시스템 보안 및 권한</p>
            <div className="mt-3 flex items-center text-sm text-gray-600">
              <span className="font-medium">모든 시스템 정상</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

export default SystemStatusGrid;