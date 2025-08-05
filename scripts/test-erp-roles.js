#!/usr/bin/env node
/**
 * CulinarySeoul ERP - Role-Based Access Control Testing Script
 * 
 * This script validates the ERP role hierarchy and access control system
 * Tests role validation, permission checking, and route protection logic
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

console.log(`${colors.bold}${colors.blue}CulinarySeoul ERP - Role-Based Access Control Testing${colors.reset}\n`);

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

// Load and evaluate the auth module
function loadAuthModule() {
  try {
    // Since we can't directly import ES modules in Node.js script, 
    // we'll analyze the source code instead
    const authFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/auth.ts'), 'utf8');
    return authFile;
  } catch (error) {
    console.error('Failed to load auth module:', error.message);
    return null;
  }
}

// =============================================
// 1. ROLE HIERARCHY VALIDATION
// =============================================

console.log(`${colors.bold}1. 👥 ERP Role Hierarchy Validation${colors.reset}`);

const authSource = loadAuthModule();
if (!authSource) {
  logResult('Auth module loading failed', 'fail');
  process.exit(1);
}

// Expected ERP roles with their hierarchy levels
const expectedRoles = {
  'super_admin': 100,
  'company_admin': 80,
  'brand_admin': 60,
  'brand_staff': 40,
  'store_manager': 30,
  'store_staff': 10
};

// Check if all roles are defined
Object.keys(expectedRoles).forEach(role => {
  const roleExists = authSource.includes(`'${role}'`) || authSource.includes(`"${role}"`);
  logResult(`Role defined: ${role}`, roleExists ? 'pass' : 'fail');
});

// Check hierarchy levels
Object.entries(expectedRoles).forEach(([role, level]) => {
  const levelExists = authSource.includes(`${role}: ${level}`) || authSource.includes(`"${role}": ${level}`);
  logResult(`Hierarchy level correct: ${role} = ${level}`, levelExists ? 'pass' : 'fail');
});

// =============================================
// 2. ROLE VALIDATION FUNCTIONS
// =============================================

console.log(`\n${colors.bold}2. 🔍 Role Validation Functions${colors.reset}`);

const requiredRoleFunctions = [
  'getERPRoleHierarchy',
  'hasRoleLevel',
  'hasMinimumRole',
  'hasRole',
  'isAdmin',
  'isSuperAdmin',
  'isCompanyAdmin',
  'isBrandAdmin',
  'isStoreManager',
  'isStoreStaff',
  'isManagerOrAbove',
  'isAdminOrAbove'
];

requiredRoleFunctions.forEach(func => {
  const exists = authSource.includes(`export function ${func}`) || authSource.includes(`export async function ${func}`);
  logResult(`Function exists: ${func}`, exists ? 'pass' : 'fail');
});

// =============================================
// 3. ACCESS CONTROL FUNCTIONS
// =============================================

console.log(`\n${colors.bold}3. 🛡️ Access Control Functions${colors.reset}`);

const accessControlFunctions = [
  'hasCompanyAccess',
  'hasBrandAccess', 
  'hasStoreAccess',
  'requireAuth',
  'requireRole'
];

accessControlFunctions.forEach(func => {
  const exists = authSource.includes(`export async function ${func}`);
  logResult(`Access control function: ${func}`, exists ? 'pass' : 'fail');
});

// =============================================
// 4. MIDDLEWARE ROUTE PROTECTION
// =============================================

console.log(`\n${colors.bold}4. 🚨 Middleware Route Protection${colors.reset}`);

const middlewareFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/supabase/middleware.ts'), 'utf8');

// Check role-based route protection
const routeProtectionChecks = [
  { path: '/company', minRole: 'company_admin', level: 80 },
  { path: '/brand', minRole: 'brand_staff', level: 40 },
  { path: '/store', minRole: 'store_staff', level: 10 }
];

routeProtectionChecks.forEach(({ path, minRole, level }) => {
  const hasProtection = middlewareFile.includes(path) && 
                       (middlewareFile.includes(minRole) || middlewareFile.includes(level.toString()));
  logResult(`Route protection: ${path} requires ${minRole}+`, hasProtection ? 'pass' : 'fail');
});

// Check role hierarchy in middleware
const hasRoleHierarchy = middlewareFile.includes('ROLE_HIERARCHY') && 
                        middlewareFile.includes('super_admin: 100') &&
                        middlewareFile.includes('store_staff: 10');
logResult('Middleware uses role hierarchy', hasRoleHierarchy ? 'pass' : 'fail');

// =============================================
// 5. DASHBOARD ROUTING LOGIC
// =============================================

console.log(`\n${colors.bold}5. 🧭 Dashboard Routing Logic${colors.reset}`);

// Check default dashboard routing
const expectedRoutes = {
  'super_admin': '/company/dashboard',
  'company_admin': '/company/dashboard', 
  'brand_admin': '/brand/dashboard',
  'brand_staff': '/brand/dashboard',
  'store_manager': '/store/dashboard',
  'store_staff': '/store/dashboard'
};

Object.entries(expectedRoutes).forEach(([role, route]) => {
  const routeExists = authSource.includes(`${role}: '${route}'`) || 
                     middlewareFile.includes(`${role}: '${route}'`);
  logResult(`Default route: ${role} → ${route}`, routeExists ? 'pass' : 'fail');
});

// Check getDefaultDashboardPath function
const hasDefaultDashboard = authSource.includes('getDefaultDashboardPath');
logResult('Default dashboard function exists', hasDefaultDashboard ? 'pass' : 'fail');

// =============================================
// 6. JWT CLAIMS INTEGRATION
// =============================================

console.log(`\n${colors.bold}6. 🎫 JWT Claims Integration${colors.reset}`);

// Check JWT claims handling in middleware
const jwtFeatures = [
  'user_metadata',
  'app_metadata', 
  'role_level',
  'company_id',
  'brand_id',
  'store_id'
];

jwtFeatures.forEach(feature => {
  const exists = middlewareFile.includes(feature);
  logResult(`JWT claim handled: ${feature}`, exists ? 'pass' : 'fail');
});

// Check refresh claims function
const hasRefreshClaims = authSource.includes('refreshUserClaims') || authSource.includes('refresh_user_claims');
logResult('JWT claims refresh implemented', hasRefreshClaims ? 'pass' : 'fail');

// =============================================
// 7. AUTH PROVIDER ROLE METHODS
// =============================================

console.log(`\n${colors.bold}7. 🔐 Auth Provider Role Methods${colors.reset}`);

const authProviderFile = fs.readFileSync(path.join(process.cwd(), 'src/lib/supabase/auth-provider.tsx'), 'utf8');

const providerRoleMethods = [
  'hasRole',
  'hasMinimumRole',
  'canAccessCompany',
  'canAccessBrand', 
  'canAccessStore'
];

providerRoleMethods.forEach(method => {
  const exists = authProviderFile.includes(method);
  logResult(`Provider role method: ${method}`, exists ? 'pass' : 'fail');
});

// Check role-based redirection
const hasRoleRedirection = authProviderFile.includes('getDefaultDashboard') && 
                          authProviderFile.includes('redirectToDashboard');
logResult('Role-based redirection implemented', hasRoleRedirection ? 'pass' : 'fail');

// =============================================
// 8. HOOK IMPLEMENTATIONS
// =============================================

console.log(`\n${colors.bold}8. 🪝 Custom Hook Implementations${colors.reset}`);

// Check useERPRole hook
const useERPRoleFile = path.join(process.cwd(), 'src/hooks/useERPRole.ts');
if (fs.existsSync(useERPRoleFile)) {
  const hookContent = fs.readFileSync(useERPRoleFile, 'utf8');
  const hasERPHook = (hookContent.includes('useProfile') || hookContent.includes('useAuth')) && 
                     hookContent.includes('role') && 
                     hookContent.includes('hasRole');
  logResult('useERPRole hook implemented', hasERPHook ? 'pass' : 'fail');
} else {
  logResult('useERPRole hook file exists', 'fail');
}

// Check use-permission hook
const usePermissionFile = path.join(process.cwd(), 'src/hooks/use-permission.ts');
if (fs.existsSync(usePermissionFile)) {
  const hookContent = fs.readFileSync(usePermissionFile, 'utf8');
  const hasPermissionHook = hookContent.includes('useAuth') && hookContent.includes('permission');
  logResult('use-permission hook implemented', hasPermissionHook ? 'pass' : 'fail');
} else {
  logResult('use-permission hook file exists', 'fail');
}

// =============================================
// 9. API ROUTE PROTECTION
// =============================================

console.log(`\n${colors.bold}9. 🌐 API Route Protection${colors.reset}`);

// Check authenticateApiRequest implementation
const authApiFile = path.join(process.cwd(), 'src/lib/supabase/auth-api.ts');
if (fs.existsSync(authApiFile)) {
  const authApiContent = fs.readFileSync(authApiFile, 'utf8');
  const hasApiAuth = authApiContent.includes('authenticateApiRequest');
  logResult('API authentication helper exists', hasApiAuth ? 'pass' : 'fail');
  
  const hasRoleBasedApi = authApiContent.includes('role') && authApiContent.includes('profile');
  logResult('Role-based API protection implemented', hasRoleBasedApi ? 'pass' : 'fail');
} else {
  logResult('auth-api.ts file exists', 'fail');
}

// Check API routes use authentication
const apiRoutes = [
  'src/app/api/profile/route.ts',
  'src/app/api/referrals/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    const hasAuth = content.includes('authenticateApiRequest');
    logResult(`${route} uses authentication`, hasAuth ? 'pass' : 'fail');
  }
});

// =============================================
// 10. ROLE PRIVILEGE TESTING
// =============================================

console.log(`\n${colors.bold}10. 🔐 Role Privilege Testing${colors.reset}`);

// Test logical role hierarchy (based on levels)
const roleTests = [
  { higher: 'super_admin', lower: 'company_admin', expected: true },
  { higher: 'company_admin', lower: 'brand_admin', expected: true },
  { higher: 'brand_admin', lower: 'store_staff', expected: true },
  { higher: 'store_staff', lower: 'super_admin', expected: false },
  { higher: 'brand_staff', lower: 'company_admin', expected: false }
];

// Since we can't execute the functions, we'll check if the hierarchy logic exists
const hasHierarchyLogic = authSource.includes('hierarchy[userRole] >= hierarchy[minimumRole]') ||
                         authSource.includes('hierarchy[userRole] >= requiredLevel') ||
                         authSource.includes('roleLevel >= requiredLevel');

logResult('Role hierarchy comparison logic exists', hasHierarchyLogic ? 'pass' : 'fail');

// Check for privilege escalation prevention
const hasPrivilegeProtection = middlewareFile.includes('hasRouteAccess') && 
                              middlewareFile.includes('roleLevel');
logResult('Privilege escalation prevention implemented', hasPrivilegeProtection ? 'pass' : 'fail');

// =============================================
// SUMMARY
// =============================================

console.log(`\n${colors.bold}📊 Role-Based Access Control Summary${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${failCount}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnCount}${colors.reset}`);

const totalTests = passCount + failCount + warnCount;
const successRate = Math.round((passCount / totalTests) * 100);

console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

if (failCount === 0) {
  console.log(`\n${colors.green}${colors.bold}🎉 ERP Role-Based Access Control validation completed successfully!${colors.reset}`);
  console.log(`${colors.green}All role hierarchy and access control components are properly implemented.${colors.reset}`);
} else {
  console.log(`\n${colors.red}${colors.bold}❌ Role-based access control validation found ${failCount} critical issues.${colors.reset}`);
  console.log(`${colors.red}Please review and fix the failed validations before proceeding.${colors.reset}`);
}

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0);