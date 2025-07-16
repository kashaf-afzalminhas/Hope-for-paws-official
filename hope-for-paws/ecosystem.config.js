module.exports = {
  apps: [{
    name: 'hope-for-paws',
    script: './backend/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Watch mode (disable in production)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health check
    health_check_grace_period: 3000,
    
    // Environment variables (will be overridden by actual env vars)
    env_file: '.env'
  }]
}; 