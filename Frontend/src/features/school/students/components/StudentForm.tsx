import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { useCreateStudent } from '../hooks/useCreateStudent';
import { useUpdateStudent } from '../hooks/useUpdateStudent';
import type { StudentDetail } from '../hooks/useStudent';

const studentSchema = z.object({
  admissionNo: z.string().trim().max(50).optional(),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  bloodGroup: z.string().trim().max(10).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().trim().max(1000).optional(),
  classId: z.string().uuid('Select a class'),
  sectionId: z.string().uuid('Select a section'),
  guardianName: z.string().trim().min(2, 'Guardian name is required').max(200),
  guardianPhone: z.string().trim().min(7, 'Guardian phone is required').max(20),
  guardianEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  guardianRelation: z.string().trim().max(50).optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'alumni']),
  admissionDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

type FormData = z.infer<typeof studentSchema>;

const selectClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

export function StudentForm({
  student,
  onSuccess,
  onCancel,
}: {
  student?: StudentDetail;
  onSuccess?: (student: StudentDetail) => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(student);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const classesQuery = useClasses();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNo: student?.admissionNo ?? '',
      fullName: student?.fullName ?? '',
      gender: (student?.gender as FormData['gender']) ?? 'male',
      dateOfBirth: student?.dateOfBirth?.slice(0, 10) ?? '',
      bloodGroup: student?.bloodGroup ?? '',
      phone: student?.phone ?? '',
      email: student?.email ?? '',
      address: student?.address ?? '',
      classId: student?.classId ?? '',
      sectionId: student?.sectionId ?? '',
      guardianName: student?.guardianName ?? '',
      guardianPhone: student?.guardianPhone ?? '',
      guardianEmail: student?.guardianEmail ?? '',
      guardianRelation: student?.guardianRelation ?? '',
      status: student?.status ?? 'active',
      admissionDate: student?.admissionDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      notes: student?.notes ?? '',
    },
  });

  const classId = useWatch({ control, name: 'classId' });
  const sectionsQuery = useSections(classId);
  const pending = createStudent.isPending || updateStudent.isPending;

  useEffect(() => {
    if (!classId) {
      setValue('sectionId', '');
      return;
    }
    if (student?.classId === classId) {
      setValue('sectionId', student.sectionId);
      return;
    }
    setValue('sectionId', '');
  }, [classId, setValue, student?.classId, student?.sectionId]);

  const submit = (data: FormData) => {
    const payload = {
      admissionNo: data.admissionNo || undefined,
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      bloodGroup: data.bloodGroup || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      classId: data.classId,
      sectionId: data.sectionId,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail || null,
      guardianRelation: data.guardianRelation || null,
      status: data.status,
      admissionDate: data.admissionDate || undefined,
      notes: data.notes || null,
    };

    if (student) {
      updateStudent.mutate(
        { id: student.id, data: payload },
        { onSuccess: (result) => onSuccess?.(result) },
      );
      return;
    }

    createStudent.mutate(payload, {
      onSuccess: (result) => onSuccess?.(result),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-base font-semibold text-ink-950">Student details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={isEdit ? 'Admission number *' : 'Admission number (optional)'}
            placeholder="Leave blank to auto-generate"
            error={errors.admissionNo?.message}
            {...register('admissionNo')}
          />
          <Input
            label="Full name *"
            placeholder="e.g. Ahmed Khan"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <div>
            <label htmlFor="student-gender" className="mb-1.5 block text-sm font-medium text-ink-800">
              Gender *
            </label>
            <select id="student-gender" className={selectClass} {...register('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Date of birth *"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
          <Input label="Blood group" placeholder="e.g. B+" {...register('bloodGroup')} />
          <Input label="Phone" placeholder="Student phone" {...register('phone')} />
          <Input
            label="Email"
            type="email"
            placeholder="student@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Admission date"
            type="date"
            error={errors.admissionDate?.message}
            {...register('admissionDate')}
          />
        </div>
        <div>
          <label htmlFor="student-address" className="mb-1.5 block text-sm font-medium text-ink-800">
            Address
          </label>
          <textarea
            id="student-address"
            rows={2}
            className={selectClass}
            {...register('address')}
          />
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-base font-semibold text-ink-950">Class placement</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="student-class" className="mb-1.5 block text-sm font-medium text-ink-800">
              Class *
            </label>
            <select
              id="student-class"
              className={selectClass}
              {...register('classId')}
              disabled={classesQuery.isPending}
            >
              <option value="">Select class</option>
              {classesQuery.data?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId && <p className="mt-1 text-xs text-red-600">{errors.classId.message}</p>}
          </div>
          <div>
            <label htmlFor="student-section" className="mb-1.5 block text-sm font-medium text-ink-800">
              Section *
            </label>
            <select
              id="student-section"
              className={selectClass}
              {...register('sectionId')}
              disabled={!classId || sectionsQuery.isPending}
            >
              <option value="">Select section</option>
              {sectionsQuery.data?.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                  {section.stream ? ` (${section.stream})` : ''}
                </option>
              ))}
            </select>
            {errors.sectionId && (
              <p className="mt-1 text-xs text-red-600">{errors.sectionId.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="student-status" className="mb-1.5 block text-sm font-medium text-ink-800">
              Status *
            </label>
            <select id="student-status" className={selectClass} {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="font-display text-base font-semibold text-ink-950">Guardian</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Guardian name *"
            error={errors.guardianName?.message}
            {...register('guardianName')}
          />
          <Input
            label="Guardian phone *"
            error={errors.guardianPhone?.message}
            {...register('guardianPhone')}
          />
          <Input
            label="Guardian email"
            type="email"
            error={errors.guardianEmail?.message}
            {...register('guardianEmail')}
          />
          <Input
            label="Relation"
            placeholder="e.g. Father, Mother"
            {...register('guardianRelation')}
          />
        </div>
        <div>
          <label htmlFor="student-notes" className="mb-1.5 block text-sm font-medium text-ink-800">
            Notes
          </label>
          <textarea id="student-notes" rows={3} className={selectClass} {...register('notes')} />
        </div>
      </section>

      <footer className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={pending} disabled={pending}>
          {isEdit ? 'Save changes' : 'Add student'}
        </Button>
      </footer>
    </form>
  );
}
