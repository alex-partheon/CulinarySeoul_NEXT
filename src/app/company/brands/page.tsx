'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { logError, getDisplayErrorMessage } from '@/lib/utils/error-handling';
import { BrandService } from '@/services/brand-service';
import type { BrandWithRelations, BrandStats, CreateBrandInput } from '@/types/brand';
import { SmartBrandForm } from '@/components/forms/SmartBrandForm';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Store,
  DollarSign,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const supabase = createClient();

// 기존 인터페이스들은 /src/types/brand.ts로 이동
// 새로운 타입 시스템 사용

export default function BrandsManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [brands, setBrands] = useState<BrandWithRelations[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [_loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandWithRelations | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 브랜드 생성 상태
  const [isCreating, setIsCreating] = useState(false);

  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      
      // 사용자 인증 상태 확인
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }
      
      console.warn('✅ 브랜드 서비스를 통한 데이터 조회 중...');
      
      // 새로운 BrandService 사용
      const brandsResult = await BrandService.getBrands({
        include_relations: true,
        filter: {
          search_term: searchTerm || undefined,
          is_active: statusFilter === 'all' ? 'all' : statusFilter === 'active'
        },
        sort: {
          field: 'created_at',
          direction: 'desc'
        }
      });

      if (!brandsResult.success) {
        // 안전한 오류 분석 및 로깅
        logError('브랜드 조회 오류:', brandsResult.error);
        
        // 사용자 친화적인 오류 메시지 표시
        let userMessage = `브랜드 데이터를 불러오는데 실패했습니다: ${brandsResult.error}`;
        
        // 특정 오류 코드에 대한 추가 안내
        if (brandsResult.code === 'PGRST116' || brandsResult.code?.includes('permission')) {
          userMessage += ' 관리자에게 문의하세요.';
        } else if (brandsResult.code?.includes('auth')) {
          userMessage += ' 페이지를 새로고침하거나 다시 로그인해주세요.';
        }
        
        toast.error(userMessage);
        return;
      }
      
      console.warn('브랜드 데이터 로드 성공:', brandsResult.data.length, '개');
      setBrands(brandsResult.data);
      
      // 통계 조회
      const statsResult = await BrandService.getBrandStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        console.warn('통계 조회 실패:', statsResult.error);
        // 통계는 필수가 아니므로 오류 토스트 없이 로그만 남김
      }
      
    } catch (error) {
      // 안전한 오류 분석 및 로깅
      logError('브랜드 로딩 오류:', error);
      
      // 사용자 친화적인 오류 메시지 표시
      const displayMessage = getDisplayErrorMessage(error);
      toast.error(`브랜드 데이터를 불러오는데 실패했습니다: ${displayMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, statusFilter]);

  // 브랜드 데이터 로드
  useEffect(() => {
    if (user) {
      loadBrands();
    }
  }, [user, loadBrands]); // loadBrands는 useCallback으로 메모이제이션됨

  // 브랜드 생성 (SmartBrandForm 호환)
  const handleCreateBrand = async (formData: CreateBrandInput) => {
    try {
      setIsCreating(true);
      
      // 회사 ID 조회 (첫 번째 회사 사용)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
        .single();

      if (companyError) {
        logError('회사 정보 조회 오류:', companyError);
        const displayMessage = getDisplayErrorMessage(companyError);
        toast.error(`회사 정보를 찾을 수 없습니다: ${displayMessage}`);
        return;
      }
      
      // 회사 ID 설정
      const createInput: CreateBrandInput = {
        ...formData,
        company_id: companyData.id,
      };

      const result = await BrandService.createBrand(createInput);

      if (!result.success) {
        // 서비스에서 반환된 오류 처리
        if (result.code === 'DUPLICATE_CODE') {
          toast.error('이미 존재하는 브랜드 코드입니다. 다른 코드를 사용해주세요.');
        } else if (result.code === 'DUPLICATE_DOMAIN') {
          toast.error('이미 존재하는 도메인입니다. 다른 도메인을 사용해주세요.');
        } else if (result.code === 'VALIDATION_ERROR') {
          toast.error(`입력 데이터 오류: ${result.error}`);
        } else {
          toast.error(`브랜드 생성에 실패했습니다: ${result.error}`);
        }
        throw new Error(result.error); // SmartBrandForm에서 오류 처리
      }

      toast.success('브랜드가 성공적으로 생성되었습니다.');
      setIsCreateDialogOpen(false);
      loadBrands(); // 목록 새로고침
      
    } catch (error: unknown) {
      // 예상치 못한 오류 처리
      logError('브랜드 생성 예외:', error);
      const displayMessage = getDisplayErrorMessage(error);
      toast.error(`브랜드 생성 중 오류가 발생했습니다: ${displayMessage}`);
      throw error; // SmartBrandForm에서 오류 처리
    } finally {
      setIsCreating(false);
    }
  };

  // 브랜드 삭제 (소프트 삭제 사용)
  const handleDeleteBrand = async () => {
    if (!selectedBrand) return;

    try {
      // 새로운 BrandService 사용하여 삭제 (소프트 삭제)
      const result = await BrandService.deleteBrand(selectedBrand.id, true);

      if (!result.success) {
        toast.error(`브랜드 삭제에 실패했습니다: ${result.error}`);
        return;
      }

      toast.success('브랜드가 비활성화되었습니다.');
      setIsDeleteDialogOpen(false);
      setSelectedBrand(null);
      loadBrands(); // 목록 새로고침
      
    } catch (error) {
      // 예상치 못한 오류 처리
      logError('브랜드 삭제 예외:', error);
      const displayMessage = getDisplayErrorMessage(error);
      toast.error(`브랜드 삭제 중 오류가 발생했습니다: ${displayMessage}`);
    }
  };

  // 필터링된 브랜드 목록
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && brand.is_active) ||
                         (statusFilter === 'inactive' && !brand.is_active);
    return matchesSearch && matchesStatus;
  });



  // 브랜드 테이블 컬럼 정의 (타입 개선)
  const columns: Array<{
    key: keyof BrandWithRelations;
    header: string;
    cell: ({ row }: { row: { original: BrandWithRelations; getValue: (key: string) => unknown } }) => JSX.Element;
  }> = [
    {
      key: 'name' as keyof BrandWithRelations,
      header: '브랜드명',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => {
        const brand = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">{brand.name}</div>
              <div className="text-sm text-muted-foreground">{brand.code}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'is_active' as keyof BrandWithRelations,
      header: '상태',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => {
        const isActive = row.original.is_active;
        return (
          <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isActive ? '활성' : '비활성'}
          </Badge>
        );
      },
    },
    {
      key: 'stores_count' as keyof BrandWithRelations,
      header: '매장 수',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => {
        const count = row.original.stores_count || 0;
        return (
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-muted-foreground" />
            <span>{count}개</span>
          </div>
        );
      },
    },
    {
      key: 'total_revenue' as keyof BrandWithRelations,
      header: '총 매출',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => {
        const revenue = row.original.total_revenue || 0;
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span>₩{revenue.toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      key: 'domain' as keyof BrandWithRelations,
      header: '도메인',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.domain || '-'}
        </span>
      ),
    },
    {
      key: 'id' as keyof BrandWithRelations,
      header: '작업',
      cell: ({ row }: { row: { original: BrandWithRelations } }) => {
        const brand = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/brand/${brand.id}/dashboard`)}>
                <Eye className="mr-2 h-4 w-4" />
                대시보드 보기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedBrand(brand);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                편집
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  setSelectedBrand(brand);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <ErrorBoundary>
      <CompanyAdminUp fallback={<AccessDenied />}>
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
                    <BreadcrumbPage>브랜드 관리</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
              <div className="p-6 lg:p-8 space-y-8">
                {/* 페이지 헤더 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">브랜드 관리</h1>
                    <p className="text-muted-foreground mt-2">
                      회사의 모든 브랜드를 관리하고 분리 준비도를 모니터링합니다.
                    </p>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        새 브랜드 생성
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="p-2">
                        <SmartBrandForm
                          onSubmit={handleCreateBrand}
                          onCancel={() => setIsCreateDialogOpen(false)}
                          isLoading={isCreating}
                          showAdvancedOptions={true}
                          className="shadow-none border-none"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 통계 카드 */}
                {stats && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 브랜드</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_brands}</div>
                        <p className="text-xs text-muted-foreground">
                          활성: {stats.active_brands}개
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 매장</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{brands.reduce((sum, brand) => sum + (brand.stores_count || 0), 0)}</div>
                        <p className="text-xs text-muted-foreground">
                          전체 브랜드 매장 수
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ₩{brands.reduce((sum, brand) => sum + (brand.total_revenue || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          전체 브랜드 매출
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">평균 매장 수</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {brands.length > 0 
                            ? Math.round(brands.reduce((sum, brand) => sum + (brand.stores_count || 0), 0) / brands.length)
                            : 0
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">
                          브랜드당 평균 매장 수
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 필터 및 검색 */}
                <Card>
                  <CardHeader>
                    <CardTitle>브랜드 목록</CardTitle>
                    <CardDescription>
                      등록된 모든 브랜드를 확인하고 관리할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="브랜드명 또는 코드로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 상태</SelectItem>
                          <SelectItem value="active">활성</SelectItem>
                          <SelectItem value="inactive">비활성</SelectItem>
                          <SelectItem value="pending">대기</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 브랜드 테이블 */}
                    <DataTable
                      columns={columns}
                      data={filteredBrands}
                    />
                  </CardContent>
                </Card>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>브랜드 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 &quot;{selectedBrand?.name}&quot; 브랜드를 삭제하시겠습니까? 
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBrand} className="bg-red-600 hover:bg-red-700">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CompanyAdminUp>
    </ErrorBoundary>
  );
}