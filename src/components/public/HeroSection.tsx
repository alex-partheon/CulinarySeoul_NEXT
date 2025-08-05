'use client';

import { ArrowRight, ChefHat, BarChart3, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-float" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              서울의 미식 문화를 선도하는 ERP
            </Badge>
          </div>

          {/* Heading */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-foreground">F&B 비즈니스의</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                완벽한 파트너
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              FIFO 재고관리부터 브랜드 분리 지원까지,
              <br className="hidden sm:inline" />
              체계적인 시스템으로 성공적인 요리 사업을 만들어가세요
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              asChild
              size="lg"
              className="min-w-[200px] h-12 text-base font-medium btn-gradient group"
            >
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-w-[200px] h-12 text-base font-medium border-2 hover:bg-muted/50"
            >
              데모 체험하기
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-16">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center card-hover">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">FIFO 재고관리</h3>
                <p className="text-sm text-muted-foreground">
                  정확한 원가 추적과
                  <br />
                  실시간 재고 모니터링
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center card-hover">
                <div className="w-12 h-12 mx-auto mb-4 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">통합 대시보드</h3>
                <p className="text-sm text-muted-foreground">
                  Company → Brand → Store
                  <br />
                  3단계 계층적 관리
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center card-hover">
                <div className="w-12 h-12 mx-auto mb-4 bg-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">브랜드 분리</h3>
                <p className="text-sm text-muted-foreground">
                  독립 운영 가능한
                  <br />
                  유연한 시스템 설계
                </p>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="pt-12 border-t border-border/30">
            <p className="text-sm text-muted-foreground mb-6">
              이미 100+ F&B 기업이 CulinarySeoul과 함께 성장하고 있습니다
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {['밀랍', '스타벅스', '투썸플레이스', '파리바게뜨'].map((brand) => (
                <div
                  key={brand}
                  className="text-sm font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-200"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
