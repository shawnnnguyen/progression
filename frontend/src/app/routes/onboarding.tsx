import { useRef } from "react";
import { Navigate } from "react-router-dom";
import { OnboardingWizard } from "@/features/orgs/components/onboarding/OnboardingWizard";
import { useOrgs } from "@/features/orgs/hooks/useOrgs";

export default function OnboardingRoute() {
  const { data: orgs, isLoading } = useOrgs();

  // Decided once, on first arrival, and never re-evaluated: the wizard's own
  // steps create an org partway through, which invalidates and refetches the
  // ["orgs"] list this same check reads — re-running the "already has an
  // org" guard on that refetch would eject the user to /dashboard mid-wizard
  // right after step 1 instead of letting them continue to step 2.
  const decisionRef = useRef<"pending" | "allow" | "redirect">("pending");
  if (decisionRef.current === "pending" && !isLoading && orgs) {
    decisionRef.current = orgs.length > 0 ? "redirect" : "allow";
  }

  if (decisionRef.current === "pending") {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  // A user who already belonged to an org before arriving here is blocked
  // from re-running onboarding for now — creating an additional org gets its
  // own entry point later.
  if (decisionRef.current === "redirect") {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingWizard />;
}
