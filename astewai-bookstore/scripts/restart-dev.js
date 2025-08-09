#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔄 Restarting Development Server...\n');

// Clear Next.js cache
console.log('Clearing Next.js cache...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ Cache cleared');
  }
} catch (error) {
  console.log('❌ Error clearing cache:', error.message);
}

console.log('\n🚀 Starting development server...');
console.log('Run: pnpm dev');
console.log('\nIf you still get chunk errors, try:');
console.log('- pnpm dev --turbo=false (disable Turbopack)');
console.log('- rm -rf node_modules && pnpm install (reinstall dependencies)');
console.log('- Check browser console for specific error details');

console.log('\n✨ Ready to restart!');