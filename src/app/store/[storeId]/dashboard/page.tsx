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
import { CalendarWidget } from '@/components/ui/calendar-widget';
import { ActivityChart } from '@/components/ui/activity-chart';
import { DataTable } from '@/components/ui/data-table';
import { useERPRole } from '@/hooks/useERPRole';
import type { Database } from '@/types/database.types';
import { AlertTriangle, TrendingUp, Users, Package, DollarSign, ShoppingCart, Star, BarChart3, Bell, Clock, Activity, Zap } from 'lucide-react';

// Supabase 클라이언트 (데이터베이스 전용)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StoreInfo {
  id: string;
  name: string;
  code: string;
  brand_id: string;
  brand_name: string;
  address: string;
  phone: string;
  manager_name: string;
}

interface StoreStats {
  daily_sales: number;
  monthly_sales: number;
  inventory_items: number;
  low_stock_items: number;
  staff_count: number;
  orders_today: number;
  customer_satisfaction: number;
  operational_efficiency: number;
}

export default function StoreDashboard() {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);
  const [calendarData, setCalendarData] = useState<Array<{ date: number; value?: number; isCurrentMonth?: boolean; isToday?: boolean }>>([]);
  const [hourlyData, setHourlyData] = useState<Array<{ hour: number; value: number }>>([]);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; time: string; items: number; amount: number; status: string }>>([]);
  const params = useParams();
  const { profile, role, hasRole, isStoreLevel } = useERPRole();
  
  const storeId = params.storeId as string;

  // 실시간 업데이트 데모
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdates(prev => prev + 1);
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      // 매장 접근 권한 확인
      if (!isStoreLevel()) {
        setError('매장 대시보드 접근 권한이 없습니다.');
        setLoading(false);
        return;
      }

      try {
        // 매장 정보 가져오기 (임시 데이터 - 실제 테이블 구현 후 수정 예정)
        // const { data: storeData } = await supabase
        //   .from('stores')
        //   .select(`
        //     *,
        //     brands (
        //       name
        //     )
        //   `)
        //   .eq('id', storeId)
        //   .single();
        
        // 임시 매장 정보 (사용자 역할에 따른 데이터 조정)
        setStoreInfo({
          id: storeId,
          name: '밀랍 성수점',
          code: 'millab-seongsu',
          brand_id: 'brand-1',
          brand_name: '밀랍 (Millab)',
          address: '서울특별시 성동구 성수일로 77',
          phone: '02-1234-5678',
          manager_name: hasRole(['store_manager']) ? profile.full_name || '매니저' : '김매니저'
        });

        // 매장 통계 가져오기 (임시 데이터 - 실시간 업데이트 반영)
        const baseStats = {
          daily_sales: 850000 + (realTimeUpdates * 15000), // 실시간 매출 증가
          monthly_sales: 12500000 + (realTimeUpdates * 45000),
          inventory_items: 145,
          low_stock_items: Math.max(0, 8 - Math.floor(realTimeUpdates / 5)), // 재고 보충 시뮬레이션
          staff_count: 6,
          orders_today: 32 + Math.floor(realTimeUpdates / 2), // 실시간 주문 증가
          customer_satisfaction: Math.min(5.0, 4.7 + (realTimeUpdates * 0.01)),
          operational_efficiency: Math.min(100, 92 + (realTimeUpdates * 0.5))
        };
        
        setStats(baseStats);

        // 캘린더 데이터 생성 (이번 달 매출)
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
        
        const calendar = [];
        // 이전 달 날짜 채우기
        const firstDay = new Date(today.getFullYear(), currentMonth, 1).getDay();
        const lastMonthDays = new Date(today.getFullYear(), currentMonth, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) {
          calendar.push({ 
            date: lastMonthDays - i, 
            isCurrentMonth: false 
          });
        }
        // 이번 달 날짜
        for (let i = 1; i <= daysInMonth; i++) {
          calendar.push({
            date: i,
            value: i <= currentDate ? 800000 + Math.random() * 400000 : undefined,
            isCurrentMonth: true,
            isToday: i === currentDate
          });
        }
        // 다음 달 날짜 채우기 (6주 맞추기)
        const remainingDays = 42 - calendar.length;
        for (let i = 1; i <= remainingDays; i++) {
          calendar.push({ 
            date: i, 
            isCurrentMonth: false 
          });
        }
        setCalendarData(calendar);

        // 시간대별 주문량 데이터
        const hourly = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          value: i >= 9 && i <= 21 ? Math.floor(Math.random() * 20) + 5 : 0
        }));
        setHourlyData(hourly);

        // 최근 주문 데이터
        const orders = [
          { id: '#1234', time: '10분 전', items: 3, amount: 45000, status: '준비중' },
          { id: '#1233', time: '15분 전', items: 2, amount: 28000, status: '완료' },
          { id: '#1232', time: '20분 전', items: 5, amount: 62000, status: '완료' },
          { id: '#1231', time: '25분 전', items: 1, amount: 15000, status: '완료' },
          { id: '#1230', time: '30분 전', items: 4, amount: 52000, status: '취소' },
        ];
        setRecentOrders(orders);

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, storeId, isStoreLevel, hasRole, realTimeUpdates]);


  // 로딩과 에러는 DashboardLayout에서 처리됨
  if (loading) {
    return null; // DashboardLayout의 로딩 UI 사용
  }

  if (error) {
    return (
      <DashboardLayout title="매장 대시보드" storeId={storeId}>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // 사용자 역할에 따른 브레드크럼 아이템 생성
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '매장 관리', href: '/stores' },
    { label: storeInfo?.name || '매장', current: true }
  ];

  return (
    <DashboardLayout 
      title={`${storeInfo?.name} 매장 대시보드`}
      storeId={storeId}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-6">
        {/* 실시간 상태 알림 */}
        {realTimeUpdates > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              실시간 데이터가 업데이트되었습니다. (업데이트 {realTimeUpdates}회)
            </AlertDescription>
          </Alert>
        )}

        {/* 매장 운영 상태 표시 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{storeInfo?.name}</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              • 운영 중
            </Badge>
            {hasRole(['store_manager']) && (
              <Badge variant="secondary">
                매니저
              </Badge>
            )}
          </div>
        </div>

        {/* 상단 KPI 메트릭 카드 섹션 - tweakcn 스타일 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="일일 매출"
              value={`₩${stats.daily_sales.toLocaleString()}`}
              change={realTimeUpdates > 0 ? 12.5 : undefined}
              changeType="positive"
              description="전일 대비"
              className="border-l-4 border-l-indigo-600 hover:shadow-lg transition-shadow"
            />
            
            <MetricCard
              title="오늘 주문"
              value={stats.orders_today}
              change={8.2}
              changeType="positive"
              description={`${realTimeUpdates > 0 ? '+' + Math.floor(realTimeUpdates / 2) + '건' : '실시간'}`}
              className="border-l-4 border-l-emerald-600 hover:shadow-lg transition-shadow"
            />
            
            <MetricCard
              title="부족 재고"
              value={stats.low_stock_items}
              changeType={stats.low_stock_items > 5 ? "negative" : undefined}
              description={stats.low_stock_items > 5 ? "즉시 보충 필요" : "정상 재고"}
              className={`border-l-4 ${
                stats.low_stock_items > 5 ? 'border-l-red-600' : 
                stats.low_stock_items > 2 ? 'border-l-yellow-600' : 'border-l-green-600'
              } hover:shadow-lg transition-shadow`}
            />
            
            <MetricCard
              title="근무 직원"
              value={stats.staff_count}
              description="현재 근무중"
              className="border-l-4 border-l-violet-600 hover:shadow-lg transition-shadow"
            />
          </div>
        )}

        {/* 운영 현황 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 월간 매출 캘린더 */}
          <CalendarWidget
            title="월간 매출 현황"
            days={calendarData}
            valueLabel="일별 매출"
            className="h-full"
          />

          {/* 시간대별 주문량 */}
          <ActivityChart
            data={hourlyData}
            title="시간대별 주문량"
            color="#6366f1"
            className="h-full"
          />
        </div>

        {/* 최근 주문 및 실시간 알림 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 주문 테이블 */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-indigo-600" />
              최근 주문
            </h3>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-500">{order.time}</p>
                    </div>
                    <Badge variant="outline">{order.items}개 항목</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">₩{order.amount.toLocaleString()}</span>
                    <Badge 
                      variant={
                        order.status === '준비중' ? 'default' : 
                        order.status === '완료' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              전체 주문 보기
            </Button>
          </Card>

          {/* 실시간 알림 위젯 */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-amber-600" />
              실시간 알림
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border-l-4 border-l-red-600">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">재고 부족 경고</p>
                    <p className="text-xs text-red-700 mt-1">아메리카노 원두 재고 10% 미만</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border-l-4 border-l-green-600">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">매출 목표 달성</p>
                    <p className="text-xs text-green-700 mt-1">오늘 매출 목표 120% 달성</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-600">
                <div className="flex items-start space-x-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">직원 출근</p>
                    <p className="text-xs text-blue-700 mt-1">김알바님 출근 완료</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 매장 성과 지표 */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                매장 성과
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">월 매출 달성률</span>
                  <Badge variant="default">65%</Badge>
                </div>
                <Progress value={65} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">재고 회전율</span>
                  <Badge variant="secondary">85%</Badge>
                </div>
                <Progress value={85} className="h-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">운영 효율성</span>
                  <Badge variant={stats.operational_efficiency >= 95 ? "default" : "secondary"}>
                    {stats.operational_efficiency}%
                  </Badge>
                </div>
                <Progress value={stats.operational_efficiency} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-amber-600" />
                고객 만족도
              </h3>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-amber-600 mb-2">
                  {stats.customer_satisfaction.toFixed(1)}
                </div>
                <div className="flex items-center space-x-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.round(stats.customer_satisfaction)
                          ? 'text-amber-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Badge 
                  variant={stats.customer_satisfaction >= 4.5 ? "default" : "secondary"}
                  className="mb-4"
                >
                  {stats.customer_satisfaction >= 4.5 ? "우수" : "양호"}
                </Badge>
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">서비스</span>
                    <span className="font-medium">4.8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">음식 품질</span>
                    <span className="font-medium">4.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">청결도</span>
                    <span className="font-medium">4.9</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 빠른 액션 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                빠른 액션
              </h3>
              <div className="space-y-3">
                <Button 
                  variant={stats.low_stock_items > 5 ? "destructive" : "outline"} 
                  className="w-full justify-start"
                >
                  <Package className="h-4 w-4 mr-2" />
                  재고 보충 요청
                  {stats.low_stock_items > 5 && (
                    <Badge variant="secondary" className="ml-auto">
                      {stats.low_stock_items}개
                    </Badge>
                  )}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  출퇴근 관리
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  매출 상세 분석
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  알림 설정
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 매장 운영 메뉴 - tweakcn 스타일 그리드 */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-6">매장 운영</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-indigo-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">매출 현황</h4>
                  <p className="text-sm text-gray-600 mt-1">일별/월별 매출 분석</p>
                  <div className="mt-3 flex items-center text-sm text-indigo-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="font-medium">₩{stats?.daily_sales.toLocaleString() || 0}</span>
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
                  <p className="text-sm text-gray-600 mt-1">재고 현황 및 발주</p>
                  <div className="mt-3 flex items-center text-sm text-violet-600">
                    {stats && stats.low_stock_items > 5 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span className="font-medium text-red-600">{stats.low_stock_items}개 부족</span>
                      </>
                    ) : (
                      <span className="font-medium text-green-600">정상 재고</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-emerald-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">주문 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">실시간 주문 처리</p>
                  <div className="mt-3 flex items-center text-sm text-emerald-600">
                    <span className="font-medium">{stats?.orders_today || 0}건 처리</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-amber-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">고객 관리</h4>
                  <p className="text-sm text-gray-600 mt-1">고객 정보 및 피드백</p>
                  <div className="mt-3 flex items-center text-sm text-amber-600">
                    <span className="font-medium">{stats?.customer_satisfaction.toFixed(1) || 0}점</span>
                  </div>
                </div>
              </div>
            </Card>

            {hasRole(['store_manager']) && (
              <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-rose-600">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-rose-100 rounded-lg">
                    <Users className="h-6 w-6 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">직원 관리</h4>
                    <p className="text-sm text-gray-600 mt-1">직원 스케줄 및 급여</p>
                    <div className="mt-3 flex items-center text-sm text-rose-600">
                      <span className="font-medium">{stats?.staff_count || 0}명 근무</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 border-t-gray-600">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">운영 보고서</h4>
                  <p className="text-sm text-gray-600 mt-1">일일 운영 리포트</p>
                  <div className="mt-3 flex items-center text-sm text-gray-600">
                    <span className="font-medium">일일 보고</span>
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