'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Sparkles, Palette, Type, Grid3x3, Layers, Zap } from 'lucide-react';

export default function StyleGuidePage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(value);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // CashUp 브랜드 색상
  const brandColors = {
    primary: {
      name: 'CashGreen',
      description: '주요 행동 유도 및 긍정적 액션',
      colors: [
        { name: '50', value: '#f0fdf4' },
        { name: '100', value: '#dcfce7' },
        { name: '200', value: '#bbf7d0' },
        { name: '300', value: '#86efac' },
        { name: '400', value: '#4ade80' },
        { name: '500', value: '#22c55e' },
        { name: '600', value: '#16a34a' },
        { name: '700', value: '#15803d' },
        { name: '800', value: '#166534' },
        { name: '900', value: '#14532d' },
      ],
    },
    secondary: {
      name: 'CashBlue',
      description: '보조 색상 및 정보 표시',
      colors: [
        { name: '50', value: '#eff6ff' },
        { name: '100', value: '#dbeafe' },
        { name: '200', value: '#bfdbfe' },
        { name: '300', value: '#93c5fd' },
        { name: '400', value: '#60a5fa' },
        { name: '500', value: '#3b82f6' },
        { name: '600', value: '#2563eb' },
        { name: '700', value: '#1d4ed8' },
        { name: '800', value: '#1e40af' },
        { name: '900', value: '#1e3a8a' },
      ],
    },
  };

  // 시맨틱 색상
  const semanticColors = {
    success: { name: '성공', value: '#22c55e', textColor: 'white' },
    warning: { name: '경고', value: '#f59e0b', textColor: 'white' },
    error: { name: '오류', value: '#ef4444', textColor: 'white' },
    info: { name: '정보', value: '#3b82f6', textColor: 'white' },
  };

  // 대시보드 테마
  const dashboardThemes = {
    creator: {
      name: '크리에이터',
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#dbeafe',
      gradient: 'from-blue-500 to-sky-400',
    },
    business: {
      name: '비즈니스',
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#d1fae5',
      gradient: 'from-emerald-500 to-teal-400',
    },
    admin: {
      name: '관리자',
      primary: '#6366f1',
      secondary: '#818cf8',
      accent: '#e0e7ff',
      gradient: 'from-indigo-500 to-purple-400',
    },
  };

  // 공개페이지 테마
  const publicThemes = [
    { name: '기본', primary: '#22c55e', gradient: 'from-green-500 to-emerald-400' },
    { name: '미니멀', primary: '#6b7280', gradient: 'from-gray-500 to-slate-400' },
    { name: '프로페셔널', primary: '#1e40af', gradient: 'from-blue-800 to-indigo-600' },
    { name: '크리에이티브', primary: '#dc2626', gradient: 'from-red-600 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* 헤더 - 글래스모피즘 효과 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  CashUp 디자인 시스템
                </h1>
              </div>
              <p className="text-gray-600 ml-14">통합 브랜드 가이드라인 v1.0</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Bento Grid 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 브랜드 소개 - 큰 카드 */}
          <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-white/50">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                CashUp
              </span>
              의 비주얼 아이덴티티
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              크리에이터와 광고주를 연결하는 혁신적인 마케팅 플랫폼의 디자인 시스템입니다.
              <br />
              성장과 신뢰를 상징하는 <span className="font-semibold text-green-600">CashGreen</span>
              과 혁신과 기술을 나타내는{' '}
              <span className="font-semibold text-blue-600">CashBlue</span>를 중심으로
              구성되었습니다.
            </p>
            <div className="mt-6 flex gap-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">브랜드 컬러</span>
              </div>
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Pretendard 폰트</span>
              </div>
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Bento Grid</span>
              </div>
            </div>
          </div>

          {/* 핵심 가치 카드 */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">핵심 가치</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>투명한 수익 구조</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>AI 기반 매칭</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>3단계 추천 시스템</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">10% → 5% → 2%</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200">커미션</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 브랜드 색상 섹션 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-bold">브랜드 색상</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(brandColors).map(([key, brand]) => (
              <div
                key={key}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{brand.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{brand.description}</p>
                </div>
                <div className="grid grid-cols-5 gap-0">
                  {brand.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => copyToClipboard(color.value)}
                      className="relative group aspect-square transition-all hover:scale-110 hover:z-10"
                      style={{ backgroundColor: color.value }}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                        <span className="text-white text-xs font-bold">{color.name}</span>
                        <span className="text-white text-xs mt-1">{color.value}</span>
                        {copiedColor === color.value ? (
                          <Check className="h-3 w-3 text-white mt-2" />
                        ) : (
                          <Copy className="h-3 w-3 text-white mt-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 시맨틱 색상 - 뉴모피즘 스타일 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Layers className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-bold">시맨틱 색상</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(semanticColors).map(([key, color]) => (
              <button
                key={key}
                onClick={() => copyToClipboard(color.value)}
                className="group relative bg-white rounded-2xl p-6 transition-all hover:scale-105 shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.9)]"
              >
                <div
                  className="w-16 h-16 rounded-xl mx-auto mb-3 shadow-inner"
                  style={{ backgroundColor: color.value }}
                ></div>
                <p className="font-semibold text-gray-800">{color.name}</p>
                <p className="text-sm text-gray-500 mt-1">{color.value}</p>
                {copiedColor === color.value ? (
                  <Check className="h-4 w-4 mx-auto mt-2 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mx-auto mt-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 타이포그래피 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Type className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-bold">타이포그래피</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="space-y-8">
              <div>
                <p className="text-sm text-gray-500 mb-2">Display Large (48px)</p>
                <p className="text-5xl font-bold leading-tight">
                  캐쉬업과 함께
                  <br />
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    성장하는 크리에이터
                  </span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Heading 1 (32px)</p>
                    <h1 className="text-3xl font-bold">크리에이터 마케팅 플랫폼</h1>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Heading 2 (24px)</p>
                    <h2 className="text-2xl font-semibold">AI 기반 매칭 시스템</h2>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Heading 3 (20px)</p>
                    <h3 className="text-xl font-medium">성과 기반 마케팅</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Body (16px)</p>
                    <p className="text-base leading-relaxed">
                      광고주와 크리에이터를 연결하는 혁신적인 플랫폼입니다. 투명한 수익 구조와 AI
                      매칭으로 최적의 마케팅 성과를 달성하세요.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Small (14px)</p>
                    <p className="text-sm text-gray-600">
                      3단계 추천 시스템으로 지속적인 수익 창출이 가능합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Caption (12px)</p>
                    <p className="text-xs text-gray-500">
                      * 커미션은 캠페인 성과에 따라 지급됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 컴포넌트 라이브러리 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Grid3x3 className="h-6 w-6 text-gray-700" />
            <h2 className="text-2xl font-bold">컴포넌트 라이브러리</h2>
          </div>

          {/* 버튼 컴포넌트 */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">버튼</h3>
              <p className="text-gray-600 text-sm mt-1">다양한 상황에 맞는 버튼 스타일</p>
            </div>
            <div className="p-6">
              <Tabs defaultValue="variants" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="variants">변형</TabsTrigger>
                  <TabsTrigger value="sizes">크기</TabsTrigger>
                  <TabsTrigger value="states">상태</TabsTrigger>
                </TabsList>

                <TabsContent value="variants" className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="default"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      기본 버튼
                    </Button>
                    <Button variant="secondary">보조 버튼</Button>
                    <Button variant="outline">윤곽선 버튼</Button>
                    <Button variant="ghost">고스트 버튼</Button>
                    <Button variant="destructive">삭제 버튼</Button>
                    <Button variant="link">링크 버튼</Button>
                  </div>
                </TabsContent>

                <TabsContent value="sizes" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button size="sm">작은 버튼</Button>
                    <Button size="default">기본 버튼</Button>
                    <Button size="lg">큰 버튼</Button>
                    <Button size="icon">
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="states" className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button>일반 상태</Button>
                    <Button disabled>비활성화</Button>
                    <Button className="animate-pulse">로딩중...</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* 배지 컴포넌트 */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">배지 & 상태 표시</h3>
              <p className="text-gray-600 text-sm mt-1">정보 표시 및 상태 관리</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                  활성
                </Badge>
                <Badge variant="secondary">대기중</Badge>
                <Badge variant="outline">초안</Badge>
                <Badge variant="destructive">종료</Badge>
                <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200">
                  진행중
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border-blue-200">
                  신규
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">온라인</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-yellow-700">자리 비움</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-600">오프라인</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 대시보드 테마 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">대시보드별 테마</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(dashboardThemes).map(([key, theme]) => (
              <div
                key={key}
                className="group relative overflow-hidden rounded-3xl shadow-xl transition-all hover:scale-105"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-90`}
                />
                <div className="relative bg-white/90 backdrop-blur-sm m-[1px] rounded-3xl p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{theme.name} 대시보드</h3>
                    <p className="text-sm text-gray-600">{key}.cashup.kr</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Primary</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shadow-inner"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {theme.primary}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Secondary</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shadow-inner"
                          style={{ backgroundColor: theme.secondary }}
                        />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {theme.secondary}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Accent</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shadow-inner border"
                          style={{ backgroundColor: theme.accent }}
                        />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {theme.accent}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 공개페이지 테마 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">공개페이지 테마 프리셋</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {publicThemes.map((theme) => (
              <div key={theme.name} className="group cursor-pointer">
                <div
                  className={`h-32 rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg transition-all group-hover:scale-105 group-hover:shadow-xl`}
                >
                  <div className="h-full flex items-end p-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm">{theme.name}</p>
                      <p className="text-xs text-gray-600">{theme.primary}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3단계 추천 시스템 시각화 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">3단계 추천 시스템</h2>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl blur opacity-25"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">1단계</h4>
                      <p className="text-sm text-gray-600">직접 추천</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-lg px-3 py-1">10%</Badge>
                  </div>
                  <div className="text-3xl font-bold text-green-600">10%</div>
                  <p className="text-sm text-gray-500 mt-2">직접 추천한 크리에이터의 수익에서</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur opacity-25"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">2단계</h4>
                      <p className="text-sm text-gray-600">간접 추천</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 text-lg px-3 py-1">5%</Badge>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">5%</div>
                  <p className="text-sm text-gray-500 mt-2">
                    추천인이 추천한 크리에이터의 수익에서
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur opacity-25"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">3단계</h4>
                      <p className="text-sm text-gray-600">확장 추천</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 text-lg px-3 py-1">2%</Badge>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">2%</div>
                  <p className="text-sm text-gray-500 mt-2">
                    2단계 추천인이 추천한 크리에이터의 수익에서
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-xl">
              <p className="text-center text-sm font-medium text-gray-700">
                총 네트워크 커미션: <span className="font-bold">최대 17%</span> (10% + 5% + 2%)
              </p>
            </div>
          </div>
        </section>

        {/* 그림자 및 효과 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">그림자 & 효과</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <p className="text-sm font-medium text-center">shadow-sm</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <p className="text-sm font-medium text-center">shadow-md</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm font-medium text-center">shadow-lg</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <p className="text-sm font-medium text-center">shadow-2xl</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 backdrop-blur-sm p-6 rounded-2xl border border-white/50">
              <p className="text-sm font-medium text-center">글래스모피즘</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.9)]">
              <p className="text-sm font-medium text-center">뉴모피즘</p>
            </div>
            <div className="relative p-6 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500"></div>
              <div className="relative text-white">
                <p className="text-sm font-medium text-center">그라디언트</p>
              </div>
            </div>
          </div>
        </section>

        {/* 애니메이션 */}
        <section className="pb-20">
          <h2 className="text-2xl font-bold mb-6">애니메이션 & 인터랙션</h2>
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-3 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl animate-pulse shadow-lg"></div>
                <p className="text-sm font-medium">Pulse</p>
                <code className="text-xs text-gray-500">animate-pulse</code>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl animate-spin shadow-lg"></div>
                <p className="text-sm font-medium">Spin</p>
                <code className="text-xs text-gray-500">animate-spin</code>
              </div>
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl animate-bounce shadow-lg"></div>
                <p className="text-sm font-medium">Bounce</p>
                <code className="text-xs text-gray-500">animate-bounce</code>
              </div>
              <div className="text-center group cursor-pointer">
                <div className="h-20 w-20 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"></div>
                <p className="text-sm font-medium">Scale & Rotate</p>
                <code className="text-xs text-gray-500">hover:scale-110</code>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
