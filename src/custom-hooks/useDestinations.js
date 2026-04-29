// src/custom-hooks/useDestinations.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AllezGoApi, { isRequestCanceled } from "../services/allezgo-api/allezGoApi.js";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

export default function useDestinations() {
  const queryClient = useQueryClient();
  const QUERY_KEY = ["destinations"];

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
        const result = await AllezGoApi.Destinations.getAll({ signal });
        return Array.isArray(result) ? result : (result?.data || []);
      } catch (err) {
        if (isRequestCanceled(err)) return [];
        throw toApiError(err);
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await AllezGoApi.Destinations.create(payload);
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
      toast.success("Destination ajoutée avec succès !", { id: "dest-create-success" });
    },
    onError: () => toast.error("Erreur lors de l'ajout de la destination.", { id: "dest-create-error" })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        return await AllezGoApi.Destinations.update(id, payload);
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
      toast.success("Destination mise à jour !", { id: "dest-update-success" });
    },
    onError: () => toast.error("Erreur lors de la mise à jour.", { id: "dest-update-error" })
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await AllezGoApi.Destinations.remove(id);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((item) => String(item?.id) !== String(id));
      });
      toast.success("Destination supprimée avec succès.", { id: "dest-delete-success" });
    },
    onError: () => toast.error("Erreur lors de la suppression.", { id: "dest-delete-error" })
  });

  const actionLoading = createMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const error = queryError || createMutation.error || updateMutation.error || removeMutation.error || null;

  return {
    data,
    loading,
    actionLoading,
    error,
    isError,
    fetchAll,
    createDestination: createMutation.mutateAsync,
    updateDestination: updateMutation.mutateAsync,
    removeDestination: removeMutation.mutateAsync,
  };
}
