'use client';

import * as React from 'react';
import { ChevronRight, Building2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useTeamSwitcher } from '@/components/team-switcher';

interface Brand {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface Store {
  id: string;
  name: string;
  brand_id: string;
  is_active: boolean;
}

function BrandTree({ brand, stores }: { brand: Brand; stores: Store[] }) {
  const router = useRouter();
  const activeStores = stores.filter((store) => store.is_active);

  const handleBrandClick = () => {
    router.push(`/brand/${brand.id}/dashboard`);
  };

  const handleStoreClick = (storeId: string) => {
    router.push(`/store/${storeId}/dashboard`);
  };

  const handleAllStoresClick = () => {
    router.push(`/brand/${brand.id}/dashboard`);
  };

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={false}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton onClick={handleBrandClick}>
            <ChevronRight className="transition-transform" />
            <Building2 className="size-4" />
            {brand.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {/* 전체 매장 옵션 */}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton onClick={handleAllStoresClick}>
                <Store className="size-4" />
                전체
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {/* 개별 매장들 */}
            {activeStores.map((store) => (
              <SidebarMenuSubItem key={store.id}>
                <SidebarMenuSubButton onClick={() => handleStoreClick(store.id)}>
                  <Store className="size-4" />
                  {store.name}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function NavFavoritesBrands() {
  const { profile } = useAuth();
  const { selectedTeam } = useTeamSwitcher();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [stores, setStores] = React.useState<Store[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchBrandsAndStores = async () => {
      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // team-switcher가 '전체'가 아닌 경우 표시하지 않음
      if (selectedTeam !== '전체') {
        setBrands([]);
        setStores([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();

        // 운영중인 브랜드 목록 가져오기
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name, code, is_active')
          .eq('company_id', profile.company_id)
          .eq('is_active', true)
          .order('name');

        if (brandsError) {
          console.error('브랜드 데이터 로딩 오류:', brandsError);
          setError('브랜드 데이터를 불러올 수 없습니다.');
          return;
        }

        setBrands(brandsData || []);

        // 모든 브랜드의 매장 목록 가져오기
        if (brandsData && brandsData.length > 0) {
          const brandIds = brandsData.map((brand) => brand.id);
          const { data: storesData, error: storesError } = await supabase
            .from('stores')
            .select('id, name, brand_id, is_active')
            .in('brand_id', brandIds)
            .eq('is_active', true)
            .order('name');

          if (storesError) {
            console.error('매장 데이터 로딩 오류:', storesError);
            setError('매장 데이터를 불러올 수 없습니다.');
            return;
          }

          setStores(storesData || []);
        }
      } catch (err) {
        console.error('데이터 로딩 중 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandsAndStores();
  }, [profile?.company_id, selectedTeam]);

  // team-switcher가 '전체'가 아닌 경우 렌더링하지 않음
  if (selectedTeam !== '전체') {
    return null;
  }

  if (loading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>브랜드 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-muted-foreground">로딩 중...</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (error) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>브랜드 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-red-500">{error}</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (brands.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>브랜드 목록</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-sm text-muted-foreground">운영중인 브랜드가 없습니다.</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>브랜드 목록</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {brands.map((brand) => {
            const brandStores = stores.filter((store) => store.brand_id === brand.id);
            return <BrandTree key={brand.id} brand={brand} stores={brandStores} />;
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
