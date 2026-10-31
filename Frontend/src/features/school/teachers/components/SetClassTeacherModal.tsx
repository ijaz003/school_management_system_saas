import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useClasses } from '@/features/school/classes/hooks/useClasses';
import { useSections } from '@/features/school/classes/hooks/useSections';
import { useSetClassTeacher } from '../hooks/useAssignments';

const selectClass =
  'field-select';

export function SetClassTeacherModal({
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
  const [formError, setFormError] = useState('');
  const classesQuery = useClasses();
  const sectionsQuery = useSections(classId);
  const setClassTeacher = useSetClassTeacher();

  const submit = () => {
    if (!sectionId) {
      setFormError('Select a class and section.');
      return;
    }
    setFormError('');
    setClassTeacher.mutate({ sectionId, teacherId }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Set as class teacher"
      description={`Make ${teacherName} the class teacher for a section.`}
      size="md"
      closeDisabled={setClassTeacher.isPending}
      closeOnOverlay={!setClassTeacher.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={setClassTeacher.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} isLoading={setClassTeacher.isPending}>
            Set class teacher
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ct-class" className="mb-1.5 block text-sm font-medium text-ink-800">
            Class *
          </label>
          <select
            id="ct-class"
            className={selectClass}
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId('');
            }}
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
          <label htmlFor="ct-section" className="mb-1.5 block text-sm font-medium text-ink-800">
            Section *
          </label>
          <select
            id="ct-section"
            className={selectClass}
            value={sectionId}
            disabled={!classId || sectionsQuery.isPending}
            onChange={(event) => setSectionId(event.target.value)}
          >
            <option value="">Select section</option>
            {sectionsQuery.data?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
                {section.classTeacherId ? ' (has class teacher)' : ''}
              </option>
            ))}
          </select>
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
