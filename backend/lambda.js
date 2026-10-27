/**
 * AWS Lambda entrypoint for the HopeForPaws Express API.
 *
 * Handler: lambda.handler
 *
 * IMPORTANT: Do not require('./app') at module load time.
 * If app init throws, API Gateway returns a generic 500 with NO CORS headers
 * (browsers report that as a CORS failure). Health/OPTIONS must always work.
 */
process.env.RUNTIME = process.env.RUNTIME || 'lambda';

const mongoose = require('mongoose');
const serverless = require('serverless-http');

const DEFAULT_ORIGINS = [
  'https://hopeforpawshub.co',
  'https://www.hopeforpawshub.co',
  'https://hopeforpaws.club',
  'https://www.hopeforpaws.club',
  'http://localhost:5173',
  'http://localhost:5174',
];

const loadAllowedOrigins = () => {
  const origins = new Set(DEFAULT_ORIGINS);
  try {
    const { ALLOWED_ORIGINS } = require('./config/allowedOrigins');
    for (const o of ALLOWED_ORIGINS || []) origins.add(o);
  } catch (_) {
    /* defaults are enough */
  }
  const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (frontend) origins.add(frontend);
  // Also allow www/non-www twin of FRONTEND_URL
  if (frontend.startsWith('https://www.')) {
    origins.add(frontend.replace('https://www.', 'https://'));
  } else if (frontend.startsWith('https://')) {
    origins.add(frontend.replace('https://', 'https://www.'));
  }
  for (const o of (process.env.CORS_ORIGINS || '').split(',')) {
    const trimmed = o.trim().replace(/\/$/, '');
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
};

const ALLOWED_ORIGINS = loadAllowedOrigins();

let cachedHandler = null;
let appLoadError = null;
let lastDbError = null;

const getHeader = (headers = {}, name) => {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (String(key).toLowerCase() === target) return value;
  }
  return undefined;
};

const buildCorsHeaders = (event) => {
  const origin = getHeader(event?.headers, 'origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,If-None-Match,ETag',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
};

const jsonResponse = (event, statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...buildCorsHeaders(event),
  },
  body: JSON.stringify(body),
});

const getPath = (event) =>
  event?.rawPath || event?.path || event?.requestContext?.http?.path || '';

const getMethod = (event) =>
  event?.requestContext?.http?.method || event?.httpMethod || 'GET';

const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/** Lambda has no CA files on disk; DocumentDB tlsCAFile=... paths break connect. */
const sanitizeMongoUri = (uri = '') =>
  String(uri)
    .replace(/([?&])tlsCAFile=[^&]*/gi, '$1')
    .replace(/([?&])sslCAFile=[^&]*/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?')
    .replace(/&&+/g, '&');

const mongoNeedsTls = (uri = '') =>
  /(?:^mongodb\+srv:)|(?:[?&]tls=true)|(?:\.docdb\.amazonaws\.com)/i.test(uri);

const resetMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(true);
    }
  } catch (err) {
    console.warn('mongo reset failed:', err.message);
  }
};

const ensureDb = async () => {
  if (mongoose.connection.readyState === 1) {
    lastDbError = null;
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set on this Lambda');
  }

  // Avoid waiting forever on a stuck "connecting" state from a prior invoke
  if (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 3) {
    await resetMongo();
  }

  const uri = sanitizeMongoUri(process.env.MONGO_URI);
  try {
    await mongoose.connect(uri, {
      ...(mongoNeedsTls(uri) ? { tls: true } : {}),
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 5,
    });
    lastDbError = null;
  } catch (err) {
    lastDbError = String(err?.message || err);
    await resetMongo();
    throw err;
  }
};

const getExpressHandler = () => {
  if (cachedHandler) return cachedHandler;

  try {
    const app = require('./app');
    cachedHandler = serverless(app, {
      provider: 'aws',
      binary: [
        'multipart/form-data',
        'image/*',
        'application/octet-stream',
        'application/pdf',
      ],
    });
    appLoadError = null;
    return cachedHandler;
  } catch (err) {
    appLoadError = err;
    console.error('Failed to load Express app:', err);
    throw err;
  }
};

const mergeCors = (event, result) => {
  if (!result || typeof result !== 'object') {
    return jsonResponse(event, 500, { message: 'Invalid handler response' });
  }
  const corsHeaders = buildCorsHeaders(event);
  const statusCode = result.statusCode || result.status || 200;
  return {
    ...result,
    statusCode,
    headers: { ...(result.headers || {}), ...corsHeaders },
  };
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const method = getMethod(event);
  const path = getPath(event);

  // Always answer preflight — never depends on Express or Mongo
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: buildCorsHeaders(event),
      body: '',
    };
  }

  // Liveness — proves this Lambda code is what API Gateway is calling
  if (method === 'GET' && (path === '/health' || path.endsWith('/health'))) {
    return jsonResponse(event, 200, {
      status: 'OK',
      runtime: 'lambda',
      handler: 'lambda.handler',
      commitHint: 'mongo-timeout-cors-v2',
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      mongoReadyState: mongoose.connection.readyState,
      appLoaded: Boolean(cachedHandler),
      appLoadError: appLoadError ? String(appLoadError.message || appLoadError) : null,
      lastDbError,
      allowedOriginCount: ALLOWED_ORIGINS.length,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  try {
    // Hard cap so API Gateway never synthesizes a CORS-less 500 on timeout
    const remaining = typeof context.getRemainingTimeInMillis === 'function'
      ? context.getRemainingTimeInMillis()
      : 25000;
    const budget = Math.max(3000, Math.min(12000, remaining - 2000));

    await withTimeout(ensureDb(), Math.min(6000, budget), 'MongoDB connect');
    const handler = getExpressHandler();
    const result = await withTimeout(
      handler(event, context),
      Math.max(2000, budget - 1000),
      'Request handler'
    );
    return mergeCors(event, result);
  } catch (err) {
    console.error('Lambda handler error:', err);
    const isDb = /mongo|MONGO_URI|server selection|ECONNREFUSED|ENOTFOUND|timed out/i.test(
      String(err?.message || err)
    );
    return jsonResponse(event, isDb ? 503 : 500, {
      message: isDb
        ? 'Database is unavailable. Please try again shortly.'
        : 'Something went wrong!',
      error: String(err?.message || err),
    });
  }
};
