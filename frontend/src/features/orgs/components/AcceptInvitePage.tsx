import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { useAcceptInvite } from "../hooks/useAcceptInvite";

export function AcceptInvitePage() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const acceptInvite = useAcceptInvite();
  const hasSubmitted = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (hasSubmitted.current) return;
    if (!inviteId || !token) {
      setFailed(true);
      return;
    }
    hasSubmitted.current = true;
    acceptInvite.mutateAsync({ inviteId, token }).catch(() => setFailed(true));
    // acceptInvite is a fresh object each render (React Query) — only inviteId/token should drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId, token]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        {failed ? (
          <>
            <h1 className="text-xl font-semibold text-foreground">This invite link isn't valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have expired, been revoked, or already been used.
            </p>
            <Link to="/dashboard" className={buttonVariants({ className: "mt-6" })}>
              Go to dashboard
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Joining organization…</p>
        )}
      </div>
    </div>
  );
}
