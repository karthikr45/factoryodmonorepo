'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import { WorkflowDesigner } from '@/components/workflow-designer';
import { apiCall } from '@/lib/api';

interface Stage {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sequence: number;
  slaHours: number | null;
  qcRequired: boolean;
  qcChecklist: unknown;
  isOutsourced: boolean;
  autoAdvance: string;
  parallelGroupId: string | null;
  assignedRoleId: string | null;
  notes: string | null;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  industry: string;
  icon: string | null;
  isDefault: boolean;
  stages: Stage[];
}

export default function EditWorkflowPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery<Template>({
    queryKey: ['workflow-template', params.id],
    queryFn: () => apiCall<Template>({ url: `/workflows/${params.id}` }),
  });

  if (isLoading) return <div className="text-neutral-500">Loading...</div>;
  if (!data) return <div className="text-danger-700">Workflow not found</div>;

  return (
    <WorkflowDesigner
      existing={{
        id: data.id,
        name: data.name,
        description: data.description,
        industry: data.industry,
        icon: data.icon,
        isDefault: data.isDefault,
        stages: data.stages.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? undefined,
          icon: s.icon ?? undefined,
          color: s.color ?? undefined,
          sequence: s.sequence,
          slaHours: s.slaHours ?? undefined,
          qcRequired: s.qcRequired,
          qcChecklist: s.qcChecklist as Array<{ parameter: string; expected: string }> | undefined,
          isOutsourced: s.isOutsourced,
          autoAdvance: s.autoAdvance as 'ALWAYS' | 'ON_QC_PASS' | 'MANUAL',
          parallelGroupId: s.parallelGroupId ?? undefined,
          notes: s.notes ?? undefined,
        })),
      }}
    />
  );
}
