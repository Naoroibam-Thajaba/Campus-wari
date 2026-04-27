import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getCurrentUser()) throw redirect({ to: "/feed" });
  },
  component: Landing,
  head: () => ({
    meta: [
      { title: "Campus Wari — The warm corner of campus" },
      { name: "description", content: "Find tutors, share notes, team up on projects, or grab momos. Campus Wari is where students help students." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-lal-cha text-paper flex items-center justify-center font-serif font-semibold">W</span>
            <span className="text-lg font-medium tracking-tight">Campus Wari</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="text-sm font-medium text-ink-muted hover:text-ink transition-colors">
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-lal-cha px-4 py-2 text-sm font-medium text-paper hover:bg-ink transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 pb-24">
        <section className="max-w-3xl mx-auto pt-16 sm:pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-paper border border-border-warm px-3 py-1 text-xs font-medium text-ink-muted">
            <span className="size-1.5 rounded-full bg-leaf" /> A campus-only space
          </span>
          <h1 className="font-serif mt-6 text-5xl sm:text-7xl leading-[1.05] tracking-tight text-balance">
            Pass a note,
            <br />
            <span className="text-lal-cha italic">find your people.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-muted max-w-xl mx-auto text-pretty">
            Campus Wari is the warm corner of campus where students share notes,
            find a tutor, team up on projects, or just grab momos together.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-lal-cha px-7 py-3.5 text-sm font-medium text-paper hover:bg-ink transition-colors shadow-sm"
            >
              Get started — it's free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-paper border border-border-warm px-7 py-3.5 text-sm font-medium text-ink hover:border-lal-cha/40 transition-colors"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-6 text-xs text-ink-muted">
            Demo accounts: <span className="font-mono">anjali@college.edu</span> / <span className="font-mono">password</span>
          </p>
        </section>

        <section className="max-w-4xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-2 gap-5">
          {([
            { type: "tutoring", emoji: "📚", title: "Tutoring", body: "Offer your skills or find someone who can help you crack that subject." },
            { type: "notes", emoji: "📝", title: "Notes", body: "Share scanned notes from last semester. Help the next batch breathe easier." },
            { type: "collab", emoji: "🤝", title: "Project collabs", body: "Find teammates for that hackathon, paper, or side project." },
            { type: "hangout", emoji: "☕", title: "Hangouts", body: "Heading to the canteen? Movie night? Post it. Someone's free." },
          ] as const).map((f) => (
            <Link
              key={f.title}
              to="/feed"
              search={{ type: f.type } as never}
              className="group text-left bg-paper rounded-2xl border border-border-warm/60 p-6 hover:-translate-y-0.5 hover:border-lal-cha/40 hover:shadow-[0_4px_24px_rgba(49,39,37,0.06)] transition-all"
            >
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="font-serif text-xl mb-1.5 group-hover:text-lal-cha transition-colors">{f.title}</h3>
              <p className="text-sm text-ink-muted text-pretty">{f.body}</p>
              <span className="inline-block mt-3 text-xs font-medium text-lal-cha opacity-0 group-hover:opacity-100 transition-opacity">
                Open the board →
              </span>
            </Link>
          ))}
        </section>

        <p className="text-center text-xs text-ink-muted mt-16 italic font-serif">
          Built by students, for students.
        </p>
      </main>
    </div>
  );
}
