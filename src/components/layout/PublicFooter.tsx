import Link from 'next/link';
import { ChefHat, Mail, Phone, MapPin } from 'lucide-react';

interface PublicFooterProps {
  className?: string;
}

export function PublicFooter({ className }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-gray-50 border-t border-gray-200 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <ChefHat className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-900">
                CulinarySeoul
              </span>
            </Link>
            <p className="text-gray-600 mb-4 max-w-md">
              서울의 미식 문화를 선도하는 종합 요리 관리 시스템입니다. 
              전문적인 재고 관리와 운영 최적화로 여러분의 요리 사업을 지원합니다.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>서울특별시 강남구 테헤란로 123</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>02-1234-5678</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>contact@culinaryseoul.com</span>
              </div>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">서비스</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/inventory" className="hover:text-emerald-600 transition-colors">
                  재고 관리
                </Link>
              </li>
              <li>
                <Link href="/forecast" className="hover:text-emerald-600 transition-colors">
                  수요 예측
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-emerald-600 transition-colors">
                  분석 리포트
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="hover:text-emerald-600 transition-colors">
                  알림 시스템
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">지원</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/help" className="hover:text-emerald-600 transition-colors">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-600 transition-colors">
                  서비스 이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {currentYear} CulinarySeoul. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 mt-2 md:mt-0">
              서울의 미식 문화를 함께 만들어갑니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}