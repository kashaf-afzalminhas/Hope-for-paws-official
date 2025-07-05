const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_USER_EMAIL = 'test@example.com'; // Change this to a real user email
const TEST_USER_PASSWORD = 'testpassword'; // Change this to a real user password

async function testLiveNotifications() {
  try {
    console.log('🧪 Testing Live Notification System...\n');

    // Step 1: Login to get token
    console.log('1️⃣  Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Logged in as: ${user.username}`);

    // Step 2: Get existing posts
    console.log('\n2️⃣  Getting posts...');
    const postsResponse = await axios.get(`${API_BASE_URL}/posts`);
    const posts = postsResponse.data;
    console.log(`✅ Found ${posts.length} posts`);

    if (posts.length === 0) {
      console.log('❌ No posts found. Please create a post first.');
      return;
    }

    // Step 3: Test like notification
    console.log('\n3️⃣  Testing like notification...');
    const testPost = posts[0];
    console.log(`📝 Testing with post: ${testPost.caption?.substring(0, 50)}...`);

    try {
      const likeResponse = await axios.post(
        `${API_BASE_URL}/posts/${testPost._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Like request sent successfully');
      console.log('📊 Post now has', likeResponse.data.likes.length, 'likes');
    } catch (error) {
      console.log('⚠️  Like test failed (might already be liked):', error.response?.data?.message || error.message);
    }

    // Step 4: Test comment notification
    console.log('\n4️⃣  Testing comment notification...');
    try {
      const commentResponse = await axios.post(
        `${API_BASE_URL}/comments/${testPost._id}`,
        {
          content: 'This is a test comment to trigger notification! 🧪'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Comment posted successfully');
      console.log('💬 Comment:', commentResponse.data.content);
    } catch (error) {
      console.log('❌ Comment test failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Get adoption posts
    console.log('\n5️⃣  Getting adoption posts...');
    const adoptionsResponse = await axios.get(`${API_BASE_URL}/adoptions`);
    const adoptions = adoptionsResponse.data;
    console.log(`✅ Found ${adoptions.length} adoption posts`);

    if (adoptions.length === 0) {
      console.log('❌ No adoption posts found. Please create an adoption post first.');
      return;
    }

    // Step 6: Test adoption request notification
    console.log('\n6️⃣  Testing adoption request notification...');
    const testAdoption = adoptions[0];
    console.log(`🐾 Testing with adoption: ${testAdoption.name}`);

    // Create a test image buffer (you'll need to provide a real image file)
    const testImageBuffer = Buffer.from('fake-image-data');
    
    try {
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('email', 'test@example.com');
      formData.append('phone', '1234567890');
      formData.append('message', 'This is a test adoption request! 🧪');
      formData.append('petHistoryImage', testImageBuffer, 'test.jpg');

      const adoptionRequestResponse = await axios.post(
        `${API_BASE_URL}/adoptions/${testAdoption._id}/request`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      console.log('✅ Adoption request sent successfully');
    } catch (error) {
      console.log('❌ Adoption request test failed:', error.response?.data?.message || error.message);
    }

    // Step 7: Check notifications
    console.log('\n7️⃣  Checking notifications...');
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = notificationsResponse.data.notifications || [];
      console.log(`✅ Found ${notifications.length} notifications`);
      
      if (notifications.length > 0) {
        console.log('\n📋 Latest notifications:');
        notifications.slice(0, 5).forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.type} (${notif.isRead ? 'Read' : 'Unread'})`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to fetch notifications:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Live notification test completed!');
    console.log('\n📱 Next steps:');
    console.log('1. Check your browser console for Socket.IO connection messages');
    console.log('2. Look for real-time notifications in the notification bell');
    console.log('3. Check your email for notification emails');
    console.log('4. Check server logs for debug messages');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Your server is running (npm start)');
    console.log('2. Update TEST_USER_EMAIL and TEST_USER_PASSWORD in this script');
    console.log('3. You have posts and adoption posts in your database');
  }
}

// Instructions for user
console.log('📋 Before running this test:');
console.log('1. Make sure your server is running: npm start');
console.log('2. Update TEST_USER_EMAIL and TEST_USER_PASSWORD in this script');
console.log('3. Make sure you have posts and adoption posts in your database');
console.log('4. Run: node test-live-notifications.js\n');

// Uncomment the line below to run the test
// testLiveNotifications();

module.exports = { testLiveNotifications }; 