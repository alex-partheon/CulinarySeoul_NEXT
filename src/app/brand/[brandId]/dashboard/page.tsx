'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { MetricCard } from '@/components/ui/metric-card';
import { BarChart } from '@/components/ui/bar-chart';
import { AreaChart } from '@/components/ui/area-chart';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useERPRole } from '@/hooks/useERPRole';
import type { Database } from '@/types/database.types';
import { Building2, Store, Package, ChefHat, TrendingUp, BarChart3, AlertTriangle, Users, DollarSign, Activity, Zap, ShieldCheck, Rocket } from 'lucide-react';

// Supabase 클라이언트 (데이터베이스 전용)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BrandInfo {
  id: string;
  name: string;
  code: string;
  company_id: string;
}

interface BrandStats {
  total_stores: number;
  total_inventory_value: number;
  total_sales: number;
  active_recipes: number;
  separation_readiness: number;
  monthly_growth: number;
  staff_count: number;
  customer_satisfaction: number;
}

export default function BrandDashboard() {
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);
  const [monthlyData, setMonthlyData] = useState<Array<{ date: string; value: number }>>([]);
  const [storeData, setStoreData] = useState<Array<{ label: string; value: number; color?: string }>>([]);
  const params = useParams();
  const { profile, role, hasRole, isBrandLevel } = useERPRole();
  
  const brandId = params.brandId as string;

  // 실시간 업데이트 데모
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdates(prev => prev + 1);
    }, 40000); // 40초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      // 브랜드 수준 접근 권한 확인
      if (!isBrandLevel()) {
        setError('브랜드 대시보드 접근 권한이 없습니다.');
        setLoading(false);
        return;
      }

      try {
        // 브랜드 정보 가져오기 (임시 데이터 - 실제 테이블 구현 후 수정 예정)
        // const { data: brandData } = await supabase.from('brands').select('*').eq('id', brandId).single();
        setBrandInfo({
          id: brandId,
          name: '밀랍 (Millab)',
          code: 'millab',
          company_id: 'company-1'
        });

        // 브랜드 통계 가져오기 (임시 데이터 - 실시간 업데이트 반영)
        const baseStats = {
          total_stores: 1, // 임시: 성수점
          total_inventory_value: 3000000 + (realTimeUpdates * 30000),
          total_sales: 8000000 + (realTimeUpdates * 80000),
          active_recipes: 15,
          separation_readiness: Math.min(100, 75 + (realTimeUpdates * 0.8)),
          monthly_growth: Math.min(20, 8 + (realTimeUpdates * 0.3)),
          staff_count: 12,
          customer_satisfaction: Math.min(5.0, 4.5 + (realTimeUpdates * 0.02))
        };
        
        setStats(baseStats);

        // 월별 트렌드 데이터 생성
        const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
        const monthlyTrend = months.map((month, index) => ({
          date: month,
          value: 6000000 + (index * 800000) + (realTimeUpdates * 50000) + Math.random() * 1000000
        }));
        setMonthlyData(monthlyTrend);

        // 매장별 매출 데이터 생성
        const stores = [
          { label: '성수점', value: 8500000 + (realTimeUpdates * 30000), color: '#6366f1' },
          { label: '강남점', value: 7200000 + (realTimeUpdates * 25000), color: '#8b5cf6' },
          { label: '판교점', value: 6800000 + (realTimeUpdates * 20000), color: '#ec4899' },
          { label: '여의도점', value: 5500000 + (realTimeUpdates * 15000), color: '#f59e0b' },
        ];
        setStoreData(stores);

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, brandId, isBrandLevel, realTimeUpdates]);

  // 로딩과 에러는 DashboardLayout에서 처리됨
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <DashboardLayout title="브랜드 대시보드" brandId={brandId}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // 브레드크럼 아이템 생성
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '브랜드 관리', href: '/brands' },
    { label: brandInfo?.name || '브랜드', current: true }
  ];

  return (
    <DashboardLayout 
      title={`${brandInfo?.name} 브랜드 대시보드`}
      brandId={brandId}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-6">
        {/* 실시간 상태 알림 */}
        {realTimeUpdates > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              브랜드 데이터가 실시간으로 업데이트되었습니다. (업데이트 {realTimeUpdates}회)
            </AlertDescription>
          </Alert>
        )}

        {/* 브랜드 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{brandInfo?.name}</h1>
            <p className="text-gray-600 mt-1">브랜드 코드: {brandInfo?.code}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              • 운영 중
            </Badge>
            {hasRole(['brand_admin']) && (
              <Badge variant="secondary">
                브랜드 관리자
              </Badge>
            )}
          </div>
        </div>
        {/* 핵심 지표 - tweakcn 스타일 MetricCard 사용 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="브랜드 매출"
              value={`₩${stats.total_sales.toLocaleString()}`}
              change={realTimeUpdates > 0 ? 8.5 : undefined}
              changeType="positive"
              description="전월 대비"
              className="border-l-4 border-l-indigo-600 hover:shadow-lg transition-shadow"
            />
            
            <MetricCard
              title="활성 매장"
              value={stats.total_stores}
              description="운영 중인 매장"
              className="border-l-4 border-l-emerald-600 hover:shadow-lg transition-shadow"
            />
            
            <MetricCard
              title="재고 가치"
              value={`₩${stats.total_inventory_value.toLocaleString()}`}
              change={5.2}
              changeType="positive"
              description="총 재고 평가액"
              className="border-l-4 border-l-violet-600 hover:shadow-lg transition-shadow"
            />
            
            <MetricCard
              title="활성 레시피"
              value={stats.active_recipes}
              description="등록된 메뉴"
              className="border-l-4 border-l-amber-600 hover:shadow-lg transition-shadow"
            />
          </div>
        )}

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
              매장별 매출 비교
            </h3>
            <BarChart data={storeData} height={250} />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              월별 매출 트렌드
            </h3>
            <AreaChart data={monthlyData} height={250} />
          </Card>
        </div>

        {/* 브랜드 건강도 및 성과 지표 */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                브랜드 건강도
              </h3>
              <div className="flex items-center justify-center">
                <CircularProgress 
                  value={Math.round((stats.monthly_growth + stats.customer_satisfaction * 10) / 2)} 
                  max={100}
                  color="#6366f1"
                  label="종합 점수"
                />
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">월간 성장률</span>
                  <Badge variant={stats.monthly_growth >= 10 ? "default" : "secondary"}>
                    {stats.monthly_growth.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">고객 만족도</span>
                  <Badge variant={stats.customer_satisfaction >= 4.5 ? "default" : "secondary"}>
                    {stats.customer_satisfaction.toFixed(1)}점
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">직원 규모</span>
                  <Badge variant="outline">{stats.staff_count}명</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                분리 준비도
              </h3>
              <div className="flex items-center justify-center">
                <CircularProgress 
                  value={stats.separation_readiness} 
                  max={100}
                  color="#f97316"
                  label="준비율"
                />
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">재무 독립성</span>
                  <Progress value={95} className="w-20 h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">운영 시스템</span>
                  <Progress value={88} className="w-20 h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">인사 체계</span>
                  <Progress value={stats.separation_readiness} className="w-20 h-2" />
                </div>
              </div>
              {stats.separation_readiness >= 90 && (
                <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700">
                  <Rocket className="h-4 w-4 mr-2" />
                  독립 프로세스 시작
                </Button>
              )}
            </Card>

            {/* 빠른 액션 카드 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                빠른 액션
              </h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  독립 준비 체크리스트
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                >
                  <Store className="h-4 w-4 mr-2" />
                  신규 매장 승인
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  레시피 승인 대기
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  직원 관리
                </Button>
              </div>
            </Card>
          </div>
        )}


        {/* 브랜드 관리 메뉴 - tweakcn 스타일 그리드 */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">브랜드 관리</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-indigo-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Store className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">매장 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">소속 매장 현황 및 관리</p>
                  <div className="mt-3 flex items-center text-sm text-indigo-600">
                    <span className="font-medium">{stats?.total_stores || 0}개 매장</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-violet-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <Package className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">재고 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">브랜드 전체 재고 현황</p>
                  <div className="mt-3 flex items-center text-sm text-violet-600">
                    <span className="font-medium">₩{stats?.total_inventory_value.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-emerald-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">매출 분석</h4>
                  <p className="text-sm text-gray-600 mt-1">브랜드 매출 대시보드</p>
                  <div className="mt-3 flex items-center text-sm text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="font-medium">+{stats?.monthly_growth.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-amber-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <ChefHat className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">레시피 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">메뉴 레시피 및 소재</p>
                  <div className="mt-3 flex items-center text-sm text-amber-600">
                    <span className="font-medium">{stats?.active_recipes || 0}개 메뉴</span>
                  </div>
                </div>
              </div>
            </Card>

            {hasRole(['brand_admin']) && (
              <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-rose-600">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-rose-100 rounded-lg">
                    <Users className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">직원 관리</h4>
                    <p className="text-sm text-gray-600 mt-1">브랜드 직원 및 권한</p>
                    <div className="mt-3 flex items-center text-sm text-rose-600">
                      <span className="font-medium">{stats?.staff_count || 0}명</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-gray-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">브랜드 설정</h4>
                  <p className="text-sm text-gray-600 mt-1">브랜드 정보 및 정책</p>
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <span className="font-medium">설정 관리</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}