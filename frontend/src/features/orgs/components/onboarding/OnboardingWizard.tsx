import { useNavigate } from "react-router-dom";
import { CreateOrgStep } from "./CreateOrgStep";

export function OnboardingWizard() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <CreateOrgStep onCreated={() => navigate("/dashboard", { replace: true })} />
    </div>
  );
}
