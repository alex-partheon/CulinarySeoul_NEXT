/**
 * Metrics API Endpoint
 * Provides performance analytics and system metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceAnalytics, getActiveAlerts } from '@/lib/monitoring'
import { getSecurityMetrics as getSecurityEventsMetrics } from '@/lib/security'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check if user has admin access
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || !['super_admin', 'company_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get time range from query params (default: 24 hours)
    const timeRange = parseInt(request.nextUrl.searchParams.get('timeRange') || '86400000')
    
    const performanceAnalytics = getPerformanceAnalytics(timeRange)
    const securityMetrics = getSecurityEventsMetrics()
    const activeAlerts = getActiveAlerts()
    
    return NextResponse.json({
      timestamp: Date.now(),
      timeRange,
      performance: performanceAnalytics,
      security: securityMetrics,
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    })
  } catch (error) {
    console.error('Metrics API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: Date.now()
    }, { status: 500 })
  }
}