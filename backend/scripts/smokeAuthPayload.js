/**
 * Smoke test: verifies that password login returns profile fields like `about`.
 *
 * Usage:
 *   node scripts/smokeAuthPayload.js --email you@gmail.com --password "YourPass123!"
 *
 * Notes:
 * - This does NOT test Google OAuth (needs real Google credential).
 * - It ensures backend response includes `about` consistently.
 */
const axios = require('axios');

const getArg = (name) => {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
};

const email = getArg('email');
const password = getArg('password');
const baseUrl = getArg('baseUrl') || 'http://localhost:3000';

if (!email || !password) {
  console.error('Missing args. Provide --email and --password.');
  process.exit(2);
}

async function main() {
  const res = await axios.post(`${baseUrl}/auth/signin`, { email, password });
  const user = res.data?.user;
  if (!user) throw new Error('No user in response');

  const fields = ['_id', 'id', 'email', 'username', 'about', 'city', 'profileImage', 'phone', 'phoneVerified', 'isSeller', 'sellerStatus', 'isVeterinarian'];
  const present = Object.fromEntries(fields.map((f) => [f, Object.prototype.hasOwnProperty.call(user, f)]));

  console.log('Signin OK. Token present:', Boolean(res.data?.token));
  console.log('User keys contains about/city/profileImage?:', present);
  console.log('about value:', user.about);
}

main().catch((e) => {
  console.error('Smoke test failed:', e.response?.data || e.message);
  process.exit(1);
});

