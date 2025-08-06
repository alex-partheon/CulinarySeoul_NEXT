'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Search,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ExternalLink,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  Shield,
  Database,
  Globe,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  RefreshCw,
  Info,
  Lightbulb,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// const supabase = createClient();

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  articleCount: number;
  color: string;
}

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // 분
  views: number;
  rating: number;
  lastUpdated: string;
  author: string;
  helpful: number;
  notHelpful: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  hours: string;
  address: string;
  website: string;
}

export default function CompanyHelpPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium' as const,
  });

  const loadHelpData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 데이터베이스에서 도움말 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 도움말 카테고리 (시뮬레이션)
      const mockCategories: HelpCategory[] = [
        {
          id: 'getting-started',
          name: '시작하기',
          description: '시스템 사용을 위한 기본 가이드',
          icon: <Book className="w-5 h-5" />,
          articleCount: 12,
          color: 'bg-blue-500',
        },
        {
          id: 'user-management',
          name: '사용자 관리',
          description: '직원 및 권한 관리 방법',
          icon: <Users className="w-5 h-5" />,
          articleCount: 8,
          color: 'bg-green-500',
        },
        {
          id: 'inventory',
          name: '재고 관리',
          description: '재고 추적 및 관리 시스템',
          icon: <ShoppingCart className="w-5 h-5" />,
          articleCount: 15,
          color: 'bg-orange-500',
        },
        {
          id: 'analytics',
          name: '분석 및 리포트',
          description: '데이터 분석 및 보고서 생성',
          icon: <BarChart3 className="w-5 h-5" />,
          articleCount: 10,
          color: 'bg-purple-500',
        },
        {
          id: 'settings',
          name: '설정',
          description: '시스템 설정 및 구성',
          icon: <Settings className="w-5 h-5" />,
          articleCount: 6,
          color: 'bg-gray-500',
        },
        {
          id: 'security',
          name: '보안',
          description: '보안 설정 및 관리',
          icon: <Shield className="w-5 h-5" />,
          articleCount: 7,
          color: 'bg-red-500',
        },
      ];

      // 도움말 문서 (시뮬레이션)
      const mockArticles: HelpArticle[] = [
        {
          id: '1',
          title: '시스템 첫 설정하기',
          description: '처음 시스템을 사용할 때 필요한 기본 설정 방법',
          content: '시스템 첫 설정에 대한 상세한 가이드...',
          category: 'getting-started',
          tags: ['설정', '시작', '기본'],
          difficulty: 'beginner',
          estimatedTime: 10,
          views: 1250,
          rating: 4.8,
          lastUpdated: '2024-01-15T10:00:00Z',
          author: 'CulinarySeoul 지원팀',
          helpful: 95,
          notHelpful: 5,
        },
        {
          id: '2',
          title: '직원 계정 생성 및 권한 설정',
          description: '새로운 직원을 시스템에 추가하고 적절한 권한을 부여하는 방법',
          content: '직원 계정 생성에 대한 상세한 가이드...',
          category: 'user-management',
          tags: ['직원', '권한', '계정'],
          difficulty: 'intermediate',
          estimatedTime: 15,
          views: 890,
          rating: 4.6,
          lastUpdated: '2024-01-14T14:30:00Z',
          author: 'CulinarySeoul 지원팀',
          helpful: 78,
          notHelpful: 8,
        },
        {
          id: '3',
          title: 'FIFO 재고 관리 시스템 사용법',
          description: '선입선출 방식의 재고 관리 시스템을 효과적으로 사용하는 방법',
          content: 'FIFO 재고 관리에 대한 상세한 가이드...',
          category: 'inventory',
          tags: ['재고', 'FIFO', '관리'],
          difficulty: 'advanced',
          estimatedTime: 25,
          views: 1450,
          rating: 4.9,
          lastUpdated: '2024-01-13T09:15:00Z',
          author: 'CulinarySeoul 지원팀',
          helpful: 142,
          notHelpful: 3,
        },
        {
          id: '4',
          title: '매출 분석 리포트 생성하기',
          description: '다양한 매출 분석 리포트를 생성하고 해석하는 방법',
          content: '매출 분석 리포트에 대한 상세한 가이드...',
          category: 'analytics',
          tags: ['매출', '분석', '리포트'],
          difficulty: 'intermediate',
          estimatedTime: 20,
          views: 720,
          rating: 4.5,
          lastUpdated: '2024-01-12T16:45:00Z',
          author: 'CulinarySeoul 지원팀',
          helpful: 65,
          notHelpful: 7,
        },
        {
          id: '5',
          title: '보안 설정 및 2단계 인증',
          description: '시스템 보안을 강화하기 위한 설정 방법',
          content: '보안 설정에 대한 상세한 가이드...',
          category: 'security',
          tags: ['보안', '인증', '설정'],
          difficulty: 'intermediate',
          estimatedTime: 12,
          views: 560,
          rating: 4.7,
          lastUpdated: '2024-01-11T11:20:00Z',
          author: 'CulinarySeoul 지원팀',
          helpful: 52,
          notHelpful: 4,
        },
      ];

      // FAQ (시뮬레이션)
      const mockFaqs: FAQ[] = [
        {
          id: '1',
          question: '비밀번호를 잊어버렸어요. 어떻게 재설정하나요?',
          answer: '로그인 페이지에서 "비밀번호 찾기" 링크를 클릭하고, 등록된 이메일 주소를 입력하세요. 비밀번호 재설정 링크가 이메일로 전송됩니다.',
          category: 'getting-started',
          tags: ['비밀번호', '재설정', '로그인'],
          views: 2340,
          helpful: 198,
          lastUpdated: '2024-01-15T08:30:00Z',
        },
        {
          id: '2',
          question: '재고 수량이 실제와 다를 때는 어떻게 하나요?',
          answer: '재고 관리 페이지에서 "재고 조정" 기능을 사용하여 실제 수량으로 조정할 수 있습니다. 조정 사유를 반드시 입력해주세요.',
          category: 'inventory',
          tags: ['재고', '조정', '수량'],
          views: 1890,
          helpful: 156,
          lastUpdated: '2024-01-14T15:20:00Z',
        },
        {
          id: '3',
          question: '새로운 브랜드를 추가하려면 어떻게 해야 하나요?',
          answer: '회사 관리자 권한이 필요합니다. 브랜드 관리 페이지에서 "새 브랜드 생성" 버튼을 클릭하고 필요한 정보를 입력하세요.',
          category: 'user-management',
          tags: ['브랜드', '추가', '권한'],
          views: 1560,
          helpful: 134,
          lastUpdated: '2024-01-13T12:10:00Z',
        },
        {
          id: '4',
          question: '매출 데이터를 엑셀로 내보낼 수 있나요?',
          answer: '네, 가능합니다. 분석 리포트 페이지에서 원하는 기간과 조건을 설정한 후 "엑셀 내보내기" 버튼을 클릭하세요.',
          category: 'analytics',
          tags: ['매출', '엑셀', '내보내기'],
          views: 1230,
          helpful: 98,
          lastUpdated: '2024-01-12T09:45:00Z',
        },
        {
          id: '5',
          question: '시스템 점검 시간은 언제인가요?',
          answer: '정기 점검은 매주 일요일 새벽 2시~4시에 진행됩니다. 긴급 점검이 필요한 경우 사전에 공지해드립니다.',
          category: 'settings',
          tags: ['점검', '시간', '공지'],
          views: 890,
          helpful: 76,
          lastUpdated: '2024-01-11T16:30:00Z',
        },
      ];

      // 지원 티켓 (시뮬레이션)
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          subject: '재고 데이터 동기화 문제',
          description: '매장 재고와 시스템 재고가 일치하지 않습니다.',
          category: 'inventory',
          priority: 'high',
          status: 'in_progress',
          createdAt: '2024-01-15T14:20:00Z',
          updatedAt: '2024-01-15T15:30:00Z',
          assignedTo: '기술지원팀',
        },
        {
          id: '2',
          subject: '새 직원 계정 생성 요청',
          description: '신입 직원을 위한 계정 생성이 필요합니다.',
          category: 'user-management',
          priority: 'medium',
          status: 'resolved',
          createdAt: '2024-01-14T10:15:00Z',
          updatedAt: '2024-01-14T16:45:00Z',
          assignedTo: '관리자',
        },
      ];

      // 연락처 정보 (시뮬레이션)
      const mockContactInfo: ContactInfo = {
        email: 'support@culinaryseoul.com',
        phone: '02-1234-5678',
        hours: '평일 09:00 - 18:00',
        address: '서울특별시 성동구 성수일로8길 5',
        website: 'https://culinaryseoul.com/support',
      };

      setCategories(mockCategories);
      setArticles(mockArticles);
      setFaqs(mockFaqs);
      setTickets(mockTickets);
      setContactInfo(mockContactInfo);

    } catch (error) {
      console.error('도움말 데이터 로딩 오류:', error);
      toast.error('도움말 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHelpData();
  }, [loadHelpData]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.description || !newTicket.category) {
      toast.error('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      // 실제 구현에서는 데이터베이스에 티켓 저장
      const ticket: SupportTicket = {
        id: Date.now().toString(),
        ...newTicket,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTickets(prev => [ticket, ...prev]);
      setNewTicket({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
      });
      setShowTicketDialog(false);
      toast.success('지원 요청이 접수되었습니다.');
    } catch (error) {
      console.error('티켓 생성 오류:', error);
      toast.error('지원 요청 접수에 실패했습니다.');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return difficulty;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasMinimumRole('brand_staff')) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
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
                  <BreadcrumbPage>도움말</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">도움말 센터</h1>
                <p className="text-muted-foreground">
                  시스템 사용법과 자주 묻는 질문을 확인하고 지원을 요청하세요.
                </p>
              </div>
              <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    지원 요청
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* 검색 및 필터 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="도움말 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 도움말 탭 */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="guides">사용 가이드</TabsTrigger>
                <TabsTrigger value="faq">자주 묻는 질문</TabsTrigger>
                <TabsTrigger value="support">지원 요청</TabsTrigger>
                <TabsTrigger value="contact">연락처</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* 카테고리 개요 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedCategory(category.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${category.color} text-white`}>
                            {category.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {category.articleCount}개 문서
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 인기 문서 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="w-5 h-5" />
                      <span>인기 문서</span>
                    </CardTitle>
                    <CardDescription>
                      가장 많이 조회된 도움말 문서입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {articles.slice(0, 5).map((article) => (
                        <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="flex-1">
                            <h4 className="font-medium">{article.title}</h4>
                            <p className="text-sm text-muted-foreground">{article.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className={getDifficultyColor(article.difficulty)}>
                                {getDifficultyLabel(article.difficulty)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {article.estimatedTime}분
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {article.views.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                {article.rating}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guides" className="space-y-4">
                <div className="grid gap-4">
                  {filteredArticles.map((article) => (
                    <Card key={article.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {article.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getDifficultyColor(article.difficulty)}>
                              {getDifficultyLabel(article.difficulty)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {article.estimatedTime}분
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {article.views.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {article.rating}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center">
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {article.helpful}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {article.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground">
                          작성자: {article.author} • 업데이트: {formatDateTime(article.lastUpdated)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="faq" className="space-y-4">
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-left font-medium">{faq.question}</span>
                          <div className="flex items-center space-x-2 mr-4">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {faq.views}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {faq.helpful}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-3">
                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {faq.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                도움됨
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                도움안됨
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            업데이트: {formatDateTime(faq.lastUpdated)}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="support" className="space-y-4">
                <div className="grid gap-6">
                  {/* 내 지원 요청 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>내 지원 요청</span>
                      </CardTitle>
                      <CardDescription>
                        제출한 지원 요청의 상태를 확인할 수 있습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {tickets.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">아직 지원 요청이 없습니다.</p>
                          <Button className="mt-4" onClick={() => setShowTicketDialog(true)}>
                            첫 지원 요청하기
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tickets.map((ticket) => (
                            <div key={ticket.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{ticket.subject}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {ticket.description}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-3">
                                    <Badge className={getPriorityColor(ticket.priority)}>
                                      {ticket.priority}
                                    </Badge>
                                    <Badge className={getStatusColor(ticket.status)}>
                                      {ticket.status}
                                    </Badge>
                                    {ticket.assignedTo && (
                                      <span className="text-xs text-muted-foreground">
                                        담당자: {ticket.assignedTo}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  <div>생성: {formatDateTime(ticket.createdAt)}</div>
                                  <div>업데이트: {formatDateTime(ticket.updatedAt)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                {contactInfo && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 연락처 정보 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Phone className="w-5 h-5" />
                          <span>연락처 정보</span>
                        </CardTitle>
                        <CardDescription>
                          직접 문의가 필요한 경우 아래 연락처를 이용하세요.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">이메일</div>
                            <div className="text-sm text-muted-foreground">{contactInfo.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">전화번호</div>
                            <div className="text-sm text-muted-foreground">{contactInfo.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">운영시간</div>
                            <div className="text-sm text-muted-foreground">{contactInfo.hours}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Globe className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">웹사이트</div>
                            <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-blue-600 hover:underline flex items-center">
                              {contactInfo.website}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 빠른 링크 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5" />
                          <span>빠른 링크</span>
                        </CardTitle>
                        <CardDescription>
                          자주 사용하는 기능들에 빠르게 접근하세요.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href="/company/manual" className="flex items-center">
                            <Book className="w-4 h-4 mr-2" />
                            운영 매뉴얼
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href="/company/settings" className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            시스템 설정
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href="/company/security" className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            보안 설정
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href="/company/data" className="flex items-center">
                            <Database className="w-4 h-4 mr-2" />
                            데이터 센터
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 지원 요청 다이얼로그 */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>지원 요청</DialogTitle>
            <DialogDescription>
              문제나 질문이 있으시면 아래 양식을 작성해주세요. 빠른 시일 내에 답변드리겠습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">제목 *</Label>
              <Input
                id="subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({...prev, subject: e.target.value}))}
                placeholder="문제나 질문을 간단히 요약해주세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select value={newTicket.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewTicket(prev => ({...prev, priority: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">상세 설명 *</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({...prev, description: e.target.value}))}
                placeholder="문제 상황이나 질문 내용을 자세히 설명해주세요"
                rows={5}
              />
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>팁:</strong> 스크린샷이나 오류 메시지를 포함하면 더 빠른 해결이 가능합니다.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateTicket}>
              <Send className="mr-2 h-4 w-4" />
              요청 제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}