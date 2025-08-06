'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-provider';
import { Building2, Globe } from 'lucide-react';

interface Team {
  name: string;
  logo: React.ElementType;
  plan: string;
  id?: string;
  url?: string;
}

// TeamSwitcher Context
interface TeamSwitcherContextType {
  selectedTeam: string | null;
  setSelectedTeam: (team: string) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
}

const TeamSwitcherContext = React.createContext<TeamSwitcherContextType | undefined>(undefined);

export function useTeamSwitcher() {
  const context = React.useContext(TeamSwitcherContext);
  if (context === undefined) {
    throw new Error('useTeamSwitcher must be used within a TeamSwitcherProvider');
  }
  return context;
}

export function TeamSwitcherProvider({ children }: { children: React.ReactNode }) {
  const [selectedTeam, setSelectedTeam] = React.useState<string>('전체');
  const [teams, setTeams] = React.useState<Team[]>([]);

  const value = React.useMemo(
    () => ({
      selectedTeam,
      setSelectedTeam,
      teams,
      setTeams,
    }),
    [selectedTeam, teams],
  );

  return <TeamSwitcherContext.Provider value={value}>{children}</TeamSwitcherContext.Provider>;
}

export function TeamSwitcher({ teams: _initialTeams }: { teams?: Team[] }) {
  const { user } = useAuth();
  const { setSelectedTeam, teams, setTeams } = useTeamSwitcher();
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(null);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  // 실제 브랜드 데이터 가져오기
  React.useEffect(() => {
    const fetchBrands = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 운영중인 브랜드만 가져오기
        const { data: brands, error } = await supabase
          .from('brands')
          .select(
            `
            id,
            name,
            is_active
          `,
          )
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('브랜드 데이터 로딩 오류:', error.message);
          console.error('전체 오류 객체:', error);
          return;
        }

        // 팀 목록 구성 (전체 + 각 브랜드)
        const teamList: Team[] = [
          {
            name: '전체',
            logo: Globe,
            plan: '통합 관리',
            id: 'all',
            url: '/company/dashboard',
          },
        ];

        // 운영중인 브랜드들 추가
        if (brands && brands.length > 0) {
          brands.forEach((brand) => {
            teamList.push({
              name: brand.name,
              logo: Building2,
              plan: '브랜드',
              id: brand.id,
              url: `/brand/${brand.id}/dashboard`,
            });
          });
        }

        setTeams(teamList);
        setActiveTeam(teamList[0]); // 기본값은 "전체"
        setSelectedTeam(teamList[0].name); // context에도 설정
      } catch (error) {
        console.error('브랜드 데이터 가져오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [user, supabase]);

  // 초기 팀 설정
  React.useEffect(() => {
    if (teams.length > 0 && !activeTeam) {
      setActiveTeam(teams[0]);
    }
  }, [teams, activeTeam]);

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="w-fit px-1.5">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
              <Globe className="size-3 animate-pulse" />
            </div>
            <span className="truncate font-medium">로딩중...</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!activeTeam || teams.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <activeTeam.logo className="size-3" />
              </div>
              <span className="truncate font-medium">{activeTeam.name}</span>
              <ChevronDownIcon className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              브랜드 전환
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id || team.name}
                onClick={() => {
                  setActiveTeam(team);
                  setSelectedTeam(team.name); // context 업데이트
                  // 회사 대시보드에서는 페이지 이동하지 않고 사이드바만 변경
                  // 브랜드 대시보드로 이동하려면 사이드바의 "브랜드 대시보드" 메뉴 사용
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            {teams.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2 text-muted-foreground">
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-4" />
                  </div>
                  <div className="font-medium text-xs">{teams.length - 1}개 브랜드 운영중</div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
