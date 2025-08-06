'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CompanyAdminUp, AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Settings,
  Building2,
  Users,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Database,
  Server,
  Wifi,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Save,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Trash2,
  Edit,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient();

interface CompanySettings {
  // 회사 기본 정보
  companyName: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  logo?: string;
  
  // 운영 설정
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  
  // 알림 설정
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  
  // 시스템 설정
  maintenanceMode: boolean;
  debugMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  
  // 보안 설정
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
  
  // 테마 설정
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  
  // 통합 설정
  integrations: {
    googleAnalytics?: string;
    facebookPixel?: string;
    tossPayments?: string;
    kakaoTalk?: string;
    naverPay?: string;
  };
}

interface SystemInfo {
  version: string;
  lastUpdate: string;
  uptime: string;
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    size: number;
    connections: number;
    status: 'healthy' | 'warning' | 'error';
  };
  performance: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'warning' | 'error';
}

export default function CompanySettingsPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const loadSettingsData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 데이터베이스에서 설정 데이터를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 회사 설정 (시뮬레이션)
      const mockSettings: CompanySettings = {
        companyName: 'CulinarySeoul',
        businessNumber: '123-45-67890',
        address: '서울특별시 성동구 성수일로8길 5',
        phone: '02-1234-5678',
        email: 'contact@culinaryseoul.com',
        website: 'https://culinaryseoul.com',
        description: '다양한 브랜드를 운영하는 종합 외식 기업',
        logo: '/images/company-logo.png',
        
        timezone: 'Asia/Seoul',
        currency: 'KRW',
        language: 'ko',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        
        maintenanceMode: false,
        debugMode: false,
        autoBackup: true,
        backupFrequency: 'daily',
        
        twoFactorAuth: true,
        sessionTimeout: 480, // 8시간
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
        },
        
        theme: 'system',
        primaryColor: '#0ea5e9',
        accentColor: '#f59e0b',
        
        integrations: {
          googleAnalytics: 'GA-XXXXXXXXX',
          tossPayments: 'test_ck_XXXXXXXXX',
          kakaoTalk: 'XXXXXXXXX',
        },
      };

      // 시스템 정보 (시뮬레이션)
      const mockSystemInfo: SystemInfo = {
        version: '1.2.3',
        lastUpdate: '2024-01-15T10:00:00Z',
        uptime: '15일 8시간 32분',
        storage: {
          used: 45.2,
          total: 100,
          percentage: 45.2,
        },
        database: {
          size: 2.8,
          connections: 12,
          status: 'healthy',
        },
        performance: {
          cpu: 23.5,
          memory: 67.8,
          responseTime: 145,
        },
      };

      // 활동 로그 (시뮬레이션)
      const mockActivityLogs: ActivityLog[] = [
        {
          id: '1',
          userId: '1',
          userName: 'admin@culinaryseoul.com',
          action: 'settings_update',
          description: '회사 기본 정보 수정',
          timestamp: '2024-01-15T14:30:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'success',
        },
        {
          id: '2',
          userId: '2',
          userName: 'manager@culinaryseoul.com',
          action: 'backup_create',
          description: '수동 백업 생성',
          timestamp: '2024-01-15T12:15:00Z',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success',
        },
        {
          id: '3',
          userId: '1',
          userName: 'admin@culinaryseoul.com',
          action: 'security_update',
          description: '보안 정책 변경',
          timestamp: '2024-01-15T09:45:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'warning',
        },
        {
          id: '4',
          userId: '3',
          userName: 'tech@culinaryseoul.com',
          action: 'system_maintenance',
          description: '시스템 점검 모드 활성화 시도',
          timestamp: '2024-01-14T22:30:00Z',
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Ubuntu; Linux x86_64)',
          status: 'error',
        },
        {
          id: '5',
          userId: '1',
          userName: 'admin@culinaryseoul.com',
          action: 'integration_update',
          description: '결제 시스템 연동 설정 변경',
          timestamp: '2024-01-14T16:20:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'success',
        },
      ];

      setSettings(mockSettings);
      setSystemInfo(mockSystemInfo);
      setActivityLogs(mockActivityLogs);

    } catch (error) {
      console.error('설정 데이터 로딩 오류:', error);
      toast.error('설정 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      
      // 실제 구현에서는 데이터베이스에 설정 저장
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      // 실제 구현에서는 기본 설정으로 리셋
      await loadSettingsData();
      setShowResetDialog(false);
      toast.success('설정이 초기화되었습니다.');
    } catch (error) {
      console.error('설정 초기화 오류:', error);
      toast.error('설정 초기화에 실패했습니다.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      // 실제 구현에서는 백업 생성 로직
      await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션
      setShowBackupDialog(false);
      toast.success('백업이 생성되었습니다.');
    } catch (error) {
      console.error('백업 생성 오류:', error);
      toast.error('백업 생성에 실패했습니다.');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return '성공';
      case 'warning':
        return '경고';
      case 'error':
        return '오류';
      default:
        return '알 수 없음';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'settings_update':
        return '설정 변경';
      case 'backup_create':
        return '백업 생성';
      case 'security_update':
        return '보안 업데이트';
      case 'system_maintenance':
        return '시스템 점검';
      case 'integration_update':
        return '연동 설정';
      default:
        return action;
    }
  };

  if (!hasMinimumRole('company_admin')) {
    return <AccessDenied />;
  }

  if (loading || !settings) {
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
                  <BreadcrumbPage>일반 설정</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">일반 설정</h1>
                <p className="text-muted-foreground">
                  회사의 기본 설정과 시스템 환경을 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowResetDialog(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  초기화
                </Button>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  저장
                </Button>
              </div>
            </div>

            {/* 설정 탭 */}
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList>
                <TabsTrigger value="general">기본 정보</TabsTrigger>
                <TabsTrigger value="system">시스템</TabsTrigger>
                <TabsTrigger value="notifications">알림</TabsTrigger>
                <TabsTrigger value="security">보안</TabsTrigger>
                <TabsTrigger value="appearance">외관</TabsTrigger>
                <TabsTrigger value="integrations">연동</TabsTrigger>
                <TabsTrigger value="logs">활동 로그</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>회사 기본 정보</span>
                      </CardTitle>
                      <CardDescription>
                        회사의 기본적인 정보를 설정합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">회사명</Label>
                          <Input
                            id="companyName"
                            value={settings.companyName}
                            onChange={(e) => setSettings(prev => prev ? {...prev, companyName: e.target.value} : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessNumber">사업자등록번호</Label>
                          <Input
                            id="businessNumber"
                            value={settings.businessNumber}
                            onChange={(e) => setSettings(prev => prev ? {...prev, businessNumber: e.target.value} : null)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">주소</Label>
                        <Input
                          id="address"
                          value={settings.address}
                          onChange={(e) => setSettings(prev => prev ? {...prev, address: e.target.value} : null)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">전화번호</Label>
                          <Input
                            id="phone"
                            value={settings.phone}
                            onChange={(e) => setSettings(prev => prev ? {...prev, phone: e.target.value} : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">이메일</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.email}
                            onChange={(e) => setSettings(prev => prev ? {...prev, email: e.target.value} : null)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">웹사이트</Label>
                        <Input
                          id="website"
                          type="url"
                          value={settings.website || ''}
                          onChange={(e) => setSettings(prev => prev ? {...prev, website: e.target.value} : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">회사 소개</Label>
                        <Textarea
                          id="description"
                          value={settings.description || ''}
                          onChange={(e) => setSettings(prev => prev ? {...prev, description: e.target.value} : null)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span>지역 및 언어 설정</span>
                      </CardTitle>
                      <CardDescription>
                        시간대, 통화, 언어 등을 설정합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="timezone">시간대</Label>
                          <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => prev ? {...prev, timezone: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">통화</Label>
                          <Select value={settings.currency} onValueChange={(value) => setSettings(prev => prev ? {...prev, currency: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KRW">KRW (원)</SelectItem>
                              <SelectItem value="USD">USD (달러)</SelectItem>
                              <SelectItem value="EUR">EUR (유로)</SelectItem>
                              <SelectItem value="JPY">JPY (엔)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="language">언어</Label>
                          <Select value={settings.language} onValueChange={(value) => setSettings(prev => prev ? {...prev, language: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ko">한국어</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ja">日本語</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateFormat">날짜 형식</Label>
                          <Select value={settings.dateFormat} onValueChange={(value) => setSettings(prev => prev ? {...prev, dateFormat: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeFormat">시간 형식</Label>
                          <Select value={settings.timeFormat} onValueChange={(value) => setSettings(prev => prev ? {...prev, timeFormat: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24h">24시간</SelectItem>
                              <SelectItem value="12h">12시간</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <div className="grid gap-6">
                  {/* 시스템 상태 */}
                  {systemInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Server className="w-5 h-5" />
                          <span>시스템 상태</span>
                        </CardTitle>
                        <CardDescription>
                          현재 시스템의 상태와 성능을 확인합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{systemInfo.version}</div>
                            <div className="text-sm text-muted-foreground">버전</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{systemInfo.uptime}</div>
                            <div className="text-sm text-muted-foreground">가동 시간</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">{systemInfo.storage.percentage}%</div>
                            <div className="text-sm text-muted-foreground">저장소 사용률</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{systemInfo.database.status}</div>
                            <div className="text-sm text-muted-foreground">DB 상태</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>시스템 설정</span>
                      </CardTitle>
                      <CardDescription>
                        시스템 운영과 관련된 설정을 관리합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>점검 모드</Label>
                          <div className="text-sm text-muted-foreground">
                            시스템 점검 시 사용자 접근을 제한합니다.
                          </div>
                        </div>
                        <Switch
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, maintenanceMode: checked} : null)}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>디버그 모드</Label>
                          <div className="text-sm text-muted-foreground">
                            개발 및 디버깅을 위한 상세 로그를 활성화합니다.
                          </div>
                        </div>
                        <Switch
                          checked={settings.debugMode}
                          onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, debugMode: checked} : null)}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>자동 백업</Label>
                          <div className="text-sm text-muted-foreground">
                            정기적으로 데이터를 자동 백업합니다.
                          </div>
                        </div>
                        <Switch
                          checked={settings.autoBackup}
                          onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, autoBackup: checked} : null)}
                        />
                      </div>
                      {settings.autoBackup && (
                        <div className="space-y-2">
                          <Label htmlFor="backupFrequency">백업 주기</Label>
                          <Select value={settings.backupFrequency} onValueChange={(value) => setSettings(prev => prev ? {...prev, backupFrequency: value} : null)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">매시간</SelectItem>
                              <SelectItem value="daily">매일</SelectItem>
                              <SelectItem value="weekly">매주</SelectItem>
                              <SelectItem value="monthly">매월</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="pt-4">
                        <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
                          <Download className="mr-2 h-4 w-4" />
                          수동 백업 생성
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>알림 설정</span>
                    </CardTitle>
                    <CardDescription>
                      다양한 알림 방식을 설정합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>이메일 알림</Label>
                        <div className="text-sm text-muted-foreground">
                          중요한 알림을 이메일로 받습니다.
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, emailNotifications: checked} : null)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS 알림</Label>
                        <div className="text-sm text-muted-foreground">
                          긴급한 알림을 SMS로 받습니다.
                        </div>
                      </div>
                      <Switch
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, smsNotifications: checked} : null)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>푸시 알림</Label>
                        <div className="text-sm text-muted-foreground">
                          브라우저 푸시 알림을 받습니다.
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, pushNotifications: checked} : null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>보안 설정</span>
                    </CardTitle>
                    <CardDescription>
                      시스템 보안과 관련된 설정을 관리합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>2단계 인증</Label>
                        <div className="text-sm text-muted-foreground">
                          추가 보안을 위한 2단계 인증을 활성화합니다.
                        </div>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(checked) => setSettings(prev => prev ? {...prev, twoFactorAuth: checked} : null)}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => prev ? {...prev, sessionTimeout: parseInt(e.target.value)} : null)}
                      />
                      <div className="text-sm text-muted-foreground">
                        비활성 상태에서 자동 로그아웃되는 시간을 설정합니다.
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>비밀번호 정책</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">최소 길이: {settings.passwordPolicy.minLength}자</span>
                          <Input
                            type="number"
                            value={settings.passwordPolicy.minLength}
                            onChange={(e) => setSettings(prev => prev ? {
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                minLength: parseInt(e.target.value)
                              }
                            } : null)}
                            className="w-20"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">대문자 포함</span>
                          <Switch
                            checked={settings.passwordPolicy.requireUppercase}
                            onCheckedChange={(checked) => setSettings(prev => prev ? {
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireUppercase: checked
                              }
                            } : null)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">소문자 포함</span>
                          <Switch
                            checked={settings.passwordPolicy.requireLowercase}
                            onCheckedChange={(checked) => setSettings(prev => prev ? {
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireLowercase: checked
                              }
                            } : null)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">숫자 포함</span>
                          <Switch
                            checked={settings.passwordPolicy.requireNumbers}
                            onCheckedChange={(checked) => setSettings(prev => prev ? {
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireNumbers: checked
                              }
                            } : null)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">특수문자 포함</span>
                          <Switch
                            checked={settings.passwordPolicy.requireSymbols}
                            onCheckedChange={(checked) => setSettings(prev => prev ? {
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireSymbols: checked
                              }
                            } : null)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>외관 설정</span>
                    </CardTitle>
                    <CardDescription>
                      시스템의 테마와 색상을 설정합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">테마</Label>
                      <Select value={settings.theme} onValueChange={(value: 'light' | 'dark' | 'system') => setSettings(prev => prev ? {...prev, theme: value} : null)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">라이트</SelectItem>
                          <SelectItem value="dark">다크</SelectItem>
                          <SelectItem value="system">시스템 설정</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">기본 색상</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => setSettings(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.primaryColor}
                            onChange={(e) => setSettings(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accentColor">강조 색상</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="accentColor"
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => setSettings(prev => prev ? {...prev, accentColor: e.target.value} : null)}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={settings.accentColor}
                            onChange={(e) => setSettings(prev => prev ? {...prev, accentColor: e.target.value} : null)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wifi className="w-5 h-5" />
                      <span>외부 연동</span>
                    </CardTitle>
                    <CardDescription>
                      외부 서비스와의 연동을 설정합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="googleAnalytics">Google Analytics</Label>
                      <Input
                        id="googleAnalytics"
                        value={settings.integrations.googleAnalytics || ''}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            googleAnalytics: e.target.value
                          }
                        } : null)}
                        placeholder="GA-XXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tossPayments">토스페이먼츠</Label>
                      <Input
                        id="tossPayments"
                        value={settings.integrations.tossPayments || ''}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            tossPayments: e.target.value
                          }
                        } : null)}
                        placeholder="test_ck_XXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kakaoTalk">카카오톡</Label>
                      <Input
                        id="kakaoTalk"
                        value={settings.integrations.kakaoTalk || ''}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            kakaoTalk: e.target.value
                          }
                        } : null)}
                        placeholder="앱 키"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookPixel">Facebook Pixel</Label>
                      <Input
                        id="facebookPixel"
                        value={settings.integrations.facebookPixel || ''}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            facebookPixel: e.target.value
                          }
                        } : null)}
                        placeholder="픽셀 ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="naverPay">네이버페이</Label>
                      <Input
                        id="naverPay"
                        value={settings.integrations.naverPay || ''}
                        onChange={(e) => setSettings(prev => prev ? {
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            naverPay: e.target.value
                          }
                        } : null)}
                        placeholder="가맹점 ID"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>활동 로그</span>
                    </CardTitle>
                    <CardDescription>
                      시스템의 주요 활동 내역을 확인합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              log.status === 'success' ? 'bg-green-500' :
                              log.status === 'warning' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <div>
                              <h4 className="font-semibold">{getActionLabel(log.action)}</h4>
                              <p className="text-sm text-muted-foreground">{log.description}</p>
                              <div className="text-xs text-muted-foreground">
                                {log.userName} • {formatDateTime(log.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(log.status)}>
                              {getStatusLabel(log.status)}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {log.ipAddress}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 설정 초기화 다이얼로그 */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>설정 초기화</DialogTitle>
            <DialogDescription>
              모든 설정을 기본값으로 되돌립니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <strong>주의:</strong> 모든 사용자 정의 설정이 삭제됩니다.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleResetSettings}>
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 백업 생성 다이얼로그 */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>백업 생성</DialogTitle>
            <DialogDescription>
              현재 시스템 상태의 백업을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p>백업에 포함될 항목:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>데이터베이스 전체</li>
                <li>시스템 설정</li>
                <li>사용자 파일</li>
                <li>로그 파일</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  백업 생성에는 몇 분이 소요될 수 있습니다.
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateBackup}>
              <Download className="mr-2 h-4 w-4" />
              백업 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}