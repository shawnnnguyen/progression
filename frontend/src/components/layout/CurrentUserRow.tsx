import { UserAvatar } from "@/components/domain/UserAvatar";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export function CurrentUserRow() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
      <UserAvatar userId={user.id} name={user.name} avatarUrl={user.avatarUrl} size="sm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
      </div>
    </div>
  );
}
