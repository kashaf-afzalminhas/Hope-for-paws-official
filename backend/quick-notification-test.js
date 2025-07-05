const axios = require('axios');

// Test with a real user from your database
const TEST_USER_EMAIL = 'saraafzal@gmail.com'; // Update this with a real user email
const TEST_USER_PASSWORD = '123456'; // Update this with the real password

async function quickTest() {
  try {
    console.log('🧪 Quick Notification Test...\n');

    // 1. Login
    console.log('1️⃣  Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Logged in as: ${user.username} (ID: ${user._id})`);

    // 2. Get posts
    console.log('\n2️⃣  Getting posts...');
    const postsResponse = await axios.get('http://localhost:3000/api/posts');
    const posts = postsResponse.data;
    console.log(`✅ Found ${posts.length} posts`);

    if (posts.length === 0) {
      console.log('❌ No posts found. Please create a post first.');
      return;
    }

    // 3. Test like notification
    console.log('\n3️⃣  Testing like notification...');
    const testPost = posts[0];
    console.log(`📝 Testing with post by: ${testPost.userId?.username || 'Unknown'}`);

    try {
      const likeResponse = await axios.post(
        `http://localhost:3000/api/posts/${testPost._id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Like request sent successfully');
      console.log('📊 Post now has', likeResponse.data.likes.length, 'likes');
      
      // Check if notification was created
      setTimeout(async () => {
        try {
          const notificationsResponse = await axios.get('http://localhost:3000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const notifications = notificationsResponse.data.notifications || [];
          console.log(`\n📋 Found ${notifications.length} notifications after like`);
          
          if (notifications.length > 0) {
            const latest = notifications[0];
            console.log(`📱 Latest: ${latest.title} - ${latest.type} (${latest.isRead ? 'Read' : 'Unread'})`);
          }
        } catch (error) {
          console.log('❌ Failed to check notifications:', error.response?.data?.message || error.message);
        }
      }, 2000);

    } catch (error) {
      console.log('⚠️  Like test failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📱 Check your browser for real-time notifications');
    console.log('📧 Check your email for notification emails');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Update TEST_USER_EMAIL and TEST_USER_PASSWORD with real credentials');
    console.log('2. Your server is running on port 3000');
  }
}

// Run the test
quickTest(); 