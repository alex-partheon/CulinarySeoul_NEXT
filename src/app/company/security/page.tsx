'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Shield,
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings,
  Clock,
  Globe,
  FileText,
  Activity,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient();

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expirationDays: number;
  };
  sessionSettings: {
    maxSessionDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
    requireReauth: boolean;
  };
  accessControl: {
    ipWhitelist: string[];
    allowVpnAccess: boolean;
    requireMfa: boolean;
    allowMobileAccess: boolean;
  };
  auditSettings: {
    logRetentionDays: number;
    enableRealTimeAlerts: boolean;
    alertThreshold: number;
    enableDataExport: boolean;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'data_access' | 'system_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  resolved: boolean;
}

interface AccessRule {
  id: string;
  name: string;
  type: 'ip' | 'role' | 'time' | 'location';
  condition: string;
  action: 'allow' | 'deny' | 'require_mfa';
  enabled: boolean;
  priority: number;
}

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  ipAddress: string;
  device: string;
  location: string;
  loginTime: string;
  lastActivity: string;
  status: 'active' | 'idle' | 'expired';
}

export default function SecuritySettingsPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 보안 설정을 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 보안 설정 (시뮬레이션)
      const mockSettings: SecuritySettings = {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
          expirationDays: 90,
        },
        sessionSettings: {
          maxSessionDuration: 480, // 8시간
          idleTimeout: 30, // 30분
          maxConcurrentSessions: 3,
          requireReauth: true,
        },
        accessControl: {
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
          allowVpnAccess: true,
          requireMfa: true,
          allowMobileAccess: true,
        },
        auditSettings: {
          logRetentionDays: 365,
          enableRealTimeAlerts: true,
          alertThreshold: 5,
          enableDataExport: true,
        },
      };

      // 보안 이벤트 (시뮬레이션)
      const mockSecurityEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'high',
          user: 'unknown',
          description: '잘못된 비밀번호로 5회 연속 로그인 시도',
          timestamp: '2024-01-15T14:30:00Z',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          resolved: false,
        },
        {
          id: '2',
          type: 'permission_change',
          severity: 'medium',
          user: 'admin@culinaryseoul.com',
          description: '사용자 권한 변경: brand_staff → brand_admin',
          timestamp: '2024-01-15T13:15:00Z',
          ipAddress: '192.168.1.50',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          resolved: true,
        },
        {
          id: '3',
          type: 'data_access',
          severity: 'low',
          user: 'manager@millab.co.kr',
          description: '대량 고객 데이터 다운로드',
          timestamp: '2024-01-15T12:45:00Z',
          ipAddress: '192.168.1.75',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          resolved: true,
        },
        {
          id: '4',
          type: 'system_change',
          severity: 'critical',
          user: 'system',
          description: '데이터베이스 백업 실패',
          timestamp: '2024-01-15T02:00:00Z',
          ipAddress: 'localhost',
          userAgent: 'System Process',
          resolved: false,
        },
      ];

      // 접근 규칙 (시뮬레이션)
      const mockAccessRules: AccessRule[] = [
        {
          id: '1',
          name: '사무실 IP 허용',
          type: 'ip',
          condition: '192.168.1.0/24',
          action: 'allow',
          enabled: true,
          priority: 1,
        },
        {
          id: '2',
          name: '관리자 MFA 필수',
          type: 'role',
          condition: 'company_admin',
          action: 'require_mfa',
          enabled: true,
          priority: 2,
        },
        {
          id: '3',
          name: '업무 시간 외 접근 제한',
          type: 'time',
          condition: '09:00-18:00',
          action: 'deny',
          enabled: false,
          priority: 3,
        },
        {
          id: '4',
          name: '해외 IP 차단',
          type: 'location',
          condition: 'KR',
          action: 'deny',
          enabled: true,
          priority: 4,
        },
      ];

      // 사용자 세션 (시뮬레이션)
      const mockUserSessions: UserSession[] = [
        {
          id: '1',
          userId: 'user1',
          userName: '김관리자',
          email: 'admin@culinaryseoul.com',
          role: 'company_admin',
          ipAddress: '192.168.1.50',
          device: 'Chrome on macOS',
          location: '서울, 대한민국',
          loginTime: '2024-01-15T09:00:00Z',
          lastActivity: '2024-01-15T14:30:00Z',
          status: 'active',
        },
        {
          id: '2',
          userId: 'user2',
          userName: '이매니저',
          email: 'manager@millab.co.kr',
          role: 'brand_admin',
          ipAddress: '192.168.1.75',
          device: 'Chrome on Windows',
          location: '서울, 대한민국',
          loginTime: '2024-01-15T08:30:00Z',
          lastActivity: '2024-01-15T14:25:00Z',
          status: 'active',
        },
        {
          id: '3',
          userId: 'user3',
          userName: '박직원',
          email: 'staff@millab.co.kr',
          role: 'brand_staff',
          ipAddress: '192.168.1.80',
          device: 'Safari on iPhone',
          location: '서울, 대한민국',
          loginTime: '2024-01-15T10:15:00Z',
          lastActivity: '2024-01-15T13:45:00Z',
          status: 'idle',
        },
      ];

      setSettings(mockSettings);
      setSecurityEvents(mockSecurityEvents);
      setAccessRules(mockAccessRules);
      setUserSessions(mockUserSessions);

    } catch (error) {
      console.error('보안 데이터 로딩 오류:', error);
      toast.error('보안 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  const handleSettingsUpdate = async (section: keyof SecuritySettings, updates: unknown) => {
    if (!settings) return;

    try {
      const newSettings = {
        ...settings,
        [section]: { ...settings[section], ...updates },
      };
      setSettings(newSettings);
      toast.success('보안 설정이 업데이트되었습니다.');
    } catch (error) {
      console.error('설정 업데이트 오류:', error);
      toast.error('설정 업데이트에 실패했습니다.');
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    try {
      setSecurityEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, resolved: true } : event
        )
      );
      toast.success('보안 이벤트가 해결됨으로 표시되었습니다.');
    } catch (error) {
      console.error('이벤트 해결 오류:', error);
      toast.error('이벤트 해결에 실패했습니다.');
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      setUserSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success('세션이 종료되었습니다.');
    } catch (error) {
      console.error('세션 종료 오류:', error);
      toast.error('세션 종료에 실패했습니다.');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'idle': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
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
                  <BreadcrumbPage>보안 설정</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">보안 설정</h1>
                <p className="text-muted-foreground">
                  시스템 보안 정책과 접근 제어를 관리합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  보안 리포트
                </Button>
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  고급 설정
                </Button>
              </div>
            </div>

            {/* 보안 상태 개요 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userSessions.filter(s => s.status === 'active').length}</div>
                  <p className="text-xs text-muted-foreground">
                    총 {userSessions.length}개 세션
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">미해결 이벤트</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {securityEvents.filter(e => !e.resolved).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    총 {securityEvents.length}개 이벤트
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">접근 규칙</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accessRules.filter(r => r.enabled).length}</div>
                  <p className="text-xs text-muted-foreground">
                    총 {accessRules.length}개 규칙
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">보안 점수</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">85</div>
                  <p className="text-xs text-muted-foreground">
                    100점 만점
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 보안 설정 탭 */}
            <Tabs defaultValue="policies" className="space-y-4">
              <TabsList>
                <TabsTrigger value="policies">보안 정책</TabsTrigger>
                <TabsTrigger value="events">보안 이벤트</TabsTrigger>
                <TabsTrigger value="access">접근 제어</TabsTrigger>
                <TabsTrigger value="sessions">활성 세션</TabsTrigger>
              </TabsList>

              <TabsContent value="policies" className="space-y-4">
                {settings && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* 비밀번호 정책 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          비밀번호 정책
                        </CardTitle>
                        <CardDescription>
                          사용자 비밀번호 요구사항을 설정합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minLength">최소 길이</Label>
                            <Input
                              id="minLength"
                              type="number"
                              value={settings.passwordPolicy.minLength}
                              onChange={(e) => handleSettingsUpdate('passwordPolicy', {
                                minLength: parseInt(e.target.value)
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expirationDays">만료 기간 (일)</Label>
                            <Input
                              id="expirationDays"
                              type="number"
                              value={settings.passwordPolicy.expirationDays}
                              onChange={(e) => handleSettingsUpdate('passwordPolicy', {
                                expirationDays: parseInt(e.target.value)
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="requireUppercase">대문자 필수</Label>
                            <Switch
                              id="requireUppercase"
                              checked={settings.passwordPolicy.requireUppercase}
                              onCheckedChange={(checked) => handleSettingsUpdate('passwordPolicy', {
                                requireUppercase: checked
                              })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="requireNumbers">숫자 필수</Label>
                            <Switch
                              id="requireNumbers"
                              checked={settings.passwordPolicy.requireNumbers}
                              onCheckedChange={(checked) => handleSettingsUpdate('passwordPolicy', {
                                requireNumbers: checked
                              })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="requireSymbols">특수문자 필수</Label>
                            <Switch
                              id="requireSymbols"
                              checked={settings.passwordPolicy.requireSymbols}
                              onCheckedChange={(checked) => handleSettingsUpdate('passwordPolicy', {
                                requireSymbols: checked
                              })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 세션 설정 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          세션 설정
                        </CardTitle>
                        <CardDescription>
                          사용자 세션 관리 정책을 설정합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="maxSessionDuration">최대 세션 시간 (분)</Label>
                            <Input
                              id="maxSessionDuration"
                              type="number"
                              value={settings.sessionSettings.maxSessionDuration}
                              onChange={(e) => handleSettingsUpdate('sessionSettings', {
                                maxSessionDuration: parseInt(e.target.value)
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="idleTimeout">유휴 타임아웃 (분)</Label>
                            <Input
                              id="idleTimeout"
                              type="number"
                              value={settings.sessionSettings.idleTimeout}
                              onChange={(e) => handleSettingsUpdate('sessionSettings', {
                                idleTimeout: parseInt(e.target.value)
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxConcurrentSessions">최대 동시 세션</Label>
                          <Input
                            id="maxConcurrentSessions"
                            type="number"
                            value={settings.sessionSettings.maxConcurrentSessions}
                            onChange={(e) => handleSettingsUpdate('sessionSettings', {
                              maxConcurrentSessions: parseInt(e.target.value)
                            })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="requireReauth">재인증 필수</Label>
                          <Switch
                            id="requireReauth"
                            checked={settings.sessionSettings.requireReauth}
                            onCheckedChange={(checked) => handleSettingsUpdate('sessionSettings', {
                              requireReauth: checked
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* 접근 제어 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          접근 제어
                        </CardTitle>
                        <CardDescription>
                          시스템 접근 권한을 제어합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="allowVpnAccess">VPN 접근 허용</Label>
                            <Switch
                              id="allowVpnAccess"
                              checked={settings.accessControl.allowVpnAccess}
                              onCheckedChange={(checked) => handleSettingsUpdate('accessControl', {
                                allowVpnAccess: checked
                              })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="requireMfa">MFA 필수</Label>
                            <Switch
                              id="requireMfa"
                              checked={settings.accessControl.requireMfa}
                              onCheckedChange={(checked) => handleSettingsUpdate('accessControl', {
                                requireMfa: checked
                              })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="allowMobileAccess">모바일 접근 허용</Label>
                            <Switch
                              id="allowMobileAccess"
                              checked={settings.accessControl.allowMobileAccess}
                              onCheckedChange={(checked) => handleSettingsUpdate('accessControl', {
                                allowMobileAccess: checked
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>허용 IP 대역</Label>
                          <div className="space-y-2">
                            {settings.accessControl.ipWhitelist.map((ip, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input value={ip} readOnly />
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              IP 추가
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 감사 설정 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          감사 설정
                        </CardTitle>
                        <CardDescription>
                          로그 및 감사 정책을 설정합니다.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="logRetentionDays">로그 보관 기간 (일)</Label>
                            <Input
                              id="logRetentionDays"
                              type="number"
                              value={settings.auditSettings.logRetentionDays}
                              onChange={(e) => handleSettingsUpdate('auditSettings', {
                                logRetentionDays: parseInt(e.target.value)
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alertThreshold">알림 임계값</Label>
                            <Input
                              id="alertThreshold"
                              type="number"
                              value={settings.auditSettings.alertThreshold}
                              onChange={(e) => handleSettingsUpdate('auditSettings', {
                                alertThreshold: parseInt(e.target.value)
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="enableRealTimeAlerts">실시간 알림</Label>
                            <Switch
                              id="enableRealTimeAlerts"
                              checked={settings.auditSettings.enableRealTimeAlerts}
                              onCheckedChange={(checked) => handleSettingsUpdate('auditSettings', {
                                enableRealTimeAlerts: checked
                              })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="enableDataExport">데이터 내보내기</Label>
                            <Switch
                              id="enableDataExport"
                              checked={settings.auditSettings.enableDataExport}
                              onCheckedChange={(checked) => handleSettingsUpdate('auditSettings', {
                                enableDataExport: checked
                              })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>보안 이벤트 로그</CardTitle>
                    <CardDescription>
                      시스템에서 발생한 보안 관련 이벤트를 모니터링합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {securityEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`} />
                            <div>
                              <h3 className="font-semibold">{event.description}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>사용자: {event.user}</span>
                                <span>IP: {event.ipAddress}</span>
                                <span>{formatDateTime(event.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(event.severity)}>
                              {event.severity}
                            </Badge>
                            {event.resolved ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                해결됨
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveEvent(event.id)}
                              >
                                해결
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="access" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>접근 제어 규칙</CardTitle>
                        <CardDescription>
                          시스템 접근을 제어하는 규칙을 관리합니다.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowNewRuleDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        새 규칙 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {accessRules.map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div>
                              <h3 className="font-semibold">{rule.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>유형: {rule.type}</span>
                                <span>조건: {rule.condition}</span>
                                <span>동작: {rule.action}</span>
                                <span>우선순위: {rule.priority}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => {
                                setAccessRules(prev => 
                                  prev.map(r => 
                                    r.id === rule.id ? { ...r, enabled: checked } : r
                                  )
                                );
                              }}
                            />
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>활성 사용자 세션</CardTitle>
                    <CardDescription>
                      현재 시스템에 로그인한 사용자들의 세션을 관리합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              session.status === 'active' ? 'bg-green-500' :
                              session.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div>
                              <h3 className="font-semibold">{session.userName}</h3>
                              <p className="text-sm text-muted-foreground">{session.email}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>역할: {session.role}</span>
                                <span>IP: {session.ipAddress}</span>
                                <span>기기: {session.device}</span>
                                <span>위치: {session.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">로그인</p>
                              <p>{formatDateTime(session.loginTime)}</p>
                              <p className="text-muted-foreground">마지막 활동</p>
                              <p>{formatDateTime(session.lastActivity)}</p>
                            </div>
                            <div className="flex flex-col items-center space-y-2">
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    세션 종료
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>세션 종료 확인</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {session.userName}의 세션을 강제로 종료하시겠습니까?
                                      사용자는 즉시 로그아웃됩니다.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleTerminateSession(session.id)}
                                    >
                                      종료
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
    </ErrorBoundary>
  );
}