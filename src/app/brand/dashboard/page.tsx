'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrandAdminUp, CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary, InlineError } from '@/components/ui/error-boundary';
import {
  Building2,
  Store,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
} from 'lucide-react';
import type { Brand, ERPRole } from '@/types/database.types';

export default function BrandDashboard() {
  const [brands, setBrands] = useState<Brand[]>([]);
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
        
        // 브랜드 관리 권한 확인
        if (!['super_admin', 'company_admin', 'brand_admin', 'brand_staff'].includes(userRole)) {
          setError('브랜드 대시보드에 접근할 권한이 없습니다.');
          return;
        }
        
        // 사용자 역할에 따른 브랜드 목록 조회
        const brandsQuery = supabase
          .from('brands')
          .select(`
            *,
            stores!stores_brand_id_fkey(count)
          `)
          .eq('is_active', true);
        
        // 브랜드 직원/관리자인 경우 자신이 속한 브랜드만 조회
        if (userRole === 'brand_admin' || userRole === 'brand_staff') {
          // TODO: 사용자가 속한 브랜드 ID 조회 후 필터링
          // brandsQuery = brandsQuery.in('id', userBrandIds);
        }
        
        const { data: brandsData, error: brandsError } = await brandsQuery.order('name');

        if (brandsError) {
          setError('브랜드 정보를 불러올 수 없습니다.');
          console.error('Brands fetch error:', brandsError);
          return;
        }

        setBrands(brandsData || []);

      } catch (err) {
        console.error('Brand dashboard data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, profile, router]);

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
      <DashboardLayout title="브랜드 관리">
        <InlineError 
          message={error} 
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout title="브랜드 관리">
        <BrandAdminUp fallback={<AccessDenied message="브랜드 대시보드에 접근할 권한이 없습니다." />}>
          <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">브랜드 대시보드</h1>
            <p className="text-gray-600 mt-1">등록된 브랜드들을 관리하고 모니터링하세요</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            새 브랜드 추가
          </Button>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 브랜드</p>
                <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 매장 수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {brands.reduce((sum, brand) => sum + (brand.stores?.length || 0), 0)}
                </p>
              </div>
              <Store className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 브랜드</p>
                <p className="text-2xl font-bold text-gray-900">
                  {brands.filter(brand => brand.is_active).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">평균 매장/브랜드</p>
                <p className="text-2xl font-bold text-gray-900">
                  {brands.length > 0 
                    ? Math.round(brands.reduce((sum, brand) => sum + (brand.stores?.length || 0), 0) / brands.length * 10) / 10
                    : 0
                  }
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* 브랜드 목록 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">브랜드 목록</h2>
            <Button variant="outline">전체 보기</Button>
          </div>

          {brands.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 브랜드가 없습니다</h3>
              <p className="text-gray-600 mb-4">첫 번째 브랜드를 추가하여 시작해보세요</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                브랜드 추가
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <Card 
                  key={brand.id} 
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/brand/${brand.id}/dashboard`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                        <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                          {brand.is_active ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {brand.description || '설명이 없습니다'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">브랜드 코드</span>
                      <span className="font-medium">{brand.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">매장 수</span>
                      <span className="font-medium">{brand.stores?.length || 0}개</span>
                    </div>
                    {brand.domain && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">도메인</span>
                        <span className="font-medium text-blue-600">{brand.domain}</span>
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
                새 브랜드 추가
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Store className="w-4 h-4 mr-2" />
                매장 관리
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                성과 분석
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">새 매장 추가</span>
                <span className="text-xs text-gray-400">2시간 전</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">브랜드 설정 업데이트</span>
                <span className="text-xs text-gray-400">1일 전</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">메뉴 카테고리 추가</span>
                <span className="text-xs text-gray-400">3일 전</span>
              </div>
            </div>
          </Card>
        </div>
          </div>
        </BrandAdminUp>
      </DashboardLayout>
    </ErrorBoundary>
  );
}