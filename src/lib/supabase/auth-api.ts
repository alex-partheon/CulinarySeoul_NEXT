/**
 * Supabase Authentication helpers for API routes
 * Replaces Clerk auth() function with native Supabase server-side auth
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, ERPRole } from '@/types/database.types'

/**
 * Get authenticated user in API routes
 * Replacement for Clerk's auth() function
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // API routes can't set cookies, so we skip this
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, userId: null }
    }

    return { 
      user, 
      userId: user.id 
    }
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error)
    return { user: null, userId: null }
  }
}

/**
 * Get user profile with role information
 */
export async function getUserProfile(userId: string) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // API routes can't set cookies
          },
        },
      }
    )

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

/**
 * Check if user has required role
 */
export async function requireRole(userId: string, requiredRoles: ERPRole | ERPRole[]) {
  const profile = await getUserProfile(userId)
  
  if (!profile) {
    return { hasAccess: false, profile: null }
  }

  const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  const hasAccess = allowedRoles.includes(profile.role)

  return { hasAccess, profile }
}

/**
 * Get user with authentication and role checking
 * Complete replacement for Clerk's auth pattern in API routes
 */
export async function authenticateApiRequest(requiredRoles?: ERPRole | ERPRole[]) {
  const { user, userId } = await getAuthenticatedUser()
  
  if (!userId) {
    return {
      authenticated: false,
      user: null,
      profile: null,
      error: 'Unauthorized'
    }
  }

  if (!requiredRoles) {
    const profile = await getUserProfile(userId)
    return {
      authenticated: true,
      user,
      profile,
      error: null
    }
  }

  const { hasAccess, profile } = await requireRole(userId, requiredRoles)
  
  if (!hasAccess) {
    return {
      authenticated: true,
      user,
      profile,
      error: 'Insufficient permissions'
    }
  }

  return {
    authenticated: true,
    user,
    profile,
    error: null
  }
}