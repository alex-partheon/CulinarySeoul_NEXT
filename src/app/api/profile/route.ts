import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { authenticateApiRequest } from '@/lib/supabase/auth-api';
import type { Database, ERPRole } from '@/types/database.types';

// Supabase 서비스 클라이언트 (관리자 권한)
const supabase = createServiceClient();

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * 현재 사용자 프로필 조회
 * GET /api/profile
 */
export async function GET() {
  try {
    // Supabase로 현재 사용자 확인
    const { authenticated, user, profile, error } = await authenticateApiRequest();

    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자 프로필 조회 (ERP 관련 정보 포함)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        *,
        company:company_id(id, name, code),
        brand:brand_id(id, name, code),
        store:store_id(id, name, code)
      `,
      )
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('Unexpected error in GET /api/profile:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 사용자 프로필 업데이트
 * PUT /api/profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Supabase로 현재 사용자 확인
    const { authenticated, user, error } = await authenticateApiRequest();

    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 업데이트 가능한 필드만 추출 (ERP 시스템용)
    const allowedFields: (keyof ProfileUpdate)[] = [
      'full_name',
      'avatar_url',
      'phone',
      'additional_permissions',
    ];

    const updateData: ProfileUpdate = {
      updated_at: new Date().toISOString(),
    };

    // 허용된 필드만 업데이트 데이터에 포함
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // 프로필 업데이트
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/profile:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 사용자 역할 변경 (관리자 전용)
 * PATCH /api/profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Supabase로 현재 사용자 확인 (관리자 권한 필요)
    const { authenticated, user, profile, error } = await authenticateApiRequest(['super_admin', 'company_admin']);

    if (!authenticated || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error === 'Insufficient permissions') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 요청 본문 파싱
    const { userId: targetUserId, role, company_id, brand_id, store_id } = await request.json();

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // 유효한 ERP 역할인지 확인
    const validRoles: ERPRole[] = ['super_admin', 'company_admin', 'brand_admin', 'brand_staff', 'store_manager', 'store_staff'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid ERP role' }, { status: 400 });
    }

    // 사용자 역할 및 조직 정보 업데이트
    const updateData: any = {
      role,
      updated_at: new Date().toISOString(),
    };

    // 역할에 따른 조직 정보 설정
    if (company_id) updateData.company_id = company_id;
    if (brand_id) updateData.brand_id = brand_id;
    if (store_id) updateData.store_id = store_id;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'User role updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/profile:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
