'use client';

import Link from 'next/link';
import { ExternalLink, HelpCircle, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardFooterProps {
  className?: string;
}

export function DashboardFooter({ className }: DashboardFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-white border-t', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* 왼쪽: 회사 정보 */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                CS
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                CulinarySeoul ERP
              </span>
            </div>
            
            <div className="text-xs text-gray-500 text-center md:text-left">
              © {currentYear} CulinarySeoul. All rights reserved.
            </div>
          </div>

          {/* 가운데: 도움말 링크 */}
          <div className="flex items-center space-x-4 text-sm">
            <Link 
              href="/help" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              도움말
            </Link>
            
            <Link 
              href="/support" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4 mr-1" />
              고객지원
            </Link>
            
            <a 
              href="tel:02-1234-5678" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Phone className="h-4 w-4 mr-1" />
              02-1234-5678
            </a>
          </div>

          {/* 오른쪽: 버전 정보 */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <span>버전 1.0.0</span>
            </div>
            
            <Link 
              href="/changelog" 
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              업데이트 내역
            </Link>
          </div>
        </div>

        {/* 하단: 추가 정보 (모바일에서는 숨김) */}
        <div className="hidden lg:block mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <div className="flex space-x-6">
              <span>서울특별시 강남구 테헤란로 123</span>
              <span>사업자등록번호: 123-45-67890</span>
              <span>대표: 김대표</span>
            </div>
            
            <div className="flex space-x-4">
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="hover:text-gray-600 transition-colors">
                이용약관
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}