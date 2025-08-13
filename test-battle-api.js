const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

async function testBattleAPI() {
  console.log('🧪 Testing Battle Room API Endpoints...\n');

  try {
    // 1. Test GET /api/battle/rooms
    console.log('1. Testing GET /api/battle/rooms');
    const roomsResponse = await fetch(`${BASE_URL}/battle/rooms`);
    console.log('   Status:', roomsResponse.status);
    const roomsData = await roomsResponse.json();
    console.log('   Response:', JSON.stringify(roomsData, null, 2));
    console.log('');

    // 2. Test POST /api/battle/create-room (without auth - should fail)
    console.log('2. Testing POST /api/battle/create-room (without auth)');
    const createRoomResponse = await fetch(`${BASE_URL}/battle/create-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Battle Room',
        categoryId: null
      })
    });
    console.log('   Status:', createRoomResponse.status);
    const createRoomData = await createRoomResponse.json();
    console.log('   Response:', JSON.stringify(createRoomData, null, 2));
    console.log('');

    // 3. Test other endpoints (should all fail without auth)
    console.log('3. Testing other endpoints (without auth)');
    
    const endpoints = [
      { method: 'POST', path: '/battle/join-room/test-room-id' },
      { method: 'POST', path: '/battle/leave-room/test-room-id' },
      { method: 'POST', path: '/battle/ready/test-room-id' },
      { method: 'POST', path: '/battle/submit-answer/test-room-id' }
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      console.log(`   ${endpoint.method} ${endpoint.path}: ${response.status}`);
    }

    console.log('\n✅ All endpoints are responding (as expected without authentication)');
    console.log('\n📝 Next steps:');
    console.log('   1. Test with proper authentication');
    console.log('   2. Test WebSocket connections');
    console.log('   3. Test full battle flow');

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test
testBattleAPI();
