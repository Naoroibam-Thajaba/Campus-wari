import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { createListing } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { LISTING_TYPES, type ListingTypeValue } from "@/lib/format";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authed/create")({
  component: CreateListing,
  head: () => ({ meta: [{ title: "Pass a Note — Campus Wari" }] }),
});

const schema = z.object({
  type: z.enum(["tutoring", "notes", "collab", "hangout"]),
  title: z.string().trim().min(4, "A few more characters please").max(120),
  subject: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "Tell us a bit more").max(2000),
});

function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<ListingTypeValue>("hangout");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      type,
      title: String(fd.get("title") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      description: String(fd.get("description") ?? ""),
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setBusy(true);
    try {
      createListing({
        user_id: user.id,
        type: parsed.data.type,
        title: parsed.data.title,
        subject: parsed.data.subject || null,
        description: parsed.data.description,
      });
      toast.success("Your note is up on the board ✨");
      navigate({ to: "/feed" });
    } catch {
      toast.error("Could not post your listing. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-6 pb-24">
      <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4">
        <ChevronLeft className="size-4" /> Back to feed
      </Link>
      <h1 className="font-serif text-4xl tracking-tight">Pass a note.</h1>
      <p className="text-sm text-ink-muted mt-1.5">
        What are you offering, looking for, or up to?
      </p>

      <form onSubmit={onSubmit} className="mt-8 bg-paper border border-border-warm/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-5" noValidate>
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2 block">What kind?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LISTING_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                  type === t.value
                    ? "bg-ink text-paper border-ink"
                    : "bg-background border-border-warm text-ink-muted hover:text-ink hover:border-lal-cha/40"
                }`}
              >
                <span className="mr-1.5">{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Title" name="title" placeholder="e.g. Sharing Macroeconomics midterm notes" error={errors.title} maxLength={120} />
        <Field label="Subject (optional)" name="subject" placeholder="e.g. ECO-201" error={errors.subject} maxLength={80} />
        <FieldArea label="Description" name="description" placeholder="A few details so people know what to expect..." error={errors.description} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center rounded-full bg-lal-cha text-paper hover:bg-ink disabled:opacity-60 px-6 py-3 text-sm font-medium transition-colors"
          >
            {busy ? "Posting..." : "Post to the board"}
          </button>
          <Link
            to="/feed"
            className="inline-flex items-center justify-center rounded-full bg-background border border-border-warm text-ink px-6 py-3 text-sm font-medium hover:border-ink/40 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

function Field({ label, name, placeholder, error, maxLength }: { label: string; name: string; placeholder?: string; error?: string; maxLength?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:border-lal-cha/60 focus:ring-2 focus:ring-lal-cha/15 transition-all ${
          error ? "border-destructive/60" : "border-border-warm"
        }`}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function FieldArea({ label, name, placeholder, error }: { label: string; name: string; placeholder?: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={5}
        maxLength={2000}
        className={`bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:border-lal-cha/60 focus:ring-2 focus:ring-lal-cha/15 transition-all resize-y ${
          error ? "border-destructive/60" : "border-border-warm"
        }`}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
