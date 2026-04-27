import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { getCurrentUser, signIn } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthShell, FormField, SubmitButton } from "@/components/auth-shell";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getCurrentUser()) throw redirect({ to: "/feed" });
  },
  component: Login,
  head: () => ({ meta: [{ title: "Log in — Campus Wari" }] }),
});

const schema = z.object({
  email: z.string().trim().email("That doesn't look like an email"),
  password: z.string().min(1, "Please enter your password"),
});

function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setBusy(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      refresh();
      toast.success("Welcome back!");
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Pull up a chair."
      footer={<>New here? <Link to="/signup" className="font-medium text-lal-cha hover:text-ink">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Email" name="email" type="email" placeholder="you@college.edu" error={errors.email} autoComplete="email" />
        <FormField label="Password" name="password" type="password" placeholder="Your password" error={errors.password} autoComplete="current-password" />
        <SubmitButton busy={busy}>{busy ? "Logging in..." : "Log in"}</SubmitButton>
      </form>
      <p className="mt-4 text-xs text-ink-muted text-center">
        Try <span className="font-mono">anjali@college.edu</span> / <span className="font-mono">password</span>
      </p>
    </AuthShell>
  );
}
