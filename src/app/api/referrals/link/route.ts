import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/supabase/auth-api';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

// Supabase 서비스 클라이언트 (관리자 권한)
const supabase = createServiceClient();

/**
 * ERP 시스템 - 추천 링크 불필요
 * GET /api/referrals/link
 */
export async function GET(request: NextRequest) {
  try {
    // Supabase로 현재 사용자 확인
    const { authenticated, user, error } = await authenticateApiRequest();

    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ERP 시스템에서는 추천 링크가 불필요
    return NextResponse.json({ 
      message: 'Referral links not available in ERP system',
      available: false 
    });
  } catch (error) {
    console.error('Error in referral link API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}