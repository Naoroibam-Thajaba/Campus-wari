export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} wk${w === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export const LISTING_TYPES = [
  { value: "tutoring", label: "Tutoring", emoji: "📚" },
  { value: "notes", label: "Notes", emoji: "📝" },
  { value: "collab", label: "Collab", emoji: "🤝" },
  { value: "hangout", label: "Hangout", emoji: "☕" },
] as const;

export type ListingTypeValue = typeof LISTING_TYPES[number]["value"];

export function typeMeta(type: string) {
  return LISTING_TYPES.find((t) => t.value === type) ?? LISTING_TYPES[0];
}

export function typeBadgeClass(type: string): string {
  switch (type) {
    case "tutoring": return "bg-leaf/10 text-leaf";
    case "notes": return "bg-sunlight/15 text-ink";
    case "collab": return "bg-lal-cha/10 text-lal-cha";
    case "hangout": return "bg-sunlight/20 text-ink";
    default: return "bg-muted text-ink-muted";
  }
}

export function avatarTintClass(seed: string): string {
  const tints = [
    "bg-sunlight/20 text-ink",
    "bg-leaf/15 text-leaf",
    "bg-lal-cha/15 text-lal-cha",
    "bg-ink/5 text-ink",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tints[h % tints.length];
}
