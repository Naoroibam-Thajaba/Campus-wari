import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  getListings,
  getProfilesMap,
  subscribe,
  type LocalListing,
  type LocalProfile,
} from "@/lib/store";
import { LISTING_TYPES, type ListingTypeValue, timeAgo, typeBadgeClass, typeMeta, initials, avatarTintClass } from "@/lib/format";
import { Plus } from "lucide-react";

type ProfileMap = Record<string, LocalProfile>;

const searchSchema = z.object({
  type: z.enum(["all", "tutoring", "notes", "collab", "hangout"]).optional(),
});

export const Route = createFileRoute("/_authed/feed")({
  component: Feed,
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Feed — Campus Wari" }] }),
});

function Feed() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const filter: "all" | ListingTypeValue = search.type ?? "all";
  const setFilter = (next: "all" | ListingTypeValue) => {
    navigate({ to: "/feed", search: next === "all" ? {} : { type: next } });
  };
  const [listings, setListings] = useState<LocalListing[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});

  useEffect(() => {
    function load() {
      const all = getListings()
        .filter((l) => l.status === "active")
        .filter((l) => filter === "all" || l.type === filter)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
      setListings(all);
      const ids = Array.from(new Set(all.map((l) => l.user_id)));
      setProfiles(getProfilesMap(ids));
    }
    load();
    const unsub = subscribe((key) => {
      if (key === "cw.listings" || key === "cw.users") load();
    });
    return unsub;
  }, [filter]);

  return (
    <main className="max-w-3xl mx-auto px-6 pt-8 pb-32">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-serif text-4xl tracking-tight">The board</h1>
          <p className="text-sm text-ink-muted mt-1">What your campus is up to right now.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>Everything</FilterChip>
        {LISTING_TYPES.map((t) => (
          <FilterChip key={t.value} active={filter === t.value} onClick={() => setFilter(t.value)}>
            <span className="mr-1.5">{t.emoji}</span>{t.label}
          </FilterChip>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-5">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} profile={profiles[l.user_id]} />
          ))}
          <p className="text-center text-xs text-ink-muted italic font-serif mt-6">
            You've reached the bottom of the pile.
          </p>
        </div>
      )}

      <Link
        to="/create"
        className="fixed bottom-6 right-6 sm:hidden inline-flex items-center justify-center size-14 rounded-full bg-lal-cha text-paper shadow-lg hover:bg-ink transition-colors"
        aria-label="Create listing"
      >
        <Plus className="size-6" />
      </Link>
      <Link
        to="/create"
        className="hidden sm:inline-flex fixed bottom-8 right-8 items-center gap-2 rounded-full bg-lal-cha text-paper px-5 py-3.5 text-sm font-medium shadow-lg hover:bg-ink transition-colors"
      >
        <Plus className="size-4" /> Pass a Note
      </Link>
    </main>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-ink text-paper"
          : "bg-paper border border-border-warm text-ink-muted hover:text-ink hover:border-lal-cha/30"
      }`}
    >
      {children}
    </button>
  );
}

function ListingCard({ listing, profile }: { listing: LocalListing; profile?: LocalProfile }) {
  const meta = typeMeta(listing.type);
  const name = profile?.name ?? "Someone";
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="block bg-paper rounded-3xl border border-border-warm/60 p-6 sm:p-7 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(49,39,37,0.06)] transition-all"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-10 rounded-full flex items-center justify-center font-medium text-sm shrink-0 ${avatarTintClass(listing.user_id)}`}>
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{name}</div>
            <div className="text-ink-muted text-xs">
              {profile?.department ? `${profile.department} · ` : ""}{timeAgo(listing.created_at)}
            </div>
          </div>
        </div>
        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest ${typeBadgeClass(listing.type)}`}>
          {meta.label}
        </span>
      </div>
      <h3 className="font-serif text-2xl leading-snug text-balance mb-2">{listing.title}</h3>
      {listing.subject && (
        <div className="text-xs text-ink-muted mb-2">{listing.subject}</div>
      )}
      <p className="text-ink-muted text-sm text-pretty line-clamp-3">{listing.description}</p>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-paper rounded-3xl border border-dashed border-border-warm p-12 text-center">
      <div className="text-5xl mb-3">🍵</div>
      <h3 className="font-serif text-2xl mb-2">Quiet on the table.</h3>
      <p className="text-sm text-ink-muted mb-6 max-w-xs mx-auto">
        No listings here yet. Be the first to start the conversation.
      </p>
      <Link
        to="/create"
        className="inline-flex items-center justify-center rounded-full bg-lal-cha text-paper px-5 py-2.5 text-sm font-medium hover:bg-ink transition-colors"
      >
        Pass the first note
      </Link>
    </div>
  );
}
