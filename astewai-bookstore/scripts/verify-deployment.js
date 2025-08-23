#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Verifying deployment readiness...');

try {
  // Check TypeScript with relaxed config
  console.log('Checking TypeScript...');
  execSync('npm run type-check:safe', { stdio: 'inherit' });
  
  // Run build
  console.log('Running build...');
  execSync('npm run build:safe', { stdio: 'inherit' });
  
  console.log('✅ Build verification successful! Ready for deployment.');
} catch (error) {
  console.log('❌ Build verification failed:', error.message);
  process.exit(1);
}