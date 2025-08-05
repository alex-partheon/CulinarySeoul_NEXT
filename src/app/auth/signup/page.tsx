'use client'

/**
 * CulinarySeoul ERP Sign Up Page
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
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { signUp, signInWithOAuth, user, loading } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/company/dashboard'

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Form validation
  const validateForm = (): string | null => {
    const { email, password, confirmPassword, fullName } = formData

    if (!email || !password || !confirmPassword || !fullName) {
      return '모든 필드를 입력해주세요.'
    }

    if (!email.includes('@')) {
      return '올바른 이메일 주소를 입력해주세요.'
    }

    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다.'
    }

    if (password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }

    // Password strength check
    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!(hasLowerCase && (hasUpperCase || hasNumbers || hasSpecialChar))) {
      return '비밀번호는 소문자와 대문자, 숫자, 특수문자 중 최소 2가지를 포함해야 합니다.'
    }

    return null
  }

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  // Handle email/password sign up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName)

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('이미 가입된 이메일입니다. 로그인을 시도해주세요.')
        } else if (error.message.includes('Password should be at least')) {
          setError('비밀번호는 최소 8자 이상이어야 합니다.')
        } else if (error.message.includes('Signup requires a valid password')) {
          setError('올바른 비밀번호를 입력해주세요.')
        } else if (error.message.includes('Invalid email')) {
          setError('올바른 이메일 주소를 입력해주세요.')
        } else {
          setError(error.message || '회원가입 중 오류가 발생했습니다.')
        }
        return
      }

      // Success
      setSuccess(true)
    } catch (err) {
      console.error('Sign up error:', err)
      setError('회원가입 중 예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OAuth sign up
  const handleOAuthSignUp = async (provider: 'google' | 'kakao') => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signInWithOAuth(provider)

      if (error) {
        if (provider === 'kakao') {
          setError('카카오 회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
        } else {
          setError('Google 회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
        }
      }
      // OAuth redirect will be handled by provider
    } catch (err) {
      console.error('OAuth sign up error:', err)
      setError('소셜 회원가입 중 예상치 못한 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              회원가입 완료
            </CardTitle>
            <CardDescription>
              이메일 인증을 완료하고 로그인해주세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                <strong>{formData.email}</strong>로 인증 이메일을 발송했습니다.
                <br />
                이메일을 확인하고 인증을 완료한 후 로그인해주세요.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
              
              <p className="text-sm text-gray-600">
                이메일을 받지 못하셨나요?{' '}
                <button
                  onClick={() => {
                    setSuccess(false)
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }))
                  }}
                  className="text-blue-600 hover:text-blue-500 hover:underline"
                >
                  다시 시도
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
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
            새 계정을 생성하여 ERP 시스템에 가입하세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="이름"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                disabled={isLoading}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="이메일 주소"
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>
            
            <div className="space-y-2 relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 (최소 8자)"
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={isLoading}
                autoComplete="new-password"
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

            <div className="space-y-2 relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || !formData.fullName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                '이메일로 회원가입'
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
              onClick={() => handleOAuthSignUp('google')}
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
              Google로 회원가입
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignUp('kakao')}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#FEE500"
                  d="M12 3c5.8 0 10.5 3.7 10.5 8.3 0 2.4-1.2 4.6-3.2 6.2l.9 3.2-3.5-1.9c-1.4.4-2.9.7-4.7.7-5.8 0-10.5-3.7-10.5-8.3S6.2 3 12 3"
                />
              </svg>
              카카오로 회원가입
            </Button>
          </div>

          {/* Footer Links */}
          <div className="text-center text-sm">
            <span className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/auth/signin"
                className="text-blue-600 hover:text-blue-500 hover:underline"
              >
                로그인
              </Link>
            </span>
          </div>

          {/* Terms */}
          <div className="text-xs text-gray-500 text-center">
            회원가입 시{' '}
            <Link href="/terms" className="underline hover:text-gray-700">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}