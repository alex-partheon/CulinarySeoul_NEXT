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
 * ERP 시스템 - 추천 시스템 불필요
 * GET /api/referrals
 */
export async function GET(request: NextRequest) {
  try {
    // Clerk로 현재 사용자 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ERP 시스템에서는 추천 시스템이 불필요
    return NextResponse.json({ 
      message: 'Referral system not available in ERP system',
      available: false 
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/referrals:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * ERP 시스템 - 추천 수익 생성 불필요
 * POST /api/referrals
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk로 현재 사용자 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ERP 시스템에서는 추천 수익 생성이 불필요
    return NextResponse.json({ 
      message: 'Referral earnings not available in ERP system',
      available: false 
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/referrals:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
