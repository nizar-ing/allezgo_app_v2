// src/custom-hooks/useUsers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AllezGoApi, { isRequestCanceled } from "../services/allezgo-api/allezGoApi.js";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

export default function useUsers() {
  const queryClient = useQueryClient();
  const QUERY_KEY = ["users"];

  // 1. Fetch All
  const {
    data = [],
    isLoading: loading,
    error: queryError,
    isError,
    refetch: fetchAll,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        const result = await AllezGoApi.Users.getAll({ signal });
        return Array.isArray(result) ? result : (result?.data || []);
      } catch (err) {
        if (isRequestCanceled(err)) return [];
        throw toApiError(err);
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // 2. Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await AllezGoApi.Users.create(payload);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (created) => {
      const newItem = created?.data || created;
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [newItem];
        return [newItem, ...oldData];
      });
      toast.success("Utilisateur ajouté avec succès !", { id: "user-create-success" });
    },
    onError: () => toast.error("Erreur lors de l'ajout de l'utilisateur.", { id: "user-create-error" })
  });

  // 3. Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        return await AllezGoApi.Users.update(id, payload);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (updated, { id }) => {
      const updatedItem = updated?.data || updated;
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.map((item) => (String(item?.id) === String(id) ? { ...item, ...updatedItem } : item));
      });
      toast.success("Utilisateur mis à jour !", { id: "user-update-success" });
    },
    onError: () => toast.error("Erreur lors de la mise à jour.", { id: "user-update-error" })
  });

  // 4. Remove Mutation
  const removeMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await AllezGoApi.Users.remove(id);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((item) => String(item?.id) !== String(id));
      });
      toast.success("Utilisateur supprimé avec succès.", { id: "user-delete-success" });
    },
    onError: () => toast.error("Erreur lors de la suppression.", { id: "user-delete-error" })
  });

  // Consolidate UI States
  const actionLoading = createMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const error = queryError || createMutation.error || updateMutation.error || removeMutation.error || null;

  return {
    data,
    loading,
    actionLoading,
    error,
    fetchAll,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    removeUser: removeMutation.mutateAsync,
  };
}