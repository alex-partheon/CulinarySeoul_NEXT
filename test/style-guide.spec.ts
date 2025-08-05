import { test, expect } from '@playwright/test';

test.describe('스타일 가이드 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/style-guide');
  });

  test('페이지가 정상적으로 로드됨', async ({ page }) => {
    await expect(page).toHaveTitle(/CashUp/);
    await expect(page.locator('h1')).toContainText('CashUp 스타일 가이드');
  });

  test('브랜드 색상 섹션이 표시됨', async ({ page }) => {
    const brandSection = page.locator('section').filter({ hasText: '브랜드 색상' });
    await expect(brandSection).toBeVisible();

    // CashGreen 색상 확인
    await expect(brandSection.locator('text=CashGreen')).toBeVisible();

    // CashBlue 색상 확인
    await expect(brandSection.locator('text=CashBlue')).toBeVisible();
  });

  test('색상 복사 기능이 작동함', async ({ page }) => {
    // 첫 번째 색상 클릭
    const firstColor = page.locator('button[style*="background-color"]').first();
    await firstColor.click();

    // 복사 아이콘이 체크 아이콘으로 변경되는지 확인
    await expect(page.locator('svg').filter({ hasText: /Check/i })).toBeVisible();
  });

  test('타이포그래피 섹션이 표시됨', async ({ page }) => {
    const typoSection = page.locator('section').filter({ hasText: '타이포그래피' });
    await expect(typoSection).toBeVisible();

    // Pretendard 폰트 확인
    await expect(typoSection.locator('text=Pretendard')).toBeVisible();
  });

  test('버튼 컴포넌트 탭이 작동함', async ({ page }) => {
    const componentSection = page.locator('section').filter({ hasText: '컴포넌트' });

    // 크기 탭 클릭
    await componentSection.locator('button[role="tab"]').filter({ hasText: '크기' }).click();
    await expect(componentSection.locator('text=작은 버튼')).toBeVisible();

    // 상태 탭 클릭
    await componentSection.locator('button[role="tab"]').filter({ hasText: '상태' }).click();
    await expect(componentSection.locator('button[disabled]')).toBeVisible();
  });

  test('대시보드 테마가 모두 표시됨', async ({ page }) => {
    const dashboardSection = page.locator('section').filter({ hasText: '대시보드 테마' });

    await expect(dashboardSection.locator('text=크리에이터 대시보드')).toBeVisible();
    await expect(dashboardSection.locator('text=비즈니스 대시보드')).toBeVisible();
    await expect(dashboardSection.locator('text=관리자 대시보드')).toBeVisible();
  });

  test('3단계 추천 시스템 시각화가 표시됨', async ({ page }) => {
    const referralSection = page.locator('section').filter({ hasText: '3단계 추천 시스템' });

    await expect(referralSection.locator('text=10%')).toBeVisible();
    await expect(referralSection.locator('text=5%')).toBeVisible();
    await expect(referralSection.locator('text=2%')).toBeVisible();
  });

  test('디자인 트렌드 요소가 표시됨', async ({ page }) => {
    // Bento Grid 레이아웃 확인
    await expect(page.locator('text=Bento Grid')).toBeVisible();

    // 글래스모피즘 효과 확인
    await expect(page.locator('text=글래스모피즘')).toBeVisible();

    // 뉴모피즘 효과 확인
    await expect(page.locator('text=뉴모피즘')).toBeVisible();

    // 그라디언트 효과 확인
    await expect(page.locator('text=그라디언트')).toBeVisible();
  });

  test('반응형 디자인이 적용됨', async ({ page }) => {
    // 모바일 뷰포트
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();

    // 태블릿 뷰포트
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // 데스크탑 뷰포트
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
