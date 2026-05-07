const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const buildProviders = (user) => {
  const providers = Array.isArray(user.authProviders) ? [...user.authProviders] : [];
  const hasLocal = providers.some((p) => p.provider === 'local');
  const hasGoogle = providers.some((p) => p.provider === 'google');

  if (user.password && !hasLocal) {
    providers.push({
      provider: 'local',
      providerId: null,
      linkedAt: user.createdAt || new Date()
    });
  }

  if (user.id && !hasGoogle) {
    providers.push({
      provider: 'google',
      providerId: user.id,
      linkedAt: user.createdAt || new Date()
    });
  }

  return providers;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    const nextProviders = buildProviders(user);
    const changed =
      JSON.stringify(nextProviders.map((p) => ({ provider: p.provider, providerId: p.providerId || null }))) !==
      JSON.stringify((user.authProviders || []).map((p) => ({ provider: p.provider, providerId: p.providerId || null })));

    if (changed) {
      user.email = String(user.email || '').trim().toLowerCase();
      user.authProviders = nextProviders;
      await user.save();
      updated += 1;
    }
  }

  console.log(`Migration finished. Updated ${updated} users.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Migration failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
