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
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, signInWithOAuth, user, loading } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/company/dashboard'

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            CulinarySeoul ERP
          </CardTitle>
          <CardDescription className="text-center">
            ERP 시스템에 로그인하여 업무를 시작하세요
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
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>
            
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '이메일로 로그인'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
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
              Google로 로그인
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignIn('kakao')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FEE500"
                  d="M12 3c5.8 0 10.5 3.7 10.5 8.3 0 2.4-1.2 4.6-3.2 6.2l.9 3.2-3.5-1.9c-1.4.4-2.9.7-4.7.7-5.8 0-10.5-3.7-10.5-8.3S6.2 3 12 3"
                />
              </svg>
              카카오로 로그인
            </Button>
          </div>

          {/* Footer Links */}
          <div className="text-center text-sm space-y-2">
            <div>
              <Link
                href="/auth/reset-password"
                className="text-blue-600 hover:text-blue-500 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <div className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link
                href="/auth/signup"
                className="text-blue-600 hover:text-blue-500 hover:underline"
              >
                회원가입
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}