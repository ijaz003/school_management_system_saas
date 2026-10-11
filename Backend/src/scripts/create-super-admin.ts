import readline from 'node:readline/promises';
import { z } from 'zod';
import { closeDatabase } from '../config/database.js';
import { createSuperAdmin } from '../modules/auth/auth.service.js';

const adminInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().trim().min(2).max(200),
});

function promptHidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    return Promise.reject(
      new Error('Run create-admin in an interactive terminal to enter a password securely'),
    );
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const stdin = process.stdin;

    const restoreTerminal = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
    };

    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          restoreTerminal();
          reject(new Error('Password entry cancelled'));
          return;
        }

        if (character === '\r' || character === '\n') {
          restoreTerminal();
          resolve(value);
          return;
        }

        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  let exitCode = 0;

  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\nCreate Super Admin\n');
    const email = await rl.question('Email: ');
    const fullName = await rl.question('Full Name: ');
    rl.close();

    const password = await promptHidden('Password (input hidden): ');
    const input = adminInputSchema.parse({ email, password, fullName });
    const user = await createSuperAdmin(input);

    console.log('\nSuper admin created successfully.');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.fullName);
  } catch (error) {
    console.error(
      '\nFailed to create super admin:',
      error instanceof Error ? error.message : error,
    );
    exitCode = 1;
  } finally {
    try {
      await closeDatabase();
    } catch (error) {
      console.error(
        'Failed to close database connection:',
        error instanceof Error ? error.message : error,
      );
      exitCode = 1;
    }
  }

  process.exitCode = exitCode;
}

void main();
