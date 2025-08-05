'use client';

import { ArrowRight, CheckCircle, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function CTASection() {
  const benefits = [
    '30일 무료 체험',
    '무료 시스템 설정 지원',
    '24/7 전문 고객 지원',
    '데이터 마이그레이션 지원',
    '맞춤형 교육 프로그램',
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: '전화 상담',
      description: '전문 상담사와 직접 통화',
      action: '02-1234-5678',
      href: 'tel:02-1234-5678',
    },
    {
      icon: Mail,
      title: '이메일 문의',
      description: '자세한 문의사항 전달',
      action: 'contact@culinaryseoul.com',
      href: 'mailto:contact@culinaryseoul.com',
    },
    {
      icon: Calendar,
      title: '데모 예약',
      description: '1:1 맞춤 시연 예약',
      action: '데모 예약하기',
      href: '/demo',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-primary bg-primary-foreground/90">
            지금 시작하세요
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-6">
            당신의 F&B 비즈니스를
            <br />
            <span className="text-primary-foreground/90">한 단계 업그레이드</span>하세요
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            CulinarySeoul ERP로 더 효율적이고 수익성 높은 비즈니스를 시작하세요. 전문 팀이 처음부터
            끝까지 함께합니다.
          </p>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2"
              >
                <CheckCircle className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Main CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg"
            >
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href="/demo">
                라이브 데모 보기
                <Calendar className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact methods */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">문의하기</h3>
            <p className="text-primary-foreground/80">
              궁금한 점이 있으시면 언제든 연락주세요. 전문 상담사가 도와드립니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/20">
                    <method.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-primary-foreground">{method.title}</CardTitle>
                  <CardDescription className="text-primary-foreground/70">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pt-0">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/20 w-full"
                  >
                    <Link href={method.href}>{method.action}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final CTA banner */}
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-8 text-center">
              <h4 className="text-xl font-bold text-primary-foreground mb-4">
                🚀 특별 런칭 이벤트
              </h4>
              <p className="text-primary-foreground/80 mb-6">
                지금 가입하시면 <strong>첫 3개월 50% 할인</strong> + 무료 설정 지원까지!
                <br />
                <span className="text-sm">(2024년 12월 31일까지 한정)</span>
              </p>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link href="/auth/signup">
                  지금 혜택 받기
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
