import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUp } from "../hooks/useSignUp";

const VALUE_PROPS = [
  "Workflow states you name yourself, per project",
  "Sprints, labels and a full activity trail on every ticket",
  "Command palette for everything — no menu hunting",
];

const BOARD_PREVIEW_COLUMNS = [
  { label: "TODO", count: 3, cards: 2 },
  { label: "IN PROGRESS", count: 2, cards: 2 },
  { label: "QA", count: 1, cards: 1 },
];

function BoardPreview() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="grid grid-cols-3 gap-3">
        {BOARD_PREVIEW_COLUMNS.map((column) => (
          <div key={column.label} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium tracking-wide text-white/50">
              {column.label} {column.count}
            </span>
            {Array.from({ length: column.cards }).map((_, index) => (
              <div key={index} className="h-8 rounded-md border border-white/10 bg-white/5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SignUpBrandPanel() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[color-mix(in_oklch,var(--color-bg),white_4%)] p-10 md:flex">
      <div className="flex max-w-md flex-col gap-6">
        <h2 className="text-3xl font-semibold text-foreground">Every ticket, one keystroke away.</h2>
        <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {prop}
            </li>
          ))}
        </ul>
        <BoardPreview />
      </div>

      <p className="text-xs text-muted-foreground/70">Trusted by ops teams running city-scale request queues.</p>
    </div>
  );
}

export function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUp = useSignUp();
  const location = useLocation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    signUp.mutate({ name: name.trim(), email: email.trim(), password });
  }

  return (
    <div className="flex min-h-svh bg-background">
      <SignUpBrandPanel />

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Free for the first 10 teammates.</p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                required
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <span className="text-xs text-muted-foreground">At least 8 characters.</span>
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={signUp.isPending}>
              {signUp.isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to the terms and privacy policy.
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" state={location.state} className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
