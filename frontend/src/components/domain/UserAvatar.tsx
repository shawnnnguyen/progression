import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const FALLBACK_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];

// Deterministic per-id color/initials so an assignee without a resolved
// name/avatar (gap #1 in the implementation plan) still reads as a stable
// identity across renders, rather than a blank or random-looking glyph.
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
  userId: string;
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const colorClass = FALLBACK_PALETTE[hashToIndex(userId, FALLBACK_PALETTE.length)];
  const fallbackText = name ? initialsFromName(name) : userId.slice(0, 2).toUpperCase();
  const title = name ?? `Unknown user (${userId.slice(0, 8)})`;

  return (
    <Avatar size={size} className={className} title={title}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
      <AvatarFallback className={cn("text-white", colorClass)}>{fallbackText}</AvatarFallback>
    </Avatar>
  );
}
