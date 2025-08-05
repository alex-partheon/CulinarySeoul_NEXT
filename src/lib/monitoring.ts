/**
 * CulinarySeoul ERP Monitoring and Observability
 * Performance metrics, health checks, and system monitoring
 */

import { NextRequest } from 'next/server'

// =============================================
// PERFORMANCE METRICS
// =============================================

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface RequestMetric {
  path: string
  method: string
  status: number
  duration: number
  timestamp: number
  userId?: string
  userRole?: string
  ip: string
  userAgent: string
}

// In-memory storage (for production, use external monitoring service)
const performanceMetrics: PerformanceMetric[] = []
const requestMetrics: RequestMetric[] = []

export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  const metric: PerformanceMetric = {
    name,
    value,
    timestamp: Date.now(),
    tags
  }
  
  performanceMetrics.push(metric)
  
  // Keep only last 10000 metrics
  if (performanceMetrics.length > 10000) {
    performanceMetrics.splice(0, performanceMetrics.length - 10000)
  }
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to DataDog, New Relic, or custom monitoring service
    console.log(`Metric: ${name} = ${value}`, tags)
  }
}

export function recordRequest(request: NextRequest, response: Response, startTime: number, userId?: string, userRole?: string) {
  const duration = Date.now() - startTime
  
  const requestMetric: RequestMetric = {
    path: request.nextUrl.pathname,
    method: request.method,
    status: response.status,
    duration,
    timestamp: Date.now(),
    userId,
    userRole,
    ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
  
  requestMetrics.push(requestMetric)
  
  // Keep only last 50000 request metrics
  if (requestMetrics.length > 50000) {
    requestMetrics.splice(0, requestMetrics.length - 50000)
  }
  
  // Record performance metrics
  recordMetric('request.duration', duration, {
    path: request.nextUrl.pathname,
    method: request.method,
    status: response.status.toString()
  })
  
  recordMetric('request.count', 1, {
    path: request.nextUrl.pathname,
    method: request.method,
    status: response.status.toString()
  })
  
  // Track slow requests
  if (duration > 1000) {
    recordMetric('request.slow', 1, {
      path: request.nextUrl.pathname,
      duration: duration.toString()
    })
  }
  
  // Track errors
  if (response.status >= 400) {
    recordMetric('request.error', 1, {
      path: request.nextUrl.pathname,
      status: response.status.toString()
    })
  }
}

// =============================================
// HEALTH CHECKS
// =============================================

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

export async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Simple database connectivity check
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        name: 'database',
        status: responseTime < 200 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          responseCode: response.status
        }
      }
    } else {
      return {
        name: 'database',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime,
        error: `HTTP ${response.status}`,
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          responseCode: response.status
        }
      }
    }
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }
  }
}

export async function checkAuthHealth(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    // Check Supabase Auth endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      }
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        name: 'auth',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime
      }
    } else {
      return {
        name: 'auth',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime,
        error: `HTTP ${response.status}`
      }
    }
  } catch (error) {
    return {
      name: 'auth',
      status: 'unhealthy',
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheck[]
  timestamp: number
}> {
  const checks = await Promise.all([
    checkDatabaseHealth(),
    checkAuthHealth()
  ])
  
  // Determine overall system status
  const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
  const hasDegraded = checks.some(check => check.status === 'degraded')
  
  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (hasUnhealthy) {
    status = 'unhealthy'
  } else if (hasDegraded) {
    status = 'degraded'
  } else {
    status = 'healthy'
  }
  
  return {
    status,
    checks,
    timestamp: Date.now()
  }
}

// =============================================
// ANALYTICS
// =============================================

export function getPerformanceAnalytics(timeRange: number = 24 * 60 * 60 * 1000) {
  const now = Date.now()
  const startTime = now - timeRange
  
  const recentMetrics = performanceMetrics.filter(metric => metric.timestamp > startTime)
  const recentRequests = requestMetrics.filter(request => request.timestamp > startTime)
  
  // Request statistics
  const totalRequests = recentRequests.length
  const successfulRequests = recentRequests.filter(r => r.status < 400).length
  const errorRequests = recentRequests.filter(r => r.status >= 400).length
  const avgResponseTime = recentRequests.length > 0 
    ? recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length 
    : 0
  
  // Slow requests (>1000ms)
  const slowRequests = recentRequests.filter(r => r.duration > 1000).length
  
  // Most active paths
  const pathCounts = recentRequests.reduce((acc, r) => {
    acc[r.path] = (acc[r.path] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topPaths = Object.entries(pathCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }))
  
  // Error analysis
  const errorsByStatus = recentRequests
    .filter(r => r.status >= 400)
    .reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<number, number>)
  
  // User activity
  const activeUsers = new Set(recentRequests
    .filter(r => r.userId)
    .map(r => r.userId)
  ).size
  
  // Role-based activity
  const roleActivity = recentRequests
    .filter(r => r.userRole)
    .reduce((acc, r) => {
      acc[r.userRole!] = (acc[r.userRole!] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  return {
    timeRange,
    totalRequests,
    successfulRequests,
    errorRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: Math.round(avgResponseTime),
    slowRequests,
    topPaths,
    errorsByStatus,
    activeUsers,
    roleActivity,
    metrics: {
      requests: recentRequests.length,
      performance: recentMetrics.length
    }
  }
}

export function getUserActivity(userId: string, timeRange: number = 24 * 60 * 60 * 1000) {
  const now = Date.now()
  const startTime = now - timeRange
  
  const userRequests = requestMetrics.filter(request => 
    request.userId === userId && request.timestamp > startTime
  )
  
  if (userRequests.length === 0) {
    return {
      userId,
      timeRange,
      totalRequests: 0,
      uniquePaths: 0,
      avgResponseTime: 0,
      errors: 0,
      lastActivity: null,
      pathActivity: {}
    }
  }
  
  const uniquePaths = new Set(userRequests.map(r => r.path)).size
  const avgResponseTime = userRequests.reduce((sum, r) => sum + r.duration, 0) / userRequests.length
  const errors = userRequests.filter(r => r.status >= 400).length
  const lastActivity = Math.max(...userRequests.map(r => r.timestamp))
  
  const pathActivity = userRequests.reduce((acc, r) => {
    acc[r.path] = (acc[r.path] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    userId,
    timeRange,
    totalRequests: userRequests.length,
    uniquePaths,
    avgResponseTime: Math.round(avgResponseTime),
    errors,
    lastActivity,
    pathActivity
  }
}

// =============================================
// ALERTING
// =============================================

interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  details?: Record<string, any>
}

const alerts: Alert[] = []

export function createAlert(
  severity: Alert['severity'], 
  message: string, 
  details?: Record<string, any>
): string {
  const alert: Alert = {
    id: crypto.randomUUID(),
    severity,
    message,
    timestamp: Date.now(),
    resolved: false,
    details
  }
  
  alerts.push(alert)
  
  // Log alert
  console.warn(`ALERT [${severity.toUpperCase()}]: ${message}`, details)
  
  // In production, send to alerting service (PagerDuty, Slack, etc.)
  if (process.env.NODE_ENV === 'production' && severity === 'critical') {
    // TODO: Send to external alerting service
  }
  
  return alert.id
}

export function resolveAlert(alertId: string) {
  const alert = alerts.find(a => a.id === alertId)
  if (alert && !alert.resolved) {
    alert.resolved = true
    alert.resolvedAt = Date.now()
    console.info(`Alert resolved: ${alert.message}`)
  }
}

export function getActiveAlerts(): Alert[] {
  return alerts.filter(alert => !alert.resolved)
}

export function getAllAlerts(limit: number = 100): Alert[] {
  return alerts
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

// =============================================
// PERFORMANCE MONITORING
// =============================================

export function monitorPerformance() {
  // Monitor response times
  const recentRequests = requestMetrics.slice(-1000) // Last 1000 requests
  if (recentRequests.length > 100) {
    const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length
    const slowRequests = recentRequests.filter(r => r.duration > 2000).length
    const slowRequestRate = slowRequests / recentRequests.length
    
    if (avgResponseTime > 1000) {
      createAlert('medium', `High average response time: ${Math.round(avgResponseTime)}ms`, {
        avgResponseTime,
        requestCount: recentRequests.length
      })
    }
    
    if (slowRequestRate > 0.1) {
      createAlert('high', `High slow request rate: ${(slowRequestRate * 100).toFixed(1)}%`, {
        slowRequests,
        totalRequests: recentRequests.length,
        slowRequestRate
      })
    }
  }
  
  // Monitor error rates
  const recentErrors = recentRequests.filter(r => r.status >= 500)
  const errorRate = recentErrors.length / recentRequests.length
  
  if (errorRate > 0.05) { // 5% error rate
    createAlert('critical', `High error rate: ${(errorRate * 100).toFixed(1)}%`, {
      errors: recentErrors.length,
      totalRequests: recentRequests.length,
      errorRate
    })
  }
}

// Run performance monitoring every 5 minutes
if (process.env.NODE_ENV === 'production') {
  setInterval(monitorPerformance, 5 * 60 * 1000)
}

// =============================================
// EXPORTS
// =============================================

export type { PerformanceMetric, RequestMetric, HealthCheck, Alert }