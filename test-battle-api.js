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
try {
    // 1. Test GET /api/battle/rooms
const roomsResponse = await fetch(`${BASE_URL}/battle/rooms`);
const roomsData = await roomsResponse.json();
// 2. Test POST /api/battle/create-room (without auth - should fail)
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
const createRoomData = await createRoomResponse.json();
// 3. Test other endpoints (should all fail without auth)
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
}

} catch {}
}

// Run the test
testBattleAPI();
