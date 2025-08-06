const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function analyzeBundleSize() {
  console.log('📦 번들 크기 분석 시작...');
  
  try {
    // .next 디렉토리 확인
    const nextDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(nextDir)) {
      console.log('❌ .next 디렉토리가 존재하지 않습니다. 먼저 빌드를 실행해주세요.');
      return null;
    }
    
    // 정적 폴더 크기 분석
    const staticPath = path.join(nextDir, 'static');
    
    if (fs.existsSync(staticPath)) {
      const calculateDirSize = (dirPath) => {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            totalSize += calculateDirSize(filePath);
          } else {
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        }
        return totalSize;
      };
      
      const staticSize = calculateDirSize(staticPath);
      console.log(`📁 Static 폴더 크기: ${(staticSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Chunks 폴더 확인
      const chunksPath = path.join(staticPath, 'chunks');
      if (fs.existsSync(chunksPath)) {
        const chunksSize = calculateDirSize(chunksPath);
        console.log(`🧩 Chunks 크기: ${(chunksSize / 1024 / 1024).toFixed(2)} MB`);
        
        // 주요 청크 파일들 분석
        const chunkFiles = fs.readdirSync(chunksPath)
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(chunksPath, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              sizeKB: (stats.size / 1024).toFixed(2)
            };
          })
          .sort((a, b) => b.size - a.size)
          .slice(0, 10); // 상위 10개
        
        console.log('\n🏆 큰 청크 파일들 (상위 10개):');
        chunkFiles.forEach((chunk, index) => {
          console.log(`  ${index + 1}. ${chunk.name}: ${chunk.sizeKB} KB`);
        });
      }
      
      // CSS 파일들 확인
      const cssPath = path.join(staticPath, 'css');
      if (fs.existsSync(cssPath)) {
        const cssSize = calculateDirSize(cssPath);
        console.log(`🎨 CSS 크기: ${(cssSize / 1024).toFixed(2)} KB`);
      }
      
      return {
        totalStaticSize: staticSize,
        chunksSize: fs.existsSync(chunksPath) ? calculateDirSize(chunksPath) : 0,
        cssSize: fs.existsSync(cssPath) ? calculateDirSize(cssPath) : 0
      };
    } else {
      console.log('❌ Static 폴더를 찾을 수 없습니다.');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 번들 분석 중 오류 발생:', error.message);
    return null;
  }
}

// 빌드 출력에서 번들 정보 추출하는 함수
function extractBuildInfo() {
  console.log('📊 빌드 정보 분석...');
  
  const buildLogPath = path.join(process.cwd(), '.next', 'trace.log');
  
  // 직접 .next/server 폴더 확인
  const serverPath = path.join(process.cwd(), '.next', 'server');
  if (fs.existsSync(serverPath)) {
    const pagesPath = path.join(serverPath, 'pages');
    const appPath = path.join(serverPath, 'app');
    
    console.log('\n🏗️ 서버 빌드 분석:');
    
    if (fs.existsSync(pagesPath)) {
      console.log(`📄 Pages 빌드 존재: ${fs.readdirSync(pagesPath).length}개 파일`);
    }
    
    if (fs.existsSync(appPath)) {
      const appFiles = fs.readdirSync(appPath, { recursive: true });
      console.log(`📱 App 빌드 존재: ${appFiles.length}개 파일`);
      
      // 주요 앱 경로들 확인
      const routes = appFiles.filter(file => file.toString().includes('page.js') || file.toString().includes('layout.js'));
      console.log(`🗺️  라우트 파일들: ${routes.length}개`);
      routes.slice(0, 10).forEach((route, index) => {
        console.log(`  ${index + 1}. ${route}`);
      });
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  Promise.all([
    analyzeBundleSize(),
    extractBuildInfo()
  ])
    .then(([bundleResult]) => {
      console.log('\n📈 === 번들 분석 완료 ===');
      if (bundleResult) {
        console.log(`총 Static 크기: ${(bundleResult.totalStaticSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Chunks 크기: ${(bundleResult.chunksSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`CSS 크기: ${(bundleResult.cssSize / 1024).toFixed(2)} KB`);
      }
      console.log('\n✅ 번들 분석 완료');
    })
    .catch((error) => {
      console.error('스크립트 실행 오류:', error);
      process.exit(1);
    });
}