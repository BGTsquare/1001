#!/usr/bin/env node

/**
 * Comprehensive Build Error Detection Script
 * Identifies all potential build errors before deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting comprehensive build error detection...\n');

// 1. TypeScript Compilation Check
console.log('1️⃣ Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation passed');
} catch (error) {
  console.log('❌ TypeScript errors found:');
  console.log(error.stdout.toString());
}

// 2. Check for missing imports in key files
console.log('\n2️⃣ Checking for missing imports...');
const criticalFiles = [
  'src/app/about/page.tsx',
  'src/app/admin/admin-dashboard-client.tsx',
  'src/app/admin/telegram/page.tsx',
  'src/app/api/admin/analytics/route.ts',
  'src/app/api/admin/analytics/export/route.ts',
  'src/app/api/admin/analytics/purchases/route.ts',
  'src/components/payments/payment-history.tsx'
];

criticalFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common missing imports
    const missingImports = [];
    
    if (content.includes('CardDescription') && !content.includes("import.*CardDescription")) {
      missingImports.push('CardDescription');
    }
    if (content.includes('Clock') && !content.includes("import.*Clock.*from.*lucide-react")) {
      missingImports.push('Clock from lucide-react');
    }
    if (content.includes('CheckCircle') && !content.includes("import.*CheckCircle.*from.*lucide-react")) {
      missingImports.push('CheckCircle from lucide-react');
    }
    
    if (missingImports.length > 0) {
      console.log(`❌ ${file}: Missing imports - ${missingImports.join(', ')}`);
    } else {
      console.log(`✅ ${file}: Imports look good`);
    }
  }
});

// 3. Check database schema compatibility
console.log('\n3️⃣ Checking database schema compatibility...');
const dbTypesPath = path.join(process.cwd(), 'src/types/database.ts');
if (fs.existsSync(dbTypesPath)) {
  const dbContent = fs.readFileSync(dbTypesPath, 'utf8');
  
  const requiredTables = ['admin_settings', 'user_sessions'];
  const missingTables = [];
  
  requiredTables.forEach(table => {
    if (!dbContent.includes(`${table}:`)) {
      missingTables.push(table);
    }
  });
  
  if (missingTables.length > 0) {
    console.log(`❌ Missing database tables: ${missingTables.join(', ')}`);
  } else {
    console.log('✅ Database schema looks complete');
  }
}

// 4. Check Next.js 15 compatibility
console.log('\n4️⃣ Checking Next.js 15 compatibility...');
const apiRoutes = [
  'src/app/api/admin/analytics/route.ts',
  'src/app/api/admin/analytics/export/route.ts',
  'src/app/api/admin/analytics/purchases/route.ts'
];

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route);
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    
    if (content.includes('createClient()') && !content.includes('await createClient()')) {
      console.log(`❌ ${route}: Missing await for createClient()`);
    } else {
      console.log(`✅ ${route}: createClient() properly awaited`);
    }
  }
});

// 5. Check for null safety issues
console.log('\n5️⃣ Checking for null safety issues...');
const analyticsRoute = path.join(process.cwd(), 'src/app/api/admin/analytics/route.ts');
if (fs.existsSync(analyticsRoute)) {
  const content = fs.readFileSync(analyticsRoute, 'utf8');
  
  if (content.includes('totalUsers >') && !content.includes('totalUsers &&')) {
    console.log('❌ analytics/route.ts: Missing null check for totalUsers');
  } else {
    console.log('✅ analytics/route.ts: Null checks look good');
  }
}

console.log('\n🏁 Build error detection complete!');
console.log('\n💡 Run the fix script to resolve all issues: node scripts/fix-build-errors.js');
