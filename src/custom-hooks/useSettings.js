import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AllezGoApi, { isRequestCanceled } from "../services/allezgo-api/allezGoApi.js";
import apiClient from "../services/ApiClient.js";

const toApiError = (error) => ({
  status: error?.status ?? null,
  message: error?.message || "Request failed",
  data: error?.data ?? null,
});

const QUERY_KEY = ["settings"];

export default function useSettings() {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading: loading,
    error: queryError,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        return await AllezGoApi.Settings.get({ signal });
      } catch (err) {
        if (isRequestCanceled(err)) return undefined;
        throw toApiError(err);
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (settings?.benefit_marge !== undefined) {
      apiClient.setBenefitRate(settings.benefit_marge / 100);
    }
  }, [settings?.benefit_marge]);

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      try {
        return await AllezGoApi.Settings.update(payload);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: (updated) => {
      const newSettings = updated?.data || updated;
      queryClient.setQueryData(QUERY_KEY, newSettings);
      if (newSettings?.benefit_marge !== undefined) {
        apiClient.setBenefitRate(newSettings.benefit_marge / 100);
      }
      toast.success("Paramètres mis à jour avec succès !", { id: "settings-update-success" });
    },
    onError: () => toast.error("Erreur lors de la mise à jour des paramètres.", { id: "settings-update-error" }),
  });

  const actionLoading = updateMutation.isPending;
  const error = queryError || updateMutation.error || null;

  return {
    settings,
    loading,
    actionLoading,
    error,
    isError,
    refetch,
    updateSettings: updateMutation.mutateAsync,
  };
}
