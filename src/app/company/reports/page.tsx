'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Calendar,
  Download,
  Eye,
  Share,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Target,
  Award,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const _supabase = createClient();

interface ReportSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  topBrand: {
    name: string;
    revenue: number;
    growth: number;
  };
  topStore: {
    name: string;
    revenue: number;
    growth: number;
  };
}

interface Report {
  id: string;
  title: string;
  type: 'sales' | 'financial' | 'operational' | 'customer' | 'inventory' | 'performance';
  description: string;
  status: 'generating' | 'ready' | 'failed' | 'scheduled';
  progress: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  fileSize?: number;
  downloadUrl?: string;
  parameters: {
    dateRange: string;
    brands?: string[];
    stores?: string[];
    metrics?: string[];
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  type: 'sales' | 'financial' | 'operational' | 'customer' | 'inventory' | 'performance';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  lastGenerated?: string;
  nextScheduled?: string;
  recipients: string[];
}

interface BrandPerformance {
  brandId: string;
  brandName: string;
  revenue: number;
  revenueGrowth: number;
  orders: number;
  ordersGrowth: number;
  customers: number;
  customersGrowth: number;
  averageOrderValue: number;
  profitMargin: number;
  marketShare: number;
}

interface StorePerformance {
  storeId: string;
  storeName: string;
  brandName: string;
  revenue: number;
  revenueGrowth: number;
  orders: number;
  ordersGrowth: number;
  customers: number;
  efficiency: number;
  satisfaction: number;
}

export default function IntegratedReportsPage() {
  const { user, hasMinimumRole } = useAuth();
  const _router = useRouter();
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [brandPerformance, setBrandPerformance] = useState<BrandPerformance[]>([]);
  const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([]);
  const [_loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const loadReportsData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 데이터베이스에서 리포트 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 리포트 요약 (시뮬레이션)
      const mockReportSummary: ReportSummary = {
        totalRevenue: 2450000000, // 24.5억
        revenueGrowth: 15.3,
        totalOrders: 45230,
        ordersGrowth: 8.7,
        totalCustomers: 12450,
        customersGrowth: 12.1,
        averageOrderValue: 54200,
        aovGrowth: 6.2,
        topBrand: {
          name: '밀랍(millab)',
          revenue: 1850000000,
          growth: 18.5,
        },
        topStore: {
          name: '성수점',
          revenue: 980000000,
          growth: 22.3,
        },
      };

      // 리포트 목록 (시뮬레이션)
      const mockReports: Report[] = [
        {
          id: '1',
          title: '2024년 1월 월간 매출 리포트',
          type: 'sales',
          description: '전체 브랜드 및 매장의 월간 매출 현황과 분석',
          status: 'ready',
          progress: 100,
          createdAt: '2024-01-15T09:00:00Z',
          completedAt: '2024-01-15T09:15:00Z',
          createdBy: 'admin@culinaryseoul.com',
          fileSize: 2.5 * 1024 * 1024,
          downloadUrl: '/reports/sales_202401.pdf',
          parameters: {
            dateRange: '2024-01-01 ~ 2024-01-31',
            brands: ['millab'],
            stores: ['seongsu'],
            metrics: ['revenue', 'orders', 'customers'],
          },
        },
        {
          id: '2',
          title: '고객 분석 리포트',
          type: 'customer',
          description: '고객 세그먼트별 구매 패턴 및 행동 분석',
          status: 'generating',
          progress: 65,
          createdAt: '2024-01-15T14:00:00Z',
          createdBy: 'manager@millab.co.kr',
          parameters: {
            dateRange: '2023-12-01 ~ 2024-01-31',
            brands: ['millab'],
            metrics: ['retention', 'lifetime_value', 'frequency'],
          },
        },
        {
          id: '3',
          title: '재고 효율성 분석',
          type: 'inventory',
          description: '재고 회전율 및 최적화 방안 분석',
          status: 'scheduled',
          progress: 0,
          createdAt: '2024-01-15T16:00:00Z',
          createdBy: 'staff@millab.co.kr',
          parameters: {
            dateRange: '2024-01-01 ~ 2024-01-31',
            stores: ['seongsu'],
            metrics: ['turnover', 'stockout', 'waste'],
          },
        },
        {
          id: '4',
          title: '운영 성과 리포트',
          type: 'operational',
          description: '매장 운영 효율성 및 성과 지표 분석',
          status: 'failed',
          progress: 0,
          createdAt: '2024-01-15T12:00:00Z',
          createdBy: 'admin@culinaryseoul.com',
          parameters: {
            dateRange: '2024-01-01 ~ 2024-01-15',
            stores: ['seongsu'],
            metrics: ['efficiency', 'productivity', 'quality'],
          },
        },
      ];

      // 리포트 템플릿 (시뮬레이션)
      const mockReportTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: '일일 매출 요약',
          type: 'sales',
          description: '전일 매출 현황 및 주요 지표 요약',
          frequency: 'daily',
          isActive: true,
          lastGenerated: '2024-01-15T06:00:00Z',
          nextScheduled: '2024-01-16T06:00:00Z',
          recipients: ['admin@culinaryseoul.com', 'manager@millab.co.kr'],
        },
        {
          id: '2',
          name: '주간 성과 리포트',
          type: 'performance',
          description: '주간 브랜드 및 매장 성과 분석',
          frequency: 'weekly',
          isActive: true,
          lastGenerated: '2024-01-14T07:00:00Z',
          nextScheduled: '2024-01-21T07:00:00Z',
          recipients: ['admin@culinaryseoul.com'],
        },
        {
          id: '3',
          name: '월간 재무 리포트',
          type: 'financial',
          description: '월간 재무 현황 및 수익성 분석',
          frequency: 'monthly',
          isActive: true,
          lastGenerated: '2024-01-01T08:00:00Z',
          nextScheduled: '2024-02-01T08:00:00Z',
          recipients: ['admin@culinaryseoul.com', 'cfo@culinaryseoul.com'],
        },
        {
          id: '4',
          name: '분기별 전략 리포트',
          type: 'performance',
          description: '분기별 전략 목표 달성도 및 개선 방안',
          frequency: 'quarterly',
          isActive: false,
          lastGenerated: '2023-10-01T09:00:00Z',
          nextScheduled: '2024-04-01T09:00:00Z',
          recipients: ['admin@culinaryseoul.com', 'ceo@culinaryseoul.com'],
        },
      ];

      // 브랜드 성과 (시뮬레이션)
      const mockBrandPerformance: BrandPerformance[] = [
        {
          brandId: '1',
          brandName: '밀랍(millab)',
          revenue: 1850000000,
          revenueGrowth: 18.5,
          orders: 32450,
          ordersGrowth: 12.3,
          customers: 8920,
          customersGrowth: 15.7,
          averageOrderValue: 57000,
          profitMargin: 23.5,
          marketShare: 75.5,
        },
        {
          brandId: '2',
          brandName: '기타 브랜드',
          revenue: 600000000,
          revenueGrowth: 8.2,
          orders: 12780,
          ordersGrowth: 5.1,
          customers: 3530,
          customersGrowth: 6.8,
          averageOrderValue: 46900,
          profitMargin: 18.2,
          marketShare: 24.5,
        },
      ];

      // 매장 성과 (시뮬레이션)
      const mockStorePerformance: StorePerformance[] = [
        {
          storeId: '1',
          storeName: '성수점',
          brandName: '밀랍(millab)',
          revenue: 980000000,
          revenueGrowth: 22.3,
          orders: 18250,
          ordersGrowth: 16.8,
          customers: 5120,
          efficiency: 92.5,
          satisfaction: 4.7,
        },
        {
          storeId: '2',
          storeName: '강남점',
          brandName: '밀랍(millab)',
          revenue: 870000000,
          revenueGrowth: 14.7,
          orders: 14200,
          ordersGrowth: 8.9,
          customers: 3800,
          efficiency: 88.3,
          satisfaction: 4.5,
        },
      ];

      setReportSummary(mockReportSummary);
      setReports(mockReports);
      setReportTemplates(mockReportTemplates);
      setBrandPerformance(mockBrandPerformance);
      setStorePerformance(mockStorePerformance);

    } catch (error) {
      console.error('리포트 데이터 로딩 오류:', error);
      toast.error('리포트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const handleGenerateReport = async (reportData: Partial<Report>) => {
    try {
      const newReport: Report = {
        id: Date.now().toString(),
        title: reportData.title || '새 리포트',
        type: reportData.type || 'sales',
        description: reportData.description || '',
        status: 'generating',
        progress: 0,
        createdAt: new Date().toISOString(),
        createdBy: user?.email || '',
        parameters: reportData.parameters || {
          dateRange: '최근 30일',
          metrics: ['revenue'],
        },
      };
      
      setReports(prev => [newReport, ...prev]);
      setShowCreateDialog(false);
      toast.success('리포트 생성이 시작되었습니다.');
    } catch (error) {
      console.error('리포트 생성 오류:', error);
      toast.error('리포트 생성에 실패했습니다.');
    }
  };

  const handleCreateTemplate = async (templateData: Partial<ReportTemplate>) => {
    try {
      const newTemplate: ReportTemplate = {
        id: Date.now().toString(),
        name: templateData.name || '새 템플릿',
        type: templateData.type || 'sales',
        description: templateData.description || '',
        frequency: templateData.frequency || 'monthly',
        isActive: true,
        recipients: templateData.recipients || [user?.email || ''],
      };
      
      setReportTemplates(prev => [newTemplate, ...prev]);
      setShowTemplateDialog(false);
      toast.success('리포트 템플릿이 생성되었습니다.');
    } catch (error) {
      console.error('템플릿 생성 오류:', error);
      toast.error('템플릿 생성에 실패했습니다.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600';
      case 'generating':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      case 'scheduled':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'generating':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales':
        return <DollarSign className="w-4 h-4" />;
      case 'financial':
        return <BarChart3 className="w-4 h-4" />;
      case 'operational':
        return <Activity className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      case 'inventory':
        return <Package className="w-4 h-4" />;
      case 'performance':
        return <Target className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sales':
        return '매출';
      case 'financial':
        return '재무';
      case 'operational':
        return '운영';
      case 'customer':
        return '고객';
      case 'inventory':
        return '재고';
      case 'performance':
        return '성과';
      default:
        return '기타';
    }
  };

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
                  <BreadcrumbPage>통합 리포트</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">통합 리포트</h1>
                <p className="text-muted-foreground">
                  회사 전체의 종합적인 성과와 분석 리포트를 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">최근 1주</SelectItem>
                    <SelectItem value="month">최근 1개월</SelectItem>
                    <SelectItem value="quarter">최근 3개월</SelectItem>
                    <SelectItem value="year">최근 1년</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  템플릿 관리
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <FileText className="mr-2 h-4 w-4" />
                  리포트 생성
                </Button>
              </div>
            </div>

            {/* 리포트 요약 */}
            {reportSummary && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportSummary.totalRevenue)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {reportSummary.revenueGrowth > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                      )}
                      <span className={reportSummary.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {reportSummary.revenueGrowth > 0 ? '+' : ''}{reportSummary.revenueGrowth}%
                      </span>
                      <span className="ml-1">전월 대비</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 주문</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(reportSummary.totalOrders)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {reportSummary.ordersGrowth > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                      )}
                      <span className={reportSummary.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {reportSummary.ordersGrowth > 0 ? '+' : ''}{reportSummary.ordersGrowth}%
                      </span>
                      <span className="ml-1">전월 대비</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">총 고객</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(reportSummary.totalCustomers)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {reportSummary.customersGrowth > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                      )}
                      <span className={reportSummary.customersGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {reportSummary.customersGrowth > 0 ? '+' : ''}{reportSummary.customersGrowth}%
                      </span>
                      <span className="ml-1">전월 대비</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">평균 주문액</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportSummary.averageOrderValue)}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {reportSummary.aovGrowth > 0 ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                      )}
                      <span className={reportSummary.aovGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {reportSummary.aovGrowth > 0 ? '+' : ''}{reportSummary.aovGrowth}%
                      </span>
                      <span className="ml-1">전월 대비</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 정보 탭 */}
            <Tabs defaultValue="reports" className="space-y-4">
              <TabsList>
                <TabsTrigger value="reports">리포트 목록</TabsTrigger>
                <TabsTrigger value="templates">자동 리포트</TabsTrigger>
                <TabsTrigger value="performance">성과 분석</TabsTrigger>
                <TabsTrigger value="insights">인사이트</TabsTrigger>
              </TabsList>

              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>생성된 리포트</CardTitle>
                        <CardDescription>
                          요청된 리포트의 생성 상태와 다운로드를 관리합니다.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        새 리포트
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(report.type)}
                              {getStatusIcon(report.status)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{report.title}</h3>
                              <p className="text-sm text-muted-foreground">{report.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                <span>유형: {getTypeLabel(report.type)}</span>
                                <span>생성자: {report.createdBy}</span>
                                <span>생성일: {formatDateTime(report.createdAt)}</span>
                                {report.fileSize && (
                                  <span>크기: {formatBytes(report.fileSize)}</span>
                                )}
                              </div>
                              {report.status === 'generating' && (
                                <Progress value={report.progress} className="mt-2 w-48" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status === 'generating' ? '생성 중' :
                               report.status === 'ready' ? '완료' :
                               report.status === 'failed' ? '실패' : '예약됨'}
                            </Badge>
                            {report.status === 'ready' && (
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  미리보기
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  다운로드
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Share className="mr-2 h-4 w-4" />
                                  공유
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>자동 리포트 템플릿</CardTitle>
                        <CardDescription>
                          정기적으로 자동 생성되는 리포트를 관리합니다.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowTemplateDialog(true)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        새 템플릿
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportTemplates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {getTypeIcon(template.type)}
                            <div>
                              <h3 className="font-semibold">{template.name}</h3>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                <span>유형: {getTypeLabel(template.type)}</span>
                                <span>주기: {template.frequency === 'daily' ? '매일' :
                                           template.frequency === 'weekly' ? '매주' :
                                           template.frequency === 'monthly' ? '매월' :
                                           template.frequency === 'quarterly' ? '분기별' : '연간'}</span>
                                <span>수신자: {template.recipients.length}명</span>
                                {template.lastGenerated && (
                                  <span>마지막 생성: {formatDateTime(template.lastGenerated)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={template.isActive ? 'default' : 'secondary'}>
                              {template.isActive ? '활성' : '비활성'}
                            </Badge>
                            {template.nextScheduled && (
                              <span className="text-xs text-muted-foreground">
                                다음: {formatDateTime(template.nextScheduled)}
                              </span>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              설정
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        브랜드별 성과
                      </CardTitle>
                      <CardDescription>
                        브랜드별 주요 성과 지표를 비교합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {brandPerformance.map((brand) => (
                          <div key={brand.brandId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{brand.brandName}</h3>
                              <Badge variant="outline">{brand.marketShare}% 점유율</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">매출: </span>
                                <span className="font-medium">{formatCurrency(brand.revenue)}</span>
                                <span className={`ml-1 text-xs ${
                                  brand.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({brand.revenueGrowth > 0 ? '+' : ''}{brand.revenueGrowth}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">주문: </span>
                                <span className="font-medium">{formatNumber(brand.orders)}</span>
                                <span className={`ml-1 text-xs ${
                                  brand.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({brand.ordersGrowth > 0 ? '+' : ''}{brand.ordersGrowth}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">고객: </span>
                                <span className="font-medium">{formatNumber(brand.customers)}</span>
                                <span className={`ml-1 text-xs ${
                                  brand.customersGrowth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({brand.customersGrowth > 0 ? '+' : ''}{brand.customersGrowth}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">수익률: </span>
                                <span className="font-medium">{brand.profitMargin}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        매장별 성과
                      </CardTitle>
                      <CardDescription>
                        매장별 운영 효율성과 고객 만족도를 분석합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {storePerformance.map((store) => (
                          <div key={store.storeId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{store.storeName}</h3>
                              <Badge variant="outline">{store.brandName}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">매출: </span>
                                <span className="font-medium">{formatCurrency(store.revenue)}</span>
                                <span className={`ml-1 text-xs ${
                                  store.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({store.revenueGrowth > 0 ? '+' : ''}{store.revenueGrowth}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">주문: </span>
                                <span className="font-medium">{formatNumber(store.orders)}</span>
                                <span className={`ml-1 text-xs ${
                                  store.ordersGrowth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ({store.ordersGrowth > 0 ? '+' : ''}{store.ordersGrowth}%)
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">효율성: </span>
                                <span className="font-medium">{store.efficiency}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">만족도: </span>
                                <span className="font-medium">{store.satisfaction}/5.0</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        주요 인사이트
                      </CardTitle>
                      <CardDescription>
                        데이터 분석을 통한 비즈니스 인사이트를 제공합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">성장 기회</span>
                        </div>
                        <p className="text-sm text-green-700">
                          밀랍 브랜드의 성수점이 22.3% 성장률을 보이며 최고 성과를 기록했습니다. 
                          이 성공 모델을 다른 매장에 적용할 수 있습니다.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-800">고객 트렌드</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          신규 고객 증가율이 12.1%로 양호하며, 평균 주문액도 6.2% 증가했습니다. 
                          고객 만족도 개선이 매출 증대로 이어지고 있습니다.
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-semibold text-yellow-800">주의 사항</span>
                        </div>
                        <p className="text-sm text-yellow-700">
                          기타 브랜드의 성장률이 8.2%로 상대적으로 낮습니다. 
                          마케팅 전략 재검토와 운영 효율성 개선이 필요합니다.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        추천 액션
                      </CardTitle>
                      <CardDescription>
                        데이터 기반 개선 방안을 제안합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-sm">성수점 성공 모델 확산</h4>
                          <p className="text-xs text-muted-foreground">
                            성수점의 운영 방식과 마케팅 전략을 다른 매장에 적용하여 전체 성과 향상
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-sm">고객 세그먼트별 맞춤 서비스</h4>
                          <p className="text-xs text-muted-foreground">
                            고객 분석 데이터를 활용한 개인화된 메뉴 추천 및 프로모션 제공
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-sm">기타 브랜드 성장 전략</h4>
                          <p className="text-xs text-muted-foreground">
                            저성장 브랜드의 메뉴 개선, 가격 정책 재검토, 마케팅 투자 확대
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-semibold text-sm">운영 효율성 개선</h4>
                          <p className="text-xs text-muted-foreground">
                            재고 관리 최적화, 직원 교육 강화, 프로세스 자동화 도입
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 리포트 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 리포트 생성</DialogTitle>
            <DialogDescription>
              생성할 리포트의 유형과 설정을 선택합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport({
                title: '매출 분석 리포트',
                type: 'sales',
                description: '브랜드별 매출 현황 및 트렌드 분석'
              })}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              매출 분석 리포트
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport({
                title: '고객 행동 분석',
                type: 'customer',
                description: '고객 세그먼트별 구매 패턴 분석'
              })}
            >
              <Users className="mr-2 h-4 w-4" />
              고객 행동 분석
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport({
                title: '운영 성과 리포트',
                type: 'operational',
                description: '매장별 운영 효율성 및 성과 분석'
              })}
            >
              <Activity className="mr-2 h-4 w-4" />
              운영 성과 리포트
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleGenerateReport({
                title: '재고 분석 리포트',
                type: 'inventory',
                description: '재고 회전율 및 최적화 분석'
              })}
            >
              <Package className="mr-2 h-4 w-4" />
              재고 분석 리포트
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 템플릿 생성 다이얼로그 */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자동 리포트 템플릿 생성</DialogTitle>
            <DialogDescription>
              정기적으로 자동 생성될 리포트 템플릿을 설정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">템플릿 이름</Label>
              <Input id="template-name" placeholder="예: 주간 매출 요약" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">설명</Label>
              <Textarea id="template-description" placeholder="템플릿에 대한 설명을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-type">리포트 유형</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">매출</SelectItem>
                  <SelectItem value="financial">재무</SelectItem>
                  <SelectItem value="operational">운영</SelectItem>
                  <SelectItem value="customer">고객</SelectItem>
                  <SelectItem value="inventory">재고</SelectItem>
                  <SelectItem value="performance">성과</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-frequency">생성 주기</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="주기 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">매일</SelectItem>
                  <SelectItem value="weekly">매주</SelectItem>
                  <SelectItem value="monthly">매월</SelectItem>
                  <SelectItem value="quarterly">분기별</SelectItem>
                  <SelectItem value="yearly">연간</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              취소
            </Button>
            <Button onClick={() => handleCreateTemplate({})}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}