import { cn } from "@/lib/utils";

const TOTAL_STEPS = 3;

export function OnboardingStepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={cn("size-1.5 rounded-full", index < step ? "bg-primary" : "bg-muted-foreground/30")}
          />
        ))}
      </div>
      <span>
        Step {step} of {TOTAL_STEPS}
      </span>
    </div>
  );
}
