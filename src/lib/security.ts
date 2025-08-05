/**
 * CulinarySeoul ERP Security Utilities
 * Production security hardening and monitoring
 */

import { NextRequest, NextResponse } from 'next/server'

// =============================================
// SECURITY HEADERS
// =============================================

export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// =============================================
// RATE LIMITING
// =============================================

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 auth attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 API calls per minute
    skipSuccessfulRequests: false
  },
  global: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
    skipSuccessfulRequests: false
  }
}

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const stored = rateLimitStore.get(key)
  
  if (!stored || now > stored.resetTime) {
    // Reset or create new entry
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: config.maxRequests - 1, resetTime }
  }
  
  if (stored.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: stored.resetTime }
  }
  
  stored.count++
  rateLimitStore.set(key, stored)
  
  return { allowed: true, remaining: config.maxRequests - stored.count, resetTime: stored.resetTime }
}

export function getRateLimitKey(request: NextRequest, type: 'auth' | 'api' | 'global'): string {
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown'
  
  return `${type}:${ip}`
}

// =============================================
// SECURITY MONITORING
// =============================================

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'csrf_attempt' | 'invalid_token'
  timestamp: number
  ip: string
  userAgent: string
  path: string
  details?: Record<string, any>
}

// In-memory store (for production, use proper logging service)
const securityEvents: SecurityEvent[] = []

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now()
  }
  
  securityEvents.push(securityEvent)
  
  // Keep only last 1000 events
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000)
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Security Event:', securityEvent)
  }
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external monitoring service (DataDog, New Relic, etc.)
  }
}

export function getSecurityMetrics() {
  const now = Date.now()
  const last24h = now - (24 * 60 * 60 * 1000)
  
  const recentEvents = securityEvents.filter(event => event.timestamp > last24h)
  
  return {
    totalEvents: recentEvents.length,
    authFailures: recentEvents.filter(e => e.type === 'auth_failure').length,
    rateLimitHits: recentEvents.filter(e => e.type === 'rate_limit').length,
    suspiciousActivity: recentEvents.filter(e => e.type === 'suspicious_activity').length,
    csrfAttempts: recentEvents.filter(e => e.type === 'csrf_attempt').length,
    invalidTokens: recentEvents.filter(e => e.type === 'invalid_token').length
  }
}

// =============================================
// INPUT VALIDATION
// =============================================

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// =============================================
// CSRF PROTECTION
// =============================================

export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken
}

// =============================================
// SECURITY MIDDLEWARE HELPERS
// =============================================

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export function checkRateLimit(request: NextRequest, type: 'auth' | 'api' | 'global'): NextResponse | null {
  const key = getRateLimitKey(request, type)
  const config = RATE_LIMITS[type]
  const result = rateLimit(key, config)
  
  if (!result.allowed) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: key.split(':')[1],
      userAgent: request.headers.get('user-agent') || 'unknown',
      path: request.nextUrl.pathname,
      details: { type, remaining: result.remaining }
    })
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }
  
  return null
}

export function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname
  
  // Basic bot detection
  const suspiciousBots = ['bot', 'crawler', 'spider', 'scraper']
  if (suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot))) {
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      userAgent,
      path,
      details: { reason: 'bot_detected' }
    })
    return true
  }
  
  // Suspicious paths
  const suspiciousPaths = [
    '/wp-admin',
    '/wp-login',
    '/.env',
    '/config',
    '/phpMyAdmin',
    '/admin.php'
  ]
  
  if (suspiciousPaths.some(suspPath => path.includes(suspPath))) {
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      userAgent,
      path,
      details: { reason: 'suspicious_path' }
    })
    return true
  }
  
  return false
}

// =============================================
// AUTHENTICATION SECURITY
// =============================================

export function logAuthFailure(request: NextRequest, reason: string, details?: Record<string, any>) {
  logSecurityEvent({
    type: 'auth_failure',
    ip: request.ip || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    details: { reason, ...details }
  })
}

export function shouldBlockIP(ip: string): boolean {
  const now = Date.now()
  const last1Hour = now - (60 * 60 * 1000)
  
  const recentFailures = securityEvents.filter(event => 
    event.ip === ip && 
    event.type === 'auth_failure' && 
    event.timestamp > last1Hour
  )
  
  // Block IP if more than 10 auth failures in 1 hour
  return recentFailures.length >= 10
}

// =============================================
// CONTENT SECURITY
// =============================================

export function validateFileUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.')
  }
  
  if (file.size > maxSize) {
    errors.push('File size too large. Maximum size is 5MB.')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// =============================================
// AUDIT LOGGING
// =============================================

interface AuditEvent {
  userId?: string
  action: string
  resource: string
  timestamp: number
  ip: string
  userAgent: string
  success: boolean
  details?: Record<string, any>
}

const auditLog: AuditEvent[] = []

export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>) {
  const auditEvent: AuditEvent = {
    ...event,
    timestamp: Date.now()
  }
  
  auditLog.push(auditEvent)
  
  // Keep only last 10000 events
  if (auditLog.length > 10000) {
    auditLog.splice(0, auditLog.length - 10000)
  }
  
  // In production, send to audit logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external audit service
  }
}

export function getAuditLog(filters?: {
  userId?: string
  action?: string
  resource?: string
  startDate?: number
  endDate?: number
}): AuditEvent[] {
  let filtered = auditLog
  
  if (filters) {
    filtered = auditLog.filter(event => {
      if (filters.userId && event.userId !== filters.userId) return false
      if (filters.action && event.action !== filters.action) return false
      if (filters.resource && event.resource !== filters.resource) return false
      if (filters.startDate && event.timestamp < filters.startDate) return false
      if (filters.endDate && event.timestamp > filters.endDate) return false
      return true
    })
  }
  
  return filtered.sort((a, b) => b.timestamp - a.timestamp)
}