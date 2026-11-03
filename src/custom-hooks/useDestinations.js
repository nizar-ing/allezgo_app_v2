import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AllezGoApi, { isRequestCanceled } from "../services/allezgo-api/allezGoApi.js";
import { normalizeDestination } from "../utils/normalizeDestination.js";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

function useDestinationsCRUD(category) {
  const queryClient = useQueryClient();
  const QUERY_KEY = ["destinations", category];

  const {
    data: queryResult = {},
    isLoading: loading,
    error: queryError,
    isError,
    refetch: fetchAll,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        const result = await AllezGoApi.Destinations.getAll({ params: { category }, signal });
        const raw = Array.isArray(result) ? result : (result?.data ?? []);
        const meta = Array.isArray(result) ? null : (result?.meta ?? null);
        return { data: raw.map(normalizeDestination), meta };
      } catch (err) {
        if (isRequestCanceled(err)) return { data: [], meta: null };
        throw toApiError(err);
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const data = queryResult.data ?? [];
  const meta = queryResult.meta ?? null;

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await AllezGoApi.Destinations.create(payload);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (created) => {
      const newItem = normalizeDestination(created?.data || created);
      queryClient.setQueryData(QUERY_KEY, (old) => {
        const prev = old?.data ?? (Array.isArray(old) ? old : []);
        return { data: [newItem, ...prev], meta: old?.meta ?? null };
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
      const updatedItem = normalizeDestination(updated?.data || updated);
      queryClient.setQueryData(QUERY_KEY, (old) => {
        const prev = old?.data ?? (Array.isArray(old) ? old : []);
        return {
          data: prev.map((item) => (String(item?.id) === String(id) ? { ...item, ...updatedItem } : item)),
          meta: old?.meta ?? null,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['destination', id] });
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
      queryClient.setQueryData(QUERY_KEY, (old) => {
        const prev = old?.data ?? (Array.isArray(old) ? old : []);
        return {
          data: prev.filter((item) => String(item?.id) !== String(id)),
          meta: old?.meta ?? null,
        };
      });
      toast.success("Destination supprimée avec succès.", { id: "dest-delete-success" });
    },
    onError: () => toast.error("Erreur lors de la suppression.", { id: "dest-delete-error" })
  });

  const actionLoading = createMutation.isPending || updateMutation.isPending || removeMutation.isPending;
  const error = queryError || createMutation.error || updateMutation.error || removeMutation.error || null;

  return {
    data,
    meta,
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

export default function useDestinations() {
  return useDestinationsCRUD('voyage_organise');
}

export function useOmraDestinations() {
  return useDestinationsCRUD('omra');
}

/**
 * Fetches and normalizes a single destination by id.
 * Shares the 5 min staleTime / 10 min gcTime policy used by the list query.
 */
export function useDestination(id) {
  return useQuery({
    queryKey: ['destination', id],
    queryFn: async ({ signal }) => {
      try {
        const raw = await AllezGoApi.Destinations.getById(id, { signal });
        return normalizeDestination(raw?.data ?? raw);
      } catch (err) {
        if (isRequestCanceled(err)) return null;
        throw toApiError(err);
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}
