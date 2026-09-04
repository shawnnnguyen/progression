import { Navigate } from "react-router-dom";
import { OnboardingWizard } from "@/features/orgs/components/onboarding/OnboardingWizard";
import { useOrgs } from "@/features/orgs/hooks/useOrgs";

export default function OnboardingRoute() {
  const { data: orgs, isLoading } = useOrgs();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // A user who already belongs to an org is blocked from re-running onboarding
  // for now — creating an additional org gets its own entry point later.
  if (orgs && orgs.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingWizard />;
}
