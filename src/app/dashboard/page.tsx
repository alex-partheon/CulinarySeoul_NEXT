'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { ERPRole } from '@/types/database.types';
import { getDefaultDashboardPath, isValidERPRole } from '@/lib/middleware-utils';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string | null;
}

export default function Dashboard() {
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, profile, loading, signOut, getDefaultDashboard, redirectToDashboard } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // ERP 역할에 따라 적절한 대시보드로 리다이렉트
    if (profile && profile.role) {
      const userRole = profile.role as ERPRole;
      if (isValidERPRole(userRole)) {
        const dashboardPath = getDefaultDashboard();
        if (dashboardPath !== '/auth/signin') {
          router.push(dashboardPath);
          return;
        }
      }
    }
  }, [loading, user, profile, router, getDefaultDashboard]);

  const handleSignOut = async () => {
    await signOut();
    // signOut already redirects to home page
  };

  const handleRoleSelection = async (selectedRole: ERPRole) => {
    if (!profile) return;

    try {
      // Supabase 클라이언트 생성
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', profile.id);

      if (error) {
        setError('역할 업데이트 중 오류가 발생했습니다.');
        console.error('Role update error:', error);
        return;
      }

      // Use auth provider's redirect function
      redirectToDashboard();
    } catch (err) {
      console.error('Role update error:', err);
      setError('역할 업데이트 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  // 역할이 설정되지 않은 경우 역할 선택 화면 표시
  if (profile && !profile.role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">역할 선택</h1>
            <p className="text-gray-600">CulinarySeoul ERP에서 어떤 역할로 활동하시겠습니까?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleRoleSelection('super_admin')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">슈퍼 관리자</h3>
              <p className="text-sm text-gray-600">전체 시스템 관리 및 모든 권한을 가집니다.</p>
            </button>

            <button
              onClick={() => handleRoleSelection('company_admin')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">회사 관리자</h3>
              <p className="text-sm text-gray-600">회사 전체의 브랜드와 매장을 관리합니다.</p>
            </button>

            <button
              onClick={() => handleRoleSelection('brand_admin')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">브랜드 관리자</h3>
              <p className="text-sm text-gray-600">특정 브랜드의 매장들을 관리합니다.</p>
            </button>

            <button
              onClick={() => handleRoleSelection('brand_staff')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">브랜드 직원</h3>
              <p className="text-sm text-gray-600">브랜드 운영 업무를 담당합니다.</p>
            </button>

            <button
              onClick={() => handleRoleSelection('store_manager')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">매장 관리자</h3>
              <p className="text-sm text-gray-600">매장 운영 및 직원을 관리합니다.</p>
            </button>

            <button
              onClick={() => handleRoleSelection('store_staff')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-500 hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-1">매장 직원</h3>
              <p className="text-sm text-gray-600">매장에서 업무를 담당합니다.</p>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 기본 대시보드 (역할이 있지만 특정 대시보드로 리다이렉트되지 않은 경우)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">대시보드</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">안녕하세요, {profile?.full_name}님</span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">환영합니다!</h2>
          <p className="text-gray-600 mb-4">
            CulinarySeoul ERP에 오신 것을 환영합니다. 아래 링크를 통해 원하는 기능을 이용해보세요.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/company/dashboard')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">회사 대시보드</h3>
              <p className="text-sm text-gray-600 mt-1">회사 전체 현황을 확인해보세요</p>
            </button>
            
            <button 
              onClick={() => router.push('/brand/dashboard')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">브랜드 대시보드</h3>
              <p className="text-sm text-gray-600 mt-1">브랜드 관련 기능을 이용해보세요</p>
            </button>
            
            <button 
              onClick={() => router.push('/store/dashboard')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">매장 대시보드</h3>
              <p className="text-sm text-gray-600 mt-1">매장 운영 기능을 이용해보세요</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}