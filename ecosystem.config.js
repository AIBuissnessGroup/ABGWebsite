module.exports = {
  apps: [{
    name: 'abg-website',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    cwd: '/root/abg-website',
    env: {
      PORT: 3000,
      HOST: '0.0.0.0',
      NODE_ENV: 'production'
    }
  }]
}; 

//netstat -tlnp | grep :3000