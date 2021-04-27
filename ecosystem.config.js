module.exports = {
  apps: [
    {
      name: 'web',
      script: 'build/src/web.js',
      node_args: '--inspect=2020',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      kill_timeout: 180000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'trades-service',
      script: 'build/src/trades-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 180000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
