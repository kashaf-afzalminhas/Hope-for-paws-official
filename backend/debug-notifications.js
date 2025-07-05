const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Post = require('./models/Post');
const Adoption = require('./models/adoptionModel');
const Notification = require('./models/Notification');
const { getNotificationService } = require('./socket');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function debugNotifications() {
  try {
    console.log('\n🔍 Starting Notification System Debug...\n');

    // 1. Check if users exist
    console.log('1️⃣  Checking users...');
    const users = await User.find().limit(5);
    console.log(`Found ${users.length} users`);
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user._id})`);
    });

    // 2. Check if posts exist
    console.log('\n2️⃣  Checking posts...');
    const posts = await Post.find().populate('userId', 'username').limit(5);
    console.log(`Found ${posts.length} posts`);
    posts.forEach(post => {
      console.log(`   - Post by ${post.userId?.username || 'Unknown'} (ID: ${post._id})`);
    });

    // 3. Check if adoption posts exist
    console.log('\n3️⃣  Checking adoption posts...');
    const adoptions = await Adoption.find().populate('userId', 'username').limit(5);
    console.log(`Found ${adoptions.length} adoption posts`);
    adoptions.forEach(adoption => {
      console.log(`   - ${adoption.name} by ${adoption.userId?.username || 'Unknown'} (ID: ${adoption._id})`);
    });

    // 4. Check existing notifications
    console.log('\n4️⃣  Checking existing notifications...');
    const notifications = await Notification.find().populate('recipient', 'username').limit(10);
    console.log(`Found ${notifications.length} notifications`);
    notifications.forEach(notif => {
      console.log(`   - ${notif.title} to ${notif.recipient?.username || 'Unknown'} (${notif.type})`);
    });

    // 5. Test notification service
    console.log('\n5️⃣  Testing notification service...');
    try {
      const notificationService = getNotificationService();
      console.log('✅ Notification service initialized successfully');
      
      // Test creating a notification
      if (users.length > 0 && posts.length > 0) {
        const testUser = users[0];
        const testPost = posts[0];
        
        console.log(`\n📝 Creating test notification for user: ${testUser.username}`);
        
        const testNotification = await notificationService.createNotification({
          type: 'test',
          recipient: testUser._id,
          title: 'Test Notification',
          message: 'This is a test notification to verify the system is working.',
          relatedPost: testPost._id,
          emailSent: false
        });
        
        console.log('✅ Test notification created:', testNotification._id);
        
        // Test sending real-time notification
        console.log('\n📡 Testing real-time notification...');
        notificationService.sendRealTimeNotification(testUser._id, testNotification);
        console.log('✅ Real-time notification sent');
        
        // Test email notification
        console.log('\n📧 Testing email notification...');
        await notificationService.sendEmailNotification(testNotification);
        console.log('✅ Email notification sent');
        
      } else {
        console.log('⚠️  Not enough data to test notifications');
      }
      
    } catch (error) {
      console.error('❌ Error testing notification service:', error);
    }

    // 6. Check Socket.IO status
    console.log('\n6️⃣  Checking Socket.IO status...');
    try {
      const { getIO } = require('./socket');
      const io = getIO();
      console.log('✅ Socket.IO is initialized');
      console.log(`📊 Active connections: ${io.engine.clientsCount}`);
      
      // Get connected users
      const connectedUsers = [];
      io.sockets.sockets.forEach((socket) => {
        if (socket.userId) {
          connectedUsers.push({
            userId: socket.userId,
            username: socket.user?.username,
            socketId: socket.id
          });
        }
      });
      
      console.log(`🔗 Connected users: ${connectedUsers.length}`);
      connectedUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.userId}) -> Socket: ${user.socketId}`);
      });
      
    } catch (error) {
      console.error('❌ Error checking Socket.IO:', error);
    }

    console.log('\n✅ Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug
debugNotifications(); 