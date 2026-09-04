import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateProjectStep } from "@/features/projects/components/onboarding/CreateProjectStep";
import { CreateOrgStep } from "./CreateOrgStep";
import { InviteTeammatesStep } from "./InviteTeammatesStep";

type WizardState =
  | { step: 1 }
  | { step: 2; orgId: string }
  | { step: 3; orgId: string; projectId: string };

export function OnboardingWizard() {
  const [state, setState] = useState<WizardState>({ step: 1 });
  const navigate = useNavigate();

  function complete() {
    navigate("/dashboard", { replace: true });
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      {state.step === 1 && <CreateOrgStep onCreated={(orgId) => setState({ step: 2, orgId })} />}
      {state.step === 2 && (
        <CreateProjectStep
          orgId={state.orgId}
          onCreated={(projectId) => setState({ step: 3, orgId: state.orgId, projectId })}
        />
      )}
      {state.step === 3 && <InviteTeammatesStep orgId={state.orgId} onComplete={complete} />}
    </div>
  );
}
