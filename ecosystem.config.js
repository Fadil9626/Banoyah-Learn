// pm2 process definition for Banoyah Learn.
// The backend serves the API and the built frontend (../frontend/dist) on one port.
// Build the UI first:  cd frontend && npm run build
// Start:               pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "banoyah-learn",
      cwd: "./backend",
      script: "server.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
