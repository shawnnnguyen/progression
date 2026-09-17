import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createComment, deleteComment, listComments, updateComment } from "../api/commentsApi";

export function useComments(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", ticketId, "comments"],
    queryFn: () => listComments(ticketId!).then((res) => res.data),
    enabled: !!ticketId,
  });
}

export function useCreateComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => createComment(ticketId, body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId, "events"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    },
  });
}

export function useUpdateComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId, "comments"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update comment");
    },
  });
}

export function useDeleteComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId, "comments"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment");
    },
  });
}
