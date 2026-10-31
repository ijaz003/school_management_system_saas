import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { api } from '@/lib/api';
import { useCreateAssignment } from '../hooks/useAssignments';

interface SectionSubject {
  id: string;
  name: string;
  code: string;
}

const selectClass =
  'field-select';

export function AssignSubjectModal({
  teacherId,
  teacherName,
  onClose,
}: {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}) {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<SectionSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [formError, setFormError] = useState('');

  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const createAssignment = useCreateAssignment();

  useEffect(() => {
    setSectionId('');
    setSubjectId('');
    setSubjects([]);
  }, [classId]);

  useEffect(() => {
    setSubjectId('');
    if (!sectionId) {
      setSubjects([]);
      return;
    }

    let cancelled = false;
    setLoadingSubjects(true);
    void api
      .get<SectionSubject[]>(`/school/sections/${sectionId}/subjects`)
      .then((response) => {
        if (!cancelled) setSubjects(response.data ?? []);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSubjects([]);
          setFormError(error.message || 'Could not load section subjects');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  const submit = () => {
    if (!classId || !sectionId || !subjectId) {
      setFormError('Select class, section, and subject.');
      return;
    }
    setFormError('');
    createAssignment.mutate(
      { teacherId, sectionId, subjectId },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Assign subject"
      description={`Assign ${teacherName} as a subject teacher for a section.`}
      size="md"
      closeDisabled={createAssignment.isPending}
      closeOnOverlay={!createAssignment.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={createAssignment.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={createAssignment.isPending}>
            Assign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="assign-class" className="mb-1.5 block text-sm font-medium text-ink-800">
            Class *
          </label>
          <select
            id="assign-class"
            className={selectClass}
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">Select class</option>
            {classesQuery.data?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assign-section" className="mb-1.5 block text-sm font-medium text-ink-800">
            Section *
          </label>
          <select
            id="assign-section"
            className={selectClass}
            value={sectionId}
            disabled={!classId || sectionsQuery.isPending}
            onChange={(event) => setSectionId(event.target.value)}
          >
            <option value="">Select section</option>
            {sectionsQuery.data?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
                {section.stream ? ` (${section.stream})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assign-subject" className="mb-1.5 block text-sm font-medium text-ink-800">
            Subject *
          </label>
          <select
            id="assign-subject"
            className={selectClass}
            value={subjectId}
            disabled={!sectionId || loadingSubjects}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">{loadingSubjects ? 'Loading subjects...' : 'Select subject'}</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
          {sectionId && !loadingSubjects && subjects.length === 0 && (
            <p className="mt-1 text-xs text-ink-700/70">
              No subjects on this section. Add subjects to the class/section first.
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-danger-600">
            {formError}
          </p>
        )}
      </div>
    </Modal>
  );
}
