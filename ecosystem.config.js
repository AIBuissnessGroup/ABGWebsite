module.exports = {
  apps: [
    {
      name: 'abg-website',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cwd: '/root/abg-website',
      node_args: '--max-http-header-size=80000',
      env: {
        PORT: 3000,
        HOST: '0.0.0.0',
        NODE_ENV: 'production',
        BODY_SIZE_LIMIT: '100mb',
        // Google Calendar sync configuration
        GOOGLE_CALENDAR_ICS_URL: 'https://calendar.google.com/calendar/ical/c_8ebf08c943d5b4177bd00fcfd2fabc97d9754726f6e5d86510acfdfcc48a9efc%40group.calendar.google.com/private-c661ea57f606be3f740c84dfedccd645/basic.ics',
        CAL_SYNC_SECRET: 'f7430d6c6515a9762b7a7f5ef6fb77ee3378ff12db21274ea613c55e162b96bf',
        // Must match an existing user in DB (seed creates this ADMIN)
        SYNC_CREATED_BY_EMAIL: 'skywlkr@umich.edu'
      }
    },
    {
      name: 'gmail-token-monitor',
      script: './scripts/gmail-token-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      cwd: '/root/abg-website',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/gmail-token-monitor-error.log',
      out_file: './logs/gmail-token-monitor.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 60000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}; 

/*
netstat -tlnp | grep :3000
*/