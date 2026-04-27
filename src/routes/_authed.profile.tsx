import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getListings,
  subscribe,
  updateProfile,
  type LocalListing,
} from "@/lib/store";
import { useAuth, signOut } from "@/lib/auth";
import { avatarTintClass, initials, timeAgo, typeBadgeClass, typeMeta } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — Campus Wari" }] }),
});

function ProfilePage() {
  const { user, refresh } = useAuth();
  const [listings, setListings] = useState<LocalListing[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    function load() {
      setListings(
        getListings()
          .filter((l) => l.user_id === user!.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    }
    load();
    const unsub = subscribe((key) => {
      if (key === "cw.listings") load();
    });
    return unsub;
  }, [user]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const updates = {
      name: String(fd.get("name") ?? "").trim(),
      department: (String(fd.get("department") ?? "").trim() || null) as string | null,
      year: (String(fd.get("year") ?? "").trim() || null) as string | null,
    };
    if (updates.name.length < 2) { toast.error("Name is too short"); return; }
    setSaving(true);
    try {
      updateProfile(user.id, updates);
      refresh();
      setEditing(false);
      toast.success("Saved");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <main className="max-w-2xl mx-auto px-6 pt-8 text-sm text-ink-muted">Loading...</main>;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-8 pb-24">
      <div className="bg-paper border border-border-warm/60 rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className={`size-16 rounded-full flex items-center justify-center font-serif font-medium text-xl ${avatarTintClass(user.id)}`}>
            {initials(user.name)}
          </div>
          <div className="flex-1">
            {!editing ? (
              <>
                <h1 className="font-serif text-3xl tracking-tight">{user.name}</h1>
                <p className="text-sm text-ink-muted mt-0.5">
                  {[user.department, user.year].filter(Boolean).join(" · ") || "Add your department and year"}
                </p>
                <p className="text-xs text-ink-muted mt-1">{user.email}</p>
              </>
            ) : (
              <form onSubmit={save} className="flex flex-col gap-3">
                <input name="name" defaultValue={user.name} placeholder="Name"
                  className="bg-background border border-border-warm rounded-xl px-3 py-2 text-sm outline-none focus:border-lal-cha/60" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="department" defaultValue={user.department ?? ""} placeholder="Department"
                    className="bg-background border border-border-warm rounded-xl px-3 py-2 text-sm outline-none focus:border-lal-cha/60" />
                  <input name="year" defaultValue={user.year ?? ""} placeholder="Year"
                    className="bg-background border border-border-warm rounded-xl px-3 py-2 text-sm outline-none focus:border-lal-cha/60" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="rounded-full bg-lal-cha text-paper px-4 py-2 text-sm font-medium hover:bg-ink disabled:opacity-60">
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="rounded-full bg-background border border-border-warm px-4 py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-lal-cha hover:text-ink">Edit</button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-dashed border-border-warm flex items-center justify-between">
          <p className="text-sm text-ink-muted">Done for the day?</p>
          <button onClick={() => signOut()} className="text-sm font-medium text-destructive hover:text-ink">
            Sign out
          </button>
        </div>
      </div>

      <h2 className="font-serif text-2xl mt-10 mb-4">Your listings</h2>
      {listings.length === 0 ? (
        <div className="bg-paper border border-dashed border-border-warm rounded-2xl p-8 text-center">
          <p className="text-sm text-ink-muted mb-4">You haven't posted anything yet.</p>
          <Link to="/create" className="inline-flex items-center rounded-full bg-lal-cha text-paper px-5 py-2.5 text-sm font-medium hover:bg-ink">
            Pass your first note
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((l) => {
            const meta = typeMeta(l.type);
            return (
              <li key={l.id}>
                <Link to="/listing/$id" params={{ id: l.id }} className="flex items-center gap-3 bg-paper border border-border-warm/60 rounded-2xl p-4 hover:border-lal-cha/30 transition-colors">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest ${typeBadgeClass(l.type)}`}>
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{l.title}</div>
                    <div className="text-xs text-ink-muted">{timeAgo(l.created_at)}</div>
                  </div>
                  {l.status === "fulfilled" && (
                    <span className="text-[10px] font-medium text-leaf bg-leaf/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Done</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
