const { chromium } = require('playwright');

async function measurePerformance() {
  console.log('🚀 회사 대시보드 성능 측정 시작...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 성능 측정을 위한 변수들
  const measurements = [];
  
  try {
    // 여러 번 측정하여 평균값 계산
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📊 측정 ${i}/5 진행 중...`);
      
      // 새 페이지로 시작 (캐시 효과 방지)
      const newPage = await context.newPage();
      
      // 성능 메트릭 측정 시작
      const startTime = Date.now();
      
      // 페이지 로드
      const response = await newPage.goto('http://localhost:3000/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Core Web Vitals 측정
      const metrics = await newPage.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const metrics = {
              lcp: 0,
              fid: 0,
              cls: 0
            };
            
            entries.forEach((entry) => {
              if (entry.entryType === 'largest-contentful-paint') {
                metrics.lcp = entry.startTime;
              }
            });
            
            resolve(metrics);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // 타임아웃으로 측정 완료
          setTimeout(() => {
            resolve({
              lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
              fid: 0,
              cls: 0
            });
          }, 3000);
        });
      });
      
      const measurement = {
        iteration: i,
        loadTime,
        responseStatus: response.status(),
        lcp: metrics.lcp,
        responseSize: await response.body().then(body => body.length).catch(() => 0)
      };
      
      measurements.push(measurement);
      
      console.log(`✅ 측정 ${i} 완료:`);
      console.log(`   - 로드 시간: ${loadTime}ms`);
      console.log(`   - 응답 상태: ${response.status()}`);
      console.log(`   - LCP: ${metrics.lcp.toFixed(2)}ms`);
      
      await newPage.close();
      
      // 측정 간 간격
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 통계 계산
    const loadTimes = measurements.map(m => m.loadTime);
    const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    const minLoadTime = Math.min(...loadTimes);
    const maxLoadTime = Math.max(...loadTimes);
    
    const lcps = measurements.map(m => m.lcp).filter(lcp => lcp > 0);
    const avgLcp = lcps.length > 0 ? lcps.reduce((sum, lcp) => sum + lcp, 0) / lcps.length : 0;
    
    console.log('\n📈 === 성능 측정 결과 ===');
    console.log(`측정 횟수: ${measurements.length}회`);
    console.log(`평균 로드 시간: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`최소 로드 시간: ${minLoadTime}ms`);
    console.log(`최대 로드 시간: ${maxLoadTime}ms`);
    console.log(`평균 LCP: ${avgLcp.toFixed(2)}ms`);
    
    // 개별 측정 결과
    console.log('\n📋 개별 측정 결과:');
    measurements.forEach(m => {
      console.log(`  ${m.iteration}. ${m.loadTime}ms (Status: ${m.responseStatus}, LCP: ${m.lcp.toFixed(2)}ms)`);
    });
    
    // 성능 평가
    console.log('\n🎯 성능 평가:');
    if (avgLoadTime < 1000) {
      console.log('🟢 우수: 1초 미만 로딩');
    } else if (avgLoadTime < 2000) {
      console.log('🟡 양호: 2초 미만 로딩');
    } else {
      console.log('🔴 개선 필요: 2초 이상 로딩');
    }
    
    return {
      avgLoadTime,
      minLoadTime,
      maxLoadTime,
      avgLcp,
      measurements,
      status: avgLoadTime < 1000 ? 'excellent' : avgLoadTime < 2000 ? 'good' : 'needs_improvement'
    };
    
  } catch (error) {
    console.error('❌ 성능 측정 중 오류 발생:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  measurePerformance()
    .then((result) => {
      if (result) {
        console.log('\n✅ 성능 측정 완료');
        process.exit(0);
      } else {
        console.log('\n❌ 성능 측정 실패');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = { measurePerformance };