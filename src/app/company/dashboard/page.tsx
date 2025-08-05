'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { AreaChart } from '@/components/ui/area-chart';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CompanyAdminUp, SuperAdminOnly, ManagersOnly, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary, InlineError } from '@/components/ui/error-boundary';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  FileText,
  Settings,
  ChevronDown,
  Plus,
  Filter,
} from 'lucide-react';
import type { ERPRole } from '@/types/database.types';

interface CompanyStats {
  total_users: number;
  total_brands: number;
  total_stores: number;
  total_inventory_value: number;
  total_sales: number;
  active_recipes: number;
}

// 차트 데이터 타입
interface ChartData {
  date: string;
  value: number;
}

// 문서 데이터 타입
interface Document {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'pending' | 'archived';
  type: string;
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // 차트 데이터 생성 (임시)
  const generateChartData = (): ChartData[] => {
    const data: ChartData[] = [];
    const baseValue = 45000;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      data.push({
        date: `Jun ${date.getDate()}`,
        value: baseValue + Math.floor(Math.random() * 10000) - 5000,
      });
    }
    
    return data;
  };

  const [chartData] = useState<ChartData[]>(generateChartData());

  // 문서 데이터 (임시)
  const documents: Document[] = [
    { id: '1', name: '2024년 3분기 실적 보고서', date: '2024-10-15', status: 'active', type: 'report' },
    { id: '2', name: '밀랍 브랜드 운영 계획서', date: '2024-10-10', status: 'active', type: 'plan' },
    { id: '3', name: '성수점 임대 계약서', date: '2024-09-01', status: 'active', type: 'contract' },
    { id: '4', name: '직원 채용 계획서', date: '2024-10-20', status: 'pending', type: 'hr' },
    { id: '5', name: '재고 관리 매뉴얼', date: '2024-08-15', status: 'active', type: 'manual' },
  ];

  const documentColumns = [
    {
      key: 'name' as keyof Document,
      header: '문서명',
      sortable: true,
    },
    {
      key: 'date' as keyof Document,
      header: '날짜',
      sortable: true,
    },
    {
      key: 'status' as keyof Document,
      header: '상태',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : value === 'pending' ? 'secondary' : 'outline'}>
          {value === 'active' ? '활성' : value === 'pending' ? '대기중' : '보관'}
        </Badge>
      ),
    },
    {
      key: 'type' as keyof Document,
      header: '유형',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      try {
        // Supabase 클라이언트 생성 (RLS 정책 적용)
        const supabase = createClient();
        
        // 사용자 역할 확인
        const { data: currentUser, error: userError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError || !currentUser) {
          setError('사용자 정보를 확인할 수 없습니다.');
          return;
        }

        const userRole = currentUser.role as ERPRole;
        
        // 회사 관리자 및 슬퍼 관리자만 접근 가능
        if (!['super_admin', 'company_admin'].includes(userRole)) {
          setError('회사 대시보드에 접근할 권한이 없습니다.');
          return;
        }
        
        // 회사 통계 가져오기 (역할에 따른 필터링 적용)
        const [usersResult] = await Promise.all([
          supabase.from('profiles').select('id, role')
        ]);

        if (usersResult.data) {
          const users = usersResult.data;
          const totalUsers = users.length;
          
          // 임시 통계 데이터 (실제 구현 시 companies, brands, stores 테이블에서 조회)
          // 브랜드 및 매장 수 조회 (사용자 권한에 따른 필터링)
          const [brandsResult, storesResult] = await Promise.all([
            supabase.from('brands').select('id').eq('is_active', true),
            supabase.from('stores').select('id').eq('is_active', true)
          ]);
          
          setStats({
            total_users: totalUsers,
            total_brands: brandsResult.data?.length || 0,
            total_stores: storesResult.data?.length || 0,
            total_inventory_value: 5000000, // TODO: 실제 재고 가치 계산
            total_sales: 15231890, // TODO: 실제 매출 계산
            active_recipes: 25 // TODO: 실제 레시피 수 계산
          });
        }

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="회사 대시보드">
        <InlineError 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout title="CulinarySeoul ERP">
        <CompanyAdminUp fallback={<AccessDenied message="회사 대시보드에 접근할 권한이 없습니다." />}>
          <div className="space-y-6">
        {/* KPI 메트릭 카드 섹션 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="총 매출"
              value={`₩${stats.total_sales.toLocaleString()}`}
              change={12.5}
              changeType="positive"
              description="이번 달 상승 추세"
            />
            <MetricCard
              title="신규 매장"
              value={stats.total_stores}
              change={20}
              changeType="negative"
              description="이번 기간 20% 감소"
            />
            <MetricCard
              title="활성 브랜드"
              value={stats.total_brands}
              change={12.5}
              changeType="positive"
              description="강력한 브랜드 유지"
            />
            <MetricCard
              title="성장률"
              value="4.5%"
              change={4.5}
              changeType="positive"
              description="안정적인 성과"
            />
          </div>
        )}

        {/* Total Visitors 차트 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">총 방문자</h3>
              <p className="text-sm text-gray-500">지난 3개월간 총계</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedPeriod === '3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('3months')}
              >
                지난 3개월
              </Button>
              <Button
                variant={selectedPeriod === '30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('30days')}
              >
                지난 30일
              </Button>
              <Button
                variant={selectedPeriod === '7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('7days')}
              >
                지난 7일
              </Button>
            </div>
          </div>
          <div className="h-[300px] mt-8 mb-8">
            <AreaChart data={chartData} height={250} />
          </div>
        </Card>

        {/* 하단 3열 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: Documents 테이블 */}
          <Card className="p-6 lg:col-span-1">
            <div className="mb-4">
              <Tabs defaultValue="outline" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="outline">개요</TabsTrigger>
                  <TabsTrigger value="performance">실적</TabsTrigger>
                  <TabsTrigger value="personnel">인사</TabsTrigger>
                  <TabsTrigger value="focus">주요</TabsTrigger>
                </TabsList>
                <TabsContent value="outline" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">문서 목록</h4>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Filter className="w-4 h-4 mr-1" />
                          컬럼 설정
                        </Button>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          섹션 추가
                        </Button>
                      </div>
                    </div>
                    <DataTable
                      data={documents}
                      columns={documentColumns}
                      className="max-h-[400px]"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="performance">
                  <p className="text-sm text-gray-500">실적 관련 문서가 여기 표시됩니다.</p>
                </TabsContent>
                <TabsContent value="personnel">
                  <p className="text-sm text-gray-500">인사 관련 문서가 여기 표시됩니다.</p>
                </TabsContent>
                <TabsContent value="focus">
                  <p className="text-sm text-gray-500">주요 문서가 여기 표시됩니다.</p>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* 중간: 차트 위젯들 */}
          <div className="space-y-6">
            {/* Pie Chart - 카테고리별 매출 */}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">밀랍 제품</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">베이커리</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">기타</span>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </Card>

            {/* Bar Chart - 월별 매출 */}
            <Card className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">월별 매출 추이</h4>
              <div className="h-[200px] flex items-end justify-between space-x-2">
                {[65, 78, 90, 70, 85, 95, 88].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-indigo-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-gray-500 mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 다양한 위젯들 */}
          <div className="space-y-6">
            {/* Total Revenue 카드 */}
            <Card className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
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

            {/* Subscriptions 카드 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">구독 서비스</h4>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900 mb-1">+2,350</p>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+180.1% 증가</span>
              </div>
            </Card>

            {/* Upgrade subscription 폼 */}
            <Card className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">구독 업그레이드</h4>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="plan">플랜 선택</Label>
                  <select
                    id="plan"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>기본 플랜</option>
                    <option>프로 플랜</option>
                    <option>엔터프라이즈</option>
                  </select>
                </div>
                <Button className="w-full">업그레이드</Button>
              </form>
            </Card>

            {/* Create account 폼 */}
            <Card className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">계정 생성</h4>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">역할</Label>
                  <select
                    id="role"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>매니저</option>
                    <option>스태프</option>
                    <option>관리자</option>
                  </select>
                </div>
                <Button className="w-full">계정 생성</Button>
              </form>
            </Card>
          </div>
        </div>
          </div>
        </CompanyAdminUp>
      </DashboardLayout>
    </ErrorBoundary>
  );
}