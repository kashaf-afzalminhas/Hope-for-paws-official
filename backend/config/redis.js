const { URL } = require('url');

const DEFAULT_REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(redisUrl) {
  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined
    };
  } catch (error) {
    console.error('Invalid REDIS_URL, falling back to localhost:', error.message);
    return {
      host: '127.0.0.1',
      port: 6379
    };
  }
}

const redisConfig = parseRedisUrl(DEFAULT_REDIS_URL);

module.exports = redisConfig;

