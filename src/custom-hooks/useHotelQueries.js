// src/custom-hooks/useHotelQueries.js
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/ApiClient.js";

// ==================== Query Keys ====================
export const QUERY_KEYS = {
    countries:   ["countries"],
    cities:      ["cities"],
    categories:  ["categories"],
    tags:        ["tags"],
    boardings:   ["boardings"],
    currencies:  ["currencies"],
    hotels:      ["hotels"],
    hotelsByCity:  (cityId)   => ["hotels", "city", cityId],
    hotelDetail:   (hotelId)  => ["hotel", hotelId],
    hotelSearch:   (params)   => ["hotelSearch", params],
    // ✅ Empêche la mutation involontaire des tableaux d'IDs passés par l'appelant
    hotelsBatch:   (hotelIds) => ["hotels", "batch", [...hotelIds].sort().join(",")],
};

// ==================== Configuration ====================
const QUERY_CONFIG = {
    STATIC: {
        staleTime: 1000 * 60 * 30, // 30 mins
        gcTime:    1000 * 60 * 60, // 1 hour
    },
    SEMI_STATIC: {
        staleTime: 1000 * 60 * 15,
        gcTime:    1000 * 60 * 30,
    },
    DYNAMIC: {
        staleTime: 1000 * 60 * 2,
        gcTime:    1000 * 60 * 5,
    },
};

// ==================== List Queries ====================

export const useCountries = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.countries,
    queryFn:  () => apiClient.listCountry(),
    ...QUERY_CONFIG.STATIC,
    ...options,
});

export const useCities = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.cities,
    queryFn:  () => apiClient.listCity(),
    ...QUERY_CONFIG.STATIC,
    ...options,
});

export const useCategories = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn:  () => apiClient.listCategorie(),
    ...QUERY_CONFIG.STATIC,
    ...options,
});

export const useTags = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn:  () => apiClient.listTag(),
    ...QUERY_CONFIG.STATIC,
    ...options,
});

export const useBoardings = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.boardings,
    queryFn:  () => apiClient.listBoarding(),
    ...QUERY_CONFIG.STATIC,
    ...options,
});

export const useCurrencies = (options = {}) => useQuery({
    queryKey: QUERY_KEYS.currencies,
    queryFn:  async () => {
        const data = await apiClient.listCurrency();
        return data.currencies;
    },
    ...QUERY_CONFIG.STATIC,
    ...options,
});

// ==================== Hotel Queries ====================

export const useHotels = (cityId = null, options = {}) => {
    const { enabled = true, ...restOptions } = options;
    return useQuery({
        queryKey: cityId ? QUERY_KEYS.hotelsByCity(cityId) : QUERY_KEYS.hotels,
        queryFn:  () => apiClient.listHotel(cityId),
        enabled,
        ...QUERY_CONFIG.SEMI_STATIC,
        ...restOptions,
    });
};

export const useHotelsBatch = (hotelIds = [], options = {}) => {
    const {
        batchSize            = 5,
        delayBetweenBatches  = 100,
        enabled              = true,
        ...restOptions
    } = options;
    return useQuery({
        queryKey: QUERY_KEYS.hotelsBatch(hotelIds),
        queryFn:  () => apiClient.getHotelsBatch(hotelIds, { batchSize, delayBetweenBatches }),
        enabled:  enabled && hotelIds.length > 0,
        ...QUERY_CONFIG.SEMI_STATIC,
        refetchOnWindowFocus: false,
        ...restOptions,
    });
};

/**
 * ✅ RESTORED & SYNCED: Charge les hôtels avec détails (Premium) pour la HomePage.
 * Consomme la méthode listHotelEnhanced restaurée dans ApiClient.js.
 */
export const useHotelsEnhanced = (cityId = null, options = {}) => {
    const {
        batchSize           = 5,
        delayBetweenBatches = 100,
        enabled             = true,
        onProgress          = null,
        onBatchComplete     = null,
        ...restOptions
    } = options;

    return useQuery({
        queryKey: cityId
            ? [...QUERY_KEYS.hotelsByCity(cityId), "enhanced"]
            : [...QUERY_KEYS.hotels, "enhanced"],
        queryFn: () => apiClient.listHotelEnhanced(cityId, {
            batchSize,
            delayBetweenBatches,
            onProgress,
            onBatchComplete,
        }),
        enabled,
        ...QUERY_CONFIG.SEMI_STATIC,
        staleTime:            1000 * 60 * 20, // 20 mins
        refetchOnWindowFocus: false,
        refetchOnMount:       false,
        retry:                1,
        ...restOptions,
    });
};

export const useHotelDetail = (hotelId, options = {}) => {
    const { enabled = true, ...restOptions } = options;
    return useQuery({
        queryKey: QUERY_KEYS.hotelDetail(hotelId),
        queryFn:  async () => {
            const data = await apiClient.getHotelDetail(hotelId);
            if (data.errorMessage && data.errorMessage.length > 0) {
                throw new Error(data.errorMessage[0]?.Description || "Failed to fetch hotel details");
            }
            // Retourne l'hôtel (avec la marge de 8% déjà appliquée par l'ApiClient)
            return data.hotelDetail;
        },
        enabled: !!hotelId && enabled,
        ...QUERY_CONFIG.SEMI_STATIC,
        ...restOptions,
    });
};

export const useHotelSearch = (searchParams, options = {}) => {
    const { enabled = false, ...restOptions } = options;

    // Cleanup: Annule les requêtes en cours si les paramètres changent radicalement
    useEffect(() => {
        return () => { apiClient.cancelRequest("hotelSearch"); };
    }, [searchParams?.checkIn, searchParams?.checkOut, searchParams?.hotels?.length]);

    return useQuery({
        queryKey: QUERY_KEYS.hotelSearch(searchParams),
        queryFn:  async () => {
            try {
                const data = await apiClient.searchHotel(searchParams);
                if (data.errorMessage && data.errorMessage.Code) {
                    throw new Error(data.errorMessage.Description || "Search failed");
                }
                // Retourne les résultats (avec 8% markup et transformation Number faite en amont)
                return data;
            } catch (error) {
                if (error.isCancelled) return null;
                throw error;
            }
        },
        enabled: enabled && !!searchParams?.checkIn && !!searchParams?.checkOut,
        ...QUERY_CONFIG.DYNAMIC,
        retry: (failureCount, error) => {
            if (error.isCancelled || (error.status >= 400 && error.status < 500)) return false;
            return failureCount < 1;
        },
        ...restOptions,
    });
};

export const useHotelSearchMutation = (options = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (searchParams) => apiClient.searchHotel(searchParams),
        onSuccess:  (data, variables) => {
            // Met à jour manuellement le cache de recherche après une mutation réussie
            queryClient.setQueryData(QUERY_KEYS.hotelSearch(variables), data);
        },
        retry: (failureCount, error) => {
            if (error.isCancelled || (error.status >= 400 && error.status < 500)) return false;
            return failureCount < 1;
        },
        ...options,
    });
};

// ==================== Helper Hooks ====================

export const useFilterData = () => {
    const countries  = useCountries();
    const cities     = useCities();
    const categories = useCategories();
    const tags       = useTags();
    const boardings  = useBoardings();
    const currencies = useCurrencies();

    return {
        countries, cities, categories, tags, boardings, currencies,
        isLoading:
            countries.isLoading  || cities.isLoading    || categories.isLoading ||
            tags.isLoading       || boardings.isLoading  || currencies.isLoading,
        isError:
            countries.isError    || cities.isError      || categories.isError   ||
            tags.isError         || boardings.isError    || currencies.isError,
        error:
            countries.error      || cities.error        || categories.error     ||
            tags.error           || boardings.error      || currencies.error,
    };
};

export const usePrefetchFilterData = () => {
    const queryClient = useQueryClient();
    useEffect(() => {
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.countries,  queryFn: () => apiClient.listCountry(),   ...QUERY_CONFIG.STATIC });
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.cities,     queryFn: () => apiClient.listCity(),      ...QUERY_CONFIG.STATIC });
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.categories, queryFn: () => apiClient.listCategorie(), ...QUERY_CONFIG.STATIC });
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.tags,       queryFn: () => apiClient.listTag(),       ...QUERY_CONFIG.STATIC });
        queryClient.prefetchQuery({ queryKey: QUERY_KEYS.boardings,  queryFn: () => apiClient.listBoarding(),  ...QUERY_CONFIG.STATIC });
        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.currencies,
            queryFn:  async () => { const data = await apiClient.listCurrency(); return data.currencies; },
            ...QUERY_CONFIG.STATIC,
        });
    }, [queryClient]);
};

export const useInvalidateHotels = () => {
    const queryClient = useQueryClient();
    return {
        invalidateAll: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotels });
            apiClient.clearCache();
        }, [queryClient]),
        invalidateByCity: useCallback((cityId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelsByCity(cityId) });
            apiClient.clearCacheEntry(`hotels_city_${cityId}`);
        }, [queryClient]),
        invalidateDetail: useCallback((hotelId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hotelDetail(hotelId) });
            apiClient.clearCacheEntry(`hotel_${hotelId}`);
        }, [queryClient]),
        invalidateSearch: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ["hotelSearch"] });
        }, [queryClient]),
        invalidateFilters: useCallback(() => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.countries });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cities });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.boardings });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currencies });
            apiClient.clearCacheEntry("countries");
            apiClient.clearCacheEntry("cities");
            apiClient.clearCacheEntry("categories");
            apiClient.clearCacheEntry("tags");
            apiClient.clearCacheEntry("boarding");
            apiClient.clearCacheEntry("currencies");
        }, [queryClient]),
    };
};

export const useCacheManager = () => {
    const queryClient = useQueryClient();
    return {
        clearAll: useCallback(() => {
            queryClient.clear();
            apiClient.clearCache();
            if (import.meta.env.DEV) console.log("✅ All caches cleared (React Query + ApiClient)");
        }, [queryClient]),

        getStats: useCallback(() => {
            const apiClientStats  = apiClient.getCacheStats();
            const reactQueryCache = queryClient.getQueryCache().getAll();
            return {
                apiClient: apiClientStats,
                reactQuery: {
                    totalQueries:  reactQueryCache.length,
                    activeQueries: reactQueryCache.filter(q => q.state.fetchStatus === "fetching").length,
                    staleQueries:  reactQueryCache.filter(q => q.isStale()).length,
                    queries:       reactQueryCache.map(q => ({
                        queryKey:      q.queryKey,
                        status:        q.state.status,
                        dataUpdatedAt: q.state.dataUpdatedAt,
                    })),
                },
            };
        }, [queryClient]),

        clearApiClientCache: useCallback(() => {
            apiClient.clearCache();
            if (import.meta.env.DEV) console.log("✅ ApiClient cache cleared");
        }, []),

        clearReactQueryCache: useCallback(() => {
            queryClient.clear();
            if (import.meta.env.DEV) console.log("✅ React Query cache cleared");
        }, [queryClient]),
    };
};

export const useApiClientLanguage = (language = "en") => {
    useEffect(() => {
        apiClient.setLanguage(language);
    }, [language]);
};

export const useDebouncedHotelSearch = (searchParams, delay = 500) => {
    const [debouncedParams, setDebouncedParams] = useState(searchParams);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedParams(searchParams);
        }, delay);
        return () => {
            clearTimeout(handler);
            apiClient.cancelRequest("hotelSearch");
        };
        // Utilise JSON.stringify pour une comparaison profonde stable des paramètres de recherche
    }, [JSON.stringify(searchParams), delay]);

    return useHotelSearch(debouncedParams, {
        enabled: !!debouncedParams?.checkIn && !!debouncedParams?.checkOut,
    });
};

// ==================== Export Everything ====================
export default {
    useCountries, useCities, useCategories, useTags, useBoardings, useCurrencies,
    useHotels, useHotelsBatch, useHotelsEnhanced, useHotelDetail,
    useHotelSearch, useHotelSearchMutation,
    useFilterData, usePrefetchFilterData, useInvalidateHotels,
    useCacheManager, useApiClientLanguage, useDebouncedHotelSearch,
    QUERY_KEYS, QUERY_CONFIG,
};