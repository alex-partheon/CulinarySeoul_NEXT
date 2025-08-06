'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChefHat, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-provider';

interface PublicHeaderProps {
  className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, getDefaultDashboard, loading } = useAuth();

  const navigation = [
    { name: '홈', href: '/' },
    { name: '소개', href: '/about' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const dashboardUrl = getDefaultDashboard();

  return (
    <header className={`bg-white border-b border-gray-200 sticky top-0 z-50 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 브랜드 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">
                CulinarySeoul
              </span>
            </Link>
          </div>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 인증 버튼 (데스크톱) */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-20 h-9 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href={dashboardUrl} className="flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>대시보드</span>
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth/signin">로그인</Link>
              </Button>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2 justify-start">
                    <ChefHat className="h-6 w-6 text-emerald-600" />
                    <span>CulinarySeoul</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <nav className="space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block text-lg text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="border-t pt-6 space-y-3">
                    {loading ? (
                      <div className="w-full h-9 bg-gray-200 animate-pulse rounded" />
                    ) : user ? (
                      <>
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href={dashboardUrl} onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>대시보드</span>
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          로그아웃
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full" asChild>
                        <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                          로그인
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}