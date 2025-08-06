'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Calendar,
  Target,
  Award,
  Activity,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import Link from 'next/link';



interface AnalyticsStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
}

interface BrandPerformance {
  id: string;
  name: string;
  revenue: number;
  revenueGrowth: number;
  customers: number;
  customerGrowth: number;
  orders: number;
  averageOrderValue: number;
  marketShare: number;
}

interface SalesTrend {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  percentage: number;
  averageSpend: number;
  retention: number;
}

interface OperationalMetric {
  metric: string;
  value: number;
  unit: string;
  trend: number;
  target: number;
  status: 'good' | 'warning' | 'poor';
}

export default function AnalyticsReportPage() {
  const { user, hasMinimumRole } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [brandPerformances, setBrandPerformances] = useState<BrandPerformance[]>([]);
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetric[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 분석 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 전체 분석 통계 (시뮬레이션)
      const mockStats: AnalyticsStats = {
        totalRevenue: 125000000, // 1억 2천 5백만원
        revenueGrowth: 12.5,
        totalCustomers: 8450,
        customerGrowth: 8.3,
        totalOrders: 15670,
        orderGrowth: 15.2,
        averageOrderValue: 7980,
        aovGrowth: -2.1,
      };

      // 브랜드 성과 데이터 (시뮬레이션)
      const mockBrandPerformances: BrandPerformance[] = [
        {
          id: '1',
          name: '밀랍(millab)',
          revenue: 85000000,
          revenueGrowth: 15.2,
          customers: 5200,
          customerGrowth: 12.1,
          orders: 9800,
          averageOrderValue: 8673,
          marketShare: 68.0,
        },
        {
          id: '2',
          name: '컬리너리서울 카페',
          revenue: 40000000,
          revenueGrowth: 8.7,
          customers: 3250,
          customerGrowth: 3.5,
          orders: 5870,
          averageOrderValue: 6814,
          marketShare: 32.0,
        },
      ];

      // 매출 트렌드 데이터 (시뮬레이션)
      const mockSalesTrends: SalesTrend[] = [
        { period: '1월', revenue: 9500000, orders: 1200, customers: 650 },
        { period: '2월', revenue: 8800000, orders: 1100, customers: 620 },
        { period: '3월', revenue: 10200000, orders: 1280, customers: 680 },
        { period: '4월', revenue: 11500000, orders: 1450, customers: 720 },
        { period: '5월', revenue: 12800000, orders: 1600, customers: 780 },
        { period: '6월', revenue: 13200000, orders: 1650, customers: 800 },
        { period: '7월', revenue: 14100000, orders: 1750, customers: 850 },
        { period: '8월', revenue: 13800000, orders: 1720, customers: 830 },
        { period: '9월', revenue: 12900000, orders: 1620, customers: 790 },
        { period: '10월', revenue: 13500000, orders: 1680, customers: 810 },
        { period: '11월', revenue: 14800000, orders: 1850, customers: 890 },
        { period: '12월', revenue: 15900000, orders: 1980, customers: 920 },
      ];

      // 고객 세그먼트 데이터 (시뮬레이션)
      const mockCustomerSegments: CustomerSegment[] = [
        {
          segment: 'VIP 고객',
          count: 425,
          percentage: 5.0,
          averageSpend: 45000,
          retention: 92.5,
        },
        {
          segment: '단골 고객',
          count: 1690,
          percentage: 20.0,
          averageSpend: 25000,
          retention: 78.3,
        },
        {
          segment: '일반 고객',
          count: 4225,
          percentage: 50.0,
          averageSpend: 12000,
          retention: 45.2,
        },
        {
          segment: '신규 고객',
          count: 2110,
          percentage: 25.0,
          averageSpend: 8500,
          retention: 25.8,
        },
      ];

      // 운영 지표 데이터 (시뮬레이션)
      const mockOperationalMetrics: OperationalMetric[] = [
        {
          metric: '고객 만족도',
          value: 4.6,
          unit: '/5.0',
          trend: 0.2,
          target: 4.5,
          status: 'good',
        },
        {
          metric: '주문 처리 시간',
          value: 12.5,
          unit: '분',
          trend: -1.2,
          target: 15.0,
          status: 'good',
        },
        {
          metric: '재고 회전율',
          value: 8.5,
          unit: '회/월',
          trend: 0.8,
          target: 10.0,
          status: 'warning',
        },
        {
          metric: '직원 생산성',
          value: 85.2,
          unit: '%',
          trend: 2.1,
          target: 90.0,
          status: 'warning',
        },
        {
          metric: '비용 효율성',
          value: 76.8,
          unit: '%',
          trend: -1.5,
          target: 80.0,
          status: 'poor',
        },
      ];

      setStats(mockStats);
      setBrandPerformances(mockBrandPerformances);
      setSalesTrends(mockSalesTrends);
      setCustomerSegments(mockCustomerSegments);
      setOperationalMetrics(mockOperationalMetrics);

    } catch (error) {
      console.error('분석 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good': return <Badge variant="default" className="bg-green-100 text-green-800">양호</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">주의</Badge>;
      case 'poor': return <Badge variant="destructive">개선 필요</Badge>;
      default: return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    } else if (trend < 0) {
      return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    }
    return null;
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
                  <BreadcrumbPage>분석 리포트</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">분석 리포트</h1>
                <p className="text-muted-foreground">
                  비즈니스 성과와 운영 효율성을 종합적으로 분석합니다.
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
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  리포트 다운로드
                </Button>
              </div>
            </div>

            {/* 주요 성과 지표 */}
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
                    <CardTitle className="text-sm font-medium">총 고객 수</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalCustomers)}</div>
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{formatPercentage(stats.customerGrowth)} 전월 대비
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 주문 수</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.totalOrders)}</div>
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{formatPercentage(stats.orderGrowth)} 전월 대비
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">평균 주문 금액</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
                    <div className="flex items-center text-xs text-red-600">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      {formatPercentage(Math.abs(stats.aovGrowth))} 전월 대비
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 분석 탭 */}
            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="performance">브랜드 성과</TabsTrigger>
                <TabsTrigger value="trends">매출 트렌드</TabsTrigger>
                <TabsTrigger value="customers">고객 분석</TabsTrigger>
                <TabsTrigger value="operations">운영 지표</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>브랜드별 성과 비교</CardTitle>
                    <CardDescription>
                      각 브랜드의 매출, 고객, 주문 성과를 비교 분석합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {brandPerformances.map((brand) => (
                        <div key={brand.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Award className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{brand.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  시장 점유율: {formatPercentage(brand.marketShare)}
                                </p>
                              </div>
                            </div>
                            <Link href={`/brand/${brand.id}/analytics`}>
                              <Button variant="outline" size="sm">
                                상세 분석
                              </Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">매출</p>
                              <p className="text-lg font-semibold">{formatCurrency(brand.revenue)}</p>
                              <div className="flex items-center justify-center text-xs text-green-600">
                                {getTrendIcon(brand.revenueGrowth)}
                                <span className="ml-1">+{formatPercentage(brand.revenueGrowth)}</span>
                              </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">고객 수</p>
                              <p className="text-lg font-semibold">{formatNumber(brand.customers)}</p>
                              <div className="flex items-center justify-center text-xs text-green-600">
                                {getTrendIcon(brand.customerGrowth)}
                                <span className="ml-1">+{formatPercentage(brand.customerGrowth)}</span>
                              </div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">주문 수</p>
                              <p className="text-lg font-semibold">{formatNumber(brand.orders)}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">평균 주문액</p>
                              <p className="text-lg font-semibold">{formatCurrency(brand.averageOrderValue)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>월별 매출 트렌드</CardTitle>
                    <CardDescription>
                      지난 12개월간의 매출, 주문, 고객 트렌드를 분석합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                          <SelectTrigger className="w-[150px]">
                            <LineChart className="mr-2 h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">매출</SelectItem>
                            <SelectItem value="orders">주문 수</SelectItem>
                            <SelectItem value="customers">고객 수</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {salesTrends.map((trend, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <h4 className="font-medium text-sm">{trend.period}</h4>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">매출</span>
                                <span className="font-semibold">{formatCurrency(trend.revenue)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">주문</span>
                                <span className="font-semibold">{formatNumber(trend.orders)}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">고객</span>
                                <span className="font-semibold">{formatNumber(trend.customers)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>고객 세그먼트 분석</CardTitle>
                    <CardDescription>
                      고객을 세그먼트별로 분류하여 특성과 가치를 분석합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customerSegments.map((segment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{segment.segment}</h3>
                              <p className="text-sm text-muted-foreground">
                                전체의 {formatPercentage(segment.percentage)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">고객 수</p>
                              <p className="font-semibold">{formatNumber(segment.count)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">평균 구매액</p>
                              <p className="font-semibold">{formatCurrency(segment.averageSpend)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">재방문율</p>
                              <p className="font-semibold">{formatPercentage(segment.retention)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>운영 효율성 지표</CardTitle>
                    <CardDescription>
                      비즈니스 운영의 핵심 지표들을 모니터링합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {operationalMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Activity className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{metric.metric}</h3>
                              <p className="text-sm text-muted-foreground">
                                목표: {metric.target}{metric.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">현재 값</p>
                              <p className="text-lg font-semibold">
                                {metric.value}{metric.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">변화</p>
                              <div className="flex items-center">
                                {getTrendIcon(metric.trend)}
                                <span className={`ml-1 font-semibold ${
                                  metric.trend > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {metric.trend > 0 ? '+' : ''}{metric.trend}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">상태</p>
                              {getStatusBadge(metric.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}