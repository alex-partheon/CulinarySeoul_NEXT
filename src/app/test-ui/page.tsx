'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestUIPage() {
  return (
    <div className="container-max section-padding py-12">
      <h1 className="text-4xl font-bold mb-8 text-gradient">CashUp UI 컴포넌트 테스트</h1>

      <div className="grid gap-8">
        {/* 버튼 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>버튼 컴포넌트</CardTitle>
            <CardDescription>다양한 버튼 스타일 테스트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button>기본 버튼</Button>
              <Button variant="secondary">보조 버튼</Button>
              <Button variant="destructive">위험 버튼</Button>
              <Button variant="outline">아웃라인 버튼</Button>
              <Button variant="ghost">고스트 버튼</Button>
              <Button variant="link">링크 버튼</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button size="sm">작은 버튼</Button>
              <Button size="default">기본 버튼</Button>
              <Button size="lg">큰 버튼</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button className="hover-lift">호버 효과</Button>
              <Button disabled>비활성화</Button>
            </div>
          </CardContent>
        </Card>

        {/* 카드 테스트 */}
        <div className="grid-responsive">
          <Card className="card">
            <CardHeader>
              <CardTitle>크리에이터 대시보드</CardTitle>
              <CardDescription>수익 관리 및 캠페인 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-creator-primary">크리에이터 테마 색상</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">대시보드 접속</Button>
            </CardFooter>
          </Card>

          <Card className="card">
            <CardHeader>
              <CardTitle>비즈니스 대시보드</CardTitle>
              <CardDescription>광고 캠페인 생성 및 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-business-primary">비즈니스 테마 색상</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full">
                캠페인 생성
              </Button>
            </CardFooter>
          </Card>

          <Card className="card">
            <CardHeader>
              <CardTitle>관리자 대시보드</CardTitle>
              <CardDescription>플랫폼 운영 및 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-admin-primary">관리자 테마 색상</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                관리자 패널
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* 폼 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle>폼 컴포넌트</CardTitle>
            <CardDescription>입력 필드 테스트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="이메일을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" placeholder="비밀번호를 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="이름을 입력하세요" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">회원가입</Button>
          </CardFooter>
        </Card>

        {/* 유틸리티 클래스 테스트 */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>유틸리티 클래스 테스트</CardTitle>
            <CardDescription>커스텀 유틸리티 클래스 확인</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="glass p-4 rounded-lg">
              <p>glass 효과</p>
            </div>
            <div className="text-gradient text-2xl font-bold">텍스트 그라데이션 효과</div>
            <div className="flex gap-4">
              <div className="animation-delay-200 animate-pulse bg-primary-500 text-white p-2 rounded">
                애니메이션 1
              </div>
              <div className="animation-delay-400 animate-pulse bg-primary-600 text-white p-2 rounded">
                애니메이션 2
              </div>
              <div className="animation-delay-600 animate-pulse bg-primary-700 text-white p-2 rounded">
                애니메이션 3
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
