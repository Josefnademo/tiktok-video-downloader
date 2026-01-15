module.exports = {
  apps: [
    {
      name: "ttd-backend",
      script: "./server.js",
      instances: "max", // uses all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Auto-restart if process crashes
      max_memory_restart: "500M",
      // Logs configuration
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Auto-start on server reboot
      autorestart: true,
      watch: ["server.js", "src"], // Restart if these files change
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: "node",
      host: "your-server-ip", // Replace with your server IP
      ref: "origin/main",
      repo: "git+https://github.com/Josefnademo/tiktok-video-downloader.git",
      path: "/var/www/tiktok-downloader",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.cjs --env production",
    },
  },
};
