# Supabase 데이터베이스 가이드

## 개요

Supabase는 CashUp 프로젝트의 백엔드 서비스로, PostgreSQL 데이터베이스, 실시간 구독, 인증, 스토리지, Edge Functions를 제공합니다. Firebase의 오픈소스 대안으로 SQL 기반의 강력한 데이터베이스 기능을 제공합니다.

### 주요 특징

- **PostgreSQL 기반**: 강력한 관계형 데이터베이스
- **실시간 기능**: 실시간 데이터 구독 및 업데이트
- **Row Level Security (RLS)**: 세밀한 보안 정책
- **자동 API 생성**: 데이터베이스 스키마 기반 REST API
- **타입 안전성**: TypeScript 타입 자동 생성
- **확장성**: 수평적 확장 지원

## 설치 및 설정

### 1. Supabase 클라이언트 설치

```bash
npm install @supabase/supabase-js
npm install -D supabase
```

### 2. 환경 변수 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qcyksavfyzivprsjhuxn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNzUyNjcsImV4cCI6MjA2ODc1MTI2N30.0HAt8Cah3qSJTIedjRFghH819HUaoUoT-444PNamiCM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE3NTI2NywiZXhwIjoyMDY4NzUxMjY3fQ.NRGB109uoMVElzOxhq5LiergzcWRC0uL0nlIBsNGdKY

# 개발 환경
NEXT_PUBLIC_SUPABASE_URL=https://qcyksavfyzivprsjhuxn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeWtzYXZmeXppdnByc2podXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNzUyNjcsImV4cCI6MjA2ODc1MTI2N30.0HAt8Cah3qSJTIedjRFghH819HUaoUoT-444PNamiCM
```

### 3. Supabase 클라이언트 초기화

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// 서버 사이드용 클라이언트 (Service Role)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
```

### 4. 서버 컴포넌트용 클라이언트

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키 설정이 제한될 수 있음
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키 삭제가 제한될 수 있음
          }
        },
      },
    },
  );
}
```

## 데이터베이스 스키마

### 1. 사용자 관련 테이블

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('creator', 'business', 'admin')) NOT NULL,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 크리에이터 상세 정보
CREATE TABLE creator_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  categories TEXT[] DEFAULT '{}',
  instagram_handle TEXT,
  instagram_followers INTEGER DEFAULT 0,
  youtube_handle TEXT,
  youtube_subscribers INTEGER DEFAULT 0,
  tiktok_handle TEXT,
  tiktok_followers INTEGER DEFAULT 0,
  average_rate INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  completed_campaigns INTEGER DEFAULT 0,
  portfolio_items JSONB DEFAULT '[]',
  availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'unavailable')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 비즈니스 상세 정보
CREATE TABLE business_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  company_name TEXT NOT NULL,
  business_type TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large')),
  business_registration_number TEXT,
  tax_id TEXT,
  address TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 캠페인 관련 테이블

```sql
-- 캠페인 테이블
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  deadline DATE NOT NULL,
  location TEXT,
  requirements TEXT[],
  deliverables TEXT[],
  max_applicants INTEGER DEFAULT 10,
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  visibility TEXT CHECK (visibility IN ('public', 'private', 'invited_only')) DEFAULT 'public',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캠페인 지원 테이블
CREATE TABLE campaign_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  proposal TEXT NOT NULL,
  proposed_rate INTEGER,
  estimated_delivery_date DATE,
  portfolio_items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- 캠페인 매칭 테이블
CREATE TABLE campaign_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('matched', 'in_progress', 'completed', 'cancelled')) DEFAULT 'matched',
  agreed_rate INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  deliverables_submitted BOOLEAN DEFAULT FALSE,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  rating_by_business INTEGER CHECK (rating_by_business >= 1 AND rating_by_business <= 5),
  rating_by_creator INTEGER CHECK (rating_by_creator >= 1 AND rating_by_creator <= 5),
  feedback_by_business TEXT,
  feedback_by_creator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);
```

### 3. 결제 관련 테이블

```sql
-- 결제 테이블
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES campaign_matches(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES profiles(id) NOT NULL,
  payee_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'KRW',
  payment_method TEXT,
  toss_payment_key TEXT UNIQUE,
  toss_order_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 정산 테이블
CREATE TABLE settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  bank_account JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. 알림 및 메시징 테이블

```sql
-- 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 메시지 테이블
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'file', 'system')) DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  read_by JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 대화 테이블
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[] NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 타입 정의

### 1. 데이터베이스 타입 생성

```bash
# Supabase CLI로 타입 생성
supabase gen types typescript --project-id your-project-id --schema public > types/database.ts
```

### 2. 커스텀 타입 정의

```typescript
// types/database.ts (생성된 파일에 추가)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          user_type: 'creator' | 'business' | 'admin';
          bio: string | null;
          website: string | null;
          location: string | null;
          phone: string | null;
          is_verified: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type: 'creator' | 'business' | 'admin';
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type?: 'creator' | 'business' | 'admin';
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ... 다른 테이블들
    };
    Views: {
      // 뷰 정의
    };
    Functions: {
      // 함수 정의
    };
    Enums: {
      // 열거형 정의
    };
  };
}

// 편의를 위한 타입 별칭
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];

export type CampaignApplication = Database['public']['Tables']['campaign_applications']['Row'];
export type CampaignMatch = Database['public']['Tables']['campaign_matches']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
```

## 데이터 액세스 레이어

### 1. 기본 CRUD 서비스

```typescript
// lib/supabase/base-service.ts
import { supabase } from './client';
import { Database } from '@/types/database';

export abstract class BaseService<T extends keyof Database['public']['Tables']> {
  protected tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  async findById(id: string) {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  }

  async findMany(
    filters?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { column: string; ascending?: boolean };
    },
  ) {
    let query = supabase.from(this.tableName).select('*');

    // 필터 적용
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // 정렬
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // 페이지네이션
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  }

  async create(data: Database['public']['Tables'][T]['Insert']) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: Database['public']['Tables'][T]['Update']) {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: string) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);

    if (error) throw error;
    return true;
  }
}
```

### 2. 프로필 서비스

```typescript
// lib/supabase/profile-service.ts
import { BaseService } from './base-service';
import { supabase } from './client';
import { Profile, ProfileInsert, ProfileUpdate } from '@/types/database';

export class ProfileService extends BaseService<'profiles'> {
  constructor() {
    super('profiles');
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findCreators(filters?: {
    categories?: string[];
    location?: string;
    minRating?: number;
    availabilityStatus?: string;
  }) {
    let query = supabase
      .from('profiles')
      .select(
        `
        *,
        creator_profiles(*)
      `,
      )
      .eq('user_type', 'creator');

    if (filters?.categories?.length) {
      query = query.contains('creator_profiles.categories', filters.categories);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.minRating) {
      query = query.gte('creator_profiles.rating', filters.minRating);
    }

    if (filters?.availabilityStatus) {
      query = query.eq('creator_profiles.availability_status', filters.availabilityStatus);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async updateCreatorProfile(userId: string, data: any) {
    const { data: result, error } = await supabase
      .from('creator_profiles')
      .upsert({
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateBusinessProfile(userId: string, data: any) {
    const { data: result, error } = await supabase
      .from('business_profiles')
      .upsert({
        id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}

export const profileService = new ProfileService();
```

### 3. 캠페인 서비스

```typescript
// lib/supabase/campaign-service.ts
import { BaseService } from './base-service';
import { supabase } from './client';
import { Campaign, CampaignInsert, CampaignUpdate } from '@/types/database';

export class CampaignService extends BaseService<'campaigns'> {
  constructor() {
    super('campaigns');
  }

  async findActiveCampaigns(filters?: {
    category?: string;
    location?: string;
    minBudget?: number;
    maxBudget?: number;
    tags?: string[];
  }) {
    let query = supabase
      .from('campaigns')
      .select(
        `
        *,
        business_profiles!campaigns_business_id_fkey(
          company_name,
          logo_url
        ),
        campaign_applications(count)
      `,
      )
      .eq('status', 'active')
      .gte('deadline', new Date().toISOString().split('T')[0]);

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.minBudget) {
      query = query.gte('budget', filters.minBudget);
    }

    if (filters?.maxBudget) {
      query = query.lte('budget', filters.maxBudget);
    }

    if (filters?.tags?.length) {
      query = query.overlaps('tags', filters.tags);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findByBusinessId(businessId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        *,
        campaign_applications(
          id,
          creator_id,
          status,
          created_at,
          profiles(
            full_name,
            avatar_url,
            creator_profiles(
              rating,
              completed_campaigns
            )
          )
        )
      `,
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async applyToCampaign(
    campaignId: string,
    creatorId: string,
    applicationData: {
      proposal: string;
      proposed_rate?: number;
      estimated_delivery_date?: string;
      portfolio_items?: any[];
    },
  ) {
    // 이미 지원했는지 확인
    const { data: existing } = await supabase
      .from('campaign_applications')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('creator_id', creatorId)
      .single();

    if (existing) {
      throw new Error('이미 지원한 캠페인입니다.');
    }

    // 캠페인 정보 확인
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status, max_applicants, campaign_applications(count)')
      .eq('id', campaignId)
      .single();

    if (!campaign || campaign.status !== 'active') {
      throw new Error('지원할 수 없는 캠페인입니다.');
    }

    // 최대 지원자 수 확인
    const currentApplicants = campaign.campaign_applications?.[0]?.count || 0;
    if (currentApplicants >= campaign.max_applicants) {
      throw new Error('지원자 수가 마감되었습니다.');
    }

    // 지원서 생성
    const { data, error } = await supabase
      .from('campaign_applications')
      .insert({
        campaign_id: campaignId,
        creator_id: creatorId,
        ...applicationData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateApplicationStatus(
    applicationId: string,
    status: 'accepted' | 'rejected',
    businessId: string,
  ) {
    // 권한 확인
    const { data: application } = await supabase
      .from('campaign_applications')
      .select(
        `
        *,
        campaigns!inner(
          business_id
        )
      `,
      )
      .eq('id', applicationId)
      .single();

    if (!application || application.campaigns.business_id !== businessId) {
      throw new Error('권한이 없습니다.');
    }

    const { data, error } = await supabase
      .from('campaign_applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // 수락된 경우 매칭 생성
    if (status === 'accepted') {
      await this.createMatch(application);
    }

    return data;
  }

  private async createMatch(application: any) {
    const { error } = await supabase.from('campaign_matches').insert({
      campaign_id: application.campaign_id,
      creator_id: application.creator_id,
      business_id: application.campaigns.business_id,
      agreed_rate: application.proposed_rate,
      start_date: new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
  }
}

export const campaignService = new CampaignService();
```

## 실시간 기능

### 1. 실시간 구독 훅

```typescript
// hooks/use-realtime.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription<T>(
  table: string,
  filter?: { column: string; value: any },
  initialData?: T[],
) {
  const [data, setData] = useState<T[]>(initialData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // 초기 데이터 로드
        let query = supabase.from(table).select('*');

        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data: initialData, error: initialError } = await query;

        if (initialError) throw initialError;

        setData(initialData || []);
        setLoading(false);

        // 실시간 구독 설정
        channel = supabase
          .channel(`${table}_changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
            },
            (payload) => {
              console.log('Realtime update:', payload);

              switch (payload.eventType) {
                case 'INSERT':
                  setData((prev) => [...prev, payload.new as T]);
                  break;
                case 'UPDATE':
                  setData((prev) =>
                    prev.map((item) =>
                      (item as any).id === payload.new.id ? (payload.new as T) : item,
                    ),
                  );
                  break;
                case 'DELETE':
                  setData((prev) => prev.filter((item) => (item as any).id !== payload.old.id));
                  break;
              }
            },
          )
          .subscribe();
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading, error };
}
```

### 2. 알림 실시간 구독

```typescript
// hooks/use-notifications.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Notification } from '@/types/database';
import { useUser } from '@clerk/nextjs';

export function useNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // 초기 알림 로드
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    };

    loadNotifications();

    // 실시간 구독
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // 브라우저 알림 (권한이 있는 경우)
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192x192.png',
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)),
          );

          if (updatedNotification.read && !payload.old.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', user?.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })),
      );
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
```

## Row Level Security (RLS)

### 1. 기본 보안 정책

```sql
-- 프로필 테이블 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 모든 사용자는 다른 사용자의 공개 정보 조회 가능
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 캠페인 테이블 RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 비즈니스는 자신의 캠페인만 생성/수정/삭제 가능
CREATE POLICY "Business can manage own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = business_id);

-- 활성 캠페인은 모든 사용자가 조회 가능
CREATE POLICY "Active campaigns are viewable by everyone" ON campaigns
  FOR SELECT USING (status = 'active' OR auth.uid() = business_id);

-- 캠페인 지원 테이블 RLS
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

-- 크리에이터는 자신의 지원서만 생성/조회 가능
CREATE POLICY "Creators can manage own applications" ON campaign_applications
  FOR ALL USING (auth.uid() = creator_id);

-- 비즈니스는 자신의 캠페인 지원서 조회/수정 가능
CREATE POLICY "Business can view applications for own campaigns" ON campaign_applications
  FOR SELECT USING (
    auth.uid() IN (
      SELECT business_id FROM campaigns WHERE id = campaign_id
    )
  );

CREATE POLICY "Business can update applications for own campaigns" ON campaign_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT business_id FROM campaigns WHERE id = campaign_id
    )
  );
```

### 2. 고급 보안 정책

```sql
-- 알림 테이블 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회/수정 가능
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 메시지 테이블 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 대화 참여자만 메시지 조회/생성 가능
CREATE POLICY "Conversation participants can view messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT unnest(participants) FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Conversation participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT unnest(participants) FROM conversations WHERE id = conversation_id
    )
  );

-- 결제 테이블 RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 결제 당사자만 결제 정보 조회 가능
CREATE POLICY "Payment parties can view payments" ON payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id);

-- 관리자 정책
CREATE POLICY "Admins can view all data" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE user_type = 'admin'
    )
  );
```

## 데이터베이스 함수

### 1. 사용자 통계 함수

```sql
-- 크리에이터 통계 조회 함수
CREATE OR REPLACE FUNCTION get_creator_stats(creator_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_campaigns', COUNT(cm.id),
    'completed_campaigns', COUNT(cm.id) FILTER (WHERE cm.status = 'completed'),
    'total_earnings', COALESCE(SUM(cm.agreed_rate) FILTER (WHERE cm.status = 'completed'), 0),
    'average_rating', COALESCE(AVG(cm.rating_by_business) FILTER (WHERE cm.rating_by_business IS NOT NULL), 0),
    'pending_payments', COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'pending'), 0)
  ) INTO result
  FROM campaign_matches cm
  LEFT JOIN payments p ON p.match_id = cm.id
  WHERE cm.creator_id = creator_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비즈니스 통계 조회 함수
CREATE OR REPLACE FUNCTION get_business_stats(business_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_campaigns', COUNT(c.id),
    'active_campaigns', COUNT(c.id) FILTER (WHERE c.status = 'active'),
    'completed_campaigns', COUNT(c.id) FILTER (WHERE c.status = 'completed'),
    'total_spent', COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0),
    'total_applications', COUNT(ca.id),
    'pending_applications', COUNT(ca.id) FILTER (WHERE ca.status = 'pending')
  ) INTO result
  FROM campaigns c
  LEFT JOIN campaign_applications ca ON ca.campaign_id = c.id
  LEFT JOIN campaign_matches cm ON cm.campaign_id = c.id
  LEFT JOIN payments p ON p.match_id = cm.id
  WHERE c.business_id = business_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. 검색 함수

```sql
-- 캠페인 검색 함수 (전문 검색)
CREATE OR REPLACE FUNCTION search_campaigns(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  min_budget INTEGER DEFAULT NULL,
  max_budget INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  budget INTEGER,
  location TEXT,
  deadline DATE,
  business_name TEXT,
  business_logo TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.category,
    c.budget,
    c.location,
    c.deadline,
    bp.company_name as business_name,
    bp.logo_url as business_logo,
    ts_rank(to_tsvector('korean', c.title || ' ' || c.description), plainto_tsquery('korean', search_query)) as rank
  FROM campaigns c
  JOIN business_profiles bp ON bp.id = c.business_id
  WHERE
    c.status = 'active' AND
    c.deadline >= CURRENT_DATE AND
    (search_query IS NULL OR to_tsvector('korean', c.title || ' ' || c.description) @@ plainto_tsquery('korean', search_query)) AND
    (category_filter IS NULL OR c.category = category_filter) AND
    (location_filter IS NULL OR c.location ILIKE '%' || location_filter || '%') AND
    (min_budget IS NULL OR c.budget >= min_budget) AND
    (max_budget IS NULL OR c.budget <= max_budget)
  ORDER BY rank DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### 3. 트리거 함수

```sql
-- 프로필 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_applications_updated_at BEFORE UPDATE ON campaign_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 캠페인 매칭 생성 시 알림 발송
CREATE OR REPLACE FUNCTION notify_campaign_match()
RETURNS TRIGGER AS $$
BEGIN
  -- 크리에이터에게 알림
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.creator_id,
    'campaign_matched',
    '캠페인 매칭 완료',
    '새로운 캠페인에 매칭되었습니다.',
    json_build_object('campaign_id', NEW.campaign_id, 'match_id', NEW.id)
  );

  -- 비즈니스에게 알림
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.business_id,
    'campaign_matched',
    '크리에이터 매칭 완료',
    '캠페인에 크리에이터가 매칭되었습니다.',
    json_build_object('campaign_id', NEW.campaign_id, 'match_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_match_notification AFTER INSERT ON campaign_matches
  FOR EACH ROW EXECUTE FUNCTION notify_campaign_match();
```

## 성능 최적화

### 1. 인덱스 생성

```sql
-- 자주 조회되는 컬럼에 인덱스 생성
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_campaigns_deadline ON campaigns(deadline);
CREATE INDEX idx_campaigns_location ON campaigns USING gin(to_tsvector('korean', location));

CREATE INDEX idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX idx_campaign_applications_creator_id ON campaign_applications(creator_id);
CREATE INDEX idx_campaign_applications_status ON campaign_applications(status);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 복합 인덱스
CREATE INDEX idx_campaigns_status_deadline ON campaigns(status, deadline);
CREATE INDEX idx_campaign_applications_campaign_creator ON campaign_applications(campaign_id, creator_id);

-- 전문 검색 인덱스
CREATE INDEX idx_campaigns_search ON campaigns USING gin(to_tsvector('korean', title || ' ' || description));
CREATE INDEX idx_creator_profiles_categories ON creator_profiles USING gin(categories);
```

### 2. 쿼리 최적화

```typescript
// lib/supabase/optimized-queries.ts
import { supabase } from './client';

// 페이지네이션과 함께 캠페인 조회 (최적화된 버전)
export async function getOptimizedCampaigns({
  page = 1,
  limit = 20,
  category,
  location,
  minBudget,
  maxBudget,
}: {
  page?: number;
  limit?: number;
  category?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
} = {}) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('campaigns')
    .select(
      `
      id,
      title,
      description,
      category,
      budget,
      location,
      deadline,
      created_at,
      business_profiles!campaigns_business_id_fkey(
        company_name,
        logo_url
      )
    `,
      { count: 'exact' },
    )
    .eq('status', 'active')
    .gte('deadline', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // 조건부 필터 적용
  if (category) query = query.eq('category', category);
  if (location) query = query.ilike('location', `%${location}%`);
  if (minBudget) query = query.gte('budget', minBudget);
  if (maxBudget) query = query.lte('budget', maxBudget);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

// 크리에이터 대시보드 데이터 (한 번의 쿼리로 모든 정보 조회)
export async function getCreatorDashboardData(creatorId: string) {
  const { data, error } = await supabase.rpc('get_creator_dashboard', {
    creator_user_id: creatorId,
  });

  if (error) throw error;
  return data;
}

// 비즈니스 대시보드 데이터
export async function getBusinessDashboardData(businessId: string) {
  const { data, error } = await supabase.rpc('get_business_dashboard', {
    business_user_id: businessId,
  });

  if (error) throw error;
  return data;
}
```

### 3. 캐싱 전략

```typescript
// lib/supabase/cache.ts
import { LRUCache } from 'lru-cache';

// 메모리 캐시
const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5분
});

// 캐시 키 생성
function generateCacheKey(table: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, any>,
    );

  return `${table}:${JSON.stringify(sortedParams)}`;
}

// 캐시된 쿼리 실행
export async function cachedQuery<T>(
  table: string,
  queryFn: () => Promise<T>,
  params: Record<string, any> = {},
  ttl?: number,
): Promise<T> {
  const cacheKey = generateCacheKey(table, params);

  // 캐시에서 확인
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 쿼리 실행
  const result = await queryFn();

  // 캐시에 저장
  cache.set(cacheKey, result, { ttl });

  return result;
}

// 캐시 무효화
export function invalidateCache(pattern: string) {
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

// 사용 예시
export async function getCachedCampaigns(filters: any) {
  return cachedQuery(
    'campaigns',
    () => getOptimizedCampaigns(filters),
    filters,
    1000 * 60 * 2, // 2분 캐시
  );
}
```

## 문제 해결 가이드

### 1. 일반적인 문제

| 문제             | 원인          | 해결방법                 |
| ---------------- | ------------- | ------------------------ |
| 연결 오류        | 잘못된 URL/키 | 환경 변수 확인           |
| RLS 정책 오류    | 권한 부족     | 정책 규칙 검토           |
| 타입 오류        | 스키마 불일치 | 타입 재생성              |
| 성능 저하        | 인덱스 부족   | 쿼리 분석 및 인덱스 추가 |
| 실시간 구독 실패 | 네트워크 문제 | 재연결 로직 구현         |

### 2. 디버깅 도구

```typescript
// lib/supabase/debug.ts
export function enableQueryLogging() {
  if (process.env.NODE_ENV === 'development') {
    // Supabase 쿼리 로깅
    const originalFrom = supabase.from;
    supabase.from = function (table: string) {
      const query = originalFrom.call(this, table);
      const originalSelect = query.select;

      query.select = function (...args: any[]) {
        console.log(`🔍 [SUPABASE] SELECT from ${table}:`, args);
        return originalSelect.apply(this, args);
      };

      return query;
    };
  }
}

export function logQueryPerformance<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
  const start = performance.now();

  return queryFn().then((result) => {
    const end = performance.now();
    console.log(`⏱️ [QUERY] ${queryName}: ${(end - start).toFixed(2)}ms`);
    return result;
  });
}
```

## 모범 사례

### 1. 데이터 모델링

- **정규화**: 데이터 중복 최소화
- **인덱스**: 자주 조회되는 컬럼에 인덱스 생성
- **타입 안전성**: TypeScript 타입 활용
- **제약 조건**: 데이터 무결성 보장

### 2. 보안

- **RLS 정책**: 세밀한 접근 제어
- **입력 검증**: SQL 인젝션 방지
- **민감 정보**: 암호화 저장
- **감사 로그**: 중요 작업 기록

### 3. 성능

- **쿼리 최적화**: 필요한 컬럼만 조회
- **페이지네이션**: 대량 데이터 처리
- **캐싱**: 자주 조회되는 데이터 캐시
- **연결 풀링**: 연결 재사용

### 4. 유지보수

- **마이그레이션**: 스키마 변경 관리
- **백업**: 정기적인 데이터 백업
- **모니터링**: 성능 및 오류 추적
- **문서화**: 스키마 및 정책 문서화

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**작성일**: 2024년 12월
**버전**: 1.0
**담당자**: CashUp 개발팀
