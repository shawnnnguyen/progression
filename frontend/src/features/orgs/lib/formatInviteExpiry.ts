export function formatInviteExpiry(expiresAt: string): string {
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft <= 0) return "Expired";
  if (daysLeft === 1) return "Expires in 1 day";
  return `Expires in ${daysLeft} days`;
}
