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
import type { TicketRow } from "../../types";
import { fieldTriggerClassName, FIELD_LABEL_CLASSNAME } from "./fieldStyles";

export function StateField({
  ticket,
  projectId,
  compact,
  disabled,
  onTransition,
}: {
  ticket: TicketRow;
  projectId: string;
  compact?: boolean;
  disabled?: boolean;
  onTransition: (toStateId: string) => void;
}) {
  const { data: states } = useWorkflowStates(projectId);
  const currentState = states?.find((state) => state.id === ticket.stateId);

  const trigger = (
    <DropdownMenuTrigger disabled={disabled} className={fieldTriggerClassName(compact)}>
      {currentState && <StateDot category={currentState.category} />}
      <span className="min-w-0 truncate">{currentState?.name ?? "—"}</span>
      <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-[var(--color-neutral-500)]" />
    </DropdownMenuTrigger>
  );

  return (
    <div className={compact ? undefined : "flex flex-col gap-1"}>
      {!compact && <span className={FIELD_LABEL_CLASSNAME}>State</span>}
      <DropdownMenu>
        {trigger}
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={ticket.stateId} onValueChange={(value) => onTransition(value as string)}>
            {states?.map((state) => (
              <DropdownMenuRadioItem key={state.id} value={state.id}>
                <StateDot category={state.category} />
                {state.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
