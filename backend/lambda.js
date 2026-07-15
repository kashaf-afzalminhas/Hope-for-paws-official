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

const app = require('./app');

let cachedHandler;

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

  await mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    serverSelectionTimeoutMS: 30000,
  });
};

const getHandler = async () => {
  await ensureDb();
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
  const handler = await getHandler();
  return handler(event, context);
};
