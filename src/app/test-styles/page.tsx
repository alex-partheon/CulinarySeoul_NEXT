'use client';

import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestStylesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Theme Switcher */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-sm font-medium">Theme:</span>
          <ThemeSwitcher />
        </div>

        {/* Toast Test Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">토스트 알림 테스트</h2>
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={() => toast.success('성공! 작업이 완료되었습니다.')}
              className="bg-green-600 hover:bg-green-700"
            >
              Success Toast
            </Button>
            <Button
              onClick={() => toast.error('오류! 작업 중 문제가 발생했습니다.')}
              variant="destructive"
            >
              Error Toast
            </Button>
            <Button
              onClick={() => toast.warning('경고! 주의가 필요한 작업입니다.')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Warning Toast
            </Button>
            <Button
              onClick={() => toast.info('정보! 새로운 업데이트가 있습니다.')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Info Toast
            </Button>
            <Button onClick={() => toast('기본 토스트 메시지입니다.')} variant="outline">
              Default Toast
            </Button>
          </div>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-primary">Tailwind CSS v4 Test Page</h1>

        {/* Color Palette Test */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">색상 팔레트 테스트</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg">Primary</div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">Secondary</div>
            <div className="bg-accent text-accent-foreground p-4 rounded-lg">Accent</div>
            <div className="bg-muted text-muted-foreground p-4 rounded-lg">Muted</div>
          </div>
        </div>

        {/* Animation Test */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">애니메이션 테스트</h2>
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-primary rounded-full animate-pulse"></div>
            <div className="w-16 h-16 bg-secondary rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Gradient Test */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">그라디언트 테스트</h2>
          <div className="h-32 bg-gradient-to-r from-primary to-secondary rounded-lg"></div>
        </div>

        {/* Typography Test */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">타이포그래피 테스트</h2>
          <div className="space-y-3">
            <p className="font-sans text-lg">
              Sans-serif 폰트 (Plus Jakarta Sans) - 한글과 영문 Mixed Test
            </p>
            <p className="font-serif text-lg">Serif 폰트 (Source Serif 4) - 우아한 세리프 스타일</p>
            <p className="font-mono text-lg">
              Mono 폰트 (JetBrains Mono) - Code style: const test = &quot;hello&quot;;
            </p>
            <div className="text-sm text-muted-foreground mt-4">
              <p>Font weights test:</p>
              <p className="font-thin">Thin (100)</p>
              <p className="font-extralight">Extra Light (200)</p>
              <p className="font-light">Light (300)</p>
              <p className="font-normal">Normal (400)</p>
              <p className="font-medium">Medium (500)</p>
              <p className="font-semibold">Semibold (600)</p>
              <p className="font-bold">Bold (700)</p>
              <p className="font-extrabold">Extra Bold (800)</p>
            </div>
          </div>
        </div>

        {/* Custom Colors Test */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-secondary">커스텀 색상 테스트</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-culinary-emerald text-white p-4 rounded-lg">Culinary Emerald</div>
            <div className="bg-culinary-purple text-white p-4 rounded-lg">Culinary Purple</div>
            <div className="bg-culinary-amber text-white p-4 rounded-lg">Culinary Amber</div>
          </div>
        </div>
      </div>
    </div>
  );
}
