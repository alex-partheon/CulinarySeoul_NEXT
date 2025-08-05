/**
 * 권한 기반 컴포넌트 보호 컴포넌트
 * 사용자 권한에 따라 자식 컴포넌트를 조건부 렌더링
 */

import { ReactNode } from 'react';
import { usePermissions, useHasPermission, useHasAnyPermission, useHasAllPermissions } from '@/hooks/use-permission';
import type { ERPRole } from '@/types/database.types';

interface ProtectedComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface RoleBasedProps extends ProtectedComponentProps {
  roles: ERPRole[];
  requireAll?: boolean; // true면 모든 역할 필요, false면 하나라도 있으면 됨
}

interface PermissionBasedProps extends ProtectedComponentProps {
  permissions: string[];
  requireAll?: boolean; // true면 모든 권한 필요, false면 하나라도 있으면 됨
}

/**
 * 특정 역할을 가진 사용자만 볼 수 있는 컴포넌트
 */
export function RoleProtected({ children, roles, requireAll = false, fallback = null }: RoleBasedProps) {
  const { profile, loading } = usePermissions();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }
  
  if (!profile) {
    return <>{fallback}</>;
  }
  
  const hasRole = requireAll 
    ? roles.every(role => profile.role === role)
    : roles.includes(profile.role);
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * 특정 권한을 가진 사용자만 볼 수 있는 컴포넌트
 */
export function PermissionProtected({ children, permissions, requireAll = false, fallback = null }: PermissionBasedProps) {
  const { permissions: userPermissions, loading } = usePermissions();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }
  
  if (!userPermissions) {
    return <>{fallback}</>;
  }
  
  const hasPermission = requireAll
    ? permissions.every(permission => userPermissions[permission as keyof typeof userPermissions])
    : permissions.some(permission => userPermissions[permission as keyof typeof userPermissions]);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * 슈퍼 관리자만 볼 수 있는 컴포넌트
 */
export function SuperAdminOnly({ children, fallback = null }: ProtectedComponentProps) {
  return (
    <RoleProtected roles={['super_admin']} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

/**
 * 회사 관리자 이상만 볼 수 있는 컴포넌트
 */
export function CompanyAdminUp({ children, fallback = null }: ProtectedComponentProps) {
  return (
    <RoleProtected roles={['super_admin', 'company_admin']} fallback={fallback}>
      {children}
    </RoleProtected>
  );
}

/**
 * 브랜드 관리자 이상만 볼 수 있는 컴포넌트
 */
export function BrandAdminUp({ children, fallback = null }: ProtectedComponentProps) {
  return (
    <RoleProtected 
      roles={['super_admin', 'company_admin', 'brand_admin']} 
      fallback={fallback}
    >
      {children}
    </RoleProtected>
  );
}

/**
 * 매장 관리자 이상만 볼 수 있는 컴포넌트
 */
export function StoreManagerUp({ children, fallback = null }: ProtectedComponentProps) {
  return (
    <RoleProtected 
      roles={['super_admin', 'company_admin', 'brand_admin', 'store_manager']} 
      fallback={fallback}
    >
      {children}
    </RoleProtected>
  );
}

/**
 * 관리자 권한 (매니저 이상)이 있는 사용자만 볼 수 있는 컴포넌트
 */
export function ManagersOnly({ children, fallback = null }: ProtectedComponentProps) {
  return (
    <RoleProtected 
      roles={['super_admin', 'company_admin', 'brand_admin', 'store_manager']} 
      fallback={fallback}
    >
      {children}
    </RoleProtected>
  );
}

/**
 * 권한 없음 경고 컴포넌트
 */
export function AccessDenied({ message = "이 기능에 접근할 권한이 없습니다." }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V9a3 3 0 10-6 0v3m6 0H9m3 0h3.6a.4.4 0 01.4.4V21a.4.4 0 01-.4.4H4.4a.4.4 0 01-.4-.4v-9.2a.4.4 0 01.4-.4H8" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">접근 권한 없음</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
export function PermissionLoading() {
  return (
    <div className="space-y-3">
      <div className="animate-pulse bg-gray-200 h-8 w-3/4 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded"></div>
      <div className="animate-pulse bg-gray-200 h-4 w-5/6 rounded"></div>
    </div>
  );
}