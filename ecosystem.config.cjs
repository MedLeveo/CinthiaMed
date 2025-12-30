// PM2 Configuration - Gerenciador de processos Node.js para produção
module.exports = {
  apps: [{
    name: 'cinthiamed-backend',
    script: './server/server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
