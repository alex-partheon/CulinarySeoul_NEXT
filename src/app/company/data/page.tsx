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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccessDenied } from '@/components/ui/protected-component';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppSidebarCompanyNew } from '@/components/dashboard/app-sidebar-company-new';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Database,
  HardDrive,
  Cpu,
  Shield,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  Archive,
  FileText,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient();

interface SystemStatus {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    maxConnections: number;
    responseTime: number;
    uptime: string;
  };
  storage: {
    used: number;
    total: number;
    backupSize: number;
    lastBackup: string;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  security: {
    lastScan: string;
    threats: number;
    vulnerabilities: number;
    patchLevel: string;
  };
}

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  progress: number;
  startTime: string;
  endTime?: string;
  size: number;
  location: string;
  retention: number;
}

interface DataExport {
  id: string;
  name: string;
  type: 'csv' | 'json' | 'xml' | 'pdf';
  tables: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  size?: number;
}

interface SystemMetric {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
}

export default function DataCenterPage() {
  const { user, hasMinimumRole } = useAuth();
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const loadDataCenterInfo = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('사용자가 인증되지 않았습니다.');
        return;
      }

      // 실제 구현에서는 시스템 상태를 조회해야 함
      // 여기서는 시뮬레이션 데이터 사용
      
      // 시스템 상태 (시뮬레이션)
      const mockSystemStatus: SystemStatus = {
        database: {
          status: 'healthy',
          connections: 45,
          maxConnections: 100,
          responseTime: 12.5,
          uptime: '15일 8시간 32분',
        },
        storage: {
          used: 2.4 * 1024 * 1024 * 1024, // 2.4GB
          total: 10 * 1024 * 1024 * 1024, // 10GB
          backupSize: 1.8 * 1024 * 1024 * 1024, // 1.8GB
          lastBackup: '2024-01-15T02:00:00Z',
        },
        performance: {
          cpuUsage: 35.2,
          memoryUsage: 68.5,
          diskUsage: 24.0,
          networkLatency: 8.5,
        },
        security: {
          lastScan: '2024-01-15T01:00:00Z',
          threats: 0,
          vulnerabilities: 2,
          patchLevel: '2024.01.10',
        },
      };

      // 백업 작업 (시뮬레이션)
      const mockBackupJobs: BackupJob[] = [
        {
          id: '1',
          name: '일일 전체 백업',
          type: 'full',
          status: 'completed',
          progress: 100,
          startTime: '2024-01-15T02:00:00Z',
          endTime: '2024-01-15T02:45:00Z',
          size: 1.8 * 1024 * 1024 * 1024,
          location: 'AWS S3 - Seoul',
          retention: 30,
        },
        {
          id: '2',
          name: '증분 백업',
          type: 'incremental',
          status: 'running',
          progress: 65,
          startTime: '2024-01-15T14:00:00Z',
          size: 0.2 * 1024 * 1024 * 1024,
          location: 'AWS S3 - Seoul',
          retention: 7,
        },
        {
          id: '3',
          name: '주간 차등 백업',
          type: 'differential',
          status: 'scheduled',
          progress: 0,
          startTime: '2024-01-16T02:00:00Z',
          size: 0.5 * 1024 * 1024 * 1024,
          location: 'AWS S3 - Seoul',
          retention: 14,
        },
      ];

      // 데이터 내보내기 (시뮬레이션)
      const mockDataExports: DataExport[] = [
        {
          id: '1',
          name: '고객 데이터 내보내기',
          type: 'csv',
          tables: ['customers', 'orders', 'order_items'],
          status: 'completed',
          progress: 100,
          requestedBy: 'admin@culinaryseoul.com',
          requestedAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T10:15:00Z',
          downloadUrl: '/exports/customers_20240115.csv',
          size: 15.2 * 1024 * 1024,
        },
        {
          id: '2',
          name: '매출 리포트',
          type: 'pdf',
          tables: ['orders', 'payments', 'brands'],
          status: 'processing',
          progress: 45,
          requestedBy: 'manager@millab.co.kr',
          requestedAt: '2024-01-15T13:30:00Z',
        },
        {
          id: '3',
          name: '재고 데이터',
          type: 'json',
          tables: ['inventory', 'products', 'suppliers'],
          status: 'pending',
          progress: 0,
          requestedBy: 'staff@millab.co.kr',
          requestedAt: '2024-01-15T14:00:00Z',
        },
      ];

      // 시스템 메트릭 (시뮬레이션)
      const mockSystemMetrics: SystemMetric[] = [
        { timestamp: '14:00', cpuUsage: 25.5, memoryUsage: 62.3, diskUsage: 23.8, networkIn: 1.2, networkOut: 0.8, activeConnections: 42 },
        { timestamp: '14:05', cpuUsage: 28.2, memoryUsage: 64.1, diskUsage: 23.9, networkIn: 1.5, networkOut: 1.1, activeConnections: 45 },
        { timestamp: '14:10', cpuUsage: 32.1, memoryUsage: 66.8, diskUsage: 24.0, networkIn: 2.1, networkOut: 1.4, activeConnections: 48 },
        { timestamp: '14:15', cpuUsage: 35.2, memoryUsage: 68.5, diskUsage: 24.0, networkIn: 1.8, networkOut: 1.2, activeConnections: 45 },
        { timestamp: '14:20', cpuUsage: 30.8, memoryUsage: 65.2, diskUsage: 24.1, networkIn: 1.3, networkOut: 0.9, activeConnections: 43 },
      ];

      setSystemStatus(mockSystemStatus);
      setBackupJobs(mockBackupJobs);
      setDataExports(mockDataExports);
      setSystemMetrics(mockSystemMetrics);

    } catch (error) {
      console.error('데이터 센터 정보 로딩 오류:', error);
      toast.error('데이터 센터 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDataCenterInfo();
  }, [loadDataCenterInfo]);

  const handleStartBackup = async (type: 'full' | 'incremental' | 'differential') => {
    try {
      const newBackup: BackupJob = {
        id: Date.now().toString(),
        name: `수동 ${type === 'full' ? '전체' : type === 'incremental' ? '증분' : '차등'} 백업`,
        type,
        status: 'running',
        progress: 0,
        startTime: new Date().toISOString(),
        size: 0,
        location: 'AWS S3 - Seoul',
        retention: type === 'full' ? 30 : type === 'incremental' ? 7 : 14,
      };
      
      setBackupJobs(prev => [newBackup, ...prev]);
      setShowBackupDialog(false);
      toast.success('백업이 시작되었습니다.');
    } catch (error) {
      console.error('백업 시작 오류:', error);
      toast.error('백업 시작에 실패했습니다.');
    }
  };

  const handleRequestExport = async (exportData: Partial<DataExport>) => {
    try {
      const newExport: DataExport = {
        id: Date.now().toString(),
        name: exportData.name || '데이터 내보내기',
        type: exportData.type || 'csv',
        tables: exportData.tables || [],
        status: 'pending',
        progress: 0,
        requestedBy: user?.email || '',
        requestedAt: new Date().toISOString(),
      };
      
      setDataExports(prev => [newExport, ...prev]);
      setShowExportDialog(false);
      toast.success('데이터 내보내기 요청이 접수되었습니다.');
    } catch (error) {
      console.error('데이터 내보내기 요청 오류:', error);
      toast.error('데이터 내보내기 요청에 실패했습니다.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return 'text-green-600';
      case 'warning':
      case 'running':
      case 'processing':
        return 'text-yellow-600';
      case 'critical':
      case 'failed':
        return 'text-red-600';
      case 'scheduled':
      case 'pending':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'running':
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'critical':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'scheduled':
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
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
                  <BreadcrumbPage>데이터 센터</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">데이터 센터</h1>
                <p className="text-muted-foreground">
                  시스템 상태, 백업, 데이터 관리를 통합적으로 모니터링합니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowBackupDialog(true)}>
                  <Archive className="mr-2 h-4 w-4" />
                  백업 시작
                </Button>
                <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  데이터 내보내기
                </Button>
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  시스템 설정
                </Button>
              </div>
            </div>

            {/* 시스템 상태 개요 */}
            {systemStatus && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">데이터베이스</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(systemStatus.database.status)}
                      <span className={`text-sm font-medium ${getStatusColor(systemStatus.database.status)}`}>
                        {systemStatus.database.status === 'healthy' ? '정상' : 
                         systemStatus.database.status === 'warning' ? '주의' : '위험'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      연결: {systemStatus.database.connections}/{systemStatus.database.maxConnections}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      응답시간: {systemStatus.database.responseTime}ms
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">스토리지</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((systemStatus.storage.used / systemStatus.storage.total) * 100)}%
                    </div>
                    <Progress 
                      value={(systemStatus.storage.used / systemStatus.storage.total) * 100} 
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatBytes(systemStatus.storage.used)} / {formatBytes(systemStatus.storage.total)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU 사용률</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{systemStatus.performance.cpuUsage}%</div>
                    <Progress value={systemStatus.performance.cpuUsage} className="mt-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      메모리: {systemStatus.performance.memoryUsage}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">보안 상태</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {systemStatus.security.threats === 0 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {systemStatus.security.threats === 0 ? '안전' : `위협 ${systemStatus.security.threats}개`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      취약점: {systemStatus.security.vulnerabilities}개
                    </div>
                    <div className="text-xs text-muted-foreground">
                      패치: {systemStatus.security.patchLevel}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 상세 정보 탭 */}
            <Tabs defaultValue="monitoring" className="space-y-4">
              <TabsList>
                <TabsTrigger value="monitoring">시스템 모니터링</TabsTrigger>
                <TabsTrigger value="backups">백업 관리</TabsTrigger>
                <TabsTrigger value="exports">데이터 내보내기</TabsTrigger>
                <TabsTrigger value="maintenance">유지보수</TabsTrigger>
              </TabsList>

              <TabsContent value="monitoring" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        실시간 성능 지표
                      </CardTitle>
                      <CardDescription>
                        시스템 리소스 사용량을 실시간으로 모니터링합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {systemMetrics.slice(-5).map((metric, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{metric.timestamp}</span>
                            <div className="flex items-center space-x-4">
                              <span>CPU: {metric.cpuUsage}%</span>
                              <span>메모리: {metric.memoryUsage}%</span>
                              <span>연결: {metric.activeConnections}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        시스템 정보
                      </CardTitle>
                      <CardDescription>
                        현재 시스템의 상태와 정보를 표시합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {systemStatus && (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">가동 시간</span>
                            <span className="text-sm font-medium">{systemStatus.database.uptime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">네트워크 지연</span>
                            <span className="text-sm font-medium">{systemStatus.performance.networkLatency}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">디스크 사용률</span>
                            <span className="text-sm font-medium">{systemStatus.performance.diskUsage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">마지막 백업</span>
                            <span className="text-sm font-medium">
                              {formatDateTime(systemStatus.storage.lastBackup)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">백업 크기</span>
                            <span className="text-sm font-medium">
                              {formatBytes(systemStatus.storage.backupSize)}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="backups" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>백업 작업 관리</CardTitle>
                        <CardDescription>
                          데이터베이스 백업 작업을 관리하고 모니터링합니다.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowBackupDialog(true)}>
                        <Archive className="mr-2 h-4 w-4" />
                        새 백업
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {backupJobs.map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(job.status)}
                            <div>
                              <h3 className="font-semibold">{job.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>유형: {job.type}</span>
                                <span>위치: {job.location}</span>
                                <span>보관: {job.retention}일</span>
                              </div>
                              {job.status === 'running' && (
                                <Progress value={job.progress} className="mt-2 w-48" />
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getStatusColor(job.status)}>
                                {job.status === 'running' ? '실행 중' :
                                 job.status === 'completed' ? '완료' :
                                 job.status === 'failed' ? '실패' : '예약됨'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              시작: {formatDateTime(job.startTime)}
                            </div>
                            {job.endTime && (
                              <div className="text-sm text-muted-foreground">
                                완료: {formatDateTime(job.endTime)}
                              </div>
                            )}
                            <div className="text-sm font-medium">
                              크기: {formatBytes(job.size)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>데이터 내보내기</CardTitle>
                        <CardDescription>
                          데이터베이스 데이터를 다양한 형식으로 내보냅니다.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setShowExportDialog(true)}>
                        <Download className="mr-2 h-4 w-4" />
                        새 내보내기
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataExports.map((exportItem) => (
                        <div key={exportItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {getStatusIcon(exportItem.status)}
                            <div>
                              <h3 className="font-semibold">{exportItem.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>형식: {exportItem.type.toUpperCase()}</span>
                                <span>테이블: {exportItem.tables.join(', ')}</span>
                                <span>요청자: {exportItem.requestedBy}</span>
                              </div>
                              {exportItem.status === 'processing' && (
                                <Progress value={exportItem.progress} className="mt-2 w-48" />
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getStatusColor(exportItem.status)}>
                                {exportItem.status === 'pending' ? '대기 중' :
                                 exportItem.status === 'processing' ? '처리 중' :
                                 exportItem.status === 'completed' ? '완료' : '실패'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              요청: {formatDateTime(exportItem.requestedAt)}
                            </div>
                            {exportItem.completedAt && (
                              <div className="text-sm text-muted-foreground">
                                완료: {formatDateTime(exportItem.completedAt)}
                              </div>
                            )}
                            {exportItem.size && (
                              <div className="text-sm font-medium">
                                크기: {formatBytes(exportItem.size)}
                              </div>
                            )}
                            {exportItem.downloadUrl && (
                              <Button variant="outline" size="sm" className="mt-2">
                                <Download className="mr-2 h-4 w-4" />
                                다운로드
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        시스템 유지보수
                      </CardTitle>
                      <CardDescription>
                        시스템 최적화 및 유지보수 작업을 수행합니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        데이터베이스 최적화
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Archive className="mr-2 h-4 w-4" />
                        로그 정리
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="mr-2 h-4 w-4" />
                        보안 스캔
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Monitor className="mr-2 h-4 w-4" />
                        성능 분석
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        예약된 작업
                      </CardTitle>
                      <CardDescription>
                        자동으로 실행되는 유지보수 작업들입니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">일일 백업</span>
                        <Badge variant="outline">매일 02:00</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">주간 최적화</span>
                        <Badge variant="outline">일요일 03:00</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">월간 보안 스캔</span>
                        <Badge variant="outline">매월 1일 01:00</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">로그 정리</span>
                        <Badge variant="outline">매일 04:00</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* 백업 시작 다이얼로그 */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 백업 시작</DialogTitle>
            <DialogDescription>
              백업 유형을 선택하여 데이터베이스 백업을 시작합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleStartBackup('full')}
            >
              <Database className="mr-2 h-4 w-4" />
              전체 백업 (모든 데이터)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleStartBackup('incremental')}
            >
              <Upload className="mr-2 h-4 w-4" />
              증분 백업 (변경된 데이터만)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleStartBackup('differential')}
            >
              <Archive className="mr-2 h-4 w-4" />
              차등 백업 (마지막 전체 백업 이후 변경분)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 데이터 내보내기 다이얼로그 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터 내보내기</DialogTitle>
            <DialogDescription>
              내보낼 데이터와 형식을 선택합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleRequestExport({
                name: '고객 데이터',
                type: 'csv',
                tables: ['customers', 'orders']
              })}
            >
              <FileText className="mr-2 h-4 w-4" />
              고객 데이터 (CSV)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleRequestExport({
                name: '매출 리포트',
                type: 'pdf',
                tables: ['orders', 'payments']
              })}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              매출 리포트 (PDF)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleRequestExport({
                name: '재고 데이터',
                type: 'json',
                tables: ['inventory', 'products']
              })}
            >
              <Database className="mr-2 h-4 w-4" />
              재고 데이터 (JSON)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}