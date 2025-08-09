#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Next.js Development Server Issues...\n');

// 1. Clear Next.js cache
console.log('1. Clearing Next.js cache...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('   ✅ .next directory cleared');
  } else {
    console.log('   ℹ️  .next directory not found');
  }
} catch (error) {
  console.log('   ❌ Error clearing .next:', error.message);
}

// 2. Clear Turbopack cache
console.log('\n2. Clearing Turbopack cache...');
try {
  if (fs.existsSync('.next/cache')) {
    fs.rmSync('.next/cache', { recursive: true, force: true });
    console.log('   ✅ Turbopack cache cleared');
  } else {
    console.log('   ℹ️  Turbopack cache not found');
  }
} catch (error) {
  console.log('   ❌ Error clearing Turbopack cache:', error.message);
}

// 3. Check for problematic imports
console.log('\n3. Checking for import issues...');
const problematicFiles = [];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common import issues
    const issues = [];
    
    if (content.includes("from '@/components/ui/") && !content.includes('"use client"') && !content.includes("'use client'")) {
      // Check if it's a client component that needs 'use client'
      if (content.includes('useState') || content.includes('useEffect') || content.includes('onClick')) {
        issues.push('Missing "use client" directive');
      }
    }
    
    // Check for circular imports
    if (content.includes("import") && content.includes("export")) {
      const imports = content.match(/import.*from ['"]([^'"]+)['"]/g) || [];
      const hasCircular = imports.some(imp => imp.includes(filePath.replace(/.*\//, '').replace('.tsx', '').replace('.ts', '')));
      if (hasCircular) {
        issues.push('Potential circular import');
      }
    }
    
    if (issues.length > 0) {
      problematicFiles.push({ file: filePath, issues });
    }
  } catch (error) {
    // Ignore files that can't be read
  }
}

// Recursively check files
function checkDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        checkFile(filePath);
      }
    });
  } catch (error) {
    // Ignore directories that can't be read
  }
}

checkDirectory('src');

if (problematicFiles.length > 0) {
  console.log('   ⚠️  Found potential issues:');
  problematicFiles.forEach(({ file, issues }) => {
    console.log(`      ${file}: ${issues.join(', ')}`);
  });
} else {
  console.log('   ✅ No obvious import issues found');
}

// 4. Check package.json for issues
console.log('\n4. Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check for conflicting versions
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const reactVersion = deps.react;
  const nextVersion = deps.next;
  
  console.log(`   React version: ${reactVersion}`);
  console.log(`   Next.js version: ${nextVersion}`);
  
  // Check for known problematic combinations
  if (reactVersion && reactVersion.startsWith('19') && nextVersion && !nextVersion.includes('15')) {
    console.log('   ⚠️  React 19 requires Next.js 15+');
  } else {
    console.log('   ✅ Package versions look compatible');
  }
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// 5. Provide recommendations
console.log('\n🚀 Recommendations:');
console.log('   1. Restart your development server: pnpm dev');
console.log('   2. If issues persist, try: rm -rf node_modules && pnpm install');
console.log('   3. For persistent chunk errors, try disabling Turbopack: pnpm dev --turbo=false');
console.log('   4. Check browser console for additional error details');

console.log('\n✨ Fix script completed!');