// Test script for Post Review System
// Run this in browser console to test the APIs

const BASE_URL = 'http://localhost:3000';

// Test 1: Create a post (as student)
async function testCreatePost() {
try {
    const token = localStorage.getItem('token');
    if (!token) {
return;
    }

    const response = await fetch(`${BASE_URL}/api/student/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        content: 'This is a test educational post for review system testing',
        hashtags: ['test', 'education', 'review'],
        isPrivate: false
      })
    });

    const result = await response.json();
if (result.success) {
}
  } catch {}
}

// Test 2: Get pending posts (as student)
async function testGetPendingPosts() {
try {
    const token = localStorage.getItem('token');
    if (!token) {
return;
    }

    const response = await fetch(`${BASE_URL}/api/student/posts/pending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
} catch {}
}

// Test 3: Get approved posts (as student)
async function testGetApprovedPosts() {
try {
    const token = localStorage.getItem('token');
    if (!token) {
return;
    }

    const response = await fetch(`${BASE_URL}/api/student/posts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
} catch {}
}

// Test 4: Review posts (as admin)
async function testReviewPost(postId, action = 'approve') {
try {
    const token = localStorage.getItem('token');
    if (!token) {
return;
    }

    const body = { postId, action };
    if (action === 'reject') {
      body.rejectionReason = 'Test rejection reason';
    }

    const response = await fetch(`${BASE_URL}/api/admin/posts/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
} catch {}
}

// Test 5: Get pending posts for admin
async function testAdminGetPendingPosts() {
try {
    const token = localStorage.getItem('token');
    if (!token) {
return;
    }

    const response = await fetch(`${BASE_URL}/api/admin/posts/review`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
} catch {}
}

// Run all tests
async function runAllTests() {
await testCreatePost();
await testGetPendingPosts();
await testGetApprovedPosts();
await testAdminGetPendingPosts();
}

// Export functions for manual testing
window.testPostReview = {
  createPost: testCreatePost,
  getPendingPosts: testGetPendingPosts,
  getApprovedPosts: testGetApprovedPosts,
  reviewPost: testReviewPost,
  adminGetPendingPosts: testAdminGetPendingPosts,
  runAllTests: runAllTests
};

