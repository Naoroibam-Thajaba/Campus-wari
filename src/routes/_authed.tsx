import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { getCurrentUser } from "@/lib/store";
import { signOut } from "@/lib/auth";
import { Home, LayoutGrid, MessageCircle, User, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const user = getCurrentUser();
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await router.invalidate();
    navigate({ to: "/" });
  }

  const navItems = [
    { to: "/feed", label: "Home", icon: Home, match: (p: string) => p === "/feed" },
    { to: "/create", label: "Post", icon: LayoutGrid, match: (p: string) => p.startsWith("/create") },
    { to: "/messages", label: "Inbox", icon: MessageCircle, match: (p: string) => p.startsWith("/messages") },
    { to: "/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/profile") },
  ] as const;

  return (
    <div className="min-h-dvh bg-background pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border-warm/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/feed" className="inline-flex items-center gap-2 shrink-0">
            <span className="size-7 rounded-full bg-lal-cha text-paper flex items-center justify-center font-serif font-semibold text-sm">W</span>
            <span className="text-sm font-medium tracking-tight hidden sm:inline">Campus Wari</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((n) => {
              const active = n.match(pathname);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-lal-cha transition-colors"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <Outlet />

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur border-t border-border-warm">
        <div className="grid grid-cols-4">
          {navItems.map((n) => {
            const active = n.match(pathname);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${
                  active ? "text-lal-cha" : "text-ink-muted"
                }`}
              >
                <Icon className="size-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
