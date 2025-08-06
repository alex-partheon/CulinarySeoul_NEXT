'use client'

/**
 * CulinarySeoul ERP Supabase Auth Provider
 * Replaces Clerk authentication with native Supabase Auth
 * Provides session management, role-based access control, and user context
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import type { ERPRole, Profile } from '@/types/database.types'

// =============================================
// TYPES AND INTERFACES
// =============================================

interface AuthContextType {
  // User and session state
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  
  // OAuth methods
  signInWithOAuth: (provider: 'google' | 'kakao') => Promise<{ error: AuthError | null }>
  
  // Profile management
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  refreshClaims: () => Promise<void>
  
  // Role and permission helpers
  hasRole: (role: ERPRole) => boolean
  hasAnyRole: (roles: ERPRole[]) => boolean
  hasMinimumRole: (minimumRole: ERPRole) => boolean
  canAccessCompany: (companyId: string) => Promise<boolean>
  canAccessBrand: (brandId: string) => Promise<boolean>
  canAccessStore: (storeId: string) => Promise<boolean>
  
  // Navigation helpers
  getDefaultDashboard: () => string
  redirectToDashboard: () => void
}

interface AuthProviderProps {
  children: React.ReactNode
}

// =============================================
// CONTEXT CREATION
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// =============================================
// ROLE HIERARCHY CONFIGURATION
// =============================================

const ROLE_HIERARCHY: Record<ERPRole, number> = {
  super_admin: 100,
  company_admin: 80,
  brand_admin: 60,
  brand_staff: 40,
  store_manager: 30,
  store_staff: 10
}

// ROLE_ROUTES 제거 - getDefaultDashboard에서 직접 처리

// =============================================
// AUTH PROVIDER COMPONENT
// =============================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // =============================================
  // PROFILE MANAGEMENT
  // =============================================

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    const userProfile = await fetchProfile(user.id)
    setProfile(userProfile)
  }, [user, fetchProfile])

  const refreshClaims = useCallback(async () => {
    try {
      // Refresh user claims by refetching the profile
      if (user) {
        await fetchProfile(user.id)
      }
      // Force a session refresh to get updated JWT claims
      const { data: { user: updatedUser } } = await supabase.auth.getUser()
      if (updatedUser) {
        // Get the current session to maintain session state
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          setSession(currentSession)
        }
      }
    } catch (error) {
      console.error('Error refreshing claims:', error)
    }
  }, [supabase, user, fetchProfile])

  // =============================================
  // AUTHENTICATION METHODS
  // =============================================

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (!error && data.user) {
      const userProfile = await fetchProfile(data.user.id)
      setUser(data.user)
      setProfile(userProfile)
      setSession(data.session)
    }

    setLoading(false)
    return { error }
  }, [supabase, fetchProfile])

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (!error && data.user) {
      // Profile will be created automatically by trigger
      const userProfile = await fetchProfile(data.user.id)
      setUser(data.user)
      setProfile(userProfile)
      setSession(data.session)
    }

    setLoading(false)
    return { error }
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    setLoading(true)
    
    const { error } = await supabase.auth.signOut()
    
    setUser(null)
    setProfile(null)
    setSession(null)
    setLoading(false)
    
    // Redirect to home page
    router.push('/')
    
    return { error }
  }, [supabase, router])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    return { error }
  }, [supabase])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    return { error }
  }, [supabase])

  // =============================================
  // PROFILE UPDATE
  // =============================================

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('User not authenticated') }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
    }

    return { error }
  }, [user, supabase, refreshProfile])

  // =============================================
  // ROLE AND PERMISSION HELPERS
  // =============================================

  const hasRole = useCallback((role: ERPRole): boolean => {
    return profile?.role === role
  }, [profile])

  const hasAnyRole = useCallback((roles: ERPRole[]): boolean => {
    if (!profile?.role || !Array.isArray(roles)) return false
    return roles.includes(profile.role)
  }, [profile])

  const hasMinimumRole = useCallback((minimumRole: ERPRole): boolean => {
    if (!profile?.role) return false
    
    const userLevel = ROLE_HIERARCHY[profile.role]
    const requiredLevel = ROLE_HIERARCHY[minimumRole]
    
    return userLevel >= requiredLevel
  }, [profile])

  const canAccessCompany = useCallback(async (companyId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('user_has_company_access', { target_company_id: companyId })
      
      if (error) {
        console.error('Company access check failed:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error checking company access:', error)
      return false
    }
  }, [supabase])

  const canAccessBrand = useCallback(async (brandId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('user_has_brand_access', { target_brand_id: brandId })
      
      if (error) {
        console.error('Brand access check failed:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error checking brand access:', error)
      return false
    }
  }, [supabase])

  const canAccessStore = useCallback(async (storeId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('user_has_store_access', { target_store_id: storeId })
      
      if (error) {
        console.error('Store access check failed:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error checking store access:', error)
      return false
    }
  }, [supabase])

  // =============================================
  // NAVIGATION HELPERS
  // =============================================

  const getDefaultDashboard = useCallback((): string => {
    if (!profile?.role) return '/auth/signin'
    
    // 권한별 동적 대시보드 경로 생성
    switch (profile.role) {
      case 'super_admin':
      case 'company_admin':
        return '/company/dashboard'
      
      case 'brand_admin':
       case 'brand_staff':
         // 사용자의 브랜드 ID 사용
         if (profile.brand_id) {
           return `/brand/${profile.brand_id}/dashboard`
         }
         return '/brand/dashboard' // fallback
       
       case 'store_manager':
       case 'store_staff':
         // 사용자의 매장 ID 사용
         if (profile.store_id) {
           return `/store/${profile.store_id}/dashboard`
         }
         return '/store/dashboard' // fallback
      
      default:
        return '/auth/signin'
    }
  }, [profile])

  const redirectToDashboard = useCallback(() => {
    const dashboardPath = getDefaultDashboard()
    router.push(dashboardPath)
  }, [getDefaultDashboard, router])

  // =============================================
  // SESSION MANAGEMENT EFFECTS
  // =============================================

  useEffect(() => {
    let mounted = true
    
    // Get initial session with optimized loading
    const getInitialSession = async () => {
      if (!mounted) return
      
      try {
        const { data: { user: initialUser }, error: userError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (userError) {
          console.error('Error getting initial user:', userError)
          setLoading(false)
          return
        }

        if (initialUser) {
          // Get session for state management
          const { data: { session: initialSession } } = await supabase.auth.getSession()
          // Parallel profile fetch for better performance
          const userProfile = await fetchProfile(initialUser.id)
          
          if (!mounted) return
          
          setUser(initialUser)
          setProfile(userProfile)
          if (initialSession) {
            setSession(initialSession)
          }
        }
        
        setLoading(false)
      } catch (error) {
        if (mounted) {
          console.error('Session initialization error:', error)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with debouncing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return
        
        console.log('Auth state changed:', event, currentSession?.user?.id)
        
        try {
          if (currentSession?.user) {
            const userProfile = await fetchProfile(currentSession.user.id)
            
            if (!mounted) return
            
            setUser(currentSession.user)
            setProfile(userProfile)
            setSession(currentSession)
          } else {
            if (mounted) {
              setUser(null)
              setProfile(null)
              setSession(null)
            }
          }
          
          if (mounted) {
            setLoading(false)
          }
        } catch (error) {
          if (mounted) {
            console.error('Auth state change error:', error)
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // =============================================
  // ROUTE PROTECTION EFFECT
  // =============================================

  useEffect(() => {
    if (loading) return
    
    // Redirect authenticated users away from auth pages ONLY (not from main page)
    if (user && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
      redirectToDashboard()
      return
    }
    
    // Allow authenticated users to stay on main page (/)
    if (user && pathname === '/') {
      return
    }
    
    // Redirect unauthenticated users to signin
    const protectedPaths = ['/company', '/brand', '/store', '/dashboard']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    
    if (!user && isProtectedPath) {
      router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    
    // Check role-based access for protected routes
    if (user && profile && isProtectedPath) {
      let hasAccess = true
      
      if (pathname.startsWith('/company')) {
        hasAccess = hasMinimumRole('company_admin')
      } else if (pathname.startsWith('/brand')) {
        hasAccess = hasMinimumRole('brand_staff')
      } else if (pathname.startsWith('/store')) {
        hasAccess = hasMinimumRole('store_staff')
      }
      
      if (!hasAccess) {
        redirectToDashboard()
      }
    }
  }, [user, profile, pathname, loading, hasMinimumRole, redirectToDashboard, router])

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const value: AuthContextType = {
    // State
    user,
    profile,
    session,
    loading,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithOAuth,
    
    // Profile methods
    updateProfile,
    refreshProfile,
    refreshClaims,
    
    // Permission methods
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    canAccessCompany,
    canAccessBrand,
    canAccessStore,
    
    // Navigation methods
    getDefaultDashboard,
    redirectToDashboard
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// =============================================
// CUSTOM HOOK
// =============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// =============================================
// CONVENIENCE HOOKS
// =============================================

export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

export function useProfile() {
  const { profile, loading, refreshProfile } = useAuth()
  return { profile, loading, refreshProfile }
}

export function useRole() {
  const { profile, hasRole, hasMinimumRole } = useAuth()
  return { 
    role: profile?.role || null, 
    hasRole, 
    hasMinimumRole,
    isAdmin: hasMinimumRole('company_admin'),
    isBrandManager: hasMinimumRole('brand_admin'),
    isStoreManager: hasMinimumRole('store_manager')
  }
}

export function useAuthGuard(minimumRole?: ERPRole) {
  const { user, profile, hasMinimumRole, redirectToDashboard } = useAuth()
  
  useEffect(() => {
    if (!user) return
    
    if (minimumRole && profile && !hasMinimumRole(minimumRole)) {
      redirectToDashboard()
    }
  }, [user, profile, minimumRole, hasMinimumRole, redirectToDashboard])
  
  return {
    isAuthenticated: !!user,
    hasAccess: !minimumRole || (profile && hasMinimumRole(minimumRole))
  }
}