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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, EyeOff, CheckCircle2, ChefHat, ArrowRight, Check, Sparkles, Shield, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [agreeToMarketing, setAgreeToMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))]" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-amber-500/30">
              <ChefHat className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-2xl font-bold">CulinarySeoul</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Start Your Journey to
              <span className="block text-amber-400 mt-2">F&B Excellence</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-md">
              체계적인 재고 관리와 통합 대시보드로
              비즈니스 성장을 가속화하세요.
            </p>
          </div>
        </div>
        
        <div className="relative space-y-8">
          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              가입 혜택
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">14일 무료 체험</p>
                  <p className="text-xs text-gray-400">모든 기능을 제한 없이 체험하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">전문가 온보딩 지원</p>
                  <p className="text-xs text-gray-400">시스템 설정부터 활용까지 1:1 지원</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">실시간 데이터 동기화</p>
                  <p className="text-xs text-gray-400">모든 기기에서 실시간 접근</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="pt-8 border-t border-gray-700">
            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                "bg-amber-500 text-slate-900"
              )}>
                1
              </div>
              <div className="h-px flex-1 bg-gray-700" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                currentStep >= 2 ? "bg-amber-500 text-slate-900" : "bg-gray-700 text-gray-500"
              )}>
                2
              </div>
              <div className="h-px flex-1 bg-gray-700" />
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors",
                success ? "bg-amber-500 text-slate-900" : "bg-gray-700 text-gray-500"
              )}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>계정 정보</span>
              <span>약관 동의</span>
              <span>가입 완료</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Sign Up Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50/50">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                <ChefHat className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-center">
              14일 무료 체험으로 모든 기능을 이용해보세요
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
              <Label htmlFor="fullName" className="text-sm font-medium">
                이름
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="홍길동"
                value={formData.fullName}
                onChange={handleInputChange('fullName')}
                disabled={isLoading}
                autoComplete="name"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                이메일 주소
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleInputChange('email')}
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
                  placeholder="최소 8자 이상"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={isLoading}
                  autoComplete="new-password"
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
              <p className="text-xs text-muted-foreground mt-1">
                소문자, 대문자, 숫자, 특수문자 중 2가지 이상 포함
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
            </div>
            
            {/* Terms */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  <span className="text-red-500">*</span> 
                  <Link href="/terms" className="underline hover:text-amber-600">
                    이용약관
                  </Link>
                  {' '}및{' '}
                  <Link href="/privacy" className="underline hover:text-amber-600">
                    개인정보처리방침
                  </Link>
                  에 동의합니다
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="marketing" 
                  checked={agreeToMarketing}
                  onCheckedChange={(checked) => setAgreeToMarketing(checked as boolean)}
                  className="mt-0.5"
                />
                <Label 
                  htmlFor="marketing" 
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  [선택] 마케팅 정보 수신에 동의합니다
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-medium transition-all duration-200 group"
              disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || !formData.fullName || !agreeToTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                <>
                  무료로 시작하기
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
              <span className="bg-white px-2 text-muted-foreground">또는 소셜 계정으로</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 hover:bg-gray-50 transition-colors"
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
              <span className="hidden sm:inline">Google</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-11 hover:bg-gray-50 transition-colors"
              onClick={() => handleOAuthSignUp('kakao')}
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
              이미 계정이 있으신가요?
            </p>
            <Button
              variant="ghost"
              className="w-full h-11 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              asChild
            >
              <Link href="/auth/signin">
                로그인하기
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