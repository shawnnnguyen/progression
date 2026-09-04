import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateProject } from "../../hooks/useCreateProject";
import { PROJECT_KEY_PATTERN, suggestProjectKey } from "../../lib/suggestProjectKey";
import type { ProjectVisibility } from "../../types";

const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string; description: string }[] = [
  { value: "ORG", label: "Org-wide", description: "Every member of your organization can find and open it." },
  { value: "PRIVATE", label: "Private", description: "Only people you add to the project." },
];

export function CreateProjectStep({
  orgId,
  onCreated,
}: {
  orgId: string;
  onCreated: (projectId: string) => void;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [visibility, setVisibility] = useState<ProjectVisibility>("ORG");
  const createProject = useCreateProject(orgId);

  const displayKey = keyTouched ? key : suggestProjectKey(name);
  const keyIsValid = PROJECT_KEY_PATTERN.test(displayKey);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!keyIsValid) return;
    createProject.mutate(
      { name: name.trim(), key: displayKey, visibility },
      { onSuccess: (project) => onCreated(project.id) },
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="projectName">Project name</Label>
          <Input
            id="projectName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex w-24 flex-col gap-1.5">
          <Label htmlFor="projectKey">Key</Label>
          <Input
            id="projectKey"
            type="text"
            required
            aria-invalid={displayKey.length > 0 && !keyIsValid}
            value={displayKey}
            onChange={(event) => {
              setKeyTouched(true);
              setKey(event.target.value.toUpperCase());
            }}
          />
        </div>
      </div>
      <span className="-mt-2 text-xs text-muted-foreground">
        Tickets will read {displayKey || "KEY"}-1, {displayKey || "KEY"}-2, … Keys are permanent.
      </span>

      <div className="flex flex-col gap-2">
        <Label>Visibility</Label>
        <RadioGroup value={visibility} onValueChange={(value) => setVisibility(value as ProjectVisibility)}>
          {VISIBILITY_OPTIONS.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-2.5">
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <Button type="submit" className="mt-2 w-full" disabled={createProject.isPending || !keyIsValid}>
        {createProject.isPending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
