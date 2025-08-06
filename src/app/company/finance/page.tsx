'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Building2,
  Store,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient();

interface FinanceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalExpenses: number;
  monthlyExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface BrandFinance {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  growth: number;
}

interface StoreFinance {
  id: string;
  name: string;
  brandName: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

export default function FinanceManagementPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [brandFinances, setBrandFinances] = useState<BrandFinance[]>([]);
  const [storeFinances, setStoreFinances] = useState<StoreFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const loadFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 재무 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 전체 재무 통계 (시뮬레이션)
      const mockStats: FinanceStats = {
        totalRevenue: 125000000, // 1억 2천 5백만원
        monthlyRevenue: 15000000, // 1천 5백만원
        totalExpenses: 95000000, // 9천 5백만원
        monthlyExpenses: 11000000, // 1천 1백만원
        netProfit: 30000000, // 3천만원
        profitMargin: 24.0, // 24%
        revenueGrowth: 12.5, // 12.5% 성장
        expenseGrowth: 8.3, // 8.3% 증가
      };

      // 브랜드별 재무 데이터 (시뮬레이션)
      const mockBrandFinances: BrandFinance[] = [
        {
          id: '1',
          name: '밀랍(millab)',
          revenue: 85000000,
          expenses: 65000000,
          profit: 20000000,
          profitMargin: 23.5,
          growth: 15.2,
        },
        {
          id: '2',
          name: '컬리너리서울 카페',
          revenue: 40000000,
          expenses: 30000000,
          profit: 10000000,
          profitMargin: 25.0,
          growth: 8.7,
        },
      ];

      // 매장별 재무 데이터 (시뮬레이션)
      const mockStoreFinances: StoreFinance[] = [
        {
          id: '1',
          name: '성수점',
          brandName: '밀랍(millab)',
          revenue: 45000000,
          expenses: 35000000,
          profit: 10000000,
          profitMargin: 22.2,
        },
        {
          id: '2',
          name: '홍대점',
          brandName: '밀랍(millab)',
          revenue: 40000000,
          expenses: 30000000,
          profit: 10000000,
          profitMargin: 25.0,
        },
        {
          id: '3',
          name: '강남점',
          brandName: '컬리너리서울 카페',
          revenue: 25000000,
          expenses: 18000000,
          profit: 7000000,
          profitMargin: 28.0,
        },
        {
          id: '4',
          name: '명동점',
          brandName: '컬리너리서울 카페',
          revenue: 15000000,
          expenses: 12000000,
          profit: 3000000,
          profitMargin: 20.0,
        },
      ];

      setStats(mockStats);
      setBrandFinances(mockBrandFinances);
      setStoreFinances(mockStoreFinances);

    } catch (error) {
      console.error('재무 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!hasMinimumRole('brand_admin')) {
    return <AccessDenied />;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebarCompanyNew />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/company/dashboard">
                    회사 대시보드
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>재무 관리</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">재무 관리</h1>
                <p className="text-muted-foreground">
                  회사 전체의 재무 현황과 브랜드별 수익성을 분석합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[120px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">이번 주</SelectItem>
                    <SelectItem value="month">이번 달</SelectItem>
                    <SelectItem value="quarter">이번 분기</SelectItem>
                    <SelectItem value="year">올해</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 주요 재무 지표 */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{formatPercentage(stats.revenueGrowth)} 전월 대비
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 비용</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
                    <div className="flex items-center text-xs text-red-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{formatPercentage(stats.expenseGrowth)} 전월 대비
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">순이익</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.netProfit)}</div>
                    <div className="text-xs text-muted-foreground">
                      이번 달: {formatCurrency(stats.monthlyRevenue - stats.monthlyExpenses)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">수익률</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(stats.profitMargin)}</div>
                    <div className="text-xs text-muted-foreground">
                      업계 평균: 18.5%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 분석 탭 */}
            <Tabs defaultValue="brands" className="space-y-4">
              <TabsList>
                <TabsTrigger value="brands">브랜드별 분석</TabsTrigger>
                <TabsTrigger value="stores">매장별 분석</TabsTrigger>
                <TabsTrigger value="reports">상세 리포트</TabsTrigger>
              </TabsList>

              <TabsContent value="brands" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>브랜드별 재무 성과</CardTitle>
                      <CardDescription>
                        각 브랜드의 매출, 비용, 수익성을 비교 분석합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {brandFinances.map((brand) => (
                          <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{brand.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  수익률: {formatPercentage(brand.profitMargin)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">매출</p>
                                  <p className="font-semibold">{formatCurrency(brand.revenue)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">순이익</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(brand.profit)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">성장률</p>
                                  <div className="flex items-center">
                                    {brand.growth > 0 ? (
                                      <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                                    ) : (
                                      <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                                    )}
                                    <span className={brand.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatPercentage(Math.abs(brand.growth))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stores" className="space-y-4">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>매장별 재무 성과</CardTitle>
                      <CardDescription>
                        각 매장의 수익성과 운영 효율성을 분석합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {storeFinances.map((store) => (
                          <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{store.name}</h3>
                                <p className="text-sm text-muted-foreground">{store.brandName}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">매출</p>
                                  <p className="font-semibold">{formatCurrency(store.revenue)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">순이익</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(store.profit)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">수익률</p>
                                  <Badge variant={store.profitMargin > 25 ? 'default' : store.profitMargin > 20 ? 'secondary' : 'outline'}>
                                    {formatPercentage(store.profitMargin)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>상세 재무 리포트</CardTitle>
                      <CardDescription>
                        더 자세한 재무 분석을 위한 전용 페이지들입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/company/finance/revenue">
                        <Button variant="outline" className="w-full justify-start">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          매출 현황 분석
                        </Button>
                      </Link>
                      <Link href="/company/finance/expenses">
                        <Button variant="outline" className="w-full justify-start">
                          <TrendingDown className="mr-2 h-4 w-4" />
                          비용 분석
                        </Button>
                      </Link>
                      <Link href="/company/finance/profitability">
                        <Button variant="outline" className="w-full justify-start">
                          <PieChart className="mr-2 h-4 w-4" />
                          수익성 분석
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>재무 요약</CardTitle>
                      <CardDescription>
                        이번 달 주요 재무 지표 요약
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">월 매출</span>
                            <span className="font-semibold">{formatCurrency(stats.monthlyRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">월 비용</span>
                            <span className="font-semibold">{formatCurrency(stats.monthlyExpenses)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">월 순이익</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(stats.monthlyRevenue - stats.monthlyExpenses)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">수익률</span>
                            <Badge variant="default">{formatPercentage(stats.profitMargin)}</Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}