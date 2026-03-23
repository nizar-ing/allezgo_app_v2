// src/pages/SearchResultsPage.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
    Search, Calendar, Users, Hotel, AlertCircle,
    ArrowLeft, ArrowUpDown, CheckCircle, ChevronDown, MapPin,
} from "lucide-react";
import toast            from "react-hot-toast";
import apiClient        from "../services/ApiClient";
import HotelLightCard   from "../components/HotelLightCard.jsx";
import Loader           from "../ui/Loader.jsx";

// ── Country banner constants ───────────────────────────────────────────────────
const COUNTRY_BANNERS = {
    tunisie: "/images/tunisie_hotels.jpeg",
    algerie: "/images/algerie_hotels.jpeg",
};
const FALLBACK_BANNER = "/images/tunisie_hotels.jpeg";

const HOTELS_PER_PAGE = 15;

function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    // ── URL params ──────────────────────────────────────────────────────────────
    const selectionType = searchParams.get("selectionType");
    const cityId        = searchParams.get("cityId");
    const cityName      = searchParams.get("cityName");
    const countryName   = searchParams.get("countryName");
    const hotelId       = searchParams.get("hotelId");
    const hotelName     = searchParams.get("hotelName");
    const checkIn       = searchParams.get("checkIn");
    const checkOut      = searchParams.get("checkOut");
    const roomsParam    = searchParams.get("rooms");
    const nightsParam   = searchParams.get("nights");

    const rooms = useMemo(() => {
        try {
            const parsed = JSON.parse(roomsParam ?? "[]");
            return parsed.length > 0 ? parsed : [{ adults: 2, children: [] }];
        } catch { return [{ adults: 2, children: [] }]; }
    }, [roomsParam]);

    const nights = useMemo(() => {
        const parsed = parseInt(nightsParam, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
        if (!checkIn || !checkOut) return 1;
        return Math.ceil(
            Math.abs(new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
        );
    }, [checkIn, checkOut, nightsParam]);

    // ── State ───────────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState({});
    const [sortBy,  setSortBy]  = useState("recommended");
    const loadMoreRef           = useRef(null);

    // ── Guard redirect ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectionType || !checkIn || !checkOut || rooms.length === 0) {
            toast.error("Paramètres de recherche invalides");
            navigate("/");
        }
    }, [selectionType, checkIn, checkOut, rooms, navigate]);

    // ── Step 1: Fetch hotel list + details ──────────────────────────────────────
    const {
        data:      hotelsData,
        isLoading: isLoadingHotels,
        isError:   isErrorHotels,
        error:     errorHotels,
    } = useQuery({
        queryKey: ["hotelDetails", cityId, hotelId, selectionType],
        queryFn:  async () => {
            if (selectionType === "hotel") {
                try {
                    const hotelDetail = await apiClient.getHotel(Number(hotelId));
                    return { hotels: [hotelDetail], hotelIds: [Number(hotelId)] };
                } catch {
                    console.warn("getHotel failed, falling back to listHotel");
                    if (cityId) {
                        const list   = await apiClient.listHotel(Number(cityId));
                        const target = list.find((h) => h.Id === Number(hotelId));
                        if (target) return { hotels: [target], hotelIds: [Number(hotelId)] };
                    }
                    return { hotels: [], hotelIds: [Number(hotelId)] };
                }
            }
            if (selectionType === "city") {
                const hotels = await apiClient.listHotel(Number(cityId));
                return { hotels, hotelIds: hotels.map((h) => h.Id) };
            }
            return { hotels: [], hotelIds: [] };
        },
        enabled:   !!selectionType && !!(cityId || hotelId),
        staleTime: 5 * 60 * 1000,
        retry:     2,
    });

    const hotelsDetailsMap = useMemo(() => {
        const map = {};
        hotelsData?.hotels?.forEach((h) => { if (h?.Id) map[h.Id] = h; });
        return map;
    }, [hotelsData]);

    const hotelIds = useMemo(() => hotelsData?.hotelIds ?? [], [hotelsData]);

    // ── Step 2: Search hotels + pricing ────────────────────────────────────────
    const {
        data:      searchResults,
        isLoading: isLoadingSearch,
        isError:   isErrorSearch,
        error:     errorSearch,
    } = useQuery({
        queryKey: ["hotelSearch", hotelIds, checkIn, checkOut, rooms],
        queryFn:  async () => {
            if (!hotelIds.length) throw new Error("Aucun hôtel à rechercher");
            const result = await apiClient.searchHotel({
                checkIn,
                checkOut,
                hotels: hotelIds,
                rooms:  rooms.map((room) => ({
                    adult:     room.adults,
                    child:     Array.isArray(room.children) ? room.children.length : (room.children ?? 0),
                    childAges: Array.isArray(room.children) && room.children.length > 0
                        ? room.children : undefined,
                })),
                filters: { keywords: "", category: "", onlyAvailable: true, tags: "" },
            });
            if (result.errorMessage?.Code)
                throw new Error(result.errorMessage.Description ?? "Erreur de recherche");
            return result;
        },
        enabled:   !!hotelIds.length && !!checkIn && !!checkOut,
        staleTime: 2 * 60 * 1000,
        retry:     1,
    });

    // ── Step 3: Merge + preloaded rooms ────────────────────────────────────────
    const processedHotels = useMemo(() => {
        if (!searchResults?.hotelSearch) return [];
        return searchResults.hotelSearch.map((sr) => {
            const fromSearch = sr.Hotel;
            const full       = hotelsDetailsMap[fromSearch.Id];
            const allPrices  = [];
            const roomMap    = new Map();

            sr.Price?.Boarding?.forEach((boarding) => {
                boarding.Pax?.forEach((pax) => {
                    const adultCount = pax.Adult ?? 2;
                    pax.Rooms?.forEach((room) => {
                        const price     = room.Price     ? parseFloat(room.Price)     : null;
                        const basePrice = room.BasePrice ? parseFloat(room.BasePrice) : null;
                        const roomKey   = `${boarding.Code}__${adultCount}__${room.Code ?? room.Id ?? ""}`;

                        if (price && !isNaN(price)) allPrices.push(price);

                        if (!roomMap.has(roomKey)) {
                            roomMap.set(roomKey, {
                                id:              room.Id   ?? roomKey,
                                name:            room.Name ?? room.Code ?? "Chambre",
                                boardingCode:    boarding.Code,
                                boardingName:    boarding.Name,
                                price:           price     && !isNaN(price)     ? price     : null,
                                basePrice:       basePrice && !isNaN(basePrice) ? basePrice : null,
                                stopReservation: room.StopReservation ?? false,
                                onRequest:       room.OnRequest       ?? false,
                                currency:        sr.Currency,
                                adults:          adultCount,
                            });
                        }
                    });
                });
            });

            const minPrice       = allPrices.length > 0 ? Math.min(...allPrices) : null;
            const maxPrice       = allPrices.length > 0 ? Math.max(...allPrices) : null;
            const preloadedRooms = Array.from(roomMap.values());

            const discounts = preloadedRooms
                .filter(r => r.basePrice && r.price && r.basePrice > r.price)
                .map(r => Math.round(((r.basePrice - r.price) / r.basePrice) * 100));
            const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : null;

            const pricing = minPrice
                ? {
                    minPrice,
                    maxPrice,
                    currency:        sr.Currency,
                    available:       true,
                    token:           sr.Token,
                    discountPercent: maxDiscount,
                }
                : null;

            return {
                Id:               fromSearch.Id,
                Name:             full?.Name             ?? fromSearch.Name,
                Category:         full?.Category         ?? fromSearch.Category,
                City:             full?.City             ?? fromSearch.City,
                Address:          full?.Adress           ?? full?.Address ?? fromSearch.Adress,
                Adress:           full?.Adress           ?? fromSearch.Adress,
                Localization:     full?.Localization     ?? fromSearch.Localization,
                ShortDescription: full?.ShortDescription ?? fromSearch.ShortDescription,
                Description:      full?.Description      ?? full?.ShortDescription ?? fromSearch.ShortDescription,
                Image:            full?.Image            ?? fromSearch.Image,
                Images:           full?.Album            ?? (fromSearch.Image ? [fromSearch.Image] : []),
                Album:            full?.Album            ?? [],
                Facilities:       full?.Facilities       ?? [],
                Theme:            full?.Theme            ?? fromSearch.Theme ?? [],
                Tag:              full?.Tag              ?? [],
                Equipments:       full?.Equipments       ?? full?.Facilities ?? [],
                Email:            full?.Email,
                Phone:            full?.Phone,
                Vues:             full?.Vues             ?? [],
                Type:             full?.Type,
                Boarding:         full?.Boarding         ?? [],
                pricing,
                MinPrice:         minPrice,
                MaxPrice:         maxPrice,
                Currency:         sr.Currency,
                PriceDetails:     sr.Price,
                Token:            sr.Token,
                Recommended:      sr.Recommended,
                FreeChild:        sr.FreeChild,
                Source:           sr.Source,
                IsAvailable:      true,
                searchResult:     true,
                hasFullDetails:   !!full,
                dataSource:       full ? "merged" : "search-only",
                preloadedRooms,
            };
        });
    }, [searchResults, hotelsDetailsMap]);

    // ── Favorites (read-once) ───────────────────────────────────────────────────
    const favoriteIds = useMemo(
        () => JSON.parse(localStorage.getItem("favoriteHotels") ?? "[]"),
        []
    );

    // ── Filter ─────────────────────────────────────────────────────────────────
    const filteredHotels = useMemo(() => {
        let result = [...processedHotels];
        if (filters.categories?.length)
            result = result.filter((h) => filters.categories.includes(h.Category?.Star));
        if (filters.services?.length)
            result = result.filter((h) =>
                h.Theme?.some((theme) =>
                    filters.services.some((s) => theme.toLowerCase().includes(s.toLowerCase()))
                )
            );
        if (filters.priceRange)
            result = result.filter((h) => {
                const p = h.MinPrice ?? 0;
                return p >= filters.priceRange.min && p <= filters.priceRange.max;
            });
        return result;
    }, [processedHotels, filters]);

    // ── Sort ───────────────────────────────────────────────────────────────────
    const sortedHotels = useMemo(() => {
        const sorted = [...filteredHotels];
        switch (sortBy) {
            case "price-asc":  return sorted.sort((a, b) => (a.MinPrice ?? 0) - (b.MinPrice ?? 0));
            case "price-desc": return sorted.sort((a, b) => (b.MinPrice ?? 0) - (a.MinPrice ?? 0));
            case "rating":     return sorted.sort((a, b) => (b.Category?.Star ?? 0) - (a.Category?.Star ?? 0));
            case "name-asc":   return sorted.sort((a, b) => (a.Name ?? "").localeCompare(b.Name ?? ""));
            default:
                return sorted.sort((a, b) => {
                    const diff = (b.Recommended ?? 0) - (a.Recommended ?? 0);
                    return diff !== 0 ? diff : (b.Category?.Star ?? 0) - (a.Category?.Star ?? 0);
                });
        }
    }, [filteredHotels, sortBy]);

    // ── Pagination (infinite scroll) ───────────────────────────────────────────
    const {
        data:              paginatedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["hotels-paginated", sortedHotels.length, sortedHotels[0]?.Id, sortBy],
        queryFn:  async ({ pageParam = 0 }) => {
            const start    = pageParam * HOTELS_PER_PAGE;
            const pageData = sortedHotels.slice(start, start + HOTELS_PER_PAGE);
            return { hotels: pageData, nextPage: start + HOTELS_PER_PAGE < sortedHotels.length ? pageParam + 1 : undefined };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled:          sortedHotels.length > 0,
        initialPageParam: 0,
        staleTime:        5 * 60 * 1000,
    });

    const displayedHotels = paginatedData?.pages?.flatMap((p) => p.hotels) ?? [];

    // ── Intersection observer ──────────────────────────────────────────────────
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
            { threshold: 0.1, rootMargin: "100px" }
        );
        observer.observe(el);
        return () => observer.unobserve(el);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleFavoriteToggle = useCallback((id, isFav) => {
        const favs = JSON.parse(localStorage.getItem("favoriteHotels") ?? "[]");
        if (isFav) { if (!favs.includes(id)) favs.push(id); }
        else { const i = favs.indexOf(id); if (i > -1) favs.splice(i, 1); }
        localStorage.setItem("favoriteHotels", JSON.stringify(favs));
    }, []);

    const buildHotelUrl = useCallback((id) => {
        const p = new URLSearchParams();
        if (checkIn)  p.set("checkin",  checkIn);
        if (checkOut) p.set("checkout", checkOut);
        if (rooms?.length) {
            try {
                const normalized = rooms.map((room) => ({
                    adults:    room.adults ?? 2,
                    children:  Array.isArray(room.children)
                        ? room.children.length
                        : (room.children ?? 0),
                    childAges: Array.isArray(room.children)
                        ? room.children.map((c) => (typeof c === "object" ? c.age ?? 5 : c))
                        : [],
                }));
                p.set("rooms", encodeURIComponent(JSON.stringify(normalized)));
            } catch {}
        }
        const qs = p.toString();
        return `/hotel/${id}${qs ? `?${qs}` : ""}`;
    }, [checkIn, checkOut, rooms]);

    const handleViewHotelDetail = useCallback((id) => {
        navigate(buildHotelUrl(id));
    }, [navigate, buildHotelUrl]);

    const handleBookHotel = useCallback((hotel, selectedRooms) => {
        const preloadedRooms = hotel.preloadedRooms ?? [];

        // ── Path 1: user explicitly selected rooms inside the card ──────────────
        const roomsList = Array.isArray(selectedRooms)
            ? selectedRooms
            : selectedRooms
                ? [selectedRooms]
                : [];

        if (roomsList.length > 0) {
            const totalPrice = roomsList.reduce((acc, r) => acc + (r.price ?? 0) * nights, 0);
            navigate(`/booking/${hotel.Id}`, {
                state: {
                    hotel,
                    hotelId:      hotel.Id,
                    hotelName:    hotel.Name,
                    checkIn,
                    checkOut,
                    nights,
                    boardingType: roomsList[0]?.boardingCode ?? null,
                    rooms:        roomsList,
                    totalPrice,
                    currency:     hotel.pricing?.currency ?? "DZD",
                    selectedRooms: roomsList,
                    searchParams:  { checkIn, checkOut, rooms },
                },
            });
            return;
        }

        // ── Path 2: fallback auto-select (no room chosen yet) ───────────────────
        if (!preloadedRooms.length || !checkIn || !checkOut) {
            navigate(buildHotelUrl(hotel.Id));
            return;
        }

        const firstBoardingCode = preloadedRooms[0]?.boardingCode ?? null;
        const boardingRooms     = preloadedRooms.filter((r) => r.boardingCode === firstBoardingCode);

        const selectedRoomsList = rooms.map((room) => {
            const adultCount    = room.adults ?? 2;
            const matchingRooms = boardingRooms.filter((r) => r.adults === adultCount);
            const pool          = matchingRooms.length > 0 ? matchingRooms : boardingRooms;
            const bestRoom      = pool.reduce(
                (best, r) => (!best || (r.price ?? Infinity) < (best.price ?? Infinity)) ? r : best,
                null
            );
            return {
                roomType:  bestRoom?.name  ?? null,
                roomId:    bestRoom?.id    ?? null,
                adults:    adultCount,
                children:  Array.isArray(room.children)
                    ? room.children.length
                    : (room.children ?? 0),
                childAges: Array.isArray(room.children)
                    ? room.children.map((c) => c.age ?? c)
                    : [],
                price: bestRoom?.price ?? 0,
                total: bestRoom ? (bestRoom.price ?? 0) * nights : 0,
            };
        });

        const totalPrice = selectedRoomsList.reduce((acc, r) => acc + r.total, 0);

        navigate(`/booking/${hotel.Id}`, {
            state: {
                hotel,
                hotelId:      hotel.Id,
                hotelName:    hotel.Name,
                checkIn,
                checkOut,
                nights,
                boardingType: firstBoardingCode,
                rooms:        selectedRoomsList,
                totalPrice,
                currency:     hotel.pricing?.currency ?? "DZD",
            },
        });
    }, [navigate, buildHotelUrl, rooms, checkIn, checkOut, nights]);

    // ── Helpers ─────────────────────────────────────────────────────────────────
    const totalGuests = useMemo(() => ({
        adults:   rooms.reduce((s, r) => s + (r.adults ?? 0), 0),
        children: rooms.reduce((s, r) => s + (Array.isArray(r.children) ? r.children.length : (r.children ?? 0)), 0),
    }), [rooms]);

    const formatDisplayDate = (dateString) => {
        const d      = new Date(dateString);
        const days   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
    };

    const getBannerImage = () => {
        const key   = (countryName ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const match = Object.keys(COUNTRY_BANNERS).find((k) => key.includes(k));
        return match ? COUNTRY_BANNERS[match] : FALLBACK_BANNER;
    };

    const sortOptions = [
        { value: "recommended", label: "Recommandés" },
        { value: "price-asc",   label: "Prix croissant" },
        { value: "price-desc",  label: "Prix décroissant" },
        { value: "rating",      label: "Meilleures notes" },
        { value: "name-asc",    label: "Nom A-Z" },
    ];

    const isLoading = isLoadingHotels || isLoadingSearch;
    const isError   = isErrorHotels   || isErrorSearch;
    const error     = errorHotels     || errorSearch;

    // ── Loading ─────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
            <Loader message="Recherche des hôtels disponibles..." fullHeight={true} />
        </div>
    );

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">

            {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
            <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 overflow-hidden mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
                <img
                    src={getBannerImage()}
                    alt={countryName ?? "Hôtels"}
                    className="w-full h-full object-fill"
                    onError={(e) => { e.target.src = FALLBACK_BANNER; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <MapPin className="text-white flex-shrink-0" size={20} />
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl leading-tight">
                                {selectionType === "city" ? cityName : hotelName}
                            </h1>
                        </div>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium drop-shadow-lg ml-7 sm:ml-8">
                            {countryName ?? ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Search Summary Banner ────────────────────────────────────────────── */}
            <div className="bg-white shadow-md border-b border-gray-200 mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Modifier la recherche</span>
                    </Link>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Destination */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <MapPin className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Destination</p>
                                <p className="font-bold text-gray-800 truncate">
                                    {selectionType === "city" ? cityName : hotelName}
                                </p>
                                {selectionType === "hotel" && cityName && (
                                    <p className="text-xs text-gray-500">{cityName}</p>
                                )}
                                {countryName && (
                                    <p className="text-xs text-gray-500">{countryName}</p>
                                )}
                            </div>
                        </div>
                        {/* Dates */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <Calendar className="text-green-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Dates</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {formatDisplayDate(checkIn)} → {formatDisplayDate(checkOut)}
                                </p>
                                <p className="text-xs text-gray-500">{nights} nuit{nights > 1 ? "s" : ""}</p>
                            </div>
                        </div>
                        {/* Voyageurs */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                <Users className="text-purple-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Voyageurs</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {totalGuests.adults} adulte{totalGuests.adults > 1 ? "s" : ""}
                                    {totalGuests.children > 0 && `, ${totalGuests.children} enfant${totalGuests.children > 1 ? "s" : ""}`}
                                </p>
                                <p className="text-xs text-gray-500">{rooms.length} chambre{rooms.length > 1 ? "s" : ""}</p>
                            </div>
                        </div>
                        {/* Type de recherche */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                                <Search className="text-amber-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500 mb-1">Type de recherche</p>
                                <p className="font-semibold text-gray-800 text-sm">
                                    {selectionType === "city" ? "Tous les hôtels" : "Hôtel spécifique"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {hotelIds?.length ?? 0} hôtel{(hotelIds?.length ?? 0) > 1 ? "s" : ""} recherché{(hotelIds?.length ?? 0) > 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────────────────── */}
            <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

                {/* Top Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="p-1.5 sm:p-2 bg-sky-100 rounded-lg flex-shrink-0">
                                <Hotel className="text-sky-600" size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-500">Hôtels disponibles</p>
                                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                                    {sortedHotels.length} résultat{sortedHotels.length > 1 ? "s" : ""}
                                    {displayedHotels.length < sortedHotels.length && (
                                        <span className="text-xs sm:text-sm text-gray-500 font-normal ml-1 sm:ml-2">
                                            {displayedHotels.length} affichés
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all cursor-pointer"
                            >
                                {sortOptions.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                            <ArrowUpDown size={16} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {isError && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                        <AlertCircle size={48} className="sm:w-16 sm:h-16 mx-auto text-red-500 mb-3 sm:mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Erreur de recherche</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            {error?.message ?? "Impossible de rechercher les hôtels disponibles."}
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Retour à la recherche
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && !isError && sortedHotels.length === 0 && (
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center">
                        <Search size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Aucun hôtel disponible</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                            Aucun hôtel ne correspond à vos critères pour ces dates.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Nouvelle recherche
                        </button>
                    </div>
                )}

                {/* Hotel cards */}
                {!isLoading && !isError && displayedHotels.length > 0 && (
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                        {displayedHotels.map((hotel) => (
                            <HotelLightCard
                                key={hotel.Id}
                                hotel={hotel}
                                pricing={hotel.pricing}
                                preloadedAvailability={hotel.preloadedRooms ?? null}
                                onFavoriteToggle={handleFavoriteToggle}
                                onBook={handleBookHotel}
                                onViewDetail={handleViewHotelDetail}
                                showBookButton={true}
                                nights={nights}
                                searchParams={{ checkIn, checkOut, rooms }}
                                initialIsFavorite={favoriteIds.includes(hotel.Id)}
                            />
                        ))}
                    </div>
                )}

                {/* Load more */}
                {hasNextPage && (
                    <div ref={loadMoreRef} className="mt-6 sm:mt-8">
                        {isFetchingNextPage ? (
                            <Loader message="Chargement de plus d'hôtels..." fullHeight={false} />
                        ) : (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg flex justify-center p-4">
                                <button
                                    onClick={() => fetchNextPage()}
                                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-base sm:text-lg rounded-lg sm:rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <ChevronDown size={20} className="sm:w-6 sm:h-6" />
                                    Charger plus d'hôtels
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* End of results */}
                {!hasNextPage && displayedHotels.length > 0 && (
                    <div className="text-center py-6 sm:py-8 mt-4 sm:mt-6">
                        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl shadow-md max-w-full mx-2">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                            <div className="text-left">
                                <p className="text-gray-800 font-bold text-sm sm:text-base lg:text-lg">
                                    Tous les résultats affichés !
                                </p>
                                <p className="text-gray-600 text-xs sm:text-sm">
                                    {sortedHotels.length} hôtel{sortedHotels.length > 1 ? "s" : ""} disponible{sortedHotels.length > 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchResultsPage;