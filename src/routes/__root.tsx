import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-serif text-7xl text-lal-cha">404</p>
        <h1 className="font-serif mt-4 text-3xl">This page wandered off.</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Maybe it's at the canteen. Try heading back to the feed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-lal-cha px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Campus Wari — Pass a note across campus" },
      { name: "description", content: "Campus Wari is the warm corner of campus where students share notes, find tutors, team up on projects, and grab momos together." },
      { name: "author", content: "Campus Wari" },
      { property: "og:title", content: "Campus Wari" },
      { property: "og:description", content: "The warm corner of campus where students share notes, find tutors, team up, and hang out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <Outlet />
      </div>
      <Toaster />
    </AuthProvider>
  );
}
