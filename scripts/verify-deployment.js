#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests that the backend API is working correctly
 */

const API_URL = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5201/api';
const BASE_URL = API_URL.replace('/api', '');

async function testEndpoint(url, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`   ✅ Success`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyDeployment() {
  console.log('🚀 Deployment Verification Script');
  console.log('=====================================\n');
  console.log(`📡 API Base URL: ${BASE_URL}`);
  console.log(`📡 API Endpoint: ${API_URL}\n`);

  const results = {
    health: null,
    appData: null,
  };

  // Test 1: Health endpoint
  results.health = await testEndpoint(
    `${BASE_URL}/health`,
    'Health Check Endpoint'
  );

  if (!results.health.success) {
    console.error('\n❌ Health check failed. Backend may not be running.');
    console.error('   Make sure the backend server is started:');
    console.error('   cd server && npm run dev');
    process.exit(1);
  }

  // Check database connection status
  if (results.health.data && results.health.data.db === 'connected') {
    console.log('\n✅ Database is connected!');
  } else {
    console.warn('\n⚠️  Database is disconnected. Check MongoDB connection.');
  }

  // Test 2: App data endpoint
  results.appData = await testEndpoint(
    `${API_URL}/app-data?userId=test`,
    'App Data Endpoint'
  );

  if (!results.appData.success) {
    console.error('\n❌ App data endpoint failed.');
    process.exit(1);
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Verification Summary');
  console.log('=====================================');
  console.log(`Health Check: ${results.health.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`App Data API: ${results.appData.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database: ${results.health.data?.db === 'connected' ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);

  if (results.health.success && results.appData.success) {
    console.log('\n🎉 All checks passed! Deployment is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch((error) => {
  console.error('\n❌ Verification script error:', error);
  process.exit(1);
});

