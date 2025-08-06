const { chromium } = require('playwright');

async function measureCompanyDashboard() {
  console.log('🏢 회사 대시보드 성능 측정 시작...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const measurements = [];
  
  try {
    for (let i = 1; i <= 3; i++) {
      console.log(`\n📊 측정 ${i}/3 진행 중...`);
      
      const newPage = await context.newPage();
      const startTime = Date.now();
      
      try {
        // 회사 대시보드 페이지 로드 시도
        const response = await newPage.goto('http://localhost:3000/company/dashboard', { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        const measurement = {
          iteration: i,
          loadTime,
          responseStatus: response.status(),
          url: response.url()
        };
        
        measurements.push(measurement);
        
        console.log(`✅ 측정 ${i} 완료:`);
        console.log(`   - 로드 시간: ${loadTime}ms`);
        console.log(`   - 응답 상태: ${response.status()}`);
        console.log(`   - 최종 URL: ${response.url()}`);
        
      } catch (error) {
        console.log(`❌ 측정 ${i} 실패: ${error.message}`);
        measurements.push({
          iteration: i,
          loadTime: Date.now() - startTime,
          responseStatus: 'error',
          error: error.message
        });
      }
      
      await newPage.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 성공한 측정만 필터링
    const successfulMeasurements = measurements.filter(m => m.responseStatus !== 'error');
    
    if (successfulMeasurements.length > 0) {
      const loadTimes = successfulMeasurements.map(m => m.loadTime);
      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
      const minLoadTime = Math.min(...loadTimes);
      const maxLoadTime = Math.max(...loadTimes);
      
      console.log('\n🏢 === 회사 대시보드 성능 측정 결과 ===');
      console.log(`성공한 측정: ${successfulMeasurements.length}회`);
      console.log(`평균 로드 시간: ${avgLoadTime.toFixed(2)}ms`);
      console.log(`최소 로드 시간: ${minLoadTime}ms`);
      console.log(`최대 로드 시간: ${maxLoadTime}ms`);
      
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
        successfulMeasurements: successfulMeasurements.length,
        totalMeasurements: measurements.length
      };
    } else {
      console.log('\n❌ 모든 측정이 실패했습니다.');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 성능 측정 중 오류 발생:', error.message);
    return null;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  measureCompanyDashboard()
    .then((result) => {
      if (result) {
        console.log('\n✅ 회사 대시보드 성능 측정 완료');
        process.exit(0);
      } else {
        console.log('\n❌ 회사 대시보드 성능 측정 실패');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('스크립트 실행 오류:', error);
      process.exit(1);
    });
}