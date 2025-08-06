'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary, InlineError } from '@/components/ui/error-boundary';
import { AppSidebarCompany } from '@/components/dashboard/app-sidebar-company';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeaderCompany } from '@/components/dashboard/site-header-company';
import {
  Store,
  MapPin,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  Clock,
  Package,
} from 'lucide-react';
import type { Store as StoreType, ERPRole } from '@/types/database.types';

interface StoreWithBrand extends StoreType {
  brands?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function StoreDashboard() {
  const [stores, setStores] = useState<StoreWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (!profile) {
        setError('사용자 정보를 확인할 수 없습니다.');
        return;
      }

      try {
        // Supabase 클라이언트 생성 (RLS 정책 적용)
        const supabase = createClient();
        
        const userRole = profile.role as ERPRole;
        
        // 매장 관리 권한 확인
        if (!['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff'].includes(userRole)) {
          setError('매장 대시보드에 접근할 권한이 없습니다.');
          return;
        }
        
        // 사용자 역할에 따른 매장 목록 조회
        const storesQuery = supabase
          .from('stores')
          .select(`
            *,
            brands!stores_brand_id_fkey(
              id,
              name,
              code
            )
          `)
          .eq('is_active', true);
        
        // 매장 직원/관리자인 경우 자신이 속한 매장만 조회
        if (userRole === 'store_manager' || userRole === 'store_staff') {
          // TODO: 사용자가 속한 매장 ID 조회 후 필터링
          // storesQuery = storesQuery.in('id', userStoreIds);
        }
        
        const { data: storesData, error: storesError } = await storesQuery.order('name');

        if (storesError) {
          setError('매장 정보를 불러올 수 없습니다.');
          console.error('Stores fetch error:', {
            message: storesError.message || String(storesError),
            error: storesError
          });
          return;
        }

        setStores(storesData || []);

      } catch (err) {
        console.error('Store dashboard data fetch error:', {
          message: err instanceof Error ? err.message : String(err),
          error: err
        });
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, profile, router]);

  // 주소 포맷팅 함수
  const formatAddress = (address: string | object | null): string => {
    if (!address) return '주소 없음';
    
    if (typeof address === 'string') return address;
    
    // JSON 객체인 경우
    const addressData = address as any;
    if (addressData.full_address) return addressData.full_address;
    
    const parts = [
      addressData.street,
      addressData.city,
      addressData.district,
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(' ') : '주소 없음';
  };

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
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebarCompany />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SiteHeaderCompany />
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-green-50">
              <div className="p-6 lg:p-8">
                <InlineError 
                  message={error} 
                  onRetry={() => window.location.reload()}
                />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebarCompany />
          <div className="flex-1 flex flex-col overflow-hidden">
            <SiteHeaderCompany />
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-green-50">
              <div className="p-6 lg:p-8">
                <BrandAdminUp fallback={<AccessDenied message="매장 대시보드에 접근할 권한이 없습니다." />}>
                  <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">매장 대시보드</h1>
            <p className="text-gray-600 mt-1">등록된 매장들을 관리하고 모니터링하세요</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            새 매장 추가
          </Button>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 매장</p>
                <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 매장</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.filter(store => store.is_active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 수용인원</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.length > 0 
                    ? Math.round(stores.reduce((sum, store) => sum + (store.capacity || 0), 0) / stores.length)
                    : 0
                  }명
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 면적</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stores.reduce((sum, store) => sum + (store.area_sqm || 0), 0)}m²
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* 매장 목록 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">매장 목록</h2>
            <Button variant="outline">전체 보기</Button>
          </div>

          {stores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 매장이 없습니다</h3>
              <p className="text-gray-600 mb-4">첫 번째 매장을 추가하여 시작해보세요</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                매장 추가
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => (
                <Card 
                  key={store.id} 
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/store/${store.id}/dashboard`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        <Badge variant={store.is_active ? 'default' : 'secondary'}>
                          {store.is_active ? '영업중' : '휴업'}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate">{formatAddress(store.address)}</span>
                      </div>
                      {store.brands && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Badge variant="outline" className="text-xs">
                            {store.brands.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">매장 코드</span>
                      <span className="font-medium">{store.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">매장 유형</span>
                      <span className="font-medium">{store.type}</span>
                    </div>
                    {store.capacity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">수용인원</span>
                        <span className="font-medium">{store.capacity}명</span>
                      </div>
                    )}
                    {store.area_sqm && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">면적</span>
                        <span className="font-medium">{store.area_sqm}m²</span>
                      </div>
                    )}
                    {store.opening_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">개점일</span>
                        <span className="font-medium">
                          {new Date(store.opening_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                새 매장 추가
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                재고 관리
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                매출 분석
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                운영 시간 관리
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 현황</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">신규 주문</span>
                <span className="text-sm font-medium text-green-600">+12건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">재고 부족 알림</span>
                <span className="text-sm font-medium text-yellow-600">3건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">완료된 주문</span>
                <span className="text-sm font-medium text-blue-600">45건</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">오늘 매출</span>
                <span className="text-sm font-medium text-green-600">₩1,250,000</span>
              </div>
            </div>
          </Card>
        </div>
                    </div>
                  </BrandAdminUp>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ErrorBoundary>
  );
}