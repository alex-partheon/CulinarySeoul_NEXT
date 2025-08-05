import Link from 'next/link';
import { ArrowRight, BarChart3, ShoppingCart, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={cn(
      "relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden",
      "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50",
      className
    )}>
      {/* 그리드 배경 패턴 */}
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      
      {/* 보라색 그라디언트 오브 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-96 h-96 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-violet-300 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8 sm:space-y-12">
        {/* 헤드라인 */}
        <div className="space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            새로운 F&B 관리의 시작
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CulinarySeoul ERP
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-700 max-w-3xl mx-auto">
            통합 F&B 관리 솔루션
          </p>
        </div>

        {/* 특징 설명 */}
        <div className="max-w-4xl mx-auto">
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-12">
            레스토랑과 카페를 위한 가장 스마트한 관리 시스템
          </p>
          
          {/* 주요 기능 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">FIFO 재고관리</h3>
                <p className="text-sm text-gray-600">
                  선입선출 방식으로 재고 손실을 최소화하고 효율적인 관리를 지원합니다
                </p>
              </div>
            </div>
            
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">브랜드 분리 지원</h3>
                <p className="text-sm text-gray-600">
                  다중 브랜드를 하나의 시스템에서 효과적으로 관리할 수 있습니다
                </p>
              </div>
            </div>
            
            <div className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">실시간 대시보드</h3>
                <p className="text-sm text-gray-600">
                  매출과 재고 현황을 실시간으로 모니터링하고 분석할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            asChild
            size="lg"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <Link href="/auth/signin">
              <span className="relative z-10 flex items-center">
                대시보드 시작하기
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="group px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-purple-300 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Link href="/about">
              더 알아보기
              <ArrowRight className="w-5 h-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </Button>
        </div>

        {/* 대시보드 미리보기 이미지 영역 */}
        <div className="mt-16 relative">
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-1">
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-4 text-sm text-gray-600">dashboard.culinaryseoul.com</span>
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart3 className="w-24 h-24 text-purple-600 mx-auto" />
                  <p className="text-gray-600 font-medium">실시간 대시보드 미리보기</p>
                  <div className="flex gap-8 justify-center pt-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">98%</div>
                      <div className="text-sm text-gray-600">재고 정확도</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">24/7</div>
                      <div className="text-sm text-gray-600">실시간 모니터링</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">30%</div>
                      <div className="text-sm text-gray-600">비용 절감</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 플로팅 요소들 */}
          <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">매출 증가</div>
                <div className="text-xs text-gray-600">+23.5%</div>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 animate-pulse delay-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">재고 최적화</div>
                <div className="text-xs text-gray-600">완료</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}