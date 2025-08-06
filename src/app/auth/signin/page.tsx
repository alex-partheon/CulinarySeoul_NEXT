'use client'

/**
 * CulinarySeoul ERP Sign In Page
 * Native Supabase Auth implementation replacing Clerk
 */

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, EyeOff, ChefHat, ArrowRight, Sparkles } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithOAuth, user, loading } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/company/dashboard'

  // Handle URL parameters for error messages
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')
    
    if (errorParam === 'unauthorized' && messageParam) {
      setError(decodeURIComponent(messageParam))
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Handle email/password sign in
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 가입 시 발송된 이메일을 확인해주세요.')
        } else if (error.message.includes('Too many requests')) {
          setError('너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.')
        } else {
          setError(error.message || '로그인 중 오류가 발생했습니다.')
        }
        return
      }

      // Success - redirect will be handled by auth provider
      router.push(redirectTo)
    } catch (err) {
      console.error('Sign in error:', err)
      setError('로그인 중 예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OAuth sign in
  const handleOAuthSignIn = async (provider: 'google' | 'kakao') => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signInWithOAuth(provider)

      if (error) {
        if (provider === 'kakao') {
          setError('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
        } else {
          setError('Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
        }
      }
      // OAuth redirect will be handled by provider
    } catch (err) {
      console.error('OAuth sign in error:', err)
      setError('소셜 로그인 중 예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for messages from URL params (e.g., from password reset)
  useEffect(() => {
    const messageParam = searchParams.get('message')
    const errorParam = searchParams.get('error')
    
    if (messageParam) {
      setMessage(messageParam)
    }
    
    if (errorParam) {
      if (errorParam === 'callback_error') {
        setError('인증 중 오류가 발생했습니다. 다시 시도해주세요.')
      } else {
        setError(errorParam)
      }
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex flex-col justify-between gradient-premium p-8 text-white">
        <div className="absolute inset-0 bg-grid opacity-[0.02] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-2xl font-bold">CulinarySeoul</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Global Food Service
              <span className="block text-amber-400 mt-2">Excellence</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-md">
              서울의 미식 문화를 선도하는 통합 F&B 관리 시스템으로
              비즈니스의 새로운 가능성을 발견하세요.
            </p>
          </div>
        </div>
        
        <div className="relative space-y-8">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>FIFO 재고관리</span>
            </div>
            <span>•</span>
            <span>실시간 대시보드</span>
            <span>•</span>
            <span>브랜드 분리 지원</span>
          </div>
          
          <blockquote className="border-l-2 border-amber-500/50 pl-4 text-gray-300">
            <p className="text-sm italic">
              "CulinarySeoul ERP 덕분에 우리 카페의 재고 관리가 체계화되었고,
              원가 절감에 큰 도움이 되었습니다."
            </p>
            <footer className="mt-2 text-xs text-gray-400">
              — 김민수, 밀랍 성수점 점장
            </footer>
          </blockquote>
        </div>
      </div>
      
      {/* Right Panel - Sign In Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50/50">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                <ChefHat className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              계정에 로그인하여 대시보드로 이동하세요
            </CardDescription>
          </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Success Message */}
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                이메일 주소
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  로그인 상태 유지
                </Label>
              </div>
              <Link
                href="/auth/reset-password"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-medium transition-all duration-200 group"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                <>
                  로그인
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">또는 소셜 로그인</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 hover:bg-gray-50 transition-colors"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="hidden sm:inline">Google</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-11 hover:bg-gray-50 transition-colors"
              onClick={() => handleOAuthSignIn('kakao')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FEE500"
                  d="M12 3c5.8 0 10.5 3.7 10.5 8.3 0 2.4-1.2 4.6-3.2 6.2l.9 3.2-3.5-1.9c-1.4.4-2.9.7-4.7.7-5.8 0-10.5-3.7-10.5-8.3S6.2 3 12 3"
                />
              </svg>
              <span className="hidden sm:inline">Kakao</span>
            </Button>
          </div>

          {/* Footer Links */}
          <Separator className="my-6" />
          
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              아직 계정이 없으신가요?
            </p>
            <Button
              variant="ghost"
              className="w-full h-11 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              asChild
            >
              <Link href="/auth/signup">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}