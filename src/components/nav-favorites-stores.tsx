'use client';

import * as React from 'react';
import { Store, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useTeamSwitcher } from '@/components/team-switcher';

interface Store {
  id: string;
  name: string;
  brand_id: string;
  is_active: boolean;
}

interface Brand {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export function NavFavoritesStores() {
  const { profile } = useAuth();
  const { selectedTeam } = useTeamSwitcher();
  const [stores, setStores] = React.useState<Store[]>([]);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const fetchStoresForBrand = async () => {
      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // team-switcher가 '전체'이거나 null인 경우 표시하지 않음
      if (!selectedTeam || selectedTeam === '전체') {
        setStores([]);
        setSelectedBrand(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        // 선택된 브랜드 정보 가져오기
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('id, name, code, is_active')
          .eq('company_id', profile.company_id)
          .eq('name', selectedTeam)
          .eq('is_active', true)
          .single();

        if (brandError) {
          console.error('브랜드 데이터 로딩 오류:', brandError);
          setError('브랜드 데이터를 불러올 수 없습니다.');
          return;
        }

        setSelectedBrand(brandData);

        // 선택된 브랜드의 매장 목록 가져오기
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, name, brand_id, is_active')
          .eq('brand_id', brandData.id)
          .eq('is_active', true)
          .order('name');

        if (storesError) {
          console.error('매장 데이터 로딩 오류:', storesError);
          setError('매장 데이터를 불러올 수 없습니다.');
          return;
        }

        setStores(storesData || []);
      } catch (err) {
        console.error('데이터 로딩 중 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoresForBrand();
  }, [profile?.company_id, selectedTeam]);

  const handleStoreClick = (storeId: string) => {
    router.push(`/store/${storeId}/dashboard`);
  };

  const handleAllStoresClick = () => {
    if (selectedBrand) {
      router.push(`/brand/${selectedBrand.id}/dashboard`);
    }
  };

  // team-switcher가 '전체'이거나 null인 경우 렌더링하지 않음
  if (!selectedTeam || selectedTeam === '전체') {
    return null;
  }

  if (loading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>매장 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-muted-foreground">로딩 중...</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>매장 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-red-500">{error}</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!selectedBrand) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>매장 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-muted-foreground">브랜드를 선택해주세요.</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{selectedBrand.name} 매장</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* 브랜드 대시보드로 이동 */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => router.push(`/brand/${selectedBrand.id}/dashboard`)}>
              <Building2 className="size-4" />
              {selectedBrand.name} 대시보드
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* 전체 매장 옵션 */}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleAllStoresClick}>
              <Store className="size-4" />
              전체 매장
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* 개별 매장들 */}
          {stores.map((store) => (
            <SidebarMenuItem key={store.id}>
              <SidebarMenuButton onClick={() => handleStoreClick(store.id)}>
                <Store className="size-4" />
                {store.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {stores.length === 0 && (
            <SidebarMenuItem>
              <div className="px-2 py-4 text-sm text-muted-foreground">
                운영중인 매장이 없습니다.
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
