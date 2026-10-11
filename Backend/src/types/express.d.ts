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
    }
  }
}

export {};
