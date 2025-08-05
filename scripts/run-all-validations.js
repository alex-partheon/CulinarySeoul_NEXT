#!/usr/bin/env node
/**
 * CulinarySeoul ERP - Complete Migration Validation Suite
 * 
 * Runs all validation scripts and provides comprehensive migration status
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║              CulinarySeoul ERP Migration Validation         ║
║                 Comprehensive Test Suite                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Test suite configuration
const validationSuites = [
  {
    name: 'Auth Migration Validation',
    script: 'test-auth-migration.js',
    description: 'Overall migration structure and implementation',
    icon: '🔄'
  },
  {
    name: 'ERP Role-Based Access Control',
    script: 'test-erp-roles.js', 
    description: 'Role hierarchy and permission system',
    icon: '👥'
  },
  {
    name: 'Security & OWASP Compliance',
    script: 'test-security-compliance.js',
    description: 'Security measures and vulnerability assessment',
    icon: '🛡️'
  }
];

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  suites: []
};

// Helper function to run a validation script
function runValidation(suite) {
  return new Promise((resolve) => {
    console.log(`${colors.bold}${suite.icon} Running: ${suite.name}${colors.reset}`);
    console.log(`${colors.cyan}${suite.description}${colors.reset}\n`);

    const scriptPath = path.join(__dirname, suite.script);
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let hasContent = false;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      hasContent = true;
      // Don't echo output to avoid duplication, just capture it
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      hasContent = true;
    });

    child.on('close', (code) => {
      // Parse results from output
      const passMatches = output.match(/✅ Passed: (\d+)/);
      const failMatches = output.match(/❌ Failed: (\d+)/);
      const warnMatches = output.match(/⚠️\s+Warnings: (\d+)/);
      const successMatches = output.match(/Success Rate: (\d+)%/);

      const suiteResult = {
        name: suite.name,
        passed: passMatches ? parseInt(passMatches[1]) : 0,
        failed: failMatches ? parseInt(failMatches[1]) : 0,
        warnings: warnMatches ? parseInt(warnMatches[1]) : 0,
        successRate: successMatches ? parseInt(successMatches[1]) : 0,
        exitCode: code,
        output: output
      };

      // Update overall results
      results.passed += suiteResult.passed;
      results.failed += suiteResult.failed;
      results.warnings += suiteResult.warnings;
      results.suites.push(suiteResult);

      // Display summary for this suite
      const status = code === 0 ? `${colors.green}✅ PASSED` : `${colors.red}❌ FAILED`;
      console.log(`${status} ${suite.name} - ${suiteResult.successRate}% Success Rate${colors.reset}`);
      console.log(`${colors.cyan}  Passed: ${suiteResult.passed}, Failed: ${suiteResult.failed}, Warnings: ${suiteResult.warnings}${colors.reset}\n`);

      resolve(suiteResult);
    });

    child.on('error', (err) => {
      console.error(`${colors.red}Error running ${suite.name}: ${err.message}${colors.reset}`);
      resolve({
        name: suite.name,
        passed: 0,
        failed: 1,
        warnings: 0,
        successRate: 0,
        exitCode: 1,
        error: err.message
      });
    });
  });
}

// Run all validation suites
async function runAllValidations() {
  console.log(`${colors.yellow}Starting comprehensive migration validation...${colors.reset}\n`);

  // Run each validation suite
  for (const suite of validationSuites) {
    await runValidation(suite);
    console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}\n`);
  }

  // Generate final report
  generateFinalReport();
}

function generateFinalReport() {
  console.log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    FINAL VALIDATION REPORT                  ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Calculate overall metrics
  const totalTests = results.passed + results.failed + results.warnings;
  const overallSuccessRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
  const criticalFailures = results.failed;

  // Display suite results
  console.log(`${colors.bold}📊 Suite Results:${colors.reset}`);
  results.suites.forEach(suite => {
    const statusIcon = suite.exitCode === 0 ? '✅' : '❌';
    const rate = suite.successRate;
    const color = rate >= 90 ? colors.green : rate >= 70 ? colors.yellow : colors.red;
    
    console.log(`${statusIcon} ${suite.name}: ${color}${rate}%${colors.reset}`);
    console.log(`   ${colors.cyan}Passed: ${suite.passed}, Failed: ${suite.failed}, Warnings: ${suite.warnings}${colors.reset}`);
  });

  console.log(`\n${colors.bold}📈 Overall Metrics:${colors.reset}`);
  console.log(`${colors.green}✅ Total Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Total Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Total Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.bold}🎯 Overall Success Rate: ${overallSuccessRate}%${colors.reset}`);

  // Migration status assessment
  console.log(`\n${colors.bold}🚀 Migration Status Assessment:${colors.reset}`);
  
  if (criticalFailures === 0 && overallSuccessRate >= 90) {
    console.log(`${colors.green}${colors.bold}✅ MIGRATION SUCCESSFUL - PRODUCTION READY${colors.reset}`);
    console.log(`${colors.green}All critical components migrated successfully with minimal warnings.${colors.reset}`);
  } else if (criticalFailures <= 5 && overallSuccessRate >= 80) {
    console.log(`${colors.yellow}${colors.bold}⚠️  MIGRATION MOSTLY SUCCESSFUL - MINOR ISSUES${colors.reset}`);
    console.log(`${colors.yellow}Few issues detected. Review failures before production deployment.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ MIGRATION NEEDS ATTENTION - MAJOR ISSUES${colors.reset}`);
    console.log(`${colors.red}Significant issues detected. Address critical failures before proceeding.${colors.reset}`);
  }

  // Key achievements
  console.log(`\n${colors.bold}🏆 Key Achievements:${colors.reset}`);
  
  const achievements = [];
  
  if (results.suites.find(s => s.name.includes('Auth Migration'))?.successRate >= 90) {
    achievements.push('✅ Authentication system successfully migrated');
  }
  
  if (results.suites.find(s => s.name.includes('ERP Role'))?.successRate >= 90) {
    achievements.push('✅ ERP role-based access control implemented');
  }
  
  if (results.suites.find(s => s.name.includes('Security'))?.successRate >= 70) {
    achievements.push('✅ Security foundation established');
  }
  
  if (achievements.length === 0) {
    achievements.push('❌ No major achievements - review implementation');
  }
  
  achievements.forEach(achievement => {
    console.log(`   ${achievement}`);
  });

  // Recommendations
  console.log(`\n${colors.bold}💡 Next Steps:${colors.reset}`);
  
  if (criticalFailures === 0) {
    console.log(`${colors.green}1. Deploy to staging environment for live testing${colors.reset}`);
    console.log(`${colors.green}2. Configure production Supabase instance${colors.reset}`);
    console.log(`${colors.green}3. Set up monitoring and security headers${colors.reset}`);
    console.log(`${colors.green}4. Plan user migration strategy${colors.reset}`);
  } else {
    console.log(`${colors.red}1. Review and fix critical validation failures${colors.reset}`);
    console.log(`${colors.red}2. Re-run validation suite after fixes${colors.reset}`);
    console.log(`${colors.yellow}3. Consider staged rollout approach${colors.reset}`);
  }

  if (results.warnings > 0) {
    console.log(`${colors.yellow}5. Address ${results.warnings} warnings for production optimization${colors.reset}`);
  }

  // Documentation references
  console.log(`\n${colors.bold}📚 Documentation:${colors.reset}`);
  console.log(`${colors.cyan}📄 MIGRATION_VALIDATION_REPORT.md - Complete validation report${colors.reset}`);
  console.log(`${colors.cyan}📄 MIGRATION_GUIDE.md - Step-by-step migration process${colors.reset}`);
  console.log(`${colors.cyan}📄 USAGE_EXAMPLE.md - Implementation examples${colors.reset}`);

  console.log(`\n${colors.bold}${colors.blue}Migration validation completed - ${new Date().toISOString()}${colors.reset}\n`);
}

// Run the validation suite
runAllValidations().catch(error => {
  console.error(`${colors.red}Validation suite failed: ${error.message}${colors.reset}`);
  process.exit(1);
});