const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
dotenv.config();

const adminEmails = [
  'kashafafzal909@gmail.com',
  'laibaanoor1616@gmail.com',
  'sahabnoor193@gmail.com'
];
const defaultPassword = 'Hope4PawsAdmin2024!';

async function createOrUpdateAdmins() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  for (const email of adminEmails) {
    let user = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    if (user) {
      user.isAdmin = true;
      user.password = hashedPassword;
      await user.save();
      console.log(`Updated admin: ${email}`);
    } else {
      user = new User({
        username: email.split('@')[0],
        email,
        password: hashedPassword,
        isAdmin: true,
        isVeterinarian: false
      });
      await user.save();
      console.log(`Created admin: ${email}`);
    }
  }
  await mongoose.disconnect();
  console.log('Done.');
}

createOrUpdateAdmins().catch(err => {
  console.error('Error creating/updating admins:', err);
  process.exit(1);
}); 