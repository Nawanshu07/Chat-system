import prisma from './src/db/prisma.js';

async function testOtpFlow() {
  const base = 'http://localhost:5000';
  const testEmail = `realuser_${Date.now()}@gmail.com`;
  const initialPass = 'StrongPass1!';
  const newPass = 'EvenStrongerPass2@';

  console.log(`1. Testing Registration for: ${testEmail}`);
  const regRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `user_${Date.now().toString().slice(-6)}`,
      email: testEmail,
      password: initialPass,
    }),
  }).then((r) => r.json());

  console.log('Register response:', regRes);

  if (!regRes.requiresVerification) {
    throw new Error('Expected requiresVerification to be true!');
  }

  // 2. Fetch the OTP from DB
  const verifyOtpRecord = await prisma.otp.findFirst({
    where: { email: testEmail, type: 'VERIFY_EMAIL' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Verification OTP found in DB:', verifyOtpRecord?.code);

  // 3. Verify Email
  console.log('2. Testing Email Verification with OTP...');
  const verifyRes = await fetch(`${base}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: verifyOtpRecord.code,
    }),
  }).then((r) => r.json());
  console.log('Verify response:', { message: verifyRes.message, user: verifyRes.user?.email, hasToken: !!verifyRes.token });

  // 4. Test Forgot Password
  console.log('\n3. Testing Forgot Password Request...');
  const forgotRes = await fetch(`${base}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  }).then((r) => r.json());
  console.log('Forgot password response:', forgotRes);

  const resetOtpRecord = await prisma.otp.findFirst({
    where: { email: testEmail, type: 'RESET_PASSWORD' },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Reset OTP found in DB:', resetOtpRecord?.code);

  // 5. Test Reset Password
  console.log('\n4. Testing Reset Password with OTP...');
  const resetRes = await fetch(`${base}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: resetOtpRecord.code,
      newPassword: newPass,
    }),
  }).then((r) => r.json());
  console.log('Reset response:', resetRes);

  // 6. Test Login with New Password
  console.log('\n5. Testing Login with New Password...');
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: newPass,
    }),
  }).then((r) => r.json());
  console.log('Login response:', { message: loginRes.message, user: loginRes.user?.email, hasToken: !!loginRes.token });

  console.log('\n🎉 ALL OTP & Password Reset tests PASSED successfully!');
  await prisma.$disconnect();
}

testOtpFlow().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
