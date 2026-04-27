import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { getCurrentUser, signUp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthShell, FormField, SubmitButton } from "@/components/auth-shell";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getCurrentUser()) throw redirect({ to: "/feed" });
  },
  component: Signup,
  head: () => ({ meta: [{ title: "Sign up — Campus Wari" }] }),
});

const schema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(80),
  email: z.string().trim().email("That doesn't look like an email").max(255),
  department: z.string().trim().max(60).optional(),
  year: z.string().trim().max(20).optional(),
  password: z.string().min(8, "At least 8 characters please"),
});

function Signup() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      department: String(fd.get("department") ?? ""),
      year: String(fd.get("year") ?? ""),
      password: String(fd.get("password") ?? ""),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }

    setBusy(true);
    try {
      const user = await signUp({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        department: parsed.data.department || null,
        year: parsed.data.year || null,
      });
      refresh();
      toast.success(`Welcome to Campus Wari, ${user.name.split(" ")[0]}!`);
      navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Make a corner of campus your own."
      subtitle="One quick form. Then you're in."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-lal-cha hover:text-ink">Log in</Link></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="Your name" name="name" placeholder="e.g. Anjali Devi" error={errors.name} autoComplete="name" />
        <FormField label="College email" name="email" type="email" placeholder="you@college.edu" error={errors.email} autoComplete="email" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Department" name="department" placeholder="e.g. CSE" error={errors.department} />
          <FormField label="Year" name="year" placeholder="e.g. 2nd" error={errors.year} />
        </div>
        <FormField label="Password" name="password" type="password" placeholder="8+ characters" error={errors.password} autoComplete="new-password" />
        <SubmitButton busy={busy}>{busy ? "Creating account..." : "Create my account"}</SubmitButton>
      </form>
    </AuthShell>
  );
}
