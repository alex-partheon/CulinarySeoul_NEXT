'use client';

import { TrendingUp, Users, Building, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function StatsSection() {
  const stats = [
    {
      icon: Building,
      value: '500+',
      label: '활성 매장',
      description: '전국의 F&B 매장이 CulinarySeoul과 함께',
      growth: '+25%',
    },
    {
      icon: Users,
      value: '50K+',
      label: '월간 사용자',
      description: '매월 활발하게 시스템을 이용하는 사용자',
      growth: '+40%',
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: '시스템 안정성',
      description: '24/7 안정적인 서비스 제공',
      growth: '업타임',
    },
    {
      icon: Award,
      value: '98%',
      label: '고객 만족도',
      description: '높은 만족도를 자랑하는 신뢰할 수 있는 솔루션',
      growth: '+5%',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            성과 지표
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            신뢰받는
            <span className="text-primary"> F&B 파트너</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            수많은 성공 사례와 검증된 성과로 여러분의 비즈니스 성장을 보장합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.growth}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="font-semibold text-foreground">{stat.label}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stat.description}
                  </p>
                </div>

                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional metrics row */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">30%</div>
            <div className="font-medium mb-1">평균 비용 절감</div>
            <div className="text-sm text-muted-foreground">효율적인 재고 관리로 운영비 절감</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">15min</div>
            <div className="font-medium mb-1">평균 설정 시간</div>
            <div className="text-sm text-muted-foreground">빠른 시스템 구축 및 운영 시작</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">24/7</div>
            <div className="font-medium mb-1">전문 지원</div>
            <div className="text-sm text-muted-foreground">언제나 도움을 받을 수 있는 지원팀</div>
          </div>
        </div>

        {/* Success stories */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">성공 사례</h3>
            <p className="text-muted-foreground">CulinarySeoul과 함께 성장한 브랜드들의 이야기</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">밀랍 카페 체인</h4>
                    <p className="text-sm text-muted-foreground">프리미엄 카페 브랜드</p>
                  </div>
                </div>
                <blockquote className="text-sm text-muted-foreground italic mb-4">
                  &ldquo;FIFO 재고 관리 시스템 도입 후 식자재 손실이 40% 줄어들었고, 실시간
                  대시보드로 매장별 성과를 한눈에 파악할 수 있게 되었습니다.&rdquo;
                </blockquote>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium text-primary">40%</span> 손실 감소
                  </div>
                  <div>
                    <span className="font-medium text-primary">25%</span> 효율성 증대
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">로컬 레스토랑 그룹</h4>
                    <p className="text-sm text-muted-foreground">지역 기반 다중 매장</p>
                  </div>
                </div>
                <blockquote className="text-sm text-muted-foreground italic mb-4">
                  &ldquo;브랜드 분리 기능 덕분에 새로운 컨셉의 매장을 독립적으로 운영하면서도 통합
                  관리의 이점을 누릴 수 있었습니다.&rdquo;
                </blockquote>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium text-primary">3개</span> 브랜드 관리
                  </div>
                  <div>
                    <span className="font-medium text-primary">15개</span> 매장 통합
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
