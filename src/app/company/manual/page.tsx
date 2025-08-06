'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Eye,
  Edit,
  Share,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Users,
  Star,
  MessageSquare,
  ThumbsUp,
  Upload,
  RefreshCw,
  PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const _supabase = createClient();

interface ManualSummary {
  totalManuals: number;
  totalViews: number;
  averageRating: number;
  completionRate: number;
  recentUpdates: number;
  pendingReviews: number;
}

interface Manual {
  id: string;
  title: string;
  description: string;
  category: 'operations' | 'training' | 'safety' | 'procedures' | 'policies' | 'technical';
  type: 'document' | 'video' | 'interactive' | 'checklist';
  status: 'draft' | 'review' | 'published' | 'archived';
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  fileUrl?: string;
  videoUrl?: string;
  duration?: number; // 비디오 길이 (분)
  views: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  targetRoles: string[];
  isRequired: boolean;
  completionTracking: boolean;
  estimatedReadTime: number; // 분
}

interface ManualCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  manualCount: number;
  completionRate: number;
  lastUpdated: string;
}

interface UserProgress {
  userId: string;
  userName: string;
  role: string;
  completedManuals: number;
  totalRequiredManuals: number;
  completionRate: number;
  lastActivity: string;
  currentManual?: {
    id: string;
    title: string;
    progress: number;
  };
}

interface ManualComment {
  id: string;
  manualId: string;
  userId: string;
  userName: string;
  content: string;
  rating?: number;
  createdAt: string;
  isHelpful: boolean;
  helpfulCount: number;
}

export default function OperationManualPage() {
  const { user, hasMinimumRole } = useAuth();
  const [manualSummary, setManualSummary] = useState<ManualSummary | null>(null);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [categories, setCategories] = useState<ManualCategory[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [comments, setComments] = useState<ManualComment[]>([]);
  const [_loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);

  const loadManualsData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 데이터베이스에서 매뉴얼 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 매뉴얼 요약 (시뮬레이션)
      const mockManualSummary: ManualSummary = {
        totalManuals: 45,
        totalViews: 12450,
        averageRating: 4.3,
        completionRate: 78.5,
        recentUpdates: 8,
        pendingReviews: 3,
      };

      // 매뉴얼 카테고리 (시뮬레이션)
      const mockCategories: ManualCategory[] = [
        {
          id: '1',
          name: '운영 절차',
          description: '일상적인 매장 운영 절차와 가이드라인',
          icon: 'settings',
          manualCount: 12,
          completionRate: 85.2,
          lastUpdated: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          name: '직원 교육',
          description: '신입 직원 온보딩 및 지속적인 교육 자료',
          icon: 'users',
          manualCount: 15,
          completionRate: 72.8,
          lastUpdated: '2024-01-14T14:30:00Z',
        },
        {
          id: '3',
          name: '안전 수칙',
          description: '작업장 안전 및 위생 관리 수칙',
          icon: 'shield',
          manualCount: 8,
          completionRate: 95.1,
          lastUpdated: '2024-01-13T09:15:00Z',
        },
        {
          id: '4',
          name: '기술 가이드',
          description: 'POS 시스템 및 장비 사용법',
          icon: 'monitor',
          manualCount: 6,
          completionRate: 68.4,
          lastUpdated: '2024-01-12T16:45:00Z',
        },
        {
          id: '5',
          name: '정책 및 규정',
          description: '회사 정책 및 규정 안내',
          icon: 'file-text',
          manualCount: 4,
          completionRate: 89.7,
          lastUpdated: '2024-01-11T11:20:00Z',
        },
      ];

      // 매뉴얼 목록 (시뮬레이션)
      const mockManuals: Manual[] = [
        {
          id: '1',
          title: '매장 오픈 체크리스트',
          description: '매일 매장 오픈 시 확인해야 할 필수 항목들',
          category: 'operations',
          type: 'checklist',
          status: 'published',
          version: '2.1',
          author: 'admin@culinaryseoul.com',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          publishedAt: '2024-01-15T10:30:00Z',
          views: 1250,
          rating: 4.8,
          ratingCount: 45,
          tags: ['오픈', '체크리스트', '일일업무'],
          targetRoles: ['store_manager', 'store_staff'],
          isRequired: true,
          completionTracking: true,
          estimatedReadTime: 5,
        },
        {
          id: '2',
          title: '신입 직원 온보딩 가이드',
          description: '신입 직원을 위한 종합적인 교육 프로그램',
          category: 'training',
          type: 'document',
          status: 'published',
          version: '1.5',
          author: 'hr@culinaryseoul.com',
          createdAt: '2023-12-15T14:00:00Z',
          updatedAt: '2024-01-14T14:30:00Z',
          publishedAt: '2024-01-14T15:00:00Z',
          fileUrl: '/manuals/onboarding-guide.pdf',
          views: 890,
          rating: 4.5,
          ratingCount: 32,
          tags: ['온보딩', '신입직원', '교육'],
          targetRoles: ['store_staff', 'brand_staff'],
          isRequired: true,
          completionTracking: true,
          estimatedReadTime: 45,
        },
        {
          id: '3',
          title: 'POS 시스템 사용법',
          description: '매장 POS 시스템의 기본 사용법과 고급 기능',
          category: 'technical',
          type: 'video',
          status: 'published',
          version: '3.0',
          author: 'tech@culinaryseoul.com',
          createdAt: '2024-01-10T11:00:00Z',
          updatedAt: '2024-01-12T16:45:00Z',
          publishedAt: '2024-01-12T17:00:00Z',
          videoUrl: '/videos/pos-tutorial.mp4',
          duration: 25,
          views: 650,
          rating: 4.2,
          ratingCount: 28,
          tags: ['POS', '기술', '시스템'],
          targetRoles: ['store_manager', 'store_staff'],
          isRequired: false,
          completionTracking: true,
          estimatedReadTime: 25,
        },
        {
          id: '4',
          title: '식품 안전 및 위생 수칙',
          description: '식품 취급 시 준수해야 할 안전 및 위생 규정',
          category: 'safety',
          type: 'document',
          status: 'published',
          version: '2.3',
          author: 'safety@culinaryseoul.com',
          createdAt: '2023-11-20T08:00:00Z',
          updatedAt: '2024-01-13T09:15:00Z',
          publishedAt: '2024-01-13T10:00:00Z',
          fileUrl: '/manuals/food-safety.pdf',
          views: 1450,
          rating: 4.9,
          ratingCount: 67,
          tags: ['안전', '위생', '식품'],
          targetRoles: ['store_manager', 'store_staff', 'brand_staff'],
          isRequired: true,
          completionTracking: true,
          estimatedReadTime: 30,
        },
        {
          id: '5',
          title: '고객 서비스 매뉴얼',
          description: '우수한 고객 서비스 제공을 위한 가이드라인',
          category: 'training',
          type: 'interactive',
          status: 'review',
          version: '1.0',
          author: 'service@culinaryseoul.com',
          createdAt: '2024-01-08T13:00:00Z',
          updatedAt: '2024-01-10T15:20:00Z',
          views: 120,
          rating: 4.1,
          ratingCount: 8,
          tags: ['고객서비스', '응대', '매뉴얼'],
          targetRoles: ['store_staff'],
          isRequired: false,
          completionTracking: true,
          estimatedReadTime: 20,
        },
        {
          id: '6',
          title: '재고 관리 절차',
          description: 'FIFO 방식의 재고 관리 및 발주 절차',
          category: 'operations',
          type: 'document',
          status: 'draft',
          version: '0.8',
          author: 'inventory@culinaryseoul.com',
          createdAt: '2024-01-12T10:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z',
          views: 45,
          rating: 0,
          ratingCount: 0,
          tags: ['재고', 'FIFO', '발주'],
          targetRoles: ['store_manager', 'brand_admin'],
          isRequired: true,
          completionTracking: true,
          estimatedReadTime: 35,
        },
      ];

      // 사용자 진행률 (시뮬레이션)
      const mockUserProgress: UserProgress[] = [
        {
          userId: '1',
          userName: '김매니저',
          role: 'store_manager',
          completedManuals: 8,
          totalRequiredManuals: 10,
          completionRate: 80,
          lastActivity: '2024-01-15T14:30:00Z',
          currentManual: {
            id: '3',
            title: 'POS 시스템 사용법',
            progress: 65,
          },
        },
        {
          userId: '2',
          userName: '이직원',
          role: 'store_staff',
          completedManuals: 5,
          totalRequiredManuals: 8,
          completionRate: 62.5,
          lastActivity: '2024-01-15T11:20:00Z',
          currentManual: {
            id: '2',
            title: '신입 직원 온보딩 가이드',
            progress: 40,
          },
        },
        {
          userId: '3',
          userName: '박신입',
          role: 'store_staff',
          completedManuals: 2,
          totalRequiredManuals: 8,
          completionRate: 25,
          lastActivity: '2024-01-14T16:45:00Z',
          currentManual: {
            id: '1',
            title: '매장 오픈 체크리스트',
            progress: 20,
          },
        },
      ];

      // 댓글 (시뮬레이션)
      const mockComments: ManualComment[] = [
        {
          id: '1',
          manualId: '1',
          userId: '1',
          userName: '김매니저',
          content: '매일 사용하는 체크리스트라 정말 유용합니다. 항목이 명확해서 놓치는 것이 없어요.',
          rating: 5,
          createdAt: '2024-01-15T09:30:00Z',
          isHelpful: true,
          helpfulCount: 12,
        },
        {
          id: '2',
          manualId: '2',
          userId: '2',
          userName: '이직원',
          content: '신입 교육에 정말 도움이 되었습니다. 다만 일부 내용이 업데이트가 필요할 것 같아요.',
          rating: 4,
          createdAt: '2024-01-14T15:20:00Z',
          isHelpful: true,
          helpfulCount: 8,
        },
        {
          id: '3',
          manualId: '3',
          userId: '3',
          userName: '박신입',
          content: '비디오 설명이 이해하기 쉬워서 좋았습니다. 실제 화면과 함께 설명해주니 따라하기 편해요.',
          rating: 4,
          createdAt: '2024-01-13T14:10:00Z',
          isHelpful: true,
          helpfulCount: 6,
        },
      ];

      setManualSummary(mockManualSummary);
      setManuals(mockManuals);
      setCategories(mockCategories);
      setUserProgress(mockUserProgress);
      setComments(mockComments);

    } catch (error) {
      console.error('매뉴얼 데이터 로딩 오류:', error);
      toast.error('매뉴얼 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadManualsData();
  }, [loadManualsData]);

  const handleCreateManual = async (manualData: Partial<Manual>) => {
    try {
      const newManual: Manual = {
        id: Date.now().toString(),
        title: manualData.title || '새 매뉴얼',
        description: manualData.description || '',
        category: manualData.category || 'operations',
        type: manualData.type || 'document',
        status: 'draft',
        version: '1.0',
        author: user?.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 0,
        rating: 0,
        ratingCount: 0,
        tags: manualData.tags || [],
        targetRoles: manualData.targetRoles || [],
        isRequired: manualData.isRequired || false,
        completionTracking: manualData.completionTracking || false,
        estimatedReadTime: manualData.estimatedReadTime || 10,
      };
      
      setManuals(prev => [newManual, ...prev]);
      setShowCreateDialog(false);
      toast.success('매뉴얼이 생성되었습니다.');
    } catch (error) {
      console.error('매뉴얼 생성 오류:', error);
      toast.error('매뉴얼 생성에 실패했습니다.');
    }
  };

  const handleUploadFile = async (_file: File) => {
    try {
      // 실제 구현에서는 파일 업로드 로직 필요
      toast.success('파일이 업로드되었습니다.');
      setShowUploadDialog(false);
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast.error('파일 업로드에 실패했습니다.');
    }
  };

  const filteredManuals = manuals.filter(manual => {
    const matchesCategory = selectedCategory === 'all' || manual.category === selectedCategory;
    const matchesType = selectedType === 'all' || manual.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manual.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manual.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesType && matchesSearch;
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600';
      case 'review':
        return 'text-yellow-600';
      case 'draft':
        return 'text-gray-600';
      case 'archived':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return '게시됨';
      case 'review':
        return '검토 중';
      case 'draft':
        return '초안';
      case 'archived':
        return '보관됨';
      default:
        return '알 수 없음';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'interactive':
        return <PlayCircle className="w-4 h-4" />;
      case 'checklist':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document':
        return '문서';
      case 'video':
        return '비디오';
      case 'interactive':
        return '인터랙티브';
      case 'checklist':
        return '체크리스트';
      default:
        return '기타';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'operations':
        return '운영 절차';
      case 'training':
        return '직원 교육';
      case 'safety':
        return '안전 수칙';
      case 'procedures':
        return '업무 절차';
      case 'policies':
        return '정책 및 규정';
      case 'technical':
        return '기술 가이드';
      default:
        return '기타';
    }
  };

  if (!hasMinimumRole('brand_staff')) {
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
                  <BreadcrumbPage>운영 매뉴얼</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">운영 매뉴얼</h1>
                <p className="text-muted-foreground">
                  회사의 운영 가이드와 교육 자료를 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  파일 업로드
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  매뉴얼 생성
                </Button>
              </div>
            </div>

            {/* 매뉴얼 요약 */}
            {manualSummary && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 매뉴얼</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.totalManuals}</div>
                    <p className="text-xs text-muted-foreground">개의 매뉴얼</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">누적 조회</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">평균 평점</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.averageRating}</div>
                    <p className="text-xs text-muted-foreground">5점 만점</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">완료율</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.completionRate}%</div>
                    <p className="text-xs text-muted-foreground">평균 완료율</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">최근 업데이트</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.recentUpdates}</div>
                    <p className="text-xs text-muted-foreground">지난 7일</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">검토 대기</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{manualSummary.pendingReviews}</div>
                    <p className="text-xs text-muted-foreground">검토 필요</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 정보 탭 */}
            <Tabs defaultValue="manuals" className="space-y-4">
              <TabsList>
                <TabsTrigger value="manuals">매뉴얼 목록</TabsTrigger>
                <TabsTrigger value="categories">카테고리별</TabsTrigger>
                <TabsTrigger value="progress">진행률 추적</TabsTrigger>
                <TabsTrigger value="analytics">분석</TabsTrigger>
              </TabsList>

              <TabsContent value="manuals" className="space-y-4">
                {/* 필터 및 검색 */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="매뉴얼 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 카테고리</SelectItem>
                      <SelectItem value="operations">운영 절차</SelectItem>
                      <SelectItem value="training">직원 교육</SelectItem>
                      <SelectItem value="safety">안전 수칙</SelectItem>
                      <SelectItem value="procedures">업무 절차</SelectItem>
                      <SelectItem value="policies">정책 및 규정</SelectItem>
                      <SelectItem value="technical">기술 가이드</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 유형</SelectItem>
                      <SelectItem value="document">문서</SelectItem>
                      <SelectItem value="video">비디오</SelectItem>
                      <SelectItem value="interactive">인터랙티브</SelectItem>
                      <SelectItem value="checklist">체크리스트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 매뉴얼 목록 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredManuals.map((manual) => (
                    <Card key={manual.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedManual(manual)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(manual.type)}
                            <Badge variant="outline">{getTypeLabel(manual.type)}</Badge>
                          </div>
                          <Badge className={getStatusColor(manual.status)}>
                            {getStatusLabel(manual.status)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{manual.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {manual.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">카테고리:</span>
                            <span>{getCategoryLabel(manual.category)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">예상 시간:</span>
                            <span>{formatDuration(manual.estimatedReadTime)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">조회수:</span>
                            <span>{manual.views.toLocaleString()}</span>
                          </div>
                          {manual.rating > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">평점:</span>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{manual.rating} ({manual.ratingCount})</span>
                              </div>
                            </div>
                          )}
                          {manual.isRequired && (
                            <Badge variant="destructive" className="text-xs">
                              필수
                            </Badge>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {manual.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant="outline">{category.manualCount}개</Badge>
                        </div>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>완료율</span>
                              <span>{category.completionRate}%</span>
                            </div>
                            <Progress value={category.completionRate} className="h-2" />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            마지막 업데이트: {formatDateTime(category.lastUpdated)}
                          </div>
                          <Button variant="outline" size="sm" className="w-full"
                                  onClick={() => setSelectedCategory(category.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            매뉴얼 보기
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>직원별 진행률</CardTitle>
                    <CardDescription>
                      각 직원의 매뉴얼 학습 진행 상황을 추적합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userProgress.map((progress) => (
                        <div key={progress.userId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{progress.userName}</h3>
                              <p className="text-sm text-muted-foreground">{progress.role}</p>
                              <div className="text-xs text-muted-foreground">
                                마지막 활동: {formatDateTime(progress.lastActivity)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-sm">
                              {progress.completedManuals}/{progress.totalRequiredManuals} 완료
                            </div>
                            <Progress value={progress.completionRate} className="w-32" />
                            <div className="text-xs text-muted-foreground">
                              {progress.completionRate}% 완료
                            </div>
                            {progress.currentManual && (
                              <div className="text-xs text-blue-600">
                                현재: {progress.currentManual.title} ({progress.currentManual.progress}%)
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>인기 매뉴얼</CardTitle>
                      <CardDescription>조회수가 높은 매뉴얼 순위</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {manuals
                          .sort((a, b) => b.views - a.views)
                          .slice(0, 5)
                          .map((manual, index) => (
                            <div key={manual.id} className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{manual.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {manual.views.toLocaleString()} 조회
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{manual.rating}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>최고 평점 매뉴얼</CardTitle>
                      <CardDescription>사용자 평가가 높은 매뉴얼</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {manuals
                          .filter(manual => manual.ratingCount > 0)
                          .sort((a, b) => b.rating - a.rating)
                          .slice(0, 5)
                          .map((manual, index) => (
                            <div key={manual.id} className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-semibold text-yellow-800">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{manual.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {manual.ratingCount}명 평가
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{manual.rating}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 매뉴얼 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 매뉴얼 생성</DialogTitle>
            <DialogDescription>
              생성할 매뉴얼의 유형을 선택합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleCreateManual({
                title: '새 운영 절차 매뉴얼',
                category: 'operations',
                type: 'document'
              })}
            >
              <FileText className="mr-2 h-4 w-4" />
              운영 절차 문서
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleCreateManual({
                title: '새 교육 비디오',
                category: 'training',
                type: 'video'
              })}
            >
              <Video className="mr-2 h-4 w-4" />
              교육 비디오
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleCreateManual({
                title: '새 체크리스트',
                category: 'operations',
                type: 'checklist'
              })}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              체크리스트
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleCreateManual({
                title: '새 인터랙티브 가이드',
                category: 'training',
                type: 'interactive'
              })}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              인터랙티브 가이드
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 파일 업로드 다이얼로그 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>파일 업로드</DialogTitle>
            <DialogDescription>
              매뉴얼 파일을 업로드합니다. PDF, DOC, MP4 파일을 지원합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                파일을 드래그하여 놓거나 클릭하여 선택하세요
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, DOCX, MP4 (최대 100MB)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              취소
            </Button>
            <Button onClick={() => handleUploadFile(new File([], 'test.pdf'))}>
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 매뉴얼 상세 다이얼로그 */}
      {selectedManual && (
        <Dialog open={!!selectedManual} onOpenChange={() => setSelectedManual(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(selectedManual.type)}
                  <DialogTitle>{selectedManual.title}</DialogTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedManual.status)}>
                    {getStatusLabel(selectedManual.status)}
                  </Badge>
                  <Badge variant="outline">
                    v{selectedManual.version}
                  </Badge>
                </div>
              </div>
              <DialogDescription>{selectedManual.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">카테고리: </span>
                  <span>{getCategoryLabel(selectedManual.category)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">유형: </span>
                  <span>{getTypeLabel(selectedManual.type)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">작성자: </span>
                  <span>{selectedManual.author}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">예상 시간: </span>
                  <span>{formatDuration(selectedManual.estimatedReadTime)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">조회수: </span>
                  <span>{selectedManual.views.toLocaleString()}</span>
                </div>
                {selectedManual.rating > 0 && (
                  <div>
                    <span className="text-muted-foreground">평점: </span>
                    <div className="inline-flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{selectedManual.rating} ({selectedManual.ratingCount})</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">태그</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedManual.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">대상 역할</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedManual.targetRoles.map((role) => (
                    <Badge key={role} variant="outline">{role}</Badge>
                  ))}
                </div>
              </div>
              
              {selectedManual.isRequired && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-800">필수 매뉴얼</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    이 매뉴얼은 해당 역할의 직원이 반드시 학습해야 합니다.
                  </p>
                </div>
              )}
              
              {/* 댓글 섹션 */}
              <div>
                <h4 className="font-semibold mb-3">댓글 및 피드백</h4>
                <div className="space-y-3">
                  {comments
                    .filter(comment => comment.manualId === selectedManual.id)
                    .map((comment) => (
                      <div key={comment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm">{comment.userName}</span>
                            {comment.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">{comment.rating}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            도움됨 ({comment.helpfulCount})
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            답글
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex items-center space-x-2">
                {selectedManual.status === 'published' && (
                  <>
                    {selectedManual.fileUrl && (
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        다운로드
                      </Button>
                    )}
                    {selectedManual.videoUrl && (
                      <Button variant="outline">
                        <PlayCircle className="mr-2 h-4 w-4" />
                        재생
                      </Button>
                    )}
                    <Button variant="outline">
                      <Share className="mr-2 h-4 w-4" />
                      공유
                    </Button>
                  </>
                )}
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  편집
                </Button>
                <Button onClick={() => setSelectedManual(null)}>
                  닫기
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </ErrorBoundary>
  );
}