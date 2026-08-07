import { apiFetch } from "@/lib/api";
import type { CommentRow, CommentsPage } from "../types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listComments(ticketId: string, cursor?: string, limit?: number) {
  return apiFetch<CommentsPage>(`/tickets/${ticketId}/comments${buildQuery({ cursor, limit })}`);
}

export function createComment(ticketId: string, body: string) {
  return apiFetch<{ data: CommentRow }>(`/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function updateComment(commentId: string, body: string) {
  return apiFetch<{ data: CommentRow }>(`/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

export function deleteComment(commentId: string) {
  return apiFetch<void>(`/comments/${commentId}`, { method: "DELETE" });
}
