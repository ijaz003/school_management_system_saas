import { closeDatabase } from '../../config/database.js';
import { seedPermissions } from './permissions.seed.js';
import { seedSystemRoles } from './system-roles.seed.js';
import { syncPlanPermissions } from './sync-plan-permissions.seed.js';

async function main() {
  console.log('Starting database seeds...');

  try {
    await seedPermissions();
    await seedSystemRoles();
    await syncPlanPermissions();
    console.log('Database seeds completed successfully.');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await closeDatabase();
    } catch (error) {
      console.error('Failed to close database connection:', error);
      process.exitCode = 1;
    }
  }
}

void main();
