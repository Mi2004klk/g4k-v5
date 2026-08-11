module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/dashboard/attendance',
        'http://localhost:3000/dashboard/leave',
        'http://localhost:3000/dashboard/org/users',
        'http://localhost:3000/dashboard/chat'
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      puppeteerScript: './scripts/lh-auth.js',
      numberOfRuns: 1,
      settings: {
        preset: 'desktop'
      }
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'categories:accessibility': ['error', { minScore: 1 }]
      }
    }
  }
};
