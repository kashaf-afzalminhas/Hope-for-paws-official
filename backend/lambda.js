/**
 * AWS Lambda entrypoint for the HopeForPaws Express API.
 *
 * Console upload settings:
 *   Runtime:  Node.js 20.x
 *   Handler:  lambda.handler
 *   Arch:     x86_64
 *   Timeout:  29 seconds (API Gateway max)
 *   Memory:   1024 MB (or higher)
 *
 * Set RUNTIME=lambda in the function environment variables as well.
 */
process.env.RUNTIME = process.env.RUNTIME || 'lambda';

const mongoose = require('mongoose');
const serverless = require('serverless-http');

const { ALLOWED_ORIGINS: BASE_ALLOWED_ORIGINS } = require('./config/allowedOrigins');
const ALLOWED_ORIGINS = [
  ...BASE_ALLOWED_ORIGINS,
  'https://www.hopeforpaws.club',
  'https://hopeforpaws.club',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : []),
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
];

const app = require('./app');

let cachedHandler;

const getHeader = (headers = {}, name) => {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
};

const buildCorsHeaders = (event) => {
  const origin = getHeader(event?.headers || {}, 'origin');
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
    // Connecting — wait briefly
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
    throw new Error('MONGO_URI environment variable is not set');
  }

  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri, {
    ...(mongoNeedsTls(uri) ? { tls: true } : {}),
    serverSelectionTimeoutMS: 10000,
  });
};

const getHandler = async () => {
  if (!cachedHandler) {
    cachedHandler = serverless(app, {
      // Support REST API (v1) and HTTP API (v2) event formats
      provider: 'aws',
      binary: [
        'multipart/form-data',
        'image/*',
        'application/octet-stream',
        'application/pdf',
      ],
    });
  }
  return cachedHandler;
};

exports.handler = async (event, context) => {
  // Keep MongoDB connections warm across invocations
  context.callbackWaitsForEmptyEventLoop = false;

  const method = getMethod(event);
  const path = getPath(event);

  // Preflight must never depend on Mongo — browsers show this as a CORS failure otherwise
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: buildCorsHeaders(event),
      body: '',
    };
  }

  // Liveness without DB so deploys can be verified even when Mongo is down
  if (method === 'GET' && (path === '/health' || path.endsWith('/health'))) {
    return jsonResponse(event, 200, {
      status: 'OK',
      runtime: 'lambda',
      mongoReadyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  try {
    await ensureDb();
    const handler = await getHandler();
    const result = await handler(event, context);

    // Ensure CORS headers exist even if a route forgot them
    const corsHeaders = buildCorsHeaders(event);
    result.headers = { ...(result.headers || {}), ...corsHeaders };
    return result;
  } catch (err) {
    console.error('Lambda handler error:', err);
    return jsonResponse(event, 500, {
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
};
