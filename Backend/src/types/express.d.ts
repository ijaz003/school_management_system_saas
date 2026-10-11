import type { Tenant } from '../modules/tenants/tenants.schema.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string | null;
        role: string;
        email: string;
        permissions: string[];
      };
      tenantId?: string | null;
      tenant?: Tenant;
    }
  }
}

export {};
