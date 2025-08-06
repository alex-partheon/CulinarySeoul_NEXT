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
import { Input } from '@/components/ui/input';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Building2,
  Store,
  BarChart3,
  Clock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

const _supabase = createClient();

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  turnoverRate: number;
}

interface BrandInventory {
  id: string;
  name: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  lastUpdated: string;
}

interface StoreInventory {
  id: string;
  name: string;
  brandName: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring';
  itemName: string;
  storeName: string;
  brandName: string;
  currentStock: number;
  minimumStock: number;
  expiryDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function InventoryIntegrationPage() {
  const { user, hasMinimumRole } = useAuth();
  const _router = useRouter();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [brandInventories, setBrandInventories] = useState<BrandInventory[]>([]);
  const [storeInventories, setStoreInventories] = useState<StoreInventory[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [_loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 재고 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 전체 재고 통계 (시뮬레이션)
      const mockStats: InventoryStats = {
        totalItems: 1247,
        totalValue: 45600000, // 4천 5백 60만원
        lowStockItems: 23,
        outOfStockItems: 5,
        expiringItems: 12,
        turnoverRate: 8.5, // 8.5회/월
      };

      // 브랜드별 재고 데이터 (시뮬레이션)
      const mockBrandInventories: BrandInventory[] = [
        {
          id: '1',
          name: '밀랍(millab)',
          totalItems: 847,
          totalValue: 32400000,
          lowStockItems: 15,
          outOfStockItems: 3,
          lastUpdated: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          name: '컬리너리서울 카페',
          totalItems: 400,
          totalValue: 13200000,
          lowStockItems: 8,
          outOfStockItems: 2,
          lastUpdated: '2024-01-15T09:45:00Z',
        },
      ];

      // 매장별 재고 데이터 (시뮬레이션)
      const mockStoreInventories: StoreInventory[] = [
        {
          id: '1',
          name: '성수점',
          brandName: '밀랍(millab)',
          totalItems: 425,
          totalValue: 16200000,
          lowStockItems: 8,
          outOfStockItems: 1,
          status: 'warning',
        },
        {
          id: '2',
          name: '홍대점',
          brandName: '밀랍(millab)',
          totalItems: 422,
          totalValue: 16200000,
          lowStockItems: 7,
          outOfStockItems: 2,
          status: 'warning',
        },
        {
          id: '3',
          name: '강남점',
          brandName: '컬리너리서울 카페',
          totalItems: 250,
          totalValue: 8200000,
          lowStockItems: 5,
          outOfStockItems: 1,
          status: 'healthy',
        },
        {
          id: '4',
          name: '명동점',
          brandName: '컬리너리서울 카페',
          totalItems: 150,
          totalValue: 5000000,
          lowStockItems: 3,
          outOfStockItems: 1,
          status: 'critical',
        },
      ];

      // 재고 알림 데이터 (시뮬레이션)
      const mockAlerts: InventoryAlert[] = [
        {
          id: '1',
          type: 'out_of_stock',
          itemName: '아메리카노 원두 (1kg)',
          storeName: '성수점',
          brandName: '밀랍(millab)',
          currentStock: 0,
          minimumStock: 5,
          priority: 'high',
        },
        {
          id: '2',
          type: 'low_stock',
          itemName: '카페라떼 시럽',
          storeName: '홍대점',
          brandName: '밀랍(millab)',
          currentStock: 2,
          minimumStock: 10,
          priority: 'medium',
        },
        {
          id: '3',
          type: 'expiring',
          itemName: '우유 (1L)',
          storeName: '강남점',
          brandName: '컬리너리서울 카페',
          currentStock: 15,
          minimumStock: 5,
          expiryDate: '2024-01-18',
          priority: 'high',
        },
        {
          id: '4',
          type: 'low_stock',
          itemName: '디저트 포장지',
          storeName: '명동점',
          brandName: '컬리너리서울 카페',
          currentStock: 3,
          minimumStock: 20,
          priority: 'low',
        },
      ];

      setStats(mockStats);
      setBrandInventories(mockBrandInventories);
      setStoreInventories(mockStoreInventories);
      setAlerts(mockAlerts);

    } catch (error) {
      console.error('재고 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">정상</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">주의</Badge>;
      case 'critical': return <Badge variant="destructive">위험</Badge>;
      default: return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">높음</Badge>;
      case 'medium': return <Badge variant="secondary">보통</Badge>;
      case 'low': return <Badge variant="outline">낮음</Badge>;
      default: return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'expiring': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredStoreInventories = storeInventories.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || store.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
                  <BreadcrumbPage>재고 통합</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">재고 통합</h1>
                <p className="text-muted-foreground">
                  전체 브랜드와 매장의 재고 현황을 통합 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  재고 리포트
                </Button>
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  재고 조정
                </Button>
              </div>
            </div>

            {/* 주요 재고 지표 */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 재고 품목</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      총 가치: {formatCurrency(stats.totalValue)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">재고 부족</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
                    <div className="text-xs text-muted-foreground">
                      품절: {stats.outOfStockItems}개
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">유통기한 임박</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.expiringItems}</div>
                    <div className="text-xs text-muted-foreground">
                      7일 이내 만료
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">재고 회전율</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.turnoverRate}</div>
                    <div className="text-xs text-muted-foreground">
                      회/월 (목표: 10회)
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 분석 탭 */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">전체 현황</TabsTrigger>
                <TabsTrigger value="brands">브랜드별</TabsTrigger>
                <TabsTrigger value="stores">매장별</TabsTrigger>
                <TabsTrigger value="alerts">알림</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>브랜드별 재고 현황</CardTitle>
                      <CardDescription>
                        각 브랜드의 재고 상태를 요약합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {brandInventories.map((brand) => (
                          <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">{brand.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  업데이트: {formatDate(brand.lastUpdated)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{brand.totalItems}개</p>
                              <p className="text-xs text-muted-foreground">
                                부족: {brand.lowStockItems}개
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>긴급 알림</CardTitle>
                      <CardDescription>
                        즉시 조치가 필요한 재고 문제들입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {alerts.filter(alert => alert.priority === 'high').map((alert) => (
                          <div key={alert.id} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{alert.itemName}</p>
                              <p className="text-xs text-muted-foreground">
                                {alert.storeName} ({alert.brandName})
                              </p>
                            </div>
                            {getPriorityBadge(alert.priority)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="brands" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>브랜드별 재고 상세</CardTitle>
                    <CardDescription>
                      각 브랜드의 재고 현황과 가치를 상세히 분석합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {brandInventories.map((brand) => (
                        <div key={brand.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{brand.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  마지막 업데이트: {formatDate(brand.lastUpdated)}
                                </p>
                              </div>
                            </div>
                            <Link href={`/brand/${brand.id}/inventory`}>
                              <Button variant="outline" size="sm">
                                상세 보기
                              </Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">총 품목</p>
                              <p className="text-lg font-semibold">{brand.totalItems}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">총 가치</p>
                              <p className="text-lg font-semibold">{formatCurrency(brand.totalValue)}</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">재고 부족</p>
                              <p className="text-lg font-semibold text-yellow-600">{brand.lowStockItems}</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">품절</p>
                              <p className="text-lg font-semibold text-red-600">{brand.outOfStockItems}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stores" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>매장별 재고 현황</CardTitle>
                    <CardDescription>
                      각 매장의 재고 상태와 운영 효율성을 모니터링합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="매장 또는 브랜드 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[120px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="healthy">정상</SelectItem>
                          <SelectItem value="warning">주의</SelectItem>
                          <SelectItem value="critical">위험</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      {filteredStoreInventories.map((store) => (
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
                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">총 품목</p>
                              <p className="font-semibold">{store.totalItems}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">총 가치</p>
                              <p className="font-semibold">{formatCurrency(store.totalValue)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">부족/품절</p>
                              <p className="font-semibold">{store.lowStockItems}/{store.outOfStockItems}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">상태</p>
                              {getStatusBadge(store.status)}
                            </div>
                            <Link href={`/store/${store.id}/inventory`}>
                              <Button variant="outline" size="sm">
                                관리
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>재고 알림</CardTitle>
                    <CardDescription>
                      재고 부족, 품절, 유통기한 임박 등의 알림을 관리합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getAlertIcon(alert.type)}
                            <div>
                              <h4 className="font-medium">{alert.itemName}</h4>
                              <p className="text-sm text-muted-foreground">
                                {alert.storeName} ({alert.brandName})
                              </p>
                              {alert.type === 'expiring' && alert.expiryDate && (
                                <p className="text-xs text-orange-600">
                                  유통기한: {new Date(alert.expiryDate).toLocaleDateString('ko-KR')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">현재/최소</p>
                              <p className="font-semibold">
                                {alert.currentStock}/{alert.minimumStock}
                              </p>
                            </div>
                            {getPriorityBadge(alert.priority)}
                            <Button variant="outline" size="sm">
                              조치
                            </Button>
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