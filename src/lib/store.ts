// Frontend-only local store backed by localStorage.
// Mocks auth, profiles, listings, and messages.

export type LocalUser = {
  id: string;
  email: string;
  password: string; // plaintext — demo only, no backend
  name: string;
  department: string | null;
  year: string | null;
  createdAt: string;
};

export type LocalProfile = {
  id: string;
  name: string;
  department: string | null;
  year: string | null;
};

export type LocalListing = {
  id: string;
  user_id: string;
  type: "tutoring" | "notes" | "collab" | "hangout";
  title: string;
  subject: string | null;
  description: string;
  status: "active" | "fulfilled";
  created_at: string;
};

export type LocalMessage = {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

const KEYS = {
  users: "cw.users",
  session: "cw.session",
  listings: "cw.listings",
  messages: "cw.messages",
  seeded: "cw.seeded.v1",
} as const;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  // Cross-tab and same-tab listeners
  window.dispatchEvent(new CustomEvent("cw:store", { detail: { key } }));
}

export function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

// ---------------- Seed ----------------

function seedIfNeeded() {
  if (!isBrowser()) return;
  if (localStorage.getItem(KEYS.seeded)) return;

  const demoUsers: LocalUser[] = [
    {
      id: "u_demo_anjali",
      email: "anjali@college.edu",
      password: "password",
      name: "Anjali Devi",
      department: "CSE",
      year: "2nd",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u_demo_ravi",
      email: "ravi@college.edu",
      password: "password",
      name: "Ravi Sharma",
      department: "ECE",
      year: "3rd",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u_demo_meera",
      email: "meera@college.edu",
      password: "password",
      name: "Meera Joshi",
      department: "Economics",
      year: "1st",
      createdAt: new Date().toISOString(),
    },
  ];

  const now = Date.now();
  const minutes = (m: number) => new Date(now - m * 60_000).toISOString();

  const demoListings: LocalListing[] = [
    {
      id: "l_1",
      user_id: "u_demo_anjali",
      type: "notes",
      title: "Sharing Macroeconomics midterm notes",
      subject: "ECO-201",
      description:
        "I made detailed notes from Prof. Mehra's midterm lectures. Happy to share PDFs — DM me!",
      status: "active",
      created_at: minutes(15),
    },
    {
      id: "l_2",
      user_id: "u_demo_ravi",
      type: "tutoring",
      title: "Need help with Signals & Systems — Fourier transforms",
      subject: "EC-301",
      description:
        "Struggling with the FT problems from Tutorial 4. Can pay or trade for chai 😄",
      status: "active",
      created_at: minutes(90),
    },
    {
      id: "l_3",
      user_id: "u_demo_meera",
      type: "hangout",
      title: "Momos at the back-gate stall — 5pm today?",
      subject: null,
      description:
        "Heading to the momo stall after class. Anyone in 1st year free? Pull up.",
      status: "active",
      created_at: minutes(180),
    },
    {
      id: "l_4",
      user_id: "u_demo_anjali",
      type: "collab",
      title: "Looking for 2 teammates for the upcoming hackathon",
      subject: "Hack The Hill",
      description:
        "Building a campus-help app. Looking for one frontend dev and one designer. Beginners welcome!",
      status: "active",
      created_at: minutes(60 * 8),
    },
  ];

  const demoMessages: LocalMessage[] = [
    {
      id: "m_1",
      listing_id: "l_1",
      sender_id: "u_demo_ravi",
      recipient_id: "u_demo_anjali",
      body: "Hey! Could you share the macro notes please?",
      created_at: minutes(10),
    },
  ];

  localStorage.setItem(KEYS.users, JSON.stringify(demoUsers));
  localStorage.setItem(KEYS.listings, JSON.stringify(demoListings));
  localStorage.setItem(KEYS.messages, JSON.stringify(demoMessages));
  localStorage.setItem(KEYS.seeded, "1");
}

if (isBrowser()) seedIfNeeded();

// ---------------- Subscribe ----------------

export function subscribe(listener: (key: string) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ key: string }>).detail;
    listener(detail?.key ?? "");
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key) listener(e.key);
  };
  window.addEventListener("cw:store", handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener("cw:store", handler);
    window.removeEventListener("storage", storageHandler);
  };
}

// ---------------- Users / Auth ----------------

export function getUsers(): LocalUser[] {
  return read<LocalUser[]>(KEYS.users, []);
}

export function getCurrentUser(): LocalUser | null {
  const id = read<string | null>(KEYS.session, null);
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

export async function signIn(email: string, password: string): Promise<LocalUser> {
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
  if (!user || user.password !== password) {
    throw new Error("Invalid email or password");
  }
  write(KEYS.session, user.id);
  return user;
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  department?: string | null;
  year?: string | null;
}): Promise<LocalUser> {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase().trim())) {
    throw new Error("That email is already registered");
  }
  const user: LocalUser = {
    id: "u_" + uid(),
    email: input.email.trim(),
    password: input.password,
    name: input.name.trim(),
    department: input.department?.trim() || null,
    year: input.year?.trim() || null,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.users, [...users, user]);
  write(KEYS.session, user.id);
  return user;
}

export async function signOut(): Promise<void> {
  if (!isBrowser()) return;
  localStorage.removeItem(KEYS.session);
  window.dispatchEvent(new CustomEvent("cw:store", { detail: { key: KEYS.session } }));
}

export function updateProfile(
  userId: string,
  updates: { name: string; department: string | null; year: string | null }
): LocalProfile {
  const users = getUsers();
  const next = users.map((u) =>
    u.id === userId ? { ...u, ...updates } : u
  );
  write(KEYS.users, next);
  const u = next.find((x) => x.id === userId)!;
  return { id: u.id, name: u.name, department: u.department, year: u.year };
}

export function getProfile(id: string): LocalProfile | null {
  const u = getUsers().find((x) => x.id === id);
  if (!u) return null;
  return { id: u.id, name: u.name, department: u.department, year: u.year };
}

export function getProfilesMap(ids: string[]): Record<string, LocalProfile> {
  const map: Record<string, LocalProfile> = {};
  for (const u of getUsers()) {
    if (ids.includes(u.id)) {
      map[u.id] = { id: u.id, name: u.name, department: u.department, year: u.year };
    }
  }
  return map;
}

// ---------------- Listings ----------------

export function getListings(): LocalListing[] {
  return read<LocalListing[]>(KEYS.listings, []);
}

export function getListing(id: string): LocalListing | null {
  return getListings().find((l) => l.id === id) ?? null;
}

export function createListing(input: {
  user_id: string;
  type: LocalListing["type"];
  title: string;
  subject: string | null;
  description: string;
}): LocalListing {
  const listing: LocalListing = {
    id: "l_" + uid(),
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    subject: input.subject,
    description: input.description,
    status: "active",
    created_at: new Date().toISOString(),
  };
  write(KEYS.listings, [listing, ...getListings()]);
  return listing;
}

export function updateListingStatus(id: string, status: LocalListing["status"]) {
  const next = getListings().map((l) => (l.id === id ? { ...l, status } : l));
  write(KEYS.listings, next);
}

export function deleteListing(id: string) {
  write(KEYS.listings, getListings().filter((l) => l.id !== id));
  // Cascade messages
  write(KEYS.messages, getMessages().filter((m) => m.listing_id !== id));
}

// ---------------- Messages ----------------

export function getMessages(): LocalMessage[] {
  return read<LocalMessage[]>(KEYS.messages, []);
}

export function sendMessage(input: {
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
}): LocalMessage {
  const msg: LocalMessage = {
    id: "m_" + uid(),
    listing_id: input.listing_id,
    sender_id: input.sender_id,
    recipient_id: input.recipient_id,
    body: input.body,
    created_at: new Date().toISOString(),
  };
  write(KEYS.messages, [...getMessages(), msg]);
  return msg;
}

// Reset everything (handy for the user)
export function resetStore() {
  if (!isBrowser()) return;
  for (const k of Object.values(KEYS)) localStorage.removeItem(k);
  seedIfNeeded();
}
