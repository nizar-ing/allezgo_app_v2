// src/pages/HotelsSearchResultsPage.jsx
import { useLayoutEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { Calendar, Users, Moon, ArrowLeft, AlertTriangle } from "lucide-react";
import HotelsListView from "../ui/HotelsListView.jsx";
import Loader         from "../ui/Loader.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient      from "../services/ApiClient";
import { normalizeHotelForCard } from "../utils/normalizeHotel";

function SearchSummaryBanner({ countResults, allHotelsCount, searchCriteria, searchId, onBack }) {
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };
    return (
        <div className="bg-white shadow-md mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Nouvelle recherche
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Résultats de recherche</h1>
                            <p className="text-gray-600 text-base sm:text-lg">
                                {allHotelsCount} hôtel{allHotelsCount > 1 ? "s" : ""} chargé{allHotelsCount > 1 ? "s" : ""}
                                {countResults !== allHotelsCount && (
                                    <span className="text-sm text-gray-500 ml-2">sur {countResults} trouvés</span>
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {searchCriteria?.checkIn && searchCriteria?.checkOut && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg border border-sky-100">
                                    <Calendar size={18} className="text-sky-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                    {formatDate(searchCriteria.checkIn)} → {formatDate(searchCriteria.checkOut)}
                  </span>
                                </div>
                            )}
                            {searchCriteria?.rooms && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg border border-orange-100">
                                    <Users size={18} className="text-orange-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                    {searchCriteria.rooms.length} chambre{searchCriteria.rooms.length > 1 ? "s" : ""}
                  </span>
                                </div>
                            )}
                            {searchCriteria?.nights && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-100">
                                    <Moon size={18} className="text-purple-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">
                    {searchCriteria.nights} nuit{searchCriteria.nights > 1 ? "s" : ""}
                  </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {allHotelsCount > 50 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Grand nombre de résultats : {allHotelsCount} hôtels. Les résultats sont chargés progressivement.
                            </p>
                        </div>
                    )}
                    {searchId && import.meta.env.DEV && (
                        <p className="text-xs text-gray-400 mt-4">ID de recherche : {searchId}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function HotelsSearchResultsPage() {
    const location       = useLocation();
    const navigate       = useNavigate();
    const [searchParams] = useSearchParams();
    const stateData      = location.state;

    const checkIn       = searchParams.get("checkIn");
    const checkOut      = searchParams.get("checkOut");
    const roomsParam    = searchParams.get("rooms");
    const hotelIdsParam = searchParams.get("hotelIds");

    const hotelIds = useMemo(() => {
        if (!hotelIdsParam) return null;
        try { return hotelIdsParam.split(",").map(Number).filter((id) => !isNaN(id) && id > 0); }
        catch { return null; }
    }, [hotelIdsParam]);

    const rooms = useMemo(() => {
        try {
            const parsed = JSON.parse(roomsParam);
            return parsed.length > 0 ? parsed : [{ adults: 2, children: [] }];
        } catch { return [{ adults: 2, children: [] }]; }
    }, [roomsParam]);

    const nights = useMemo(() => {
        const parsed = parseInt(searchParams.get("nights"), 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
        if (!checkIn || !checkOut) return 1;
        return Math.ceil(Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    }, [checkIn, checkOut, searchParams]);

    const fromNavigation = useMemo(() => {
        if (stateData) return { data: stateData, storageError: null };
        try {
            const currentSearchId = sessionStorage.getItem("currentSearchId");
            if (currentSearchId) {
                const stored = sessionStorage.getItem(currentSearchId);
                if (stored) {
                    try {
                        return { data: JSON.parse(stored), storageError: null };
                    } catch {
                        return { data: null, storageError: "Données corrompues dans le cache" };
                    }
                }
            }
        } catch {
            return { data: null, storageError: "Erreur lors du chargement des données" };
        }
        return { data: null, storageError: null };
    }, [stateData]);

    const hotelSearchQueryKey = useMemo(
        () => ["hotelSearch", hotelIds, checkIn, checkOut, rooms],
        [hotelIds, checkIn, checkOut, rooms],
    );

    const queryClient = useQueryClient();
    const cachedHotelSearch = queryClient.getQueryData(hotelSearchQueryKey);
    const hasMergedSearchResults = !!(fromNavigation.data ?? cachedHotelSearch);

    useLayoutEffect(() => {
        if (!stateData) return;
        try {
            if (JSON.stringify(stateData).length <= 1048576) return;
            const sid = `search_${Date.now()}`;
            sessionStorage.setItem(sid, JSON.stringify(stateData));
            sessionStorage.setItem("currentSearchId", sid);
        } catch {
            /* ignore quota / private mode */
        }
    }, [stateData]);

    const { data: hotelsDetailsData, isLoading: isLoadingDetails, isError: isErrorDetails, error: errorDetails } = useQuery({
        queryKey: ["hotelDetailsForSearch", hotelIds],
        queryFn:  async () => {
            if (!hotelIds || hotelIds.length === 0) return { hotelsMap: {}, count: 0 };
            const ids       = hotelIds.slice(0, 100);
            const hotelsMap = await apiClient.getHotelsBatch(ids, ids.length <= 50 ? 3 : 5, { delayBetweenBatches: 150 });
            return { hotelsMap, count: Object.keys(hotelsMap).length };
        },
        enabled: !hasMergedSearchResults && !!hotelIds && hotelIds.length > 0, staleTime: 5 * 60 * 1000, retry: 1,
    });

    const { data: fetchedData, isLoading: isLoadingSearch, isError, error } = useQuery({
        queryKey: hotelSearchQueryKey,
        queryFn:  async () => {
            if (!hotelIds?.length)     throw new Error("Aucun hôtel spécifié");
            if (!checkIn || !checkOut) throw new Error("Dates de séjour manquantes");
            if (!rooms?.length)        throw new Error("Informations sur les chambres manquantes");
            const result = await apiClient.searchHotel({
                checkIn, checkOut,
                hotels: hotelIds.slice(0, 100),
                rooms:  rooms.map((room) => ({
                    adult: room.adults,
                    child: Array.isArray(room.children) ? room.children.length : (room.children ?? 0),
                    childAges: Array.isArray(room.children) && room.children.length > 0 ? room.children
                        : Array.isArray(room.childAges) && room.childAges.length > 0 ? room.childAges : undefined,
                })),
                filters: { keywords: "", category: "", onlyAvailable: true, tags: "" },
            });
            const hotelsMap       = hotelsDetailsData?.hotelsMap ?? {};
            const enrichedResults = result.hotelSearch.map((sr) => {
                const fromSearch = sr.Hotel;
                const full       = hotelsMap[fromSearch.Id];
                let minPrice = null, maxPrice = null;
                const roomMap = new Map(), allPrices = [];
                sr.Price?.Boarding?.forEach((boarding) => {
                    boarding.Pax?.forEach((pax) => {
                        pax.Rooms?.forEach((room) => {
                            const price = room.Price ? parseFloat(room.Price) : null;
                            const key   = `${boarding.Code}__${room.Code ?? room.Id ?? ""}`;
                            if (price && !isNaN(price)) allPrices.push(price);
                            if (!roomMap.has(key)) roomMap.set(key, {
                                id: room.Id ?? key, name: room.Name ?? room.Code ?? "Chambre",
                                boardingCode: boarding.Code, boardingName: boarding.Name,
                                price: price && !isNaN(price) ? price : null, currency: sr.Currency,
                            });
                        });
                    });
                });
                if (allPrices.length > 0) { minPrice = Math.min(...allPrices); maxPrice = Math.max(...allPrices); }
                const rawHotel = {
                    Id: fromSearch.Id, Name: full?.Name ?? fromSearch.Name, Category: full?.Category ?? fromSearch.Category,
                    City: full?.City ?? fromSearch.City, Adress: full?.Adress ?? fromSearch.Adress,
                    Address: full?.Address ?? fromSearch.Address, Localization: full?.Localization ?? fromSearch.Localization,
                    ShortDescription: full?.ShortDescription ?? fromSearch.ShortDescription,
                    Description: full?.Description ?? full?.ShortDescription,
                    Image: full?.Image ?? fromSearch.Image, Album: full?.Album ?? fromSearch.Album,
                    Facilities: full?.Facilities?.slice(0, 10), Theme: full?.Theme?.slice(0, 5) ?? fromSearch.Theme,
                    hasFullDetails: !!full, preloadedRooms: Array.from(roomMap.values()),
                };
                return {
                    Hotel: normalizeHotelForCard(rawHotel), MinPrice: minPrice, MaxPrice: maxPrice,
                    Currency: sr.Currency, Token: sr.Token, Recommended: sr.Recommended,
                    fullPriceDetails: sr.Price, Tarif: sr.Tarif ?? sr.Price,
                };
            });
            const finalData = { searchResults: enrichedResults, searchId: result.searchId, countResults: result.countResults, searchCriteria: { checkIn, checkOut, rooms, nights } };
            if (JSON.stringify(finalData).length > 524288) {
                const sid = `search_${Date.now()}`;
                try { sessionStorage.setItem(sid, JSON.stringify(finalData)); sessionStorage.setItem("currentSearchId", sid); } catch { /* quota / private mode */ }
            }
            return finalData;
        },
        enabled:   !hasMergedSearchResults && !!hotelIds && !!checkIn && !!checkOut && rooms.length > 0 && !isLoadingDetails,
        staleTime: 2 * 60 * 1000, retry: 1,
    });

    const searchData =
        fetchedData ?? fromNavigation.data ?? null;
    const dataLoadError =
        fromNavigation.storageError ?? (isError ? (error?.message ?? null) : null);

    const shouldRedirectHome =
        !isLoadingDetails &&
        !isLoadingSearch &&
        !searchData &&
        !fetchedData &&
        !dataLoadError &&
        !hotelIds &&
        !stateData;

    const allHotels        = useMemo(() => searchData?.searchResults?.map((r) => r.Hotel) ?? [], [searchData]);
    const getTarifForHotel = useCallback((hotelId) => {
        const r = searchData?.searchResults?.find((x) => x.Hotel?.Id === hotelId);
        return r?.fullPriceDetails ?? r?.Tarif ?? null;
    }, [searchData]);
    const handleBack = useCallback(() => {
        const sid = sessionStorage.getItem("currentSearchId");
        if (sid) { sessionStorage.removeItem(sid); sessionStorage.removeItem("currentSearchId"); }
        navigate("/");
    }, [navigate]);

    if (shouldRedirectHome) return <Navigate to="/" replace />;

    const { searchId = null, countResults = 0, searchCriteria = null } = searchData ?? {};

    if (isLoadingDetails || isLoadingSearch) return (
        <Loader message="Chargement des résultats..." submessage="Cette opération peut prendre quelques instants" size="large" variant="gradient" fullHeight={true} />
    );

    const hasError     = isErrorDetails || isError || dataLoadError;
    const errorMessage = dataLoadError ?? errorDetails?.message ?? error?.message;
    if (hasError) return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement</h2>
                <p className="text-gray-600 mb-6">{errorMessage ?? "Impossible de charger les résultats."}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-all">Réessayer</button>
                    <button onClick={() => navigate("/")} className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold transition-all">Nouvelle recherche</button>
                </div>
            </div>
        </div>
    );

    if (!searchData) return <Loader message="Préparation des données..." size="medium" variant="gradient" fullHeight={true} />;

    return (
        <HotelsListView
            hotels={allHotels}
            initialFilters={{}}
            showPricing={true}
            searchCriteria={searchCriteria}
            getTarifForHotel={getTarifForHotel}
            headerContent={
                <SearchSummaryBanner
                    countResults={countResults}
                    allHotelsCount={allHotels.length}
                    searchCriteria={searchCriteria}
                    searchId={searchId}
                    onBack={handleBack}
                />
            }
            isLoading={false}
            isError={false}
            error={null}
        />
    );
}

export default HotelsSearchResultsPage;