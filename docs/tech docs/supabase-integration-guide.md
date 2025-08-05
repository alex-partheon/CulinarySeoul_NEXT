# Supabase 통합 가이드

## 개요

Supabase는 CashUp 프로젝트의 백엔드 인프라를 담당하는 오픈소스 Firebase 대안입니다. 인증, 데이터베이스, 실시간 기능, 스토리지를 제공하며, PostgreSQL 기반의 강력한 기능을 활용할 수 있습니다.

## 설치 및 환경 설정

### 기본 설치

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react
```

### 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qcyksavfyzivprsjhuxn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.exxxxxxxxxxxxxxx1MTI2N30.0HAt8Cah3qSJTIedjRFxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE3NTI2NywiZXhwIjoyMDY4NzUxxxxxxxxxxxxxx

```

### Supabase 클라이언트 설정

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const createClient = () => createClientComponentClient<Database>();

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

// lib/supabase/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}
```

## 데이터베이스 설계 및 관리

### 1. 테이블 스키마 정의

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'business', 'admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 크리에이터 테이블
CREATE TABLE creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  category TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '{}',
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캠페인 테이블
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 추천 시스템 테이블
CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  level INTEGER CHECK (level IN (1, 2, 3)) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- 페이지 빌더 블록 테이블
CREATE TABLE page_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Row Level Security (RLS) 정책

```sql
-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 크리에이터 정책
CREATE POLICY "Anyone can view verified creators" ON creators
  FOR SELECT USING (verified = true);

CREATE POLICY "Creators can manage own data" ON creators
  FOR ALL USING (auth.uid() = user_id);

-- 캠페인 정책
CREATE POLICY "Businesses can manage own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "Creators can view active campaigns" ON campaigns
  FOR SELECT USING (status = 'active');

-- 추천 정책
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 페이지 블록 정책
CREATE POLICY "Creators can manage own blocks" ON page_blocks
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM creators WHERE id = creator_id)
  );

CREATE POLICY "Anyone can view active blocks" ON page_blocks
  FOR SELECT USING (is_active = true);
```

### 3. 데이터베이스 함수 및 트리거

```sql
-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사용자 생성 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 추천 수수료 계산 함수
CREATE OR REPLACE FUNCTION calculate_referral_commission(
  referred_user_id UUID,
  transaction_amount DECIMAL
)
RETURNS TABLE(referrer_id UUID, level INTEGER, commission DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE referral_chain AS (
    -- 1단계 추천인
    SELECT r.referrer_id, r.referred_id, 1 as level, r.commission_rate
    FROM referrals r
    WHERE r.referred_id = referred_user_id

    UNION ALL

    -- 2-3단계 추천인
    SELECT r.referrer_id, r.referred_id, rc.level + 1, r.commission_rate
    FROM referrals r
    JOIN referral_chain rc ON r.referred_id = rc.referrer_id
    WHERE rc.level < 3
  )
  SELECT
    rc.referrer_id,
    rc.level,
    (transaction_amount * rc.commission_rate / 100) as commission
  FROM referral_chain rc;
END;
$$ LANGUAGE plpgsql;
```

## 인증 시스템

### 1. 인증 설정

```typescript
// lib/auth.ts
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = createServerClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('프로필을 가져올 수 없습니다');
  }

  return profile;
}
```

### 2. 로그인/회원가입 컴포넌트

```tsx
// components/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <button type="button" onClick={handleGoogleLogin} className="btn-secondary w-full">
        Google로 로그인
      </button>
    </form>
  );
}
```

### 3. 인증 콜백 처리

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard');
}
```

## 데이터 조작 및 쿼리

### 1. 기본 CRUD 작업

```typescript
// lib/api/creators.ts
import { createServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

type Creator = Database['public']['Tables']['creators']['Row'];
type CreateCreator = Database['public']['Tables']['creators']['Insert'];
type UpdateCreator = Database['public']['Tables']['creators']['Update'];

export async function getCreators(filters?: {
  category?: string;
  verified?: boolean;
  limit?: number;
}) {
  const supabase = createServerClient();

  let query = supabase.from('creators').select(`
      *,
      profiles!inner(
        full_name,
        avatar_url
      )
    `);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.verified !== undefined) {
    query = query.eq('verified', filters.verified);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error('크리에이터 목록을 가져올 수 없습니다');
  }

  return data;
}

export async function getCreatorById(id: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('creators')
    .select(
      `
      *,
      profiles!inner(
        full_name,
        avatar_url,
        email
      ),
      page_blocks(
        id,
        block_type,
        content,
        order_index
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error('크리에이터를 찾을 수 없습니다');
  }

  return data;
}

export async function createCreator(creatorData: CreateCreator) {
  const supabase = createServerClient();

  const { data, error } = await supabase.from('creators').insert(creatorData).select().single();

  if (error) {
    throw new Error('크리에이터 생성에 실패했습니다');
  }

  return data;
}

export async function updateCreator(id: string, updates: UpdateCreator) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('creators')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error('크리에이터 업데이트에 실패했습니다');
  }

  return data;
}
```

### 2. 복잡한 쿼리 및 조인

```typescript
// lib/api/campaigns.ts
export async function getCampaignsWithMatching(creatorId: string) {
  const supabase = createServerClient();

  // 크리에이터 정보 가져오기
  const { data: creator } = await supabase
    .from('creators')
    .select('category, followers_count')
    .eq('id', creatorId)
    .single();

  if (!creator) {
    throw new Error('크리에이터를 찾을 수 없습니다');
  }

  // AI 매칭을 위한 캠페인 조회
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      profiles!inner(
        full_name,
        avatar_url
      )
    `,
    )
    .eq('status', 'active')
    .contains('requirements', { category: creator.category })
    .gte('requirements->min_followers', creator.followers_count);

  if (error) {
    throw new Error('캠페인 목록을 가져올 수 없습니다');
  }

  return campaigns;
}

// 추천 시스템 데이터 조회
export async function getReferralTree(userId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('get_referral_tree', {
    user_id: userId,
  });

  if (error) {
    throw new Error('추천 트리를 가져올 수 없습니다');
  }

  return data;
}
```

### 3. 실시간 구독

```typescript
// hooks/use-realtime-campaigns.ts
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

export function useRealtimeCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 초기 데이터 로드
    const loadCampaigns = async () => {
      const { data } = await supabase.from('campaigns').select('*').eq('status', 'active');

      if (data) {
        setCampaigns(data);
      }
      setLoading(false);
    };

    loadCampaigns();

    // 실시간 구독 설정
    const subscription = supabase
      .channel('campaigns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: 'status=eq.active',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCampaigns((prev) => [...prev, payload.new as Campaign]);
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns((prev) =>
              prev.map((campaign) =>
                campaign.id === payload.new.id ? (payload.new as Campaign) : campaign,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setCampaigns((prev) => prev.filter((campaign) => campaign.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { campaigns, loading };
}
```

## 파일 스토리지

### 1. 스토리지 설정

```typescript
// lib/storage.ts
import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'cashup-assets';

export async function uploadFile(
  file: File,
  path: string,
  options?: {
    cacheControl?: string;
    contentType?: string;
  },
) {
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: options?.cacheControl || '3600',
    upsert: true,
    contentType: options?.contentType || file.type,
  });

  if (error) {
    throw new Error('파일 업로드에 실패했습니다');
  }

  return data;
}

export async function getPublicUrl(path: string) {
  const supabase = createClient();

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteFile(path: string) {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    throw new Error('파일 삭제에 실패했습니다');
  }
}
```

### 2. 이미지 업로드 컴포넌트

```tsx
// components/image-upload.tsx
'use client';

import { useState } from 'react';
import { uploadFile, getPublicUrl } from '@/lib/storage';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  folder?: string;
}

export function ImageUpload({ onUpload, currentImage, folder = 'images' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    setUploading(true);

    try {
      // 미리보기 설정
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 파일 업로드
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${folder}/${fileName}`;

      await uploadFile(file, filePath);
      const publicUrl = await getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(undefined);
    onUpload('');
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="미리보기" className="w-32 h-32 object-cover rounded-lg border" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">
            {uploading ? '업로드 중...' : '이미지 선택'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
```

## CashUp 특화 기능

### 1. AI 매칭 시스템

```typescript
// lib/ai-matching.ts
import { createServerClient } from '@/lib/supabase/server';

interface MatchingCriteria {
  category: string;
  minFollowers: number;
  maxBudget: number;
  keywords: string[];
}

export async function findMatchingCreators(criteria: MatchingCriteria) {
  const supabase = createServerClient();

  // 기본 필터링
  let query = supabase
    .from('creators')
    .select(
      `
      *,
      profiles!inner(full_name, avatar_url)
    `,
    )
    .eq('category', criteria.category)
    .gte('followers_count', criteria.minFollowers)
    .eq('verified', true);

  const { data: creators, error } = await query;

  if (error) {
    throw new Error('매칭 크리에이터 검색 실패');
  }

  // AI 점수 계산 (Google Gemini 연동)
  const scoredCreators = await Promise.all(
    creators.map(async (creator) => {
      const score = await calculateMatchingScore(creator, criteria);
      return { ...creator, matchingScore: score };
    }),
  );

  // 점수순 정렬
  return scoredCreators.sort((a, b) => b.matchingScore - a.matchingScore).slice(0, 10); // 상위 10명
}

async function calculateMatchingScore(creator: any, criteria: MatchingCriteria) {
  // 팔로워 수 점수 (0-30점)
  const followerScore = Math.min(30, (creator.followers_count / criteria.minFollowers) * 30);

  // 카테고리 일치 점수 (0-40점)
  const categoryScore = creator.category === criteria.category ? 40 : 0;

  // 키워드 매칭 점수 (0-30점)
  const keywordScore = calculateKeywordScore(creator.bio, criteria.keywords);

  return followerScore + categoryScore + keywordScore;
}

function calculateKeywordScore(bio: string, keywords: string[]): number {
  if (!bio) return 0;

  const bioLower = bio.toLowerCase();
  const matchedKeywords = keywords.filter((keyword) => bioLower.includes(keyword.toLowerCase()));

  return (matchedKeywords.length / keywords.length) * 30;
}
```

### 2. 3단계 추천 시스템

```typescript
// lib/referral-system.ts
export async function processReferralCommission(
  transactionId: string,
  userId: string,
  amount: number,
) {
  const supabase = createServerClient();

  // 추천 체인 조회
  const { data: referralChain } = await supabase.rpc('calculate_referral_commission', {
    referred_user_id: userId,
    transaction_amount: amount,
  });

  if (!referralChain || referralChain.length === 0) {
    return [];
  }

  // 각 레벨별 수수료 지급
  const commissions = [];

  for (const referral of referralChain) {
    const { data: commission } = await supabase
      .from('commissions')
      .insert({
        transaction_id: transactionId,
        referrer_id: referral.referrer_id,
        referred_id: userId,
        level: referral.level,
        amount: referral.commission,
        status: 'pending',
      })
      .select()
      .single();

    commissions.push(commission);

    // 추천인 총 수익 업데이트
    await supabase
      .from('referrals')
      .update({
        total_earnings: supabase.raw(`total_earnings + ${referral.commission}`),
      })
      .eq('referrer_id', referral.referrer_id)
      .eq('referred_id', userId);
  }

  return commissions;
}
```

### 3. 페이지 빌더 시스템

```typescript
// lib/page-builder.ts
export async function savePageBlocks(creatorId: string, blocks: any[]) {
  const supabase = createServerClient();

  // 기존 블록 삭제
  await supabase.from('page_blocks').delete().eq('creator_id', creatorId);

  // 새 블록 저장
  const { data, error } = await supabase
    .from('page_blocks')
    .insert(
      blocks.map((block, index) => ({
        creator_id: creatorId,
        block_type: block.type,
        content: block.content,
        order_index: index,
        is_active: true,
      })),
    )
    .select();

  if (error) {
    throw new Error('페이지 블록 저장 실패');
  }

  return data;
}

export async function getCreatorPage(creatorId: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('page_blocks')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_active', true)
    .order('order_index');

  if (error) {
    throw new Error('페이지 블록 조회 실패');
  }

  return data;
}
```

## 성능 최적화

### 1. 쿼리 최적화

```typescript
// 인덱스 생성
-- 성능 향상을 위한 인덱스
CREATE INDEX idx_creators_category ON creators(category);
CREATE INDEX idx_creators_verified ON creators(verified);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_page_blocks_creator ON page_blocks(creator_id, order_index);

-- 복합 인덱스
CREATE INDEX idx_creators_category_verified ON creators(category, verified);
CREATE INDEX idx_campaigns_status_dates ON campaigns(status, start_date, end_date);
```

### 2. 캐싱 전략

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedCreators = unstable_cache(
  async (category?: string) => {
    return getCreators({ category, verified: true });
  },
  ['creators'],
  {
    revalidate: 300, // 5분 캐시
    tags: ['creators'],
  },
);

export const getCachedCampaigns = unstable_cache(
  async () => {
    return getCampaigns({ status: 'active' });
  },
  ['campaigns'],
  {
    revalidate: 60, // 1분 캐시
    tags: ['campaigns'],
  },
);
```

## 보안 고려사항

### 1. 데이터 검증

```typescript
// lib/validation.ts
import { z } from 'zod';

export const createCreatorSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
  category: z.enum(['beauty', 'fashion', 'lifestyle', 'tech', 'food']),
  social_links: z
    .object({
      instagram: z.string().url().optional(),
      youtube: z.string().url().optional(),
      tiktok: z.string().url().optional(),
    })
    .optional(),
});

export const createCampaignSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  budget: z.number().min(10000).max(10000000),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  requirements: z.object({
    category: z.string(),
    min_followers: z.number().min(1000),
    age_range: z.array(z.number()).optional(),
  }),
});
```

### 2. API 보안

```typescript
// app/api/creators/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createCreatorSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 요청 데이터 검증
    const body = await request.json();
    const validatedData = createCreatorSchema.parse(body);

    // 중복 사용자명 확인
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('username', validatedData.username)
      .single();

    if (existingCreator) {
      return NextResponse.json({ error: '이미 사용 중인 사용자명입니다' }, { status: 400 });
    }

    // 크리에이터 생성
    const { data: creator, error } = await supabase
      .from('creators')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '크리에이터 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
```

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
