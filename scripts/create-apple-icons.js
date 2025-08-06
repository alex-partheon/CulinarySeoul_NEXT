#!/usr/bin/env node

/**
 * Apple Touch Icon 생성 스크립트
 * CulinarySeoul 브랜드 색상으로 간단한 아이콘 생성
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// CulinarySeoul 브랜드 색상
const BRAND_COLORS = {
  navy: '#1e293b',    // Primary Navy
  honey: '#f59e0b',   // Accent Honey
  gold: '#d97706'     // Secondary Gold
};

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 배경 - 네이비 그라데이션
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, BRAND_COLORS.navy);
  gradient.addColorStop(1, '#0f172a');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // 모서리 둥글게
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.18); // iOS 스타일 라운드 코너
  ctx.fill();

  // 텍스트 "C" for CulinarySeoul
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = BRAND_COLORS.honey;
  ctx.font = `bold ${size * 0.6}px -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', size/2, size/2);

  // 하단에 작은 점 (밀랍 브랜드 표시)
  ctx.fillStyle = BRAND_COLORS.gold;
  ctx.beginPath();
  ctx.arc(size * 0.75, size * 0.75, size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // PNG 파일 저장
  const publicPath = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicPath, filename), buffer);
  
  console.log(`✅ ${filename} (${size}x${size}) 생성 완료`);
}

async function createAppleIcons() {
  console.log('🍎 Apple Touch Icon 생성 시작...\n');

  try {
    // 필수 Apple Touch Icon
    createIcon(180, 'apple-touch-icon.png');
    createIcon(180, 'apple-touch-icon-precomposed.png');
    
    // 다양한 크기 (선택사항)
    createIcon(120, 'apple-touch-icon-120x120.png');
    createIcon(152, 'apple-touch-icon-152x152.png');
    createIcon(167, 'apple-touch-icon-167x167.png');

    // 추가 PWA 아이콘들
    createIcon(192, 'icon-192.png');
    createIcon(512, 'icon-512.png');

    console.log('\n🎉 모든 Apple Touch Icon 생성 완료!');
    console.log('📱 iOS Safari에서 홈 화면에 추가 시 CulinarySeoul 브랜드 아이콘이 표시됩니다.');

  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error.message);
    
    // Canvas 라이브러리가 없을 경우 간단한 대안 제공
    console.log('\n💡 대안 해결책:');
    console.log('1. 온라인 아이콘 생성기 사용: https://realfavicongenerator.net/');
    console.log('2. 또는 기존 favicon.ico를 PNG로 변환하여 사용');
    
    // 간단한 HTML 파일로 대안 제공
    const simpleIcon = `
<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="32" fill="url(#bg)"/>
  <text x="90" y="110" font-family="system-ui" font-size="108" font-weight="bold" 
        text-anchor="middle" fill="#f59e0b">C</text>
  <circle cx="135" cy="135" r="12" fill="#d97706"/>
</svg>
    `;
    
    fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.svg'), simpleIcon);
    console.log('✅ SVG 버전 아이콘 생성됨: apple-touch-icon.svg');
  }
}

createAppleIcons();