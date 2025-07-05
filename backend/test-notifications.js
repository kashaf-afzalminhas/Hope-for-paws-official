const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./models/Notification');
const User = require('./models/User');
const nodemailer = require('nodemailer');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Test email function
const testEmail = async () => {
  try {
    console.log('Testing email configuration...');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set');
    console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set' : 'Not set');
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself for testing
      subject: 'Test Notification - Hope for Paws',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f4ed; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: #6b493d; margin-bottom: 10px;">🐾 Hope for Paws</h1>
            <h2 style="color: #4E3B31; margin-bottom: 20px;">Test Notification</h2>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="color: #4E3B31; font-size: 16px; line-height: 1.6;">
              This is a test notification to verify that the email system is working properly.
            </p>
            
            <div style="margin-top: 30px; text-center;">
              <p style="color: #8B5A2B; font-size: 14px;">
                If you received this email, the notification system is configured correctly!
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email test successful!');
    console.log('Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    return false;
  }
};

// Test notification creation
const testNotificationCreation = async () => {
  try {
    console.log('\nTesting notification creation...');
    
    // Find a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found in database. Please create a user first.');
      return false;
    }
    
    console.log('Found test user:', testUser.username);
    
    // Create a test notification
    const testNotification = new Notification({
      recipient: testUser._id,
      sender: testUser._id,
      type: 'POST_LIKE',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      isRead: false,
      emailSent: false
    });
    
    await testNotification.save();
    console.log('✅ Test notification created successfully!');
    console.log('Notification ID:', testNotification._id);
    
    return true;
  } catch (error) {
    console.error('❌ Notification creation test failed:', error.message);
    return false;
  }
};

// Test notification retrieval
const testNotificationRetrieval = async () => {
  try {
    console.log('\nTesting notification retrieval...');
    
    const notifications = await Notification.find()
      .populate('recipient', 'username email')
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`✅ Found ${notifications.length} notifications`);
    
    if (notifications.length > 0) {
      console.log('Latest notification:');
      console.log('- Title:', notifications[0].title);
      console.log('- Message:', notifications[0].message);
      console.log('- Type:', notifications[0].type);
      console.log('- Recipient:', notifications[0].recipient?.username);
      console.log('- Is Read:', notifications[0].isRead);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Notification retrieval test failed:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Starting Notification System Tests...\n');
  
  const emailTest = await testEmail();
  const notificationCreationTest = await testNotificationCreation();
  const notificationRetrievalTest = await testNotificationRetrieval();
  
  console.log('\n📊 Test Results:');
  console.log('Email Test:', emailTest ? '✅ PASSED' : '❌ FAILED');
  console.log('Notification Creation:', notificationCreationTest ? '✅ PASSED' : '❌ FAILED');
  console.log('Notification Retrieval:', notificationRetrievalTest ? '✅ PASSED' : '❌ FAILED');
  
  if (emailTest && notificationCreationTest && notificationRetrievalTest) {
    console.log('\n🎉 All tests passed! The notification system is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration.');
  }
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\nDatabase connection closed.');
};

// Run the tests
runTests().catch(console.error); 