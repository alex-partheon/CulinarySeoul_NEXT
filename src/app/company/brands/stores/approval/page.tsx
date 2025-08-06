'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  MapPin,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PendingStore {
  id: string;
  name: string;
  brand_id: string;
  brand_name: string;
  address: string;
  phone: string;
  manager_name: string;
  manager_email: string;
  opening_hours: string;
  business_license: string;
  submitted_at: string;
  documents: {
    business_license: boolean;
    lease_agreement: boolean;
    insurance: boolean;
    health_permit: boolean;
  };
  estimated_investment: number;
  expected_opening: string;
  notes: string;
}

export default function StoreApprovalPage() {
  const { profile: _profile } = useAuth();
  const [pendingStores, setPendingStores] = useState<PendingStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<PendingStore | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const _supabase = createClient();

  useEffect(() => {
    fetchPendingStores();
  }, []);

  const fetchPendingStores = async () => {
    try {
      // 실제 데이터가 없으므로 임시 데이터 생성
      const mockData: PendingStore[] = [
        {
          id: 'pending-1',
          name: '밀랍 강남점',
          brand_id: 'brand-1',
          brand_name: '밀랍(millab)',
          address: '서울시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          manager_name: '김매니저',
          manager_email: 'manager@millab.com',
          opening_hours: '09:00 - 22:00',
          business_license: '123-45-67890',
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          documents: {
            business_license: true,
            lease_agreement: true,
            insurance: false,
            health_permit: true,
          },
          estimated_investment: 50000,
          expected_opening: '2024-03-15',
          notes: '강남 핵심 상권 위치, 높은 유동인구 예상',
        },
        {
          id: 'pending-2',
          name: '밀랍 홍대점',
          brand_id: 'brand-1',
          brand_name: '밀랍(millab)',
          address: '서울시 마포구 홍익로 456',
          phone: '02-9876-5432',
          manager_name: '이매니저',
          manager_email: 'hongdae@millab.com',
          opening_hours: '10:00 - 24:00',
          business_license: '987-65-43210',
          submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          documents: {
            business_license: true,
            lease_agreement: true,
            insurance: true,
            health_permit: false,
          },
          estimated_investment: 45000,
          expected_opening: '2024-04-01',
          notes: '젊은 고객층 타겟, 야간 운영 계획',
        },
        {
          id: 'pending-3',
          name: '새로운 브랜드 1호점',
          brand_id: 'brand-2',
          brand_name: '새로운 브랜드',
          address: '서울시 종로구 인사동길 789',
          phone: '02-5555-1234',
          manager_name: '박매니저',
          manager_email: 'insadong@newbrand.com',
          opening_hours: '08:00 - 20:00',
          business_license: '555-12-34567',
          submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          documents: {
            business_license: true,
            lease_agreement: false,
            insurance: false,
            health_permit: false,
          },
          estimated_investment: 60000,
          expected_opening: '2024-05-01',
          notes: '전통 문화 지역, 관광객 대상 매장',
        },
      ];

      setPendingStores(mockData);
    } catch (_error) {
      console.error('승인 대기 매장 데이터 로딩 실패:', {
        message: error instanceof Error ? error.message : String(error),
        error: error
      });
      toast.error('승인 대기 매장 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (storeId: string) => {
    try {
      // 실제 승인 로직 구현
      toast.success('매장이 승인되었습니다.');
      setPendingStores((prev) => prev.filter((store) => store.id !== storeId));
    } catch (error) {
      toast.error('매장 승인에 실패했습니다.');
    }
  };

  const handleApprove = async (storeId: string, _reason: string) => {
    try {
      // 실제 거부 로직 구현
      toast.success('매장 신청이 거부되었습니다.');
      setPendingStores((prev) => prev.filter((store) => store.id !== storeId));
    } catch (error) {
      toast.error('매장 거부에 실패했습니다.');
    }
  };

  const getDocumentStatus = (documents: PendingStore['documents']) => {
    const total = Object.keys(documents).length;
    const completed = Object.values(documents).filter(Boolean).length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const getDocumentBadge = (isCompleted: boolean) => {
    return isCompleted ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        완료
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        미완료
      </Badge>
    );
  };

  const filteredStores = pendingStores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.manager_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'all' || store.brand_id === brandFilter;

    return matchesSearch && matchesBrand;
  });

  const uniqueBrands = Array.from(
    new Set(pendingStores.map((store) => ({ id: store.brand_id, name: store.brand_name }))),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">승인 대기 매장을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">매장 승인</h1>
          <p className="text-muted-foreground mt-2">
            새로운 매장 신청을 검토하고 승인/거부를 결정합니다
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          승인 대기: {pendingStores.length}건
        </Badge>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 신청</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStores.length}</div>
            <p className="text-xs text-muted-foreground">승인 대기 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완전한 서류</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                pendingStores.filter((store) => {
                  const { percentage } = getDocumentStatus(store.documents);
                  return percentage === 100;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">서류 완비 매장</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 투자액</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingStores.length > 0
                ? Math.round(
                    pendingStores.reduce((sum, store) => sum + store.estimated_investment, 0) /
                      pendingStores.length,
                  ).toLocaleString()
                : 0}
              만원
            </div>
            <p className="text-xs text-muted-foreground">예상 투자 규모</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">긴급 검토</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                pendingStores.filter((store) => {
                  const daysSinceSubmission = Math.floor(
                    (Date.now() - new Date(store.submitted_at).getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return daysSinceSubmission > 3;
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">3일 이상 대기</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>승인 대기 매장 목록</CardTitle>
          <CardDescription>새로운 매장 신청을 검토하고 승인 여부를 결정하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="매장명, 브랜드명, 매니저명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="브랜드 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 브랜드</SelectItem>
                {uniqueBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>매장명</TableHead>
                  <TableHead>브랜드</TableHead>
                  <TableHead>매니저</TableHead>
                  <TableHead>신청일</TableHead>
                  <TableHead>서류 현황</TableHead>
                  <TableHead>투자액</TableHead>
                  <TableHead>개점 예정</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>승인 대기 중인 매장이 없습니다.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store) => {
                    const { completed, total, percentage } = getDocumentStatus(store.documents);
                    const daysSinceSubmission = Math.floor(
                      (Date.now() - new Date(store.submitted_at).getTime()) / (1000 * 60 * 60 * 24),
                    );

                    return (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.brand_name}</TableCell>
                        <TableCell>{store.manager_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {daysSinceSubmission > 3 && (
                              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            )}
                            {new Date(store.submitted_at).toLocaleDateString()}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({daysSinceSubmission}일 전)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">
                              {completed}/{total}
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{store.estimated_investment.toLocaleString()}만원</TableCell>
                        <TableCell>
                          {new Date(store.expected_opening).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStore(store);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>매장 승인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {store.name}을(를) 승인하시겠습니까? 승인 후에는 매장이
                                    활성화됩니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleApprove(store.id)}>
                                    승인
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>매장 거부</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {store.name}의 신청을 거부하시겠습니까?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                  <Label htmlFor="rejection-reason">거부 사유</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    placeholder="거부 사유를 입력하세요..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleReject(store.id, rejectionReason)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    거부
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>매장 신청 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedStore?.name}의 상세 신청 정보를 확인하세요.
            </DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">매장명</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">브랜드</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.brand_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">매니저</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.manager_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">이메일</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.manager_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">전화번호</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">사업자등록번호</Label>
                  <p className="text-sm text-muted-foreground">{selectedStore.business_license}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">주소</Label>
                <p className="text-sm text-muted-foreground">{selectedStore.address}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">운영시간</Label>
                <p className="text-sm text-muted-foreground">{selectedStore.opening_hours}</p>
              </div>

              {/* 서류 현황 */}
              <div>
                <Label className="text-sm font-medium mb-3 block">제출 서류 현황</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">사업자등록증</span>
                    {getDocumentBadge(selectedStore.documents.business_license)}
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">임대차계약서</span>
                    {getDocumentBadge(selectedStore.documents.lease_agreement)}
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">보험증서</span>
                    {getDocumentBadge(selectedStore.documents.insurance)}
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span className="text-sm">영업허가증</span>
                    {getDocumentBadge(selectedStore.documents.health_permit)}
                  </div>
                </div>
              </div>

              {/* 투자 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">예상 투자액</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedStore.estimated_investment.toLocaleString()}만원
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">개점 예정일</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedStore.expected_opening).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* 특이사항 */}
              <div>
                <Label className="text-sm font-medium">특이사항</Label>
                <p className="text-sm text-muted-foreground">{selectedStore.notes}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
