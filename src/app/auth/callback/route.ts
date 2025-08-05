/**
 * CulinarySeoul ERP OAuth Callback Route
 * Handles OAuth authentication callbacks from providers (Google, Kakao)
 * Processes the authorization code and sets up user session
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const state = requestUrl.searchParams.get('state')
  
  // Parse redirect URL from state or use default
  let redirectUrl = '/company/dashboard'
  if (state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state))
      redirectUrl = stateData.redirectTo || redirectUrl
    } catch {
      // Invalid state, use default redirect
    }
  }

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    
    let errorMessage = 'authentication_failed'
    
    if (error === 'access_denied') {
      errorMessage = 'access_denied'
    } else if (error === 'server_error') {
      errorMessage = 'server_error'
    }
    
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${errorMessage}`, request.url)
    )
  }

  // Handle authorization code
  if (code) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(
          new URL('/auth/signin?error=callback_error', request.url)
        )
      }

      if (data.user) {
        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // Create profile if it doesn't exist (OAuth users)
        if (profileError?.code === 'PGRST116' || !existingProfile) {
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: 
                data.user.user_metadata?.full_name || 
                data.user.user_metadata?.name || 
                data.user.user_metadata?.display_name ||
                data.user.email?.split('@')[0] ||
                'User',
              role: 'store_staff', // Default role for new OAuth users
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (createError) {
            console.error('Error creating profile:', createError)
            // Don't fail the login, but log the error
          }
        }

        // Get user profile to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        // Determine redirect based on role
        if (profile?.role) {
          switch (profile.role) {
            case 'super_admin':
            case 'company_admin':
              redirectUrl = '/company/dashboard'
              break
            case 'brand_admin':
            case 'brand_staff':
              redirectUrl = '/brand/dashboard'
              break
            case 'store_manager':
            case 'store_staff':
              redirectUrl = '/store/dashboard'
              break
            default:
              redirectUrl = '/company/dashboard'
          }
        }

        // Add success message
        const successUrl = new URL(redirectUrl, request.url)
        successUrl.searchParams.set('message', 'login_success')
        
        return NextResponse.redirect(successUrl)
      }
    } catch (error) {
      console.error('Unexpected callback error:', error)
      return NextResponse.redirect(
        new URL('/auth/signin?error=callback_error', request.url)
      )
    }
  }

  // No code parameter, redirect to signin
  return NextResponse.redirect(
    new URL('/auth/signin?error=missing_code', request.url)
  )
}

export async function POST(request: NextRequest) {
  // Handle any POST requests (some OAuth flows might use POST)
  return NextResponse.redirect(
    new URL('/auth/signin?error=invalid_method', request.url)
  )
}