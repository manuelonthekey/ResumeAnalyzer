import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('--- Starting Backend Tests ---');
  
  // 1. Health check
  try {
    const health = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', health.data);
  } catch (e) {
    console.error('❌ Health check failed:', e.message);
  }

  // 2. Auth - Register
  const testEmail = `test_${Date.now()}@example.com`;
  let token = null;
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'password123',
      name: 'Test User'
    });
    console.log('✅ Register passed, user id:', res.data.user.id);
    token = res.data.token;
  } catch (e) {
    console.error('❌ Register failed:', e.response?.data || e.message);
  }

  // 3. Auth - Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    console.log('✅ Login passed, token received');
  } catch (e) {
    console.error('❌ Login failed:', e.response?.data || e.message);
  }

  console.log('--- Tests Completed ---');
}

runTests();
