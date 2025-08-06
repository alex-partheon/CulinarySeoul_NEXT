'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Store,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building2,
  DollarSign,
  Users,
  MapPin,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const supabase = createClient();



interface RawStore {
  id: string;
  brand_id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  brands: {
    id: string;
    name: string;
  } | null;
}

interface StoreData {
  id: string;
  brand_id: string;
  name: string;
  code: string;
  address?: string;
  coordinates?: Record<string, unknown>;
  floor_info?: string;
  opening_hours?: Record<string, unknown>;
  capacity?: number;
  area_sqm?: number;
  is_active: boolean;
  opening_date?: string;
  closing_date?: string;
  type: string;
  created_at: string;
  updated_at: string;
  // 관계 데이터
  brand?: {
    id: string;
    name: string;
    code: string;
  } | null;
  // 계산된 필드
  total_revenue: number;
  employee_count: number;
}



interface StoreStats {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  total_brands: number;
  total_revenue: number;
  total_employees: number;
}

export default function StoresManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [_loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [brands, setBrands] = useState<{ id: string; name: string; code: string; type?: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  
  // 다이얼로그 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 새 매장 생성 폼 상태
  const [newStore, setNewStore] = useState({
    name: '',
    code: '',
    brand_id: '',
    region: 'seoul', // 지역 (서울/경기/대전/대구/부산)
    district: '', // 구/시 (성동/판교 등)
    type: 'restaurant',
    capacity: 50,
    area_sqm: 100,
    status: 'preparing', // 오픈준비중/운영중/휴업/폐업
    manager_ids: [], // 담당자 ID 배열
  });
  const [isCreating, setIsCreating] = useState(false);

  // 매장 데이터 로드
  useEffect(() => {
    if (user) {
      // 병렬로 데이터 로드
      Promise.all([
        loadStores(),
        loadBrands(),
        loadUsers()
      ]).catch(error => {
        console.error('데이터 로딩 오류:', error);
      });
    }
  }, [user]);

  const loadBrands = useCallback(async () => {
    try {
      const { data: brandsData, error } = await supabase
        .from('brands')
        .select('id, name, code, type')
        .eq('is_active', true);

      if (error) throw error;

      const processedBrands = brandsData?.map(brand => ({
        id: brand.id,
        name: brand.name,
        code: brand.code,
        type: brand.type || 'restaurant'
      })) || [];

      setBrands(processedBrands);
    } catch (error) {
      console.error('브랜드 로딩 중 오류:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true);

      if (error) throw error;

      const processedUsers = usersData?.map(user => ({
        id: user.id,
        name: user.full_name || user.email,
        email: user.email
      })) || [];

      setUsers(processedUsers);
    } catch (error) {
      console.error('사용자 로딩 중 오류:', error);
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.log('사용자가 인증되지 않았습니다.');
        return;
      }
      
      // 매장 데이터 조회 (브랜드 관계 포함)
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          id,
          brand_id,
          name,
          code,
          is_active,
          created_at,
          updated_at,
          brands!inner (
            id,
            name
          )
        `);
        
      console.log('Supabase 쿼리 실행 완료');

      if (error) {
        console.error('매장 조회 오류:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        toast.error(`매장 데이터를 불러오는데 실패했습니다: ${error.message}`);
        return;
      }
      
      if (!storesData) {
        console.log('매장 데이터가 없습니다.');
        setStores([]);
        return;
      }
      
      console.log('매장 데이터 로드 성공:', storesData.length, '개');

      // 매장 데이터 가공 및 통계 계산을 한 번에 처리
      const processedStores: StoreData[] = [];
      const uniqueBrands = new Set<string>();
      let totalRevenue = 0;
      let totalEmployees = 0;
      let activeStores = 0;
      
      // 브랜드 데이터 추출
      const brandsMap = new Map();
      
      for (const store of storesData as RawStore[]) {
        const revenue = Math.floor(Math.random() * 5000000) + 500000;
        const employees = Math.floor(Math.random() * 20) + 5;
        
        const processedStore: StoreData = {
          ...store,
          brand: store.brands ? {
            id: store.brand_id,
            name: store.brands.name,
            code: store.brands.name.toLowerCase().replace(/\s+/g, '_')
          } : null,
          created_at: store.created_at || '',
          updated_at: store.updated_at || '',
          type: 'restaurant', // 기본값 설정
          total_revenue: revenue,
          employee_count: employees,
        };
        
        processedStores.push(processedStore);
        uniqueBrands.add(store.brand_id);
        totalRevenue += revenue;
        totalEmployees += employees;
        if (store.is_active) activeStores++;
        
        // 브랜드 정보 수집
        if (store.brands && !brandsMap.has(store.brand_id)) {
          brandsMap.set(store.brand_id, {
            id: store.brand_id,
            name: store.brands.name,
            code: store.brands.name.toLowerCase().replace(/\s+/g, '_')
          });
        }
      }
      
      // 브랜드 데이터 설정
      setBrands(Array.from(brandsMap.values()));

      setStores(processedStores);
      
      // 통계 설정
      const stats: StoreStats = {
        total_stores: processedStores.length,
        active_stores: activeStores,
        inactive_stores: processedStores.length - activeStores,
        total_brands: uniqueBrands.size,
        total_revenue: totalRevenue,
        total_employees: totalEmployees,
      };
      
      setStats(stats);
      
    } catch (error) {
      console.error('매장 로딩 오류:', error);
      toast.error('매장 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 지역 코드를 한글로 변환
  const getRegionName = (regionCode: string) => {
    const regionMap: { [key: string]: string } = {
      'seoul': '서울특별시',
      'gyeonggi': '경기도',
      'daejeon': '대전광역시',
      'daegu': '대구광역시',
      'busan': '부산광역시'
    };
    return regionMap[regionCode] || regionCode;
  };

  // 브랜드 선택 시 매장 유형 자동 설정
  const handleBrandChange = (brandId: string) => {
    const selectedBrand = brands.find(brand => brand.id === brandId);
    setNewStore({ 
      ...newStore, 
      brand_id: brandId,
      type: selectedBrand?.type || 'restaurant'
    });
  };

  // 매장 생성
  const handleCreateStore = async () => {
    if (!newStore.name.trim() || !newStore.code.trim() || !newStore.brand_id) {
      toast.error('매장명, 코드, 브랜드는 필수입니다.');
      return;
    }

    try {
      setIsCreating(true);
      
      const regionName = getRegionName(newStore.region);
      const address = newStore.district ? `${regionName} - ${newStore.district}` : regionName;
      
      const { error } = await supabase
        .from('stores')
        .insert([
          {
            name: newStore.name.trim(),
            code: newStore.code.trim(),
            brand_id: newStore.brand_id,
            address: address,
            type: newStore.type,
            capacity: newStore.capacity,
            area_sqm: newStore.area_sqm,
            status: newStore.status,
            manager_ids: newStore.manager_ids,
          }
        ])
        .select();

      if (error) throw error;

      toast.success('매장이 성공적으로 생성되었습니다.');
      setIsCreateDialogOpen(false);
      setNewStore({ 
        name: '', 
        code: '', 
        brand_id: '', 
        region: 'seoul', 
        district: '', 
        type: 'restaurant', 
        capacity: 50, 
        area_sqm: 100,
        status: 'preparing',
        manager_ids: [],
      });
      loadStores(); // 목록 새로고침
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
      console.error('매장 생성 오류:', error);
      if (errorCode === '23505') {
        toast.error('이미 존재하는 매장 코드입니다.');
      } else {
        toast.error('매장 생성에 실패했습니다.');
      }
      console.error('매장 생성 오류:', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // 매장 삭제
  const handleDeleteStore = async () => {
    if (!selectedStore) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', selectedStore.id);

      if (error) throw error;

      toast.success('매장이 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setSelectedStore(null);
      loadStores();
    } catch (error) {
      console.error('매장 삭제 실패:', error);
      toast.error('매장 삭제에 실패했습니다.');
    }
  };

  // 필터링된 매장 목록 (useMemo로 최적화)
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (store.brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && store.is_active) ||
                           (statusFilter === 'inactive' && !store.is_active);
      const matchesBrand = brandFilter === 'all' || store.brand_id === brandFilter;
      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [stores, searchTerm, statusFilter, brandFilter]);

  // 매장 테이블 컬럼 정의 (useMemo로 최적화)
  const columns: Array<{
    key: keyof StoreData;
    header: string;
    render: (value: unknown, row: StoreData) => JSX.Element;
  }> = useMemo(() => [
    {
      key: 'name' as keyof StoreData,
      header: '매장명',
      render: (value: unknown, row: StoreData) => {
        return (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-sm text-muted-foreground">{row.code}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'brand' as keyof StoreData,
      header: '브랜드',
      render: (value: unknown, row: StoreData) => {
        const brand = row.brand;
        return (
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span>{brand?.name || '-'}</span>
          </div>
        );
      },
    },
    {
      key: 'is_active' as keyof StoreData,
      header: '상태',
      render: (value: unknown, row: StoreData) => {
        const isActive = row.is_active;
        return (
          <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isActive ? '운영중' : '휴업'}
          </Badge>
        );
      },
    },
    {
      key: 'type' as keyof StoreData,
      header: '매장 유형',
      render: (value: unknown, row: StoreData) => {
        const type = row.type;
        const typeLabels: Record<string, string> = {
          restaurant: '레스토랑',
          cafe: '카페',
          bakery: '베이커리',
          takeout: '테이크아웃',
        };
        return (
          <span className="text-sm">{typeLabels[type] || type}</span>
        );
      },
    },
    {
      key: 'capacity' as keyof StoreData,
      header: '수용인원',
      render: (value: unknown, row: StoreData) => {
        const capacity = row.capacity;
        return (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{capacity}명</span>
          </div>
        );
      },
    },
    {
      key: 'area_sqm' as keyof StoreData,
      header: '면적(㎡)',
      render: (value: unknown, row: StoreData) => {
        const area = row.area_sqm;
        return (
          <span>{area || 0}㎡</span>
        );
      },
    },
    {
      key: 'address' as keyof StoreData,
      header: '주소',
      render: (value: unknown, row: StoreData) => {
        const address = row.address;
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground max-w-[200px] truncate">
              {address || '-'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'total_revenue' as keyof StoreData,
      header: '월 매출',
      render: (value: unknown, row: StoreData) => {
        const revenue = row.total_revenue;
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span>₩{revenue.toLocaleString()}</span>
          </div>
        );
      },
    },
    {
      key: 'id' as keyof StoreData,
      header: '작업',
      render: (value: unknown, row: StoreData) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/store/${row.id}/dashboard`)}>
                <Eye className="mr-2 h-4 w-4" />
                대시보드 보기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedStore(row);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                편집
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  setSelectedStore(row);
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
  ], [router]);

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
                    <BreadcrumbPage>매장 관리</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
              <div className="p-6 lg:p-8 space-y-8">
                {/* 페이지 헤더 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">매장 관리</h1>
                    <p className="text-muted-foreground mt-2">
                      회사의 모든 매장을 관리하고 운영 현황을 모니터링합니다.
                    </p>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        새 매장 생성
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white">
                      <DialogHeader>
                        <DialogTitle>새 매장 생성</DialogTitle>
                        <DialogDescription>
                          새로운 매장을 생성합니다. 모든 필수 정보를 입력해주세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            매장명
                          </Label>
                          <Input
                            id="name"
                            value={newStore.name}
                            onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                            className="col-span-3"
                            placeholder="예: 성수점"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">
                            매장 코드
                          </Label>
                          <Input
                            id="code"
                            value={newStore.code}
                            onChange={(e) => setNewStore({ ...newStore, code: e.target.value })}
                            className="col-span-3"
                            placeholder="예: seongsu"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="brand_id" className="text-right">
                            브랜드
                          </Label>
                          <Select value={newStore.brand_id} onValueChange={handleBrandChange}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="브랜드 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name} ({brand.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right">
                            매장 유형
                          </Label>
                          <Select value={newStore.type} onValueChange={(value: string) => setNewStore({ ...newStore, type: value })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="restaurant">레스토랑</SelectItem>
                              <SelectItem value="cafe">카페</SelectItem>
                              <SelectItem value="bakery">베이커리</SelectItem>
                              <SelectItem value="takeout">테이크아웃</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="capacity" className="text-right">
                            수용인원
                          </Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={newStore.capacity}
                            onChange={(e) => setNewStore({ ...newStore, capacity: parseInt(e.target.value) || 0 })}
                            className="col-span-3"
                            placeholder="50"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="area_sqm" className="text-right">
                            면적(㎡)
                          </Label>
                          <Input
                            id="area_sqm"
                            type="number"
                            value={newStore.area_sqm}
                            onChange={(e) => setNewStore({ ...newStore, area_sqm: parseInt(e.target.value) || 0 })}
                            className="col-span-3"
                            placeholder="100"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="region" className="text-right">
                            지역
                          </Label>
                          <Select value={newStore.region} onValueChange={(value: string) => setNewStore({ ...newStore, region: value })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seoul">서울특별시</SelectItem>
                              <SelectItem value="gyeonggi">경기도</SelectItem>
                              <SelectItem value="daejeon">대전광역시</SelectItem>
                              <SelectItem value="daegu">대구광역시</SelectItem>
                              <SelectItem value="busan">부산광역시</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="district" className="text-right">
                            구/시
                          </Label>
                          <Input
                            id="district"
                            value={newStore.district}
                            onChange={(e) => setNewStore({ ...newStore, district: e.target.value })}
                            className="col-span-3"
                            placeholder="예: 성동구, 판교"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="status" className="text-right">
                            상태
                          </Label>
                          <Select value={newStore.status} onValueChange={(value: string) => setNewStore({ ...newStore, status: value })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="preparing">오픈준비중</SelectItem>
                              <SelectItem value="operating">운영중</SelectItem>
                              <SelectItem value="closed">휴업</SelectItem>
                              <SelectItem value="shutdown">폐업</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="manager_ids" className="text-right">
                            담당자
                          </Label>
                          <Select value="" onValueChange={(value: string) => {
                            if (value === 'undecided') {
                              setNewStore({ ...newStore, manager_ids: [] });
                            } else if (value && !newStore.manager_ids.includes(value)) {
                              setNewStore({ ...newStore, manager_ids: [...newStore.manager_ids, value] });
                            }
                          }}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="담당자 추가" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="undecided">미정</SelectItem>
                              {users.filter(user => !newStore.manager_ids.includes(user.id)).map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {newStore.manager_ids.length > 0 && (
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">
                              선택된 담당자
                            </Label>
                            <div className="col-span-3 space-y-2">
                              {newStore.manager_ids.map((managerId) => {
                                const manager = users.find(u => u.id === managerId);
                                return (
                                  <div key={managerId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-sm">{manager?.name} ({manager?.email})</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setNewStore({
                                          ...newStore,
                                          manager_ids: newStore.manager_ids.filter(id => id !== managerId)
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          onClick={handleCreateStore}
                          disabled={isCreating}
                        >
                          {isCreating ? '생성 중...' : '생성'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 통계 카드 */}
                {stats && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 매장</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_stores}</div>
                        <p className="text-xs text-muted-foreground">
                          운영중: {stats.active_stores}개
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">연결 브랜드</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_brands}</div>
                        <p className="text-xs text-muted-foreground">
                          브랜드별 매장 운영
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
                          ₩{stats.total_revenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          전체 매장 월 매출
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 직원</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total_employees}</div>
                        <p className="text-xs text-muted-foreground">
                          전체 매장 직원 수
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 필터 및 검색 */}
                <Card>
                  <CardHeader>
                    <CardTitle>매장 목록</CardTitle>
                    <CardDescription>
                      등록된 모든 매장을 확인하고 관리할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="매장명, 코드 또는 브랜드로 검색..."
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
                          <SelectItem value="active">운영중</SelectItem>
                          <SelectItem value="inactive">휴업</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={brandFilter} onValueChange={setBrandFilter}>
                        <SelectTrigger className="w-[180px]">
                          <Building2 className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="브랜드 필터" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 브랜드</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 매장 테이블 */}
                    <DataTable
                      columns={columns}
                      data={filteredStores}
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
              <AlertDialogTitle>매장 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 &quot;{selectedStore?.name}&quot; 매장을 삭제하시겠습니까? 
                이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStore} className="bg-red-600 hover:bg-red-700">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CompanyAdminUp>
    </ErrorBoundary>
  );
}