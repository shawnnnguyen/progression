import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectKeyBadge } from "@/features/projects/components/ProjectKeyBadge";
import { useOrgProjects } from "@/features/projects/hooks/useOrgProjects";
import type { ProjectRow } from "@/features/projects/types";

export function NewTicketProjectPicker({
  orgId,
  value,
  onChange,
}: {
  orgId: string;
  value: ProjectRow;
  onChange: (project: ProjectRow) => void;
}) {
  const { data: projects } = useOrgProjects(orgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded-md border border-[var(--color-divider)] bg-[var(--color-bg)] px-2 py-1 text-xs font-medium outline-none hover:bg-[var(--color-surface)] data-popup-open:bg-[var(--color-surface)]">
        <ProjectKeyBadge projectKey={value.key} />
        <ChevronDownIcon className="size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value.id}
          onValueChange={(next) => {
            const project = projects?.find((p) => p.id === next);
            if (project) onChange(project);
          }}
        >
          {projects?.map((project) => (
            <DropdownMenuRadioItem key={project.id} value={project.id}>
              <ProjectKeyBadge projectKey={project.key} />
              {project.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
