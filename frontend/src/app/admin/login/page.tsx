"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { LogoMark } from "@/components/layout/LogoMark";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useLogin } from "@/hooks/use-auth";

/**
 * Admin sign-in (`.auth` full-screen card). It sits outside the gated `(panel)`
 * route group, so it renders on the root layout only — no admin topbar, no auth
 * probe. On success it follows the `?next=` the gate stamped on (falling back to
 * `/admin`).
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          // Only honour same-site admin destinations (no open redirect).
          const next = new URLSearchParams(window.location.search).get("next");
          router.replace(next?.startsWith("/admin") ? next : "/admin");
        },
        onError: () => setError("Invalid email or password."),
      },
    );
  }

  return (
    <main className="auth">
      <Link
        className="fixed top-[18px] left-[18px] inline-flex items-center gap-[7px] whitespace-nowrap rounded-[10px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-[13px] py-2 font-semibold text-[#cdd9ec] text-[13px] no-underline hover:bg-[rgba(255,255,255,0.14)]"
        href="/"
      >
        <Icon name="chevron" size={15} className="rotate-180" />
        Back to matchroom
      </Link>

      <form
        className="w-[392px] max-w-full rounded-xl border border-line bg-surface px-8 py-[34px] shadow-[var(--shadow-lg)]"
        onSubmit={onSubmit}
      >
        <div className="mb-6 flex flex-col items-center gap-3.5 text-center">
          <LogoMark size={44} />
          <div>
            <h1 className="m-0 font-bold font-display text-[20px]">Control panel</h1>
            <p className="mt-1 text-[13px] text-muted">Sign in to manage teams &amp; matches</p>
          </div>
        </div>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>

        {error && <p className="mb-3 text-[13px] text-danger">{error}</p>}

        <Button variant="primary" type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
