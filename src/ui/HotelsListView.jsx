// src/ui/HotelsListView.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    X, Search, Hotel, AlertCircle, Filter,
    ArrowUpDown, ChevronDown, CheckCircle,
} from "lucide-react";
import HotelsFiltering from "../components/HotelsFiltering.jsx";
import HotelLightCard  from "../components/HotelLightCard.jsx";

const HOTELS_PER_PAGE = 10;

function HotelsListView({
                            hotels,
                            initialFilters   = {},
                            showPricing      = false,
                            searchCriteria   = null,
                            getTarifForHotel = null,
                            headerContent    = null,
                            isLoading        = false,
                            isError          = false,
                            error            = null,
                        }) {
    const [filters,      setFilters]      = useState(initialFilters);
    const [sortBy,       setSortBy]       = useState("recommended");
    const [showFilters,  setShowFilters]  = useState(false);
    const [displayCount, setDisplayCount] = useState(HOTELS_PER_PAGE);
    const loadMoreRef = useRef(null);

    const nights = useMemo(() => {
        if (searchCriteria?.nights) return searchCriteria.nights;
        if (!searchCriteria?.checkIn || !searchCriteria?.checkOut) return 1;
        return Math.ceil(
            Math.abs(new Date(searchCriteria.checkOut) - new Date(searchCriteria.checkIn))
            / (1000 * 60 * 60 * 24)
        );
    }, [searchCriteria]);

    const getPricingForHotel = useCallback((hotel) => {
        if (hotel.pricing) return hotel.pricing;
        if (!getTarifForHotel) return null;
        const tarif = getTarifForHotel(hotel.Id);
        if (!tarif?.Boarding) return null;
        const allPrices = [];
        tarif.Boarding.forEach((boarding) => {
            boarding.Pax?.forEach((pax) => {
                pax.Rooms?.forEach((room) => {
                    const p = room.Price ? parseFloat(room.Price) : null;
                    if (p && !isNaN(p)) allPrices.push(p);
                });
            });
        });
        if (!allPrices.length) return null;
        return { minPrice: Math.min(...allPrices), maxPrice: Math.max(...allPrices), available: true };
    }, [getTarifForHotel]);

    const favoriteIds = useMemo(
        () => JSON.parse(localStorage.getItem("favoriteHotels") ?? "[]"), []
    );

    const filteredHotels = useMemo(() => {
        if (!hotels?.length) return [];
        let result = [...hotels];
        if (filters.categories?.length > 0)
            result = result.filter((h) => filters.categories.includes(h.Category?.Star));
        if (filters.services?.length > 0)
            result = result.filter((h) =>
                h.Theme?.some((theme) =>
                    filters.services.some((s) => theme.toLowerCase().includes(s.toLowerCase()))
                )
            );
        return result;
    }, [hotels, filters]);

    const sortedHotels = useMemo(() => {
        const sorted = [...filteredHotels];
        switch (sortBy) {
            case "price-asc":
                return sorted.sort((a, b) =>
                    (getPricingForHotel(a)?.minPrice ?? Infinity) - (getPricingForHotel(b)?.minPrice ?? Infinity));
            case "price-desc":
                return sorted.sort((a, b) =>
                    (getPricingForHotel(b)?.minPrice ?? 0) - (getPricingForHotel(a)?.minPrice ?? 0));
            case "rating":
                return sorted.sort((a, b) => (b.Category?.Star ?? 0) - (a.Category?.Star ?? 0));
            default: return sorted;
        }
    }, [filteredHotels, sortBy, getPricingForHotel]);

    useEffect(() => { setDisplayCount(HOTELS_PER_PAGE); }, [filters, sortBy]);

    const displayedHotels = sortedHotels.slice(0, displayCount);
    const hasNextPage     = displayCount < sortedHotels.length;
    const loadMore        = useCallback(() => setDisplayCount((prev) => prev + HOTELS_PER_PAGE), []);

    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage) return;
        const el       = loadMoreRef.current;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore(); },
            { threshold: 0.1, rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.unobserve(el);
    }, [hasNextPage, loadMore]);

    const handleFilterChange   = useCallback((newFilters) => setFilters(newFilters), []);
    const handleFavoriteToggle = useCallback((hotelId, isFav) => {
        const favorites = JSON.parse(localStorage.getItem("favoriteHotels") ?? "[]");
        if (isFav) { if (!favorites.includes(hotelId)) favorites.push(hotelId); }
        else { const i = favorites.indexOf(hotelId); if (i > -1) favorites.splice(i, 1); }
        localStorage.setItem("favoriteHotels", JSON.stringify(favorites));
    }, []);

    const sortOptions = [
        { value: "recommended", label: "Recommandés" },
        { value: "price-asc",   label: "Prix croissant",   disabled: !showPricing },
        { value: "price-desc",  label: "Prix décroissant",  disabled: !showPricing },
        { value: "rating",      label: "Meilleures notes" },
    ];

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            {headerContent}
            <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 sticky top-16 sm:top-20 lg:top-4 z-40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <Hotel className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-500">
                                    {showPricing ? "Résultats trouvés" : "Hôtels disponibles"}
                                </p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                                    {sortedHotels.length} hôtel{sortedHotels.length > 1 ? "s" : ""}
                                    {displayedHotels.length < sortedHotels.length && (
                                        <span className="text-xs sm:text-sm text-gray-500 font-normal ml-2">
                      {displayedHotels.length} affichés
                    </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-md active:scale-95 flex-1 sm:flex-initial justify-center"
                            >
                                <Filter size={18} />
                                <span className="hidden xs:inline">Filtres</span>
                            </button>
                            <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px]">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all cursor-pointer"
                                >
                                    {sortOptions.map((o) => (
                                        <option key={o.value} value={o.value} disabled={o.disabled}>
                                            {o.label}{o.disabled ? " (dates requises)" : ""}
                                        </option>
                                    ))}
                                </select>
                                <ArrowUpDown size={16} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    <aside className="hidden lg:block lg:col-span-3 xl:col-span-1">
                        <div className="sticky top-32 lg:top-28">
                            <HotelsFiltering onFilterChange={handleFilterChange} initialFilters={filters} />
                        </div>
                    </aside>
                    <main className="lg:col-span-9 xl:col-span-3">
                        {isError && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                                <AlertCircle size={48} className="sm:w-16 sm:h-16 mx-auto text-red-500 mb-3 sm:mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Erreur de chargement</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    {error?.message ?? "Impossible de charger les hôtels. Veuillez réessayer."}
                                </p>
                                <button onClick={() => window.location.reload()} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95">
                                    Réessayer
                                </button>
                            </div>
                        )}
                        {!isLoading && !isError && sortedHotels.length === 0 && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                                <Search size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Aucun hôtel trouvé</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    Essayez de modifier vos filtres ou critères de recherche.
                                </p>
                                <button onClick={() => setFilters({})} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95">
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        )}
                        {!isLoading && !isError && displayedHotels.length > 0 && (
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {displayedHotels.map((hotel) => {
                                    const pricing = getPricingForHotel(hotel);
                                    return (
                                        <HotelLightCard
                                            key={hotel.Id}
                                            hotel={hotel}
                                            pricing={pricing}
                                            preloadedAvailability={hotel.preloadedRooms ?? null}
                                            onFavoriteToggle={handleFavoriteToggle}
                                            showBookButton={showPricing}
                                            nights={nights}
                                            searchParams={searchCriteria}
                                            initialIsFavorite={favoriteIds.includes(hotel.Id)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        {hasNextPage && (
                            <div ref={loadMoreRef} className="mt-6 sm:mt-8">
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg flex justify-center p-4">
                                    <button onClick={loadMore} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base sm:text-lg rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95">
                                        <ChevronDown size={20} className="sm:w-6 sm:h-6" />
                                        Charger plus d'hôtels
                                    </button>
                                </div>
                            </div>
                        )}
                        {!hasNextPage && displayedHotels.length > 0 && (
                            <div className="text-center py-6 sm:py-8 mt-4 sm:mt-6">
                                <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl shadow-md max-w-full mx-2">
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                                    <div className="text-left">
                                        <p className="text-gray-800 font-bold text-sm sm:text-base lg:text-lg">Tous les hôtels affichés !</p>
                                        <p className="text-gray-600 text-xs sm:text-sm">
                                            Vous avez vu les {sortedHotels.length} hôtel{sortedHotels.length > 1 ? "s" : ""} disponible{sortedHotels.length > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {showFilters && (
                <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
                    <div className="bg-white rounded-t-2xl sm:rounded-t-3xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
                        <div className="sticky top-0 bg-white border-b-2 border-gray-100 p-4 sm:p-5 flex items-center justify-between z-10 shadow-sm">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Filter size={22} className="text-sky-600" /> Filtres
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95">
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto filter-scroll p-4 sm:p-5">
                            <HotelsFiltering
                                onFilterChange={(f) => { handleFilterChange(f); setShowFilters(false); }}
                                initialFilters={filters}
                            />
                        </div>
                        <div className="sticky bottom-0 bg-white border-t-2 border-gray-100 p-4 sm:p-5 flex gap-3 shadow-lg">
                            <button onClick={() => { setFilters({}); setShowFilters(false); }} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all active:scale-95">Réinitialiser</button>
                            <button onClick={() => setShowFilters(false)} className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95">Appliquer</button>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-fade-in  { animation: fade-in  0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        @media (min-width: 375px) { .xs\\:inline { display: inline; } }
      `}} />
        </div>
    );
}

export default HotelsListView;