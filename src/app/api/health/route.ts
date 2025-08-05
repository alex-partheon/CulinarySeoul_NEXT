/**
 * Health Check API Endpoint
 * Provides system health status and metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/monitoring'

export async function GET(_request: NextRequest) {
  try {
    const health = await getSystemHealth()
    
    const status = health.status === 'healthy' ? 200 : 
                  health.status === 'degraded' ? 206 : 503
    
    return NextResponse.json(health, { status })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: Date.now()
    }, { status: 503 })
  }
}