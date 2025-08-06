import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Mail, MapPin, Phone, Github, Linkedin, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-900 text-gray-300">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xl font-bold text-white">CulinarySeoul</span>
            </div>
            <p className="text-sm leading-relaxed">
              서울의 미식 문화를 선도하는 통합 F&B 관리 솔루션. 
              FIFO 재고관리부터 브랜드 분리 지원까지 체계적인 시스템을 제공합니다.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://github.com"
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">제품</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm hover:text-white transition-colors">
                  주요 기능
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm hover:text-white transition-colors">
                  요금제
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-sm hover:text-white transition-colors">
                  고객 사례
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-sm hover:text-white transition-colors">
                  연동 서비스
                </Link>
              </li>
              <li>
                <Link href="/updates" className="text-sm hover:text-white transition-colors">
                  업데이트 소식
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">회사</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm hover:text-white transition-colors">
                  회사 소개
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm hover:text-white transition-colors">
                  채용 정보
                  <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    채용중
                  </Badge>
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-sm hover:text-white transition-colors">
                  언론 보도
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-sm hover:text-white transition-colors">
                  파트너
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-white transition-colors">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">고객 지원</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  서울특별시 성동구 성수동<br />
                  밀랍 성수점 2층
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href="tel:02-1234-5678" className="text-sm hover:text-white transition-colors">
                  02-1234-5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href="mailto:support@culinaryseoul.com" className="text-sm hover:text-white transition-colors">
                  support@culinaryseoul.com
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/support"
                className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                고객센터 바로가기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span>© {currentYear} CulinarySeoul. All rights reserved.</span>
              <span className="hidden sm:inline text-gray-500">•</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                개인정보처리방침
              </Link>
              <span className="hidden sm:inline text-gray-500">•</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                이용약관
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">한국어</span>
              <span className="text-gray-500">|</span>
              <button className="hover:text-white transition-colors">English</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}