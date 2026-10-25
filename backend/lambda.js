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
    /* ignore — defaults are enough for CORS */
  }
  const frontend = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  if (frontend) origins.add(frontend);
  for (const o of (process.env.CORS_ORIGINS || '').split(',')) {
    const trimmed = o.trim();
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
};

const ALLOWED_ORIGINS = loadAllowedOrigins();

let cachedHandler = null;
let appLoadError = null;

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

const mongoNeedsTls = (uri = '') =>
  /(?:^mongodb\+srv:)|(?:[?&]tls=true)|(?:\.docdb\.amazonaws\.com)/i.test(uri);

const ensureDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = (err) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        mongoose.connection.off('connected', onConnected);
        mongoose.connection.off('error', onError);
      };
      mongoose.connection.on('connected', onConnected);
      mongoose.connection.on('error', onError);
    });
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set on this Lambda');
  }

  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri, {
    ...(mongoNeedsTls(uri) ? { tls: true } : {}),
    serverSelectionTimeoutMS: 10000,
  });
};

const getExpressHandler = () => {
  if (cachedHandler) return cachedHandler;

  try {
    // Lazy-load so OPTIONS/health still work if Express fails to boot
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
      commitHint: 'lazy-app-load',
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      mongoReadyState: mongoose.connection.readyState,
      appLoaded: Boolean(cachedHandler),
      appLoadError: appLoadError ? String(appLoadError.message || appLoadError) : null,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  try {
    await ensureDb();
    const handler = getExpressHandler();
    const result = await handler(event, context);
    const corsHeaders = buildCorsHeaders(event);
    result.headers = { ...(result.headers || {}), ...corsHeaders };
    if (!result.statusCode && result.status) {
      // some wrappers use `status`
      result.statusCode = result.status;
    }
    return result;
  } catch (err) {
    console.error('Lambda handler error:', err);
    return jsonResponse(event, 500, {
      message: 'Something went wrong!',
      error: String(err?.message || err),
    });
  }
};
