import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Supabase 클라이언트 (데이터베이스 전용)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ERP 시스템 - 추천 링크 불필요
 * GET /api/referrals/link
 */
export async function GET(request: NextRequest) {
  try {
    // Clerk로 현재 사용자 확인
    const { userId } = await auth();

    if (!userId) {
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