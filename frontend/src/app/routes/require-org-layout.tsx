import { Navigate } from "react-router-dom";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { useOrgs } from "@/features/orgs/hooks/useOrgs";

export default function RequireOrgLayout() {
  const { data: orgs, isLoading } = useOrgs();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!orgs || orgs.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppShellLayout />;
}
