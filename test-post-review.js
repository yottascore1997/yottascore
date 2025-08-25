// Test script for Post Review System
// Run this in browser console to test the APIs

const BASE_URL = 'http://localhost:3000';

// Test 1: Create a post (as student)
async function testCreatePost() {
  console.log('🧪 Testing: Create Post');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login first.');
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
    console.log('✅ Post created:', result);
    
    if (result.success) {
      console.log('✅ Post submitted for review successfully!');
    }
  } catch (error) {
    console.error('❌ Error creating post:', error);
  }
}

// Test 2: Get pending posts (as student)
async function testGetPendingPosts() {
  console.log('🧪 Testing: Get Pending Posts');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login first.');
      return;
    }

    const response = await fetch(`${BASE_URL}/api/student/posts/pending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('✅ Pending posts:', result);
    console.log(`📊 Found ${result.length} pending posts`);
  } catch (error) {
    console.error('❌ Error getting pending posts:', error);
  }
}

// Test 3: Get approved posts (as student)
async function testGetApprovedPosts() {
  console.log('🧪 Testing: Get Approved Posts');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login first.');
      return;
    }

    const response = await fetch(`${BASE_URL}/api/student/posts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('✅ Approved posts:', result);
    console.log(`📊 Found ${result.length} approved posts`);
  } catch (error) {
    console.error('❌ Error getting approved posts:', error);
  }
}

// Test 4: Review posts (as admin)
async function testReviewPost(postId, action = 'approve') {
  console.log(`🧪 Testing: Review Post (${action})`);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login as admin first.');
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
    console.log(`✅ Post ${action}ed:`, result);
  } catch (error) {
    console.error(`❌ Error ${action}ing post:`, error);
  }
}

// Test 5: Get pending posts for admin
async function testAdminGetPendingPosts() {
  console.log('🧪 Testing: Admin Get Pending Posts');
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please login as admin first.');
      return;
    }

    const response = await fetch(`${BASE_URL}/api/admin/posts/review`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await response.json();
    console.log('✅ Admin pending posts:', result);
    console.log(`📊 Found ${result.length} posts for admin review`);
  } catch (error) {
    console.error('❌ Error getting admin pending posts:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Post Review System Tests...\n');
  
  await testCreatePost();
  console.log('\n---\n');
  
  await testGetPendingPosts();
  console.log('\n---\n');
  
  await testGetApprovedPosts();
  console.log('\n---\n');
  
  await testAdminGetPendingPosts();
  console.log('\n---\n');
  
  console.log('✅ All tests completed!');
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

console.log('🧪 Post Review Test Script Loaded!');
console.log('Available functions:');
console.log('- testPostReview.createPost()');
console.log('- testPostReview.getPendingPosts()');
console.log('- testPostReview.getApprovedPosts()');
console.log('- testPostReview.reviewPost(postId, "approve")');
console.log('- testPostReview.reviewPost(postId, "reject")');
console.log('- testPostReview.adminGetPendingPosts()');
console.log('- testPostReview.runAllTests()');
