/**
 * Supabase Admin Client
 * RLS를 우회하는 관리자 권한 클라이언트
 * Service Role Key 사용으로 모든 데이터에 접근 가능
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase admin environment variables');
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * RLS 우회 브랜드 데이터 조회 함수
 * 임시 해결책: RLS 함수 문제가 해결될 때까지 사용
 */
export async function getBrandsWithAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select(`
        id,
        company_id,
        name,
        code,
        domain,
        brand_settings,
        separation_readiness,
        is_active,
        created_at,
        updated_at,
        stores:stores(id, name)
      `);

    if (error) {
      console.error('Admin brands query error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Admin brands query exception:', err);
    throw err;
  }
}