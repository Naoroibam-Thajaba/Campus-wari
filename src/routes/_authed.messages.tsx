import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getListings,
  getMessages,
  getProfilesMap,
  sendMessage,
  subscribe,
  type LocalMessage,
} from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { avatarTintClass, initials, timeAgo } from "@/lib/format";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";

type Conversation = {
  key: string;
  listing_id: string;
  listing_title: string;
  other_id: string;
  other_name: string;
  last: LocalMessage;
};

export const Route = createFileRoute("/_authed/messages")({
  component: Messages,
  head: () => ({ meta: [{ title: "Messages — Campus Wari" }] }),
});

function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [listings, setListings] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    function load() {
      const all = getMessages().filter(
        (m) => m.sender_id === user!.id || m.recipient_id === user!.id
      );
      setMessages(all);

      const listingIds = Array.from(new Set(all.map((m) => m.listing_id)));
      const userIds = Array.from(new Set(all.flatMap((m) => [m.sender_id, m.recipient_id])));

      const lmap: Record<string, string> = {};
      for (const l of getListings()) {
        if (listingIds.includes(l.id)) lmap[l.id] = l.title;
      }
      setListings(lmap);

      const profs = getProfilesMap(userIds);
      const pmap: Record<string, string> = {};
      for (const id of Object.keys(profs)) pmap[id] = profs[id].name;
      setProfiles(pmap);
    }
    load();
    const unsub = subscribe((key) => {
      if (key === "cw.messages" || key === "cw.listings" || key === "cw.users") load();
    });
    return unsub;
  }, [user]);

  const conversations = useMemo<Conversation[]>(() => {
    if (!user) return [];
    const map = new Map<string, Conversation>();
    for (const m of messages) {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const key = `${m.listing_id}:${other}`;
      const existing = map.get(key);
      if (!existing || new Date(m.created_at) > new Date(existing.last.created_at)) {
        map.set(key, {
          key,
          listing_id: m.listing_id,
          listing_title: listings[m.listing_id] ?? "Listing",
          other_id: other,
          other_name: profiles[other] ?? "Someone",
          last: m,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime()
    );
  }, [messages, user, listings, profiles]);

  const activeConvo = activeKey ? conversations.find((c) => c.key === activeKey) : null;
  const activeMessages = useMemo(() => {
    if (!activeConvo || !user) return [];
    return messages
      .filter(
        (m) =>
          m.listing_id === activeConvo.listing_id &&
          ((m.sender_id === user.id && m.recipient_id === activeConvo.other_id) ||
           (m.sender_id === activeConvo.other_id && m.recipient_id === user.id))
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeConvo, messages, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length]);

  function send() {
    if (!user || !activeConvo || !body.trim()) return;
    setSending(true);
    try {
      sendMessage({
        listing_id: activeConvo.listing_id,
        sender_id: user.id,
        recipient_id: activeConvo.other_id,
        body: body.trim().slice(0, 2000),
      });
      setBody("");
    } catch {
      toast.error("Could not send");
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 pt-12 text-center">
        <div className="text-5xl mb-3">💌</div>
        <h1 className="font-serif text-3xl">No messages yet.</h1>
        <p className="text-sm text-ink-muted mt-2 mb-6">Browse the feed and reach out to someone.</p>
        <Link to="/feed" className="inline-flex items-center justify-center rounded-full bg-lal-cha text-paper px-5 py-2.5 text-sm font-medium hover:bg-ink">
          Open the feed
        </Link>
      </main>
    );
  }

  if (activeConvo) {
    return (
      <main className="max-w-3xl mx-auto px-0 sm:px-6 sm:pt-6 pb-0 flex flex-col h-[calc(100dvh-4rem)]">
        <div className="px-4 sm:px-0 py-3 border-b border-border-warm flex items-center gap-3">
          <button onClick={() => setActiveKey(null)} className="text-ink-muted hover:text-ink">
            <ChevronLeft className="size-5" />
          </button>
          <div className={`size-9 rounded-full flex items-center justify-center font-medium text-sm ${avatarTintClass(activeConvo.other_id)}`}>
            {initials(activeConvo.other_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{activeConvo.other_name}</div>
            <Link to="/listing/$id" params={{ id: activeConvo.listing_id }} className="text-xs text-ink-muted hover:text-lal-cha truncate block">
              About: {activeConvo.listing_title}
            </Link>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-0 py-6 flex flex-col gap-2">
          {activeMessages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                mine
                  ? "self-end bg-lal-cha text-paper rounded-br-sm"
                  : "self-start bg-paper border border-border-warm rounded-bl-sm"
              }`}>
                <div className="whitespace-pre-wrap text-pretty">{m.body}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-paper/70" : "text-ink-muted"}`}>{timeAgo(m.created_at)}</div>
              </div>
            );
          })}
        </div>

        <div className="px-4 sm:px-0 py-3 border-t border-border-warm bg-background">
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              maxLength={2000}
              className="flex-1 bg-paper border border-border-warm rounded-full px-4 py-2.5 text-sm outline-none focus:border-lal-cha/60 focus:ring-2 focus:ring-lal-cha/15"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="size-11 rounded-full bg-lal-cha text-paper inline-flex items-center justify-center disabled:opacity-50 hover:bg-ink transition-colors"
              aria-label="Send"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 pt-8 pb-24">
      <h1 className="font-serif text-4xl tracking-tight mb-1">Inbox</h1>
      <p className="text-sm text-ink-muted mb-6">Conversations from your listings.</p>

      <ul className="bg-paper border border-border-warm/60 rounded-3xl overflow-hidden divide-y divide-border-warm">
        {conversations.map((c) => {
          const mine = c.last.sender_id === user?.id;
          return (
            <li key={c.key}>
              <button
                onClick={() => setActiveKey(c.key)}
                className="w-full text-left flex items-start gap-3 p-4 sm:p-5 hover:bg-background/60 transition-colors"
              >
                <div className={`size-11 rounded-full flex items-center justify-center font-medium text-sm shrink-0 ${avatarTintClass(c.other_id)}`}>
                  {initials(c.other_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm truncate">{c.other_name}</div>
                    <div className="text-xs text-ink-muted shrink-0">{timeAgo(c.last.created_at)}</div>
                  </div>
                  <div className="text-xs text-ink-muted truncate mt-0.5">↳ {c.listing_title}</div>
                  <div className="text-sm text-ink/80 truncate mt-1">
                    {mine && <span className="text-ink-muted">You: </span>}{c.last.body}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
