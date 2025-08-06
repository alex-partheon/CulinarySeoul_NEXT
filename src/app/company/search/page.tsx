'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileText,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Shield,
  Database,
  HelpCircle,
  Building,
  Store,
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  Tag,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Download,
  Share,
  Bookmark,
  History,
  Zap,
  Target,
  Layers,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient();

interface SearchResult {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: 'brand' | 'store' | 'product' | 'user' | 'document' | 'report' | 'setting' | 'help';
  category: string;
  url: string;
  relevance: number;
  lastUpdated: string;
  author?: string;
  tags: string[];
  metadata: Record<string, any>;
}

interface SearchFilter {
  type: string[];
  category: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  author: string[];
  tags: string[];
}

interface SearchStats {
  totalResults: number;
  searchTime: number;
  popularQueries: string[];
  recentSearches: string[];
  suggestedQueries: string[];
}

export default function CompanySearchPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<SearchFilter>({
    type: [],
    category: [],
    dateRange: {},
    author: [],
    tags: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchTypes = [
    { value: 'brand', label: '브랜드', icon: <Building className="w-4 h-4" />, color: 'bg-blue-500' },
    { value: 'store', label: '매장', icon: <Store className="w-4 h-4" />, color: 'bg-green-500' },
    { value: 'product', label: '상품', icon: <Package className="w-4 h-4" />, color: 'bg-orange-500' },
    { value: 'user', label: '사용자', icon: <Users className="w-4 h-4" />, color: 'bg-purple-500' },
    { value: 'document', label: '문서', icon: <FileText className="w-4 h-4" />, color: 'bg-gray-500' },
    { value: 'report', label: '리포트', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-red-500' },
    { value: 'setting', label: '설정', icon: <Settings className="w-4 h-4" />, color: 'bg-yellow-500' },
    { value: 'help', label: '도움말', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-indigo-500' },
  ];

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchStats(null);
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 데이터베이스에서 검색을 수행해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 검색 결과 시뮬레이션
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: '밀랍 브랜드',
          description: '프리미엄 베이커리 브랜드로 고품질 빵과 디저트를 제공합니다.',
          type: 'brand',
          category: '브랜드 관리',
          url: '/company/brands/1',
          relevance: 0.95,
          lastUpdated: '2024-01-15T10:00:00Z',
          author: 'CulinarySeoul',
          tags: ['브랜드', '베이커리', '프리미엄'],
          metadata: {
            storeCount: 5,
            revenue: 150000000,
            status: 'active',
          },
        },
        {
          id: '2',
          title: '성수점 매장',
          description: '밀랍 브랜드의 플래그십 매장으로 성수동에 위치합니다.',
          type: 'store',
          category: '매장 관리',
          url: '/company/stores/1',
          relevance: 0.88,
          lastUpdated: '2024-01-14T15:30:00Z',
          author: '매장 관리자',
          tags: ['매장', '성수동', '플래그십'],
          metadata: {
            address: '서울특별시 성동구 성수일로8길 5',
            phone: '02-1234-5678',
            status: 'active',
          },
        },
        {
          id: '3',
          title: '크루아상',
          description: '버터가 풍부한 프랑스식 크루아상으로 인기 상품입니다.',
          type: 'product',
          category: '상품 관리',
          url: '/company/products/1',
          relevance: 0.82,
          lastUpdated: '2024-01-13T09:15:00Z',
          author: '상품 관리자',
          tags: ['상품', '크루아상', '베이커리'],
          metadata: {
            price: 3500,
            category: '빵류',
            stock: 45,
          },
        },
        {
          id: '4',
          title: '김철수 매장 관리자',
          description: '성수점 매장 관리자로 5년 경력의 베테랑 직원입니다.',
          type: 'user',
          category: '직원 관리',
          url: '/company/staff/1',
          relevance: 0.75,
          lastUpdated: '2024-01-12T14:20:00Z',
          author: 'HR 팀',
          tags: ['직원', '관리자', '성수점'],
          metadata: {
            role: 'store_manager',
            department: '매장 운영',
            joinDate: '2019-03-15',
          },
        },
        {
          id: '5',
          title: '월간 매출 리포트',
          description: '2024년 1월 전체 브랜드 및 매장별 매출 분석 리포트입니다.',
          type: 'report',
          category: '분석 리포트',
          url: '/company/reports/monthly-sales-2024-01',
          relevance: 0.70,
          lastUpdated: '2024-01-31T18:00:00Z',
          author: '분석팀',
          tags: ['리포트', '매출', '분석'],
          metadata: {
            period: '2024-01',
            totalRevenue: 450000000,
            growth: 12.5,
          },
        },
        {
          id: '6',
          title: '재고 관리 시스템 설정',
          description: 'FIFO 재고 관리 시스템의 기본 설정 및 구성 방법입니다.',
          type: 'help',
          category: '도움말',
          url: '/company/help/inventory-settings',
          relevance: 0.68,
          lastUpdated: '2024-01-10T11:30:00Z',
          author: '지원팀',
          tags: ['도움말', '재고', '설정'],
          metadata: {
            difficulty: 'intermediate',
            estimatedTime: 15,
            views: 234,
          },
        },
        {
          id: '7',
          title: '시스템 보안 설정',
          description: '회사 시스템의 보안 정책 및 설정 관리 페이지입니다.',
          type: 'setting',
          category: '보안 설정',
          url: '/company/security',
          relevance: 0.65,
          lastUpdated: '2024-01-09T16:45:00Z',
          author: '보안팀',
          tags: ['설정', '보안', '정책'],
          metadata: {
            lastAudit: '2024-01-01',
            complianceLevel: 'high',
            activeRules: 15,
          },
        },
        {
          id: '8',
          title: '운영 매뉴얼',
          description: '회사 운영에 필요한 전체적인 가이드 및 매뉴얼 모음입니다.',
          type: 'document',
          category: '문서',
          url: '/company/manual',
          relevance: 0.62,
          lastUpdated: '2024-01-08T13:15:00Z',
          author: '운영팀',
          tags: ['문서', '매뉴얼', '가이드'],
          metadata: {
            totalPages: 156,
            version: '2.1',
            downloads: 89,
          },
        },
      ];

      // 필터 적용
      const filteredResults = mockResults.filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.description.toLowerCase().includes(query.toLowerCase()) ||
                           result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesType = filters.type.length === 0 || filters.type.includes(result.type);
        const matchesCategory = filters.category.length === 0 || filters.category.includes(result.category);
        
        return matchesQuery && matchesType && matchesCategory;
      });

      // 정렬 적용
      filteredResults.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'relevance':
            comparison = b.relevance - a.relevance;
            break;
          case 'date':
            comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
        }
        
        return sortOrder === 'asc' ? -comparison : comparison;
      });

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      // 검색 통계 시뮬레이션
      const mockStats: SearchStats = {
        totalResults: filteredResults.length,
        searchTime,
        popularQueries: ['재고 관리', '매출 분석', '직원 관리', '브랜드 설정', '보안 정책'],
        recentSearches: ['크루아상', '성수점', '월간 리포트', '시스템 설정'],
        suggestedQueries: [`${query} 설정`, `${query} 관리`, `${query} 분석`, `${query} 리포트`],
      };

      setSearchResults(filteredResults);
      setSearchStats(mockStats);

    } catch (error) {
      console.error('검색 오류:', error);
      toast.error('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, filters, sortBy, sortOrder]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams, performSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      router.push(`/company/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/company/search');
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      category: [],
      dateRange: {},
      author: [],
      tags: [],
    });
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = searchTypes.find(t => t.value === type);
    return typeConfig?.icon || <FileText className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = searchTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-500';
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = searchTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
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
                  <BreadcrumbPage>통합 검색</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">통합 검색</h1>
                <p className="text-muted-foreground">
                  브랜드, 매장, 상품, 직원, 문서 등 모든 데이터를 한 번에 검색하세요.
                </p>
              </div>
            </div>

            {/* 검색 바 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
              <Button 
                onClick={() => handleSearch(searchQuery)}
                disabled={loading}
                className="h-12 px-8"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                검색
              </Button>
            </div>

            {/* 검색 통계 및 필터 */}
            {searchStats && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    총 <strong>{searchStats.totalResults.toLocaleString()}</strong>개 결과 
                    ({searchStats.searchTime}ms)
                  </span>
                  {searchQuery && (
                    <span className="text-sm text-muted-foreground">
                      검색어: <strong>"{searchQuery}"</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                  <Select value={sortBy} onValueChange={(value: 'relevance' | 'date' | 'title') => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">관련도순</SelectItem>
                      <SelectItem value="date">최신순</SelectItem>
                      <SelectItem value="title">제목순</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* 필터 패널 */}
            {showFilters && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">검색 필터</CardTitle>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      필터 초기화
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 타입 필터 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">타입</label>
                      <div className="flex flex-wrap gap-2">
                        {searchTypes.map((type) => (
                          <Button
                            key={type.value}
                            variant={filters.type.includes(type.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              const newTypes = filters.type.includes(type.value)
                                ? filters.type.filter(t => t !== type.value)
                                : [...filters.type, type.value];
                              handleFilterChange('type', newTypes);
                            }}
                          >
                            {type.icon}
                            <span className="ml-1">{type.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">카테고리</label>
                      <Select
                        value={filters.category[0] || ''}
                        onValueChange={(value) => handleFilterChange('category', value ? [value] : [])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">전체</SelectItem>
                          <SelectItem value="브랜드 관리">브랜드 관리</SelectItem>
                          <SelectItem value="매장 관리">매장 관리</SelectItem>
                          <SelectItem value="상품 관리">상품 관리</SelectItem>
                          <SelectItem value="직원 관리">직원 관리</SelectItem>
                          <SelectItem value="분석 리포트">분석 리포트</SelectItem>
                          <SelectItem value="보안 설정">보안 설정</SelectItem>
                          <SelectItem value="도움말">도움말</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 날짜 필터 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">업데이트 날짜</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="기간 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">오늘</SelectItem>
                          <SelectItem value="week">최근 1주일</SelectItem>
                          <SelectItem value="month">최근 1개월</SelectItem>
                          <SelectItem value="quarter">최근 3개월</SelectItem>
                          <SelectItem value="year">최근 1년</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 검색 결과 */}
            <div className="grid gap-6">
              {!searchQuery ? (
                /* 검색 전 상태 */
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 인기 검색어 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>인기 검색어</span>
                      </CardTitle>
                      <CardDescription>
                        다른 사용자들이 자주 검색하는 키워드입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {searchStats?.popularQueries.map((query, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearch(query)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {query}
                          </Button>
                        )) || [
                          '재고 관리', '매출 분석', '직원 관리', '브랜드 설정', '보안 정책'
                        ].map((query, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSearch(query)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {query}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 최근 검색 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <History className="w-5 h-5" />
                        <span>최근 검색</span>
                      </CardTitle>
                      <CardDescription>
                        최근에 검색했던 키워드입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(searchStats?.recentSearches || [
                          '크루아상', '성수점', '월간 리포트', '시스템 설정'
                        ]).map((query, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                               onClick={() => handleSearch(query)}>
                            <span className="text-sm">{query}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 검색 팁 */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>검색 팁</span>
                      </CardTitle>
                      <CardDescription>
                        더 정확한 검색 결과를 얻기 위한 팁입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              1
                            </div>
                            <div>
                              <h4 className="font-medium">구체적인 키워드 사용</h4>
                              <p className="text-sm text-muted-foreground">
                                "매장"보다는 "성수점 매장"처럼 구체적으로 검색하세요.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                              2
                            </div>
                            <div>
                              <h4 className="font-medium">필터 활용</h4>
                              <p className="text-sm text-muted-foreground">
                                타입이나 카테고리 필터를 사용해 결과를 좁혀보세요.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                              3
                            </div>
                            <div>
                              <h4 className="font-medium">여러 키워드 조합</h4>
                              <p className="text-sm text-muted-foreground">
                                "재고 관리 설정"처럼 관련 키워드를 조합해보세요.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                              4
                            </div>
                            <div>
                              <h4 className="font-medium">정렬 옵션 변경</h4>
                              <p className="text-sm text-muted-foreground">
                                관련도, 날짜, 제목순으로 정렬을 바꿔가며 확인하세요.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : loading ? (
                /* 로딩 상태 */
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="ml-2">검색 중...</span>
                </div>
              ) : searchResults.length === 0 ? (
                /* 검색 결과 없음 */
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                      "{searchQuery}"에 대한 검색 결과를 찾을 수 없습니다.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">다음을 시도해보세요:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 검색어의 철자를 확인해보세요</li>
                        <li>• 더 일반적인 키워드를 사용해보세요</li>
                        <li>• 필터 설정을 확인해보세요</li>
                        <li>• 다른 키워드로 검색해보세요</li>
                      </ul>
                    </div>
                    {searchStats?.suggestedQueries && searchStats.suggestedQueries.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-medium mb-2">추천 검색어:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {searchStats.suggestedQueries.map((query, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearch(query)}
                            >
                              {query}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* 검색 결과 표시 */
                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {searchResults.map((result) => (
                    <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => router.push(result.url)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getTypeColor(result.type)} text-white`}>
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg leading-tight">
                                {highlightText(result.title, searchQuery)}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(result.type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {result.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              관련도: {Math.round(result.relevance * 100)}%
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {highlightText(result.description, searchQuery)}
                        </p>
                        
                        {/* 메타데이터 표시 */}
                        {result.metadata && Object.keys(result.metadata).length > 0 && (
                          <div className="space-y-2 mb-3">
                            {result.type === 'brand' && (
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>매장 수: {result.metadata.storeCount}</span>
                                <span>매출: {result.metadata.revenue?.toLocaleString()}원</span>
                              </div>
                            )}
                            {result.type === 'store' && (
                              <div className="text-xs text-muted-foreground">
                                <div>{result.metadata.address}</div>
                                <div>{result.metadata.phone}</div>
                              </div>
                            )}
                            {result.type === 'product' && (
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>가격: {result.metadata.price?.toLocaleString()}원</span>
                                <span>재고: {result.metadata.stock}개</span>
                              </div>
                            )}
                            {result.type === 'user' && (
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>역할: {result.metadata.role}</span>
                                <span>부서: {result.metadata.department}</span>
                              </div>
                            )}
                            {result.type === 'report' && (
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>기간: {result.metadata.period}</span>
                                <span>성장률: {result.metadata.growth}%</span>
                              </div>
                            )}
                            {result.type === 'help' && (
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>난이도: {result.metadata.difficulty}</span>
                                <span>소요시간: {result.metadata.estimatedTime}분</span>
                                <span>조회수: {result.metadata.views}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {result.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="text-xs text-muted-foreground">
                            {result.author && `작성자: ${result.author} • `}
                            업데이트: {formatDateTime(result.lastUpdated)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}