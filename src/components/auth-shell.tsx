import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="size-8 rounded-full bg-lal-cha text-paper flex items-center justify-center font-serif font-semibold">W</span>
          <span className="text-lg font-medium tracking-tight">Campus Wari</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-lal-cha transition-colors"
        >
          ← Back to home
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-[1.05] text-balance">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-muted">{subtitle}</p>}
          <div className="mt-8 bg-paper border border-border-warm/60 rounded-3xl p-6 sm:p-8">
            {children}
          </div>
          {footer && <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  error,
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className={`bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:border-lal-cha/60 focus:ring-2 focus:ring-lal-cha/15 transition-all ${
          error ? "border-destructive/60" : "border-border-warm"
        }`}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-2 inline-flex items-center justify-center rounded-full bg-lal-cha hover:bg-ink disabled:opacity-60 disabled:cursor-not-allowed text-paper px-6 py-3 text-sm font-medium transition-colors"
    >
      {children}
    </button>
  );
}
