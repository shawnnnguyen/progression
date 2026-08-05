import { Link } from "react-router-dom";

export default function NotFoundRoute() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/dashboard" className="text-primary underline underline-offset-4">
        Go to dashboard
      </Link>
    </div>
  );
}
