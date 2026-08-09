import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StateDot } from "@/components/domain/StateDot";
import { useWorkflowStates } from "@/features/workflow/hooks/useWorkflowStates";
import { fieldTriggerClassName } from "../metadata/fieldStyles";

export function NewTicketStatePicker({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string | undefined;
  onChange: (stateId: string) => void;
}) {
  const { data: states } = useWorkflowStates(projectId);
  const currentState = states?.find((state) => state.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={fieldTriggerClassName(true)}>
        {currentState && <StateDot category={currentState.category} />}
        <span className="min-w-0 truncate">{currentState?.name ?? "State"}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as string)}>
          {states?.map((state) => (
            <DropdownMenuRadioItem key={state.id} value={state.id}>
              <StateDot category={state.category} />
              {state.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
