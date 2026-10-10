// src/scripts/test-libs.ts
import { hashPassword, verifyPassword, generateRandomPassword } from '@/lib/password';
import { signAccessToken, verifyAccessToken } from '@/lib/jwt';
import { hasPermission, canGrantPermissions } from '@/lib/permissions';
import { generateSlug } from '@/lib/slug';

async function test() {
  console.log('\n🧪 Testing libraries...\n');

  // Test password
  const password = 'Test@123456';
  const hash = await hashPassword(password);
  const isValid = await verifyPassword(hash, password);
  console.log('Password hash:', hash.substring(0, 30) + '...');
  console.log('Password verify:', isValid);
  console.log('Random password:', generateRandomPassword());

  // Test JWT
  const token = signAccessToken({
    userId: 'test-id',
    tenantId: null,
    role: 'super_admin',
    email: 'test@test.com',
  });
  const payload = verifyAccessToken(token);
  console.log('\nJWT payload:', payload);

  // Test permissions
  console.log('\nPermissions:');
  console.log('Has students.create:', hasPermission(['students.*'], 'students.create'));
  console.log('Has fees.read:', hasPermission(['students.*'], 'fees.read'));
  console.log('Can grant:', canGrantPermissions(['students.*'], ['students.create']));
  console.log('Cannot grant:', canGrantPermissions(['students.*'], ['fees.create']));

  // Test slug
  console.log('\nSlug:', generateSlug('City School Lahore'));
}

test().catch(console.error);