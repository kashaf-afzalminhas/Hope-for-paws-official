const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Adoption = require('../models/adoptionModel');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set. Please set it in backend/.env');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // 1) Ensure a demo user exists (used as owner of seeded data)
  const demoEmail = 'demo@hopeforpaws.local';
  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    const hashed = await bcrypt.hash('Password123!', 10);
    demoUser = await User.create({
      username: 'Demo User',
      email: demoEmail,
      password: hashed,
      city: 'Karachi',
      about: 'Seed user for demo data',
      phoneVerified: true,
      isVeterinarian: false,
    });
    console.log('Created demo user:', demoUser._id.toString());
  } else {
    console.log('Demo user already exists:', demoUser._id.toString());
  }

  // 2) Seed posts if empty
  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    await Post.insertMany([
      {
        userId: demoUser._id,
        caption: 'First rescue success story! Meet Luna. 🐾',
        imageUrl: 'https://placekitten.com/600/400',
      },
      {
        userId: demoUser._id,
        caption: 'Community cleanup day photos. Thank you volunteers!',
        imageUrl: 'https://placekitten.com/640/420',
      },
    ]);
    console.log('Seeded sample posts');
  } else {
    console.log(`Posts already present (${postCount}), skipping post seed`);
  }

  // 3) Seed adoptions if empty
  const adoptionCount = await Adoption.countDocuments();
  if (adoptionCount === 0) {
    await Adoption.insertMany([
      {
        userId: demoUser._id,
        name: 'Buddy',
        age: '2 years',
        petType: 'dog',
        breed: 'Mixed',
        vaccinated: 'Yes',
        neuteredSpayed: 'Yes',
        description: 'Friendly and playful, great with kids.',
        imageUrl: 'https://placedog.net/640/420',
        status: 'available',
        location: 'Karachi, PK',
      },
      {
        userId: demoUser._id,
        name: 'Milo',
        age: '1 year',
        petType: 'cat',
        breed: 'Tabby',
        vaccinated: 'Yes',
        neuteredSpayed: 'Yes',
        description: 'Calm indoor cat, loves naps in sunny spots.',
        imageUrl: 'https://placekitten.com/620/420',
        status: 'available',
        location: 'Lahore, PK',
      },
    ]);
    console.log('Seeded sample adoption ads');
  } else {
    console.log(`Adoptions already present (${adoptionCount}), skipping adoption seed`);
  }

  await mongoose.disconnect();
  console.log('Done seeding');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
