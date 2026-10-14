export interface CreateClassInput {
  tenantId: string;
  data: {
    name: string;
    order: number;
    type?: 'common' | 'streamed';
    description?: string | null;
  };
}

export interface UpdateClassInput {
  classId: string;
  tenantId: string;
  data: {
    name?: string;
    order?: number;
    type?: 'common' | 'streamed';
    description?: string | null;
  };
}
