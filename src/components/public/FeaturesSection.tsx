'use client';

import { Package, BarChart3, Users, Database, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function FeaturesSection() {
  const features = [
    {
      icon: Package,
      title: 'FIFO 재고 관리',
      description: '선입선출 방식의 정확한 재고 추적으로 원가 계산의 정확성을 보장합니다.',
      details: [
        '실시간 재고 현황 모니터링',
        '자동 투입량 차감 시스템',
        '유통기한 관리 및 알림',
        '정확한 원가 계산',
      ],
    },
    {
      icon: BarChart3,
      title: '3단계 통합 대시보드',
      description: 'Company → Brand → Store 계층적 관리로 체계적인 비즈니스 운영이 가능합니다.',
      details: [
        '회사별 전체 현황 파악',
        '브랜드별 성과 분석',
        '매장별 상세 운영 데이터',
        '실시간 KPI 모니터링',
      ],
    },
    {
      icon: Users,
      title: '하이브리드 권한 시스템',
      description: '복수 권한 보유와 계층적 접근 제어로 유연한 권한 관리를 제공합니다.',
      details: ['역할 기반 접근 제어', '계층적 데이터 접근', '복수 권한 지원', '보안 강화된 인증'],
    },
    {
      icon: Database,
      title: '브랜드 분리 지원',
      description:
        '향후 브랜드 매각 시 완전한 시스템 분리가 가능한 설계로 비즈니스 확장성을 보장합니다.',
      details: [
        '독립 운영 준비도 평가',
        '데이터 무결성 보장',
        '점진적 분리 프로세스',
        '완전 분리 지원',
      ],
    },
  ];

  return (
    <section className="py-24 bg-muted/20">
      <div className="container px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            핵심 기능
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            모든 F&B 비즈니스 요구사항을
            <span className="text-primary"> 하나의 시스템</span>으로
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            CulinarySeoul ERP는 음식 서비스 업계의 복잡한 요구사항을 완벽하게 해결합니다
          </p>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-12">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              재고관리
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              권한관리
            </TabsTrigger>
            <TabsTrigger value="separation" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              브랜드분리
            </TabsTrigger>
          </TabsList>

          {features.map((feature, index) => (
            <TabsContent
              key={index}
              value={['inventory', 'dashboard', 'permissions', 'separation'][index]}
              className="mt-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative">
                  <Card className="bg-gradient-to-br from-card to-card/50 border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <feature.icon className="h-5 w-5 text-primary" />
                        {feature.title} 미리보기
                      </CardTitle>
                      <CardDescription>
                        실제 시스템에서 제공되는 기능들을 확인해보세요
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <feature.icon className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">{feature.title} 대시보드</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Additional Features Grid */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">추가 기능들</h3>
            <p className="text-muted-foreground">더욱 강력한 기능들로 완성된 F&B 관리 솔루션</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'AI 기반 재고 최적화',
                description: 'Google Gemini AI를 활용한 지능형 재고 관리',
              },
              {
                icon: Shield,
                title: '결제 시스템 연동',
                description: 'Toss Payments 연동으로 안전한 결제 처리',
              },
              {
                icon: BarChart3,
                title: '실시간 분석',
                description: '즉시 확인 가능한 매출 및 재고 분석 리포트',
              },
            ].map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="mb-2 font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
