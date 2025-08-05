#!/usr/bin/env node
/**
 * CulinarySeoul ERP - Clerk to Supabase Auth Migration Validation Script
 * 
 * This script validates the migration by testing core authentication functionality
 * without requiring a running Supabase instance.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}CulinarySeoul ERP - Auth Migration Validation${colors.reset}\n`);

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function logResult(message, status) {
  const prefix = status === 'pass' ? `${colors.green}✅` : 
                 status === 'fail' ? `${colors.red}❌` : 
                 `${colors.yellow}⚠️`;
  console.log(`${prefix} ${message}${colors.reset}`);
  
  if (status === 'pass') passCount++;
  else if (status === 'fail') failCount++;
  else warnCount++;
}

// =============================================
// 1. FILE STRUCTURE VALIDATION
// =============================================

console.log(`${colors.bold}1. 📁 File Structure Validation${colors.reset}`);

const requiredFiles = [
  'src/lib/auth.ts',
  'src/lib/supabase/auth-provider.tsx',
  'src/lib/supabase/middleware.ts',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/supabase/auth-api.ts',
  'src/middleware.ts',
  'src/app/layout.tsx'
];

const removedClerkFiles = [
  'src/lib/clerk.ts'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  logResult(`Required file exists: ${file}`, exists ? 'pass' : 'fail');
});

removedClerkFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  logResult(`Clerk file removed: ${file}`, !exists ? 'pass' : 'fail');
});

// =============================================
// 2. DEPENDENCY VALIDATION
// =============================================

console.log(`\n${colors.bold}2. 📦 Dependencies Validation${colors.reset}`);

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check Supabase dependencies
const requiredDeps = [
  '@supabase/supabase-js',
  '@supabase/ssr'
];

const clerkDeps = [
  '@clerk/nextjs',
  '@clerk/themes'
];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  logResult(`Required dependency: ${dep}`, exists ? 'pass' : 'fail');
});

clerkDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  logResult(`Clerk dependency removed: ${dep}`, !exists ? 'pass' : 'warn');
});

// =============================================
// 3. CODE STRUCTURE VALIDATION
// =============================================

console.log(`\n${colors.bold}3. 🔍 Code Structure Validation${colors.reset}`);

// Check auth.ts exports
const authFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth.ts'), 'utf8');

const expectedAuthExports = [
  'getCurrentUser',
  'getCurrentProfile',
  'requireAuth',
  'requireRole',
  'upsertUserProfile',
  'getERPRoleHierarchy',
  'hasCompanyAccess',
  'hasBrandAccess',
  'hasStoreAccess',
  'getDefaultDashboardPath'
];

expectedAuthExports.forEach(exportName => {
  const exists = authFile.includes(`export async function ${exportName}`) || 
                 authFile.includes(`export function ${exportName}`);
  logResult(`Auth function exported: ${exportName}`, exists ? 'pass' : 'fail');
});

// Check middleware conversion
const middlewareFile = fs.readFileSync(path.join(process.cwd(), 'src/middleware.ts'), 'utf8');
const hasClerkMiddleware = middlewareFile.includes('clerkMiddleware') || middlewareFile.includes('@clerk/nextjs');
const hasSupabaseMiddleware = middlewareFile.includes('createAuthMiddleware');

logResult('Clerk middleware removed', !hasClerkMiddleware ? 'pass' : 'fail');
logResult('Supabase middleware implemented', hasSupabaseMiddleware ? 'pass' : 'fail');

// Check layout.tsx conversion
const layoutFile = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
const hasClerkProvider = layoutFile.includes('ClerkProvider') || layoutFile.includes('@clerk/nextjs');
const hasAuthProvider = layoutFile.includes('AuthProvider');

logResult('ClerkProvider removed from layout', !hasClerkProvider ? 'pass' : 'fail');
logResult('AuthProvider added to layout', hasAuthProvider ? 'pass' : 'fail');

// =============================================
// 4. ENVIRONMENT VARIABLES VALIDATION
// =============================================

console.log(`\n${colors.bold}4. 🔧 Environment Variables Validation${colors.reset}`);

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const clerkEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

requiredEnvVars.forEach(envVar => {
  const exists = process.env[envVar];
  logResult(`Required env var configured: ${envVar}`, exists ? 'pass' : 'warn');
});

clerkEnvVars.forEach(envVar => {
  const exists = process.env[envVar];
  logResult(`Clerk env var removed: ${envVar}`, !exists ? 'pass' : 'warn');
});

// =============================================
// 5. API ROUTES VALIDATION
// =============================================

console.log(`\n${colors.bold}5. 🌐 API Routes Validation${colors.reset}`);

const apiRoutes = [
  'src/app/api/profile/route.ts',
  'src/app/api/referrals/route.ts',
  'src/app/api/referrals/link/route.ts',
  'src/app/api/referrals/validate/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    const hasClerkAuth = content.includes('@clerk/nextjs') || content.includes('auth()');
    const hasSupabaseAuth = content.includes('authenticateApiRequest') || content.includes('createServiceClient') || content.includes('exchangeCodeForSession');
    
    logResult(`${route} - Clerk removed`, !hasClerkAuth ? 'pass' : 'fail');
    logResult(`${route} - Supabase implemented`, hasSupabaseAuth ? 'pass' : 'fail');
  } else {
    logResult(`API route exists: ${route}`, 'fail');
  }
});

// =============================================
// 6. AUTH PAGES VALIDATION
// =============================================

console.log(`\n${colors.bold}6. 📄 Auth Pages Validation${colors.reset}`);

const authPages = [
  'src/app/auth/signin/page.tsx',
  'src/app/auth/signup/page.tsx',
  'src/app/auth/callback/route.ts'
];

authPages.forEach(page => {
  const pagePath = path.join(process.cwd(), page);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    const hasClerkComponents = content.includes('<SignIn') || content.includes('<SignUp') || content.includes('@clerk/nextjs') || content.includes('from \'@clerk');
    
    // Different check for API routes vs pages
    let hasSupabaseAuth;
    if (page.includes('route.ts')) {
      hasSupabaseAuth = content.includes('exchangeCodeForSession') || content.includes('createServerClient') || content.includes('@supabase/ssr');
    } else {
      hasSupabaseAuth = content.includes('useAuth') || content.includes('signIn') || content.includes('signUp');
    }
    
    logResult(`${page} - Clerk components removed`, !hasClerkComponents ? 'pass' : 'fail');
    logResult(`${page} - Supabase auth implemented`, hasSupabaseAuth ? 'pass' : 'fail');
  } else {
    logResult(`Auth page exists: ${page}`, 'fail');
  }
});

// =============================================
// 7. ERP ROLE SYSTEM VALIDATION
// =============================================

console.log(`\n${colors.bold}7. 👥 ERP Role System Validation${colors.reset}`);

const expectedRoles = [
  'super_admin',
  'company_admin', 
  'brand_admin',
  'brand_staff',
  'store_manager',
  'store_staff'
];

expectedRoles.forEach(role => {
  const exists = authFile.includes(`'${role}'`);
  logResult(`ERP role defined: ${role}`, exists ? 'pass' : 'fail');
});

// Check role hierarchy
const hasRoleHierarchy = authFile.includes('getERPRoleHierarchy') && authFile.includes('100') && authFile.includes('10');
logResult('Role hierarchy implemented', hasRoleHierarchy ? 'pass' : 'fail');

// =============================================
// 8. DASHBOARD ROUTING VALIDATION
// =============================================

console.log(`\n${colors.bold}8. 🧭 Dashboard Routing Validation${colors.reset}`);

const dashboardPaths = [
  'src/app/company/dashboard/page.tsx',
  'src/app/brand/[brandId]/dashboard/page.tsx',
  'src/app/store/[storeId]/dashboard/page.tsx'
];

dashboardPaths.forEach(dashboardPath => {
  const exists = fs.existsSync(path.join(process.cwd(), dashboardPath));
  logResult(`Dashboard route exists: ${dashboardPath}`, exists ? 'pass' : 'warn');
});

// =============================================
// 9. SUPABASE AUTH PROVIDER VALIDATION
// =============================================

console.log(`\n${colors.bold}9. 🔐 Supabase Auth Provider Validation${colors.reset}`);

const authProviderFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/supabase/auth-provider.tsx'), 'utf8');

const expectedProviderFeatures = [
  'signIn',
  'signUp', 
  'signOut',
  'signInWithOAuth',
  'hasRole',
  'hasMinimumRole',
  'canAccessCompany',
  'canAccessBrand',
  'canAccessStore',
  'getDefaultDashboard'
];

expectedProviderFeatures.forEach(feature => {
  const exists = authProviderFile.includes(feature);
  logResult(`Auth provider feature: ${feature}`, exists ? 'pass' : 'fail');
});

// =============================================
// SUMMARY
// =============================================

console.log(`\n${colors.bold}📊 Migration Validation Summary${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnCount}${colors.reset}`);

const totalTests = passCount + failCount + warnCount;
const successRate = Math.round((passCount / totalTests) * 100);

console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

if (failCount === 0) {
  console.log(`\n${colors.green}${colors.bold}🎉 Migration validation completed successfully!${colors.reset}`);
  console.log(`${colors.green}All critical components have been successfully migrated from Clerk to Supabase Auth.${colors.reset}`);
} else {
  console.log(`\n${colors.red}${colors.bold}❌ Migration validation found ${failCount} critical issues.${colors.reset}`);
  console.log(`${colors.red}Please review and fix the failed validations before proceeding.${colors.reset}`);
}

if (warnCount > 0) {
  console.log(`\n${colors.yellow}${colors.bold}⚠️  There are ${warnCount} warnings that should be addressed.${colors.reset}`);
}

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0);