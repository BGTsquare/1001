#!/usr/bin/env node

const fetch = require('node-fetch');

async function fixStorage() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Checking and fixing storage configuration...\n');

  try {
    // Check storage status
    console.log('1. Checking storage status...');
    const statusResponse = await fetch(`${baseUrl}/api/admin/storage/status`);
    
    if (!statusResponse.ok) {
      console.log('   ❌ Cannot check storage status. Make sure your dev server is running.');
      console.log('   Run: pnpm dev');
      return;
    }

    const status = await statusResponse.json();
    console.log('   ✅ Storage status retrieved');
    console.log(`   📊 Total buckets: ${status.storage?.totalBuckets || 0}`);
    console.log(`   📦 Books bucket exists: ${status.storage?.booksBucketExists ? 'Yes' : 'No'}`);
    console.log(`   🔓 Books bucket accessible: ${status.storage?.booksBucketAccessible ? 'Yes' : 'No'}`);

    // If books bucket doesn't exist, create it
    if (!status.storage?.booksBucketExists) {
      console.log('\n2. Creating books storage bucket...');
      
      const setupResponse = await fetch(`${baseUrl}/api/admin/storage/setup`, {
        method: 'POST'
      });

      if (setupResponse.ok) {
        const setupResult = await setupResponse.json();
        console.log('   ✅ Storage bucket created successfully!');
        console.log('   📦 Bucket details:', setupResult.bucket);
      } else {
        const error = await setupResponse.json();
        console.log('   ❌ Failed to create storage bucket:', error.error);
        console.log('   💡 Details:', error.details);
      }
    } else {
      console.log('\n2. Books bucket already exists ✅');
    }

    // Final status check
    console.log('\n3. Final storage check...');
    const finalStatus = await fetch(`${baseUrl}/api/admin/storage/status`);
    const finalResult = await finalStatus.json();
    
    if (finalResult.storage?.booksBucketExists && finalResult.storage?.booksBucketAccessible) {
      console.log('   🎉 Storage is now properly configured!');
      console.log('   📤 You can now upload images and books.');
    } else {
      console.log('   ⚠️  Storage may still have issues.');
      console.log('   🔍 Check the admin dashboard for more details.');
    }

  } catch (error) {
    console.log('❌ Error fixing storage:', error.message);
    console.log('\n💡 Manual steps:');
    console.log('1. Make sure your development server is running: pnpm dev');
    console.log('2. Login as admin and go to Admin Dashboard → Storage');
    console.log('3. Click "Setup Storage" button');
  }

  console.log('\n✨ Storage fix script completed!');
}

fixStorage();