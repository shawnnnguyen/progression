import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrg } from "../../hooks/useCreateOrg";
import { slugify } from "../../lib/slugify";
import { OnboardingStepIndicator } from "./OnboardingStepIndicator";

export function CreateOrgStep({ onCreated }: { onCreated: (orgId: string) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const createOrg = useCreateOrg();

  const displaySlug = slugTouched ? slug : slugify(name);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createOrg.mutate(
      { name: name.trim(), slug: displaySlug },
      { onSuccess: (org) => onCreated(org.id) },
    );
  }

  return (
    <div className="w-full max-w-sm">
      <OnboardingStepIndicator step={1} />

      <h1 className="mt-4 text-2xl font-semibold text-foreground">Create your organization</h1>
      <p className="mt-1 text-sm text-muted-foreground">You can belong to more than one — switch any time from the sidebar.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgName">Organization name</Label>
          <Input
            id="orgName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgSlug">URL slug</Label>
          <div className="flex h-9 w-full items-center rounded-lg border border-input bg-input/30 pl-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span>malm.app/</span>
            <input
              id="orgSlug"
              type="text"
              required
              value={displaySlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="h-full min-w-0 flex-1 bg-transparent pr-3 text-foreground outline-none"
            />
          </div>
          <span className="text-xs text-muted-foreground">Suggested from the name · lowercase letters, numbers and dashes.</span>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={createOrg.isPending}>
          {createOrg.isPending ? "Creating…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
