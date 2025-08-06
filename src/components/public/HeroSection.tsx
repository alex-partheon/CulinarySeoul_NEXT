'use client';

import { ArrowRight, ChefHat, BarChart3, Shield, Sparkles, Globe as GlobeIcon, Zap, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe } from '@/components/ui/globe';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HeroSection() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid opacity-[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,white)]" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-64 w-96 h-96 gradient-radial opacity-10 rounded-full blur-3xl animate-pulse-subtle" />
          <div className="absolute bottom-1/4 -right-64 w-96 h-96 gradient-radial opacity-10 rounded-full blur-3xl animate-pulse-subtle" style={{ "--delay": "1s" } as React.CSSProperties} />
        </div>

        {/* Content */}
        <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium bg-amber-50 text-amber-700 border-amber-200">
                <GlobeIcon className="mr-2 h-3.5 w-3.5" />
                Global Food Service Excellence
              </Badge>
            </div>

            {/* Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="block text-slate-900">
                  세계적인 F&B
                </span>
                <span className="block mt-2 bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                  비즈니스 협력자
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
                FIFO 재고관리와 실시간 대시보드로 비즈니스를 혁신하세요.
                <span className="block mt-2 text-lg font-medium text-slate-800">
                  서울에서 시작해 세계로 나아가는 미식 문화의 중심
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start pt-4">
              <Button
                asChild
                size="lg"
                className="min-w-[200px] h-14 text-base font-medium bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white shadow-xl group"
              >
                <Link href="/auth/signup">
                  14일 무료 체험
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] h-14 text-base font-medium border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                <Zap className="mr-2 h-4 w-4" />
                데모 예약하기
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-600 pt-8">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>100+ 파트너사</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>30% 원가 절감</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>데이터 보안 인증</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Globe */}
          <div className="relative h-[500px] lg:h-[600px] hidden lg:block">
            <Globe className="absolute inset-0" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              비즈니스를 위한 완벽한 기능
            </h2>
            <p className="text-lg text-gray-600">
              CulinarySeoul ERP는 F&B 비즈니스의 모든 요구사항을 충족합니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FIFO Inventory */}
            <div className="group relative">
              <div className="absolute inset-0 gradient-accent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative card-premium p-8 h-full hover-lift">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">FIFO 재고관리</h3>
                <p className="text-gray-600 mb-4">
                  선입선출 방식의 정확한 원가 계산과 실시간 재고 추적으로 손실을 최소화합니다.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    실시간 재고 추적
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    자동 원가 계산
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    유통기한 관리
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Dashboard */}
            <div className="group relative">
              <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-20 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative card-premium p-8 h-full hover-lift">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">통합 대시보드</h3>
                <p className="text-gray-600 mb-4">
                  Company, Brand, Store 단위로 계층적 관리가 가능한 3단계 대시보드 시스템.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                    실시간 데이터 동기화
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                    맞춤형 리포트
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                    성과 분석 도구
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Brand Separation */}
            <div className="group relative">
              <div className="absolute inset-0 gradient-secondary rounded-2xl blur-xl opacity-20 opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative card-premium p-8 h-full hover-lift">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">브랜드 분리 지원</h3>
                <p className="text-gray-600 mb-4">
                  브랜드별 독립적인 운영이 가능하며, 필요시 완전한 분리가 가능합니다.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    독립적 데이터 관리
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    브랜드별 권한 설정
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    원클릭 분리
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Millab Brand Section */}
      <section className="py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                Success Story
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                밀랍과 함께 성장하는
                <span className="block text-amber-600 mt-2">
                  CulinarySeoul
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                성수점을 시작으로 전국으로 확장하고 있는 밀랍 카페.
                CulinarySeoul ERP를 통해 체계적인 재고 관리와 매출 분석으로
                빠른 성장을 이루고 있습니다.
              </p>
              
              <div className="grid grid-cols-3 gap-6 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">30%</div>
                  <div className="text-sm text-gray-600 mt-1">원가 절감</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">50%</div>
                  <div className="text-sm text-gray-600 mt-1">업무 효율 증가</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">재고 정확도</div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                밀랍 사례 자세히 보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-3xl" />
              <div className="relative bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600">밀랍</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">밀랍 성수점</h3>
                    <p className="text-sm text-gray-600">Premium Coffee & Bakery</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">FIFO 재고 관리</p>
                      <p className="text-xs text-gray-500">실시간 재고 추적 및 자동 발주</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">매출 분석</p>
                      <p className="text-xs text-gray-500">시간대별, 메뉴별 상세 분석</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">브랜드 통합 관리</p>
                      <p className="text-xs text-gray-500">본사-지점 통합 시스템</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              14일 동안 모든 기능을 무료로 체험해보세요.
              <br className="hidden sm:inline" />
              신용카드 없이 즉시 시작 가능합니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="min-w-[200px] h-14 text-base font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-xl group"
              >
                <Link href="/auth/signup">
                  무료 체험 시작하기
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] h-14 text-base font-medium border-2 border-white/20 text-white hover:bg-white/10 transition-all duration-200"
              >
                영업팀 상담 예약
              </Button>
            </div>
            
            <p className="text-sm text-gray-400 mt-8">
              ✓ 무료 체험 기간 중 언제든 취소 가능 • 신용카드 필요 없음 • 전문가 1:1 온보딩 지원
            </p>
          </div>
        </div>
      </section>
    </>
  );
}