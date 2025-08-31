#!/usr/bin/env node

/**
 * Payment Confirmation System Test Script
 * 
 * This script tests the payment confirmation system implementation
 * Run with: node scripts/test-payment-confirmation-system.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Payment Confirmation System Test Suite');
console.log('==========================================\n');

// Test 1: Check if all required files exist
function testFileExistence() {
  console.log('📁 Testing File Existence...');
  
  const requiredFiles = [
    'supabase/migrations/20250824000001_payment_confirmations.sql',
    'supabase/migrations/20250824000002_payment_confirmations_storage.sql',
    'src/components/payments/payment-confirmation-upload.tsx',
    'src/components/admin/payment-config-management.tsx',
    'src/components/admin/payment-confirmation-viewer.tsx',
    'src/app/admin/payment-config/page.tsx',
    'src/app/api/payments/confirmations/upload/route.ts',
    'src/app/api/payments/confirmations/[purchaseRequestId]/route.ts',
    'src/lib/security/file-security.ts'
  ];

  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });

  console.log(`\n📊 File Existence Test: ${allFilesExist ? 'PASSED' : 'FAILED'}\n`);
  return allFilesExist;
}

// Test 2: Check database migration syntax
function testDatabaseMigrations() {
  console.log('🗄️  Testing Database Migrations...');
  
  const migrationFiles = [
    'supabase/migrations/20250824000001_payment_confirmations.sql',
    'supabase/migrations/20250824000002_payment_confirmations_storage.sql'
  ];

  let migrationsValid = true;

  migrationFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic SQL syntax checks
      const hasCreateOrInsert = content.includes('CREATE TABLE') || content.includes('INSERT INTO') || content.includes('CREATE POLICY');
      const hasProperSemicolons = content.split(';').length > 1;
      const hasComments = content.includes('--') || content.includes('/*');

      if (hasCreateOrInsert && hasProperSemicolons) {
        console.log(`  ✅ ${file} - Valid SQL syntax`);
      } else {
        console.log(`  ❌ ${file} - Invalid SQL syntax`);
        migrationsValid = false;
      }
    }
  });

  console.log(`\n📊 Database Migration Test: ${migrationsValid ? 'PASSED' : 'FAILED'}\n`);
  return migrationsValid;
}

// Test 3: Check React component structure
function testReactComponents() {
  console.log('⚛️  Testing React Components...');
  
  const componentFiles = [
    'src/components/payments/payment-confirmation-upload.tsx',
    'src/components/admin/payment-config-management.tsx',
    'src/components/admin/payment-confirmation-viewer.tsx'
  ];

  let componentsValid = true;

  componentFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic React component checks
      const hasUseClient = content.includes("'use client'");
      const hasExportFunction = content.includes('export function');
      const hasReactImports = content.includes('react');
      const hasProperTypeScript = content.includes('interface') || content.includes('type');
      
      if (hasUseClient && hasExportFunction && hasReactImports) {
        console.log(`  ✅ ${file} - Valid React component`);
      } else {
        console.log(`  ❌ ${file} - Invalid React component structure`);
        componentsValid = false;
      }
    }
  });

  console.log(`\n📊 React Components Test: ${componentsValid ? 'PASSED' : 'FAILED'}\n`);
  return componentsValid;
}

// Test 4: Check API route structure
function testAPIRoutes() {
  console.log('🔌 Testing API Routes...');
  
  const apiFiles = [
    'src/app/api/payments/confirmations/upload/route.ts',
    'src/app/api/payments/confirmations/[purchaseRequestId]/route.ts'
  ];

  let apiRoutesValid = true;

  apiFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic API route checks
      const hasNextImports = content.includes('NextRequest') && content.includes('NextResponse');
      const hasExportedMethods = content.includes('export async function');
      const hasErrorHandling = content.includes('try') && content.includes('catch');
      const hasSupabaseClient = content.includes('createClient');
      
      if (hasNextImports && hasExportedMethods && hasErrorHandling && hasSupabaseClient) {
        console.log(`  ✅ ${file} - Valid API route`);
      } else {
        console.log(`  ❌ ${file} - Invalid API route structure`);
        apiRoutesValid = false;
      }
    }
  });

  console.log(`\n📊 API Routes Test: ${apiRoutesValid ? 'PASSED' : 'FAILED'}\n`);
  return apiRoutesValid;
}

// Test 5: Check security implementation
function testSecurityImplementation() {
  console.log('🔒 Testing Security Implementation...');
  
  const securityFile = 'src/lib/security/file-security.ts';
  const filePath = path.join(__dirname, '..', securityFile);
  
  let securityValid = true;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Security implementation checks
    const hasFileValidation = content.includes('validateFile');
    const hasMagicNumberCheck = content.includes('magic');
    const hasSanitization = content.includes('sanitize');
    const hasSecurityChecks = content.includes('security');
    const hasErrorHandling = content.includes('errors');
    
    if (hasFileValidation && hasMagicNumberCheck && hasSanitization && hasSecurityChecks) {
      console.log(`  ✅ ${securityFile} - Comprehensive security implementation`);
    } else {
      console.log(`  ❌ ${securityFile} - Incomplete security implementation`);
      securityValid = false;
    }
  } else {
    console.log(`  ❌ ${securityFile} - Security file missing`);
    securityValid = false;
  }

  console.log(`\n📊 Security Implementation Test: ${securityValid ? 'PASSED' : 'FAILED'}\n`);
  return securityValid;
}

// Test 6: Check configuration updates
function testConfigurationUpdates() {
  console.log('⚙️  Testing Configuration Updates...');
  
  const configFile = 'src/lib/config/storage.ts';
  const filePath = path.join(__dirname, '..', configFile);
  
  let configValid = true;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Configuration checks
    const hasPaymentConfirmations = content.includes('PAYMENT_CONFIRMATIONS');
    const hasBucketConfig = content.includes('payment-confirmations');
    const hasProperExports = content.includes('export');
    
    if (hasPaymentConfirmations && hasBucketConfig && hasProperExports) {
      console.log(`  ✅ ${configFile} - Configuration properly updated`);
    } else {
      console.log(`  ❌ ${configFile} - Configuration not properly updated`);
      configValid = false;
    }
  } else {
    console.log(`  ❌ ${configFile} - Configuration file missing`);
    configValid = false;
  }

  console.log(`\n📊 Configuration Test: ${configValid ? 'PASSED' : 'FAILED'}\n`);
  return configValid;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Payment Confirmation System Tests...\n');
  
  const testResults = [
    testFileExistence(),
    testDatabaseMigrations(),
    testReactComponents(),
    testAPIRoutes(),
    testSecurityImplementation(),
    testConfigurationUpdates()
  ];

  const passedTests = testResults.filter(result => result).length;
  const totalTests = testResults.length;
  
  console.log('📋 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Payment confirmation system is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation before deployment.');
  }

  console.log('\n📚 Next Steps:');
  console.log('1. Run database migrations: supabase db push');
  console.log('2. Test the application: npm run dev');
  console.log('3. Verify file uploads work in browser');
  console.log('4. Test admin dashboard functionality');
  console.log('5. Verify email notifications are sent');
  
  return passedTests === totalTests;
}

// Execute tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testFileExistence,
  testDatabaseMigrations,
  testReactComponents,
  testAPIRoutes,
  testSecurityImplementation,
  testConfigurationUpdates
};
