/*
  Clerk setup:
  1. Create an application at https://dashboard.clerk.com
  2. Enable Email address and Password under User & Authentication.
  3. Copy your Publishable Key from API keys.
  4. Replace the placeholder below with that key.

  The publishable key is safe to use in frontend code. Do not place a Secret Key here.
*/
window.CLERK_CONFIG = {
  publishableKey: "pk_test_aG9wZWZ1bC1oeWVuYS0xNi5jbGVyay5hY2NvdW50cy5kZXYk",
  signInUrl: "login.html",
  signUpUrl: "register.html",
  afterSignInUrl: "courts.html",
  afterSignUpUrl: "courts.html",
  apiBaseUrl: "http://localhost:5000/api",
  adminEmails: [
    "admin@iium.edu.my"
  ]
};
