import { randomInt } from 'node:crypto';
import { hash, verify, type Algorithm } from '@node-rs/argon2';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    algorithm: 2 as Algorithm,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(
  encodedHash: string,
  password: string,
): Promise<boolean> {
  if (
    !/^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$/.test(
      encodedHash,
    )
  ) {
    return false;
  }

  return verify(encodedHash, password);
}

export function generateRandomPassword(length = 12): string {
  if (!Number.isSafeInteger(length) || length < 1) {
    throw new RangeError('Password length must be a positive safe integer');
  }

  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';

  return Array.from({ length }, () => chars[randomInt(chars.length)]).join('');
}
