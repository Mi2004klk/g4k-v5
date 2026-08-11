module.exports = async (browser, context) => {
  const page = await browser.newPage();
  
  // Set auth cookie
  await page.setCookie({
    name: 'g4k_token',
    value: 'lh-mock-token',
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  });

  // Navigate to login to initialize local storage
  await page.goto('http://localhost:3000/login');
  
  // Set localStorage zustand state
  await page.evaluate(() => {
    localStorage.setItem('g4k-auth', JSON.stringify({
      state: {
        token: 'lh-mock-token',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          active_role: 'admin',
          roles: ['admin'],
          onboarded_at: new Date().toISOString(),
          active_status: 'active'
        },
        activeRole: 'admin',
        density: 'comfortable'
      },
      version: 0
    }));
  });

  await page.close();
};
