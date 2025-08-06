/**
 * 개선된 오류 로깅 함수 검증 스크립트
 * 실제 브라우저 환경과 유사하게 오류 처리 테스트
 */

// ES module을 CommonJS에서 사용하기 위한 설정
const { createRequire } = require('module');
const require_esm = createRequire(import.meta.url);

async function testImprovedErrorLogging() {
  console.log('='.repeat(60));
  console.log('개선된 오류 로깅 검증 테스트');
  console.log('='.repeat(60));

  // 개발 환경 설정
  process.env.NODE_ENV = 'development';
  
  try {
    // TypeScript 모듈을 동적으로 import
    const { logError, analyzeSupabaseError, getDisplayErrorMessage } = await import('../src/lib/utils/error-handling.ts');
    
    console.log('✅ 오류 처리 유틸리티 모듈 로드 성공\n');
    
    // 테스트 케이스들
    const testCases = [
      {
        name: 'Permission Denied 오류 (실제 Supabase 케이스)',
        error: {
          code: '42501',
          details: null,
          hint: null,
          message: 'permission denied for table users'
        }
      },
      {
        name: 'Table Not Found 오류',
        error: {
          code: '42P01',
          details: null,
          hint: null,
          message: 'relation "public.brands" does not exist'
        }
      },
      {
        name: 'Network Fetch 오류',
        error: {
          message: 'TypeError: fetch failed',
          details: 'TypeError: fetch failed\n    at node:internal/deps/undici/undici:15422:13',
          hint: '',
          code: ''
        }
      },
      {
        name: '빈 메시지 오류 (이전 문제 케이스)',
        error: {
          message: '',
          code: '',
          details: '',
          hint: ''
        }
      },
      {
        name: 'Null 필드 오류 (이전 문제 케이스)',
        error: {
          message: null,
          code: null,
          details: null,
          hint: null
        }
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.name}`);
      console.log('-'.repeat(50));
      
      // 분석 함수 테스트
      console.log('🔍 analyzeSupabaseError 결과:');
      const analyzed = analyzeSupabaseError(testCase.error);
      console.log('  message:', analyzed.message);
      console.log('  code:', analyzed.code);
      console.log('  details:', analyzed.details);
      console.log('  hint:', analyzed.hint);
      
      // 사용자 친화적 메시지 테스트
      console.log('💬 사용자 친화적 메시지:');
      const displayMessage = getDisplayErrorMessage(testCase.error);
      console.log('  ', displayMessage);
      
      // logError 함수 테스트 (콘솔 출력 캡처)
      console.log('📝 logError 출력:');
      
      // 콘솔을 가로채서 출력 확인
      const originalConsoleError = console.error;
      const originalConsoleGroup = console.group;
      const originalConsoleLog = console.log;
      const originalConsoleGroupEnd = console.groupEnd;
      
      let capturedLogs = [];
      
      console.error = (...args) => {
        capturedLogs.push(['error', ...args]);
        originalConsoleError(...args);
      };
      console.group = (...args) => {
        capturedLogs.push(['group', ...args]);
        originalConsoleGroup(...args);
      };
      console.log = (...args) => {
        capturedLogs.push(['log', ...args]);
        originalConsoleLog(...args);
      };
      console.groupEnd = (...args) => {
        capturedLogs.push(['groupEnd', ...args]);
        originalConsoleGroupEnd(...args);
      };
      
      // logError 함수 실행
      logError(`테스트 케이스 ${i + 1}:`, testCase.error);
      
      // 콘솔 복원
      console.error = originalConsoleError;
      console.group = originalConsoleGroup;
      console.log = originalConsoleLog;
      console.groupEnd = originalConsoleGroupEnd;
      
      // 캡처된 로그 분석
      const errorLogs = capturedLogs.filter(log => log[0] === 'error');
      const debugLogs = capturedLogs.filter(log => log[0] === 'group' || log[0] === 'log');
      
      console.log('  에러 로그 개수:', errorLogs.length);
      console.log('  디버깅 로그 개수:', debugLogs.length);
      
      // 빈 객체 로그 확인
      const hasEmptyObjectLog = errorLogs.some(log => {
        const errorObj = log.find(item => typeof item === 'object' && item !== null);
        return errorObj && Object.keys(errorObj).length === 0;
      });
      
      console.log('  빈 객체 로그 여부:', hasEmptyObjectLog ? '❌ 발견됨' : '✅ 없음');
      
      // 메시지 유무 확인
      const hasValidMessage = errorLogs.some(log => {
        const errorObj = log.find(item => typeof item === 'object' && item !== null && item.message);
        return errorObj && errorObj.message && errorObj.message !== '';
      });
      
      console.log('  유효한 메시지 여부:', hasValidMessage ? '✅ 있음' : '❌ 없음');
    }
    
    console.log('\n='.repeat(60));
    console.log('🎯 프로덕션 환경 테스트');
    console.log('='.repeat(60));
    
    // 프로덕션 환경에서 테스트
    process.env.NODE_ENV = 'production';
    
    console.log('\n프로덕션 환경에서 디버깅 로그 확인...');
    
    // 콘솔 캡처
    let prodCapturedLogs = [];
    const originalProdConsoleError = console.error;
    const originalProdConsoleGroup = console.group;
    
    console.error = (...args) => {
      prodCapturedLogs.push(['error', ...args]);
      originalProdConsoleError(...args);
    };
    console.group = (...args) => {
      prodCapturedLogs.push(['group', ...args]);
      originalProdConsoleGroup(...args);
    };
    
    // 프로덕션 환경에서 logError 실행
    logError('프로덕션 테스트:', testCases[0].error);
    
    // 콘솔 복원
    console.error = originalProdConsoleError;
    console.group = originalProdConsoleGroup;
    
    const prodDebugLogs = prodCapturedLogs.filter(log => log[0] === 'group');
    console.log('프로덕션 환경 디버깅 로그 개수:', prodDebugLogs.length);
    console.log('디버깅 로그 억제 여부:', prodDebugLogs.length === 0 ? '✅ 성공' : '❌ 실패');
    
    console.log('\n🎉 개선된 오류 로깅 검증 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  }
}

// 메인 실행 (ES module import 지원)
(async () => {
  await testImprovedErrorLogging();
})();