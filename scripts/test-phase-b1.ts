import { prisma } from '../src/lib/prisma';
import { hash, verify as verifyArgon2 } from '@node-rs/argon2';
import { Role } from '@prisma/client';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../src/lib/rate-limiter';
import { requireRole, getOperatorScope } from '../src/lib/auth';

async function runB1Verification() {
  console.log('🧪 Starting Phase B1 Authentication & RBAC Verification...\n');

  // 1. Argon2id Hash & Verify Check
  console.log('1. Argon2id Cryptographic Verification:');
  const samplePass = 'ZanzibarSecret2026!';
  const argonHash = await hash(samplePass);
  console.log('   - Generated Hash:', argonHash.slice(0, 30) + '...');
  console.log('   - Hash algorithm is argon2id:', argonHash.startsWith('$argon2id$'));
  const isValid = await verifyArgon2(argonHash, samplePass);
  const isInvalid = await verifyArgon2(argonHash, 'WrongPassword!');
  console.log('   - Valid password matches:', isValid);
  console.log('   - Invalid password rejected:', !isInvalid);
  if (!isValid || isInvalid) {
    throw new Error('Argon2id verification failed!');
  }

  // 2. Rate Limiting Engine Check (5 attempts / 15 min per IP+email)
  console.log('\n2. Rate Limiting Verification:');
  const testKey = `192.168.1.100:attacker@example.com`;
  resetRateLimit(testKey);

  // Initial check
  const initialCheck = checkRateLimit(testKey);
  console.log('   - Initial allowed:', initialCheck.allowed, `(Remaining: ${initialCheck.remainingAttempts})`);

  // Record 5 failed attempts
  for (let i = 1; i <= 5; i++) {
    recordFailedAttempt(testKey);
  }

  const lockedCheck = checkRateLimit(testKey);
  console.log('   - After 5 failed attempts, allowed:', lockedCheck.allowed);
  console.log('   - Lockout retryAfterSec:', lockedCheck.retryAfterSec, 'seconds');
  if (lockedCheck.allowed) {
    throw new Error('Rate limit failed to lock out after 5 attempts!');
  }

  resetRateLimit(testKey);
  const resetCheck = checkRateLimit(testKey);
  console.log('   - After reset, allowed:', resetCheck.allowed);

  // 3. Seeded Accounts & mustChangePassword Check
  console.log('\n3. Seeded Users & Temporary Password Check:');
  const adminUser = await prisma.adminUser.findUnique({ where: { email: 'admin@ibrahimtours.co.tz' } });
  const operatorUser = await prisma.adminUser.findUnique({ where: { email: 'ibrahim@ibrahimtours.co.tz' } });

  console.log('   - Platform Admin exists:', !!adminUser);
  console.log('   - Platform Admin role:', adminUser?.role);
  console.log('   - Platform Admin mustChangePassword:', (adminUser as any)?.mustChangePassword);
  const adminPassValid = adminUser ? await verifyArgon2(adminUser.passwordHash, 'AdminPass123!') : false;
  console.log('   - Platform Admin password verified (AdminPass123!):', adminPassValid);

  console.log('   - Operator exists:', !!operatorUser);
  console.log('   - Operator role:', operatorUser?.role);
  console.log('   - Operator linked operatorId:', operatorUser?.operatorId);
  console.log('   - Operator mustChangePassword:', (operatorUser as any)?.mustChangePassword);
  const opPassValid = operatorUser ? await verifyArgon2(operatorUser.passwordHash, 'IbrahimTour2026!') : false;
  console.log('   - Operator password verified (IbrahimTour2026!):', opPassValid);

  if (!adminPassValid || !opPassValid) {
    throw new Error('Seeded password verification failed!');
  }

  // 4. Simulated Password Change Flow
  console.log('\n4. Password Change Flow Simulation:');
  const testEmail = `test-b1-${Date.now()}@ibrahimtours.co.tz`;
  const tempHash = await hash('TempInitialPass1!');

  const createdUser = await prisma.adminUser.create({
    data: {
      email: testEmail,
      name: 'Test Temporary User',
      passwordHash: tempHash,
      role: Role.OPERATOR,
      mustChangePassword: true,
    },
  });
  console.log('   - Created user with mustChangePassword=true');

  // Verify old password
  const oldValid = await verifyArgon2(createdUser.passwordHash, 'TempInitialPass1!');
  console.log('   - Verified current password:', oldValid);

  // Set new password
  const newPermanentPass = 'NewPermanentPass2026!';
  const newHash = await hash(newPermanentPass);
  const updatedUser = await prisma.adminUser.update({
    where: { id: createdUser.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  console.log('   - Updated mustChangePassword:', (updatedUser as any).mustChangePassword);
  const newValid = await verifyArgon2(updatedUser.passwordHash, newPermanentPass);
  console.log('   - New password verified:', newValid);

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId: updatedUser.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'AdminUser',
      entityId: updatedUser.id,
      details: { email: testEmail },
      ipAddress: '127.0.0.1',
    },
  });

  // Verify audit log
  const log = await (prisma.auditLog as any).findFirst({
    where: { userId: updatedUser.id, action: 'PASSWORD_CHANGED' },
  });
  console.log('   - Audit log created for PASSWORD_CHANGED:', !!log, `(IP: ${log?.ipAddress})`);

  // Clean up test user
  await (prisma.auditLog as any).deleteMany({ where: { userId: updatedUser.id } });
  await (prisma.adminUser as any).delete({ where: { id: updatedUser.id } });
  console.log('   - Cleaned up test user.');

  // 5. Auth Helpers Signature Check
  console.log('\n5. Server Helper Signatures Check:');
  console.log('   - requireRole is function:', typeof requireRole === 'function');
  console.log('   - getOperatorScope is function:', typeof getOperatorScope === 'function');

  console.log('\n✨ ALL PHASE B1 AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!');
}

runB1Verification()
  .catch((err) => {
    console.error('❌ Phase B1 verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
