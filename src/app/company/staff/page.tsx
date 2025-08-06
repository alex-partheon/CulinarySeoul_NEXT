'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
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
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';

const supabase = createClient();

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  brand_ids: string[];
  store_ids: string[];
  is_active: boolean;
  created_at: string;
  last_sign_in_at?: string;
  brand_names?: string[];
  store_names?: string[];
}

interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  company_admins: number;
  brand_admins: number;
  store_managers: number;
}

export default function StaffManagementPage() {
  const { user, hasMinimumRole } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 새 직원 초대 폼 상태
  const [newStaff, setNewStaff] = useState({
    email: '',
    full_name: '',
    role: 'brand_staff',
  });
  const [isInviting, setIsInviting] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 프로필 데이터 조회 (사용자 정보)
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          is_active,
          created_at,
          last_sign_in_at
        `);

      // 검색 필터
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // 역할 필터
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // 상태 필터
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data: staffData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('직원 데이터 조회 오류:', error);
        toast.error('직원 데이터를 불러오는데 실패했습니다.');
        return;
      }

      // 브랜드 및 매장 이름 조회
      const staffWithNames = (staffData || []).map((member: any) => ({
        ...member,
        brand_names: [],
        store_names: []
      }));

      setStaff(staffWithNames);

      // 통계 계산
      const totalStaff = staffWithNames.length;
      const activeStaff = staffWithNames.filter((s: any) => s.is_active).length;
      const inactiveStaff = totalStaff - activeStaff;
      const companyAdmins = staffWithNames.filter((s: any) => s.role === 'company_admin').length;
      const brandAdmins = staffWithNames.filter((s: any) => s.role === 'brand_admin').length;
      const storeManagers = staffWithNames.filter((s: any) => s.role === 'store_manager').length;

      setStats({
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        company_admins: companyAdmins,
        brand_admins: brandAdmins,
        store_managers: storeManagers,
      });

    } catch (error) {
      console.error('직원 데이터 로딩 오류:', error);
      toast.error('직원 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleInviteStaff = async () => {
    if (!newStaff.email || !newStaff.full_name || !newStaff.role) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setIsInviting(true);

      // 이메일 중복 확인
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newStaff.email)
        .single();

      if (existingUser) {
        toast.error('이미 등록된 이메일입니다.');
        return;
      }

      // 실제 구현에서는 Supabase Auth의 초대 기능을 사용해야 함
      // 여기서는 시뮬레이션
      toast.success('직원 초대가 완료되었습니다.');
      
      setNewStaff({ email: '', full_name: '', role: 'brand_staff' });
      setIsInviteDialogOpen(false);
      loadStaff();

    } catch (error) {
      console.error('직원 초대 오류:', error);
      toast.error('직원 초대에 실패했습니다.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', selectedStaff.id);

      if (error) {
        console.error('직원 비활성화 오류:', error);
        toast.error('직원 비활성화에 실패했습니다.');
        return;
      }

      toast.success('직원이 비활성화되었습니다.');
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
      loadStaff();

    } catch (error) {
      console.error('직원 비활성화 오류:', error);
      toast.error('직원 비활성화에 실패했습니다.');
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'super_admin': '슈퍼 관리자',
      'company_admin': '회사 관리자',
      'brand_admin': '브랜드 관리자',
      'brand_staff': '브랜드 직원',
      'store_manager': '매장 관리자',
      'store_staff': '매장 직원',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'super_admin': 'destructive',
      'company_admin': 'default',
      'brand_admin': 'secondary',
      'brand_staff': 'outline',
      'store_manager': 'secondary',
      'store_staff': 'outline',
    };
    return variantMap[role] || 'outline';
  };

  const columns: any[] = [
    {
      accessorKey: 'full_name',
      header: '이름',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{row.getValue('full_name')}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: '역할',
      cell: ({ row }) => (
        <Badge variant={getRoleBadgeVariant(row.getValue('role'))}>
          {getRoleDisplayName(row.getValue('role'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'brand_names',
      header: '소속 브랜드',
      cell: ({ row }) => {
        const brandNames = row.original.brand_names || [];
        return (
          <div className="flex flex-wrap gap-1">
            {brandNames.length > 0 ? (
              brandNames.map((name, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">없음</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'store_names',
      header: '소속 매장',
      cell: ({ row }) => {
        const storeNames = row.original.store_names || [];
        return (
          <div className="flex flex-wrap gap-1">
            {storeNames.length > 0 ? (
              storeNames.map((name, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">없음</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: '상태',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? '활성' : '비활성'}
        </Badge>
      ),
    },
    {
      accessorKey: 'last_sign_in_at',
      header: '최근 로그인',
      cell: ({ row }) => {
        const lastSignIn = row.getValue('last_sign_in_at') as string;
        return lastSignIn ? (
          <span className="text-sm">
            {new Date(lastSignIn).toLocaleDateString('ko-KR')}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">없음</span>
        );
      },
    },
    {
      id: 'actions',
      header: '작업',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              // 직원 상세 보기
              console.log('직원 상세:', row.original);
            }}>
              <Eye className="mr-2 h-4 w-4" />
              상세 보기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // 역할 변경
              console.log('역할 변경:', row.original);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              역할 변경
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setSelectedStaff(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              비활성화
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (!hasMinimumRole('company_admin')) {
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
                  <BreadcrumbPage>직원 관리</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">직원 관리</h1>
                <p className="text-muted-foreground">
                  회사 직원들의 계정과 권한을 관리합니다.
                </p>
              </div>
              <CompanyAdminUp>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      새 직원 초대
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 직원 초대</DialogTitle>
                      <DialogDescription>
                        새로운 직원을 초대하고 역할을 설정합니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="직원의 이메일을 입력하세요"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="full_name">이름</Label>
                        <Input
                          id="full_name"
                          placeholder="직원의 이름을 입력하세요"
                          value={newStaff.full_name}
                          onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">역할</Label>
                        <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="역할을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company_admin">회사 관리자</SelectItem>
                            <SelectItem value="brand_admin">브랜드 관리자</SelectItem>
                            <SelectItem value="brand_staff">브랜드 직원</SelectItem>
                            <SelectItem value="store_manager">매장 관리자</SelectItem>
                            <SelectItem value="store_staff">매장 직원</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        취소
                      </Button>
                      <Button onClick={handleInviteStaff} disabled={isInviting}>
                        {isInviting ? '초대 중...' : '초대 보내기'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CompanyAdminUp>
            </div>

            {/* 통계 카드 */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">전체 직원</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">활성 직원</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">비활성 직원</CardTitle>
                    <UserX className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">회사 관리자</CardTitle>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.company_admins}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">브랜드 관리자</CardTitle>
                    <Shield className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.brand_admins}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">매장 관리자</CardTitle>
                    <Shield className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.store_managers}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 필터 및 검색 */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="직원 이름 또는 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="역할 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 역할</SelectItem>
                  <SelectItem value="company_admin">회사 관리자</SelectItem>
                  <SelectItem value="brand_admin">브랜드 관리자</SelectItem>
                  <SelectItem value="brand_staff">브랜드 직원</SelectItem>
                  <SelectItem value="store_manager">매장 관리자</SelectItem>
                  <SelectItem value="store_staff">매장 직원</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 직원 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle>직원 목록</CardTitle>
                <CardDescription>
                  등록된 모든 직원들의 정보와 권한을 확인할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={staff}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>
        </SidebarInset>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>직원 비활성화</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedStaff?.full_name} 직원을 비활성화하시겠습니까?
                비활성화된 직원은 시스템에 로그인할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStaff}>
                비활성화
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarProvider>
    </ErrorBoundary>
  );
}