// PM2 config — run with: pm2 start ecosystem.config.js
module.exports = {
  apps: [{
    name: 'doonportal',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
  }],
};
