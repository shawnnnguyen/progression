import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FALLBACK_PALETTE: { bg: string; fg: string }[] = [
  { bg: "var(--color-accent-700)", fg: "var(--color-accent-100)" },
  { bg: "var(--color-accent-2-700)", fg: "var(--color-accent-2-100)" },
  { bg: "var(--color-neutral-700)", fg: "var(--color-neutral-100)" },
  { bg: "var(--color-neutral-800)", fg: "var(--color-neutral-200)" },
  { bg: "var(--color-accent-800)", fg: "var(--color-accent-200)" },
];

function hashToIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = "default",
  className,
}: {
  userId: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  // Unassigned: transparent fill, muted "?" — matches the design's "none" tone.
  if (!userId) {
    return (
      <Avatar size={size} className={className} title="Unassigned">
        <AvatarFallback style={{ backgroundColor: "transparent", color: "var(--color-neutral-500)" }}>?</AvatarFallback>
      </Avatar>
    );
  }

  const { bg, fg } = FALLBACK_PALETTE[hashToIndex(userId, FALLBACK_PALETTE.length)];
  const fallbackText = name ? initialsFromName(name) : userId.slice(0, 2).toUpperCase();
  const title = name ?? `Unknown user (${userId.slice(0, 8)})`;

  return (
    <Avatar size={size} className={className} title={title}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
      <AvatarFallback style={{ backgroundColor: bg, color: fg }}>{fallbackText}</AvatarFallback>
    </Avatar>
  );
}
