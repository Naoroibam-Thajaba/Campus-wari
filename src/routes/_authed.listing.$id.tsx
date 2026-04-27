import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  deleteListing,
  getListing,
  getProfile,
  sendMessage,
  subscribe,
  updateListingStatus,
  type LocalListing,
  type LocalProfile,
} from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { avatarTintClass, initials, timeAgo, typeBadgeClass, typeMeta } from "@/lib/format";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authed/listing/$id")({
  component: ListingDetail,
  head: () => ({ meta: [{ title: "Listing — Campus Wari" }] }),
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<LocalListing | null | "missing">(null);
  const [poster, setPoster] = useState<LocalProfile | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    function load() {
      const l = getListing(id);
      if (!l) { setListing("missing"); return; }
      setListing(l);
      setPoster(getProfile(l.user_id));
    }
    load();
    const unsub = subscribe((key) => {
      if (key === "cw.listings" || key === "cw.users") load();
    });
    return unsub;
  }, [id]);

  function onSend() {
    if (!user || !listing || listing === "missing" || !body.trim()) return;
    setSending(true);
    try {
      sendMessage({
        listing_id: listing.id,
        sender_id: user.id,
        recipient_id: listing.user_id,
        body: body.trim().slice(0, 2000),
      });
      toast.success("Message sent! Check your inbox.");
      navigate({ to: "/messages" });
    } catch {
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  }

  function markFulfilled() {
    if (!listing || listing === "missing") return;
    updateListingStatus(listing.id, "fulfilled");
    toast.success("Marked as fulfilled");
    setListing({ ...listing, status: "fulfilled" });
  }

  function onDelete() {
    if (!listing || listing === "missing") return;
    if (!confirm("Delete this listing? This can't be undone.")) return;
    deleteListing(listing.id);
    toast.success("Listing deleted");
    navigate({ to: "/feed" });
  }

  if (listing === "missing") {
    return (
      <main className="max-w-2xl mx-auto px-6 pt-12 text-center">
        <div className="text-5xl mb-3">📭</div>
        <h1 className="font-serif text-3xl">This listing is gone.</h1>
        <p className="text-ink-muted text-sm mt-2">It may have been removed or fulfilled.</p>
        <Link to="/feed" className="inline-flex items-center justify-center rounded-full bg-lal-cha text-paper px-5 py-2.5 text-sm font-medium mt-6 hover:bg-ink">
          Back to feed
        </Link>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="max-w-2xl mx-auto px-6 pt-8 animate-pulse">
        <div className="h-4 w-24 bg-secondary rounded mb-4" />
        <div className="bg-paper rounded-3xl border border-border-warm/60 p-7">
          <div className="h-3 w-32 bg-secondary rounded mb-4" />
          <div className="h-8 w-3/4 bg-secondary rounded mb-3" />
          <div className="h-3 w-full bg-secondary rounded mb-2" />
          <div className="h-3 w-2/3 bg-secondary rounded" />
        </div>
      </main>
    );
  }

  const meta = typeMeta(listing.type);
  const isOwner = user?.id === listing.user_id;
  const name = poster?.name ?? "Someone";

  return (
    <main className="max-w-2xl mx-auto px-6 pt-6 pb-24">
      <Link to="/feed" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4">
        <ChevronLeft className="size-4" /> Back to feed
      </Link>

      <article className="bg-paper rounded-3xl border border-border-warm/60 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`size-11 rounded-full flex items-center justify-center font-medium text-sm ${avatarTintClass(listing.user_id)}`}>
              {initials(name)}
            </div>
            <div>
              <div className="font-medium text-sm">{name}</div>
              <div className="text-ink-muted text-xs">
                {poster?.department ? `${poster.department} · ` : ""}{timeAgo(listing.created_at)}
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest ${typeBadgeClass(listing.type)}`}>
            {meta.label}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl leading-tight text-balance mb-3">{listing.title}</h1>
        {listing.subject && (
          <div className="text-sm text-ink-muted mb-4">📌 {listing.subject}</div>
        )}
        <p className="text-ink whitespace-pre-wrap text-pretty leading-relaxed">{listing.description}</p>

        {listing.status === "fulfilled" && (
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-leaf bg-leaf/10 px-3 py-1.5 rounded-full">
            ✓ Marked as fulfilled
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-dashed border-border-warm">
          {isOwner ? (
            <div className="flex flex-wrap gap-3">
              {listing.status === "active" && (
                <button onClick={markFulfilled} className="rounded-full bg-leaf text-paper px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
                  Mark as fulfilled
                </button>
              )}
              <button onClick={onDelete} className="rounded-full bg-background border border-destructive/40 text-destructive px-5 py-2.5 text-sm font-medium hover:bg-destructive/5 transition-colors">
                Delete listing
              </button>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2 block">
                Message {name.split(" ")[0]}
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Hey! I saw your post..."
                className="w-full bg-background border border-border-warm rounded-xl px-4 py-3 text-sm outline-none focus:border-lal-cha/60 focus:ring-2 focus:ring-lal-cha/15 resize-y"
              />
              <button
                onClick={onSend}
                disabled={sending || !body.trim()}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-lal-cha text-paper px-6 py-2.5 text-sm font-medium hover:bg-ink disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
