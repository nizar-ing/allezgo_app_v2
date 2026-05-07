// src/custom-hooks/useCarousel.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AllezGoApi, { isRequestCanceled } from "../services/allezgo-api/allezGoApi.js";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

export default function useCarousel() {
  const queryClient = useQueryClient();
  const QUERY_KEY = ["carousel"];

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
        const result = await AllezGoApi.Carousel.getAll({ signal });
        const items = Array.isArray(result) ? result : (result?.data || []);
        // Sort items by displayOrder locally just to be sure
        return items.sort((a, b) => a.displayOrder - b.displayOrder);
      } catch (err) {
        if (isRequestCanceled(err)) return [];
        throw toApiError(err);
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      try {
        return await AllezGoApi.Carousel.upload(formData);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (created) => {
      const newItem = created?.data || created;
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [newItem];
        const newData = [...oldData, newItem];
        return newData.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      toast.success("Média ajouté au carrousel avec succès !", { id: "carousel-upload-success" });
    },
    onError: () => toast.error("Erreur lors de l'ajout du média.", { id: "carousel-upload-error" })
  });

  const reorderMutation = useMutation({
    mutationFn: async (items) => {
      try {
        return await AllezGoApi.Carousel.reorder(items);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (updated) => {
      const updatedItems = updated?.data || updated;
      queryClient.setQueryData(QUERY_KEY, () => {
        const items = Array.isArray(updatedItems) ? updatedItems : [];
        return items.sort((a, b) => a.displayOrder - b.displayOrder);
      });
      toast.success("Carrousel réorganisé !", { id: "carousel-reorder-success" });
    },
    onError: () => toast.error("Erreur lors de la réorganisation.", { id: "carousel-reorder-error" })
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      try {
        return await AllezGoApi.Carousel.remove(id);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(QUERY_KEY, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((item) => String(item?.id) !== String(id));
      });
      toast.success("Média supprimé avec succès.", { id: "carousel-delete-success" });
    },
    onError: () => toast.error("Erreur lors de la suppression.", { id: "carousel-delete-error" })
  });

  const actionLoading = uploadMutation.isPending || reorderMutation.isPending || removeMutation.isPending;
  const error = queryError || uploadMutation.error || reorderMutation.error || removeMutation.error || null;

  return {
    data,
    loading,
    actionLoading,
    error,
    isError,
    fetchAll,
    uploadMedia: uploadMutation.mutateAsync,
    reorderMedia: reorderMutation.mutateAsync,
    removeMedia: removeMutation.mutateAsync,
  };
}
