// src/pages/HotelDetails.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
    MapPin, Star, ChevronLeft, ChevronRight, ChevronDown, X, Users, Eye, Sparkles,
    Navigation, Mountain, Home, CheckCircle2, Calendar, AlertCircle,
    LayoutGrid, Images, Building2, BedDouble, Clock, Search,
    Wifi, Car, Utensils, Waves, Wind, Coffee, Dumbbell, ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../services/ApiClient";
import DateRangePicker from "../components/booking/DateRangePicker.jsx";
import GuestRoomSelector from "../components/booking/GuestRoomSelector.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const getDefaultCheckIn = () => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); return d;
};
const getDefaultCheckOut = () => {
    const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(0, 0, 0, 0); return d;
};

const toDateString = (date) => {
    if (!(date instanceof Date)) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const toDateObject = (str) => {
    if (!str) return null;
    const d = new Date(str); d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
};

const BOARDING_LABELS = {
    RO: "Chambre Seule", BB: "Bed & Breakfast", HB: "Demi-Pension",
    FB: "Pension Complète", AI: "Tout Inclus",   SC: "Self Catering",
};

const BOARDING_BADGE_STYLES = {
    RO: "bg-white/15 text-white border-white/25",
    BB: "bg-blue-400/30 text-blue-100 border-blue-300/40",
    HB: "bg-amber-300/30 text-amber-100 border-amber-200/40",
    FB: "bg-green-400/30 text-green-100 border-green-300/40",
    AI: "bg-purple-400/30 text-purple-100 border-purple-300/40",
    SC: "bg-yellow-300/30 text-yellow-100 border-yellow-200/40",
};

const BOARDING_TAB_STYLES = {
    ALL: {
        active:   "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-200 border-transparent",
        inactive: "bg-white text-sky-700 border-sky-200 hover:bg-sky-50",
        dot:      "bg-sky-400",
    },
    RO: {
        active:   "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-200 border-transparent",
        inactive: "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
        dot:      "bg-gray-400",
    },
    BB: {
        active:   "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 border-transparent",
        inactive: "bg-white text-blue-600 border-blue-200 hover:bg-blue-50",
        dot:      "bg-blue-500",
    },
    HB: {
        active:   "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200 border-transparent",
        inactive: "bg-white text-orange-600 border-orange-200 hover:bg-orange-50",
        dot:      "bg-orange-500",
    },
    FB: {
        active:   "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-200 border-transparent",
        inactive: "bg-white text-green-600 border-green-200 hover:bg-green-50",
        dot:      "bg-green-500",
    },
    AI: {
        active:   "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200 border-transparent",
        inactive: "bg-white text-purple-600 border-purple-200 hover:bg-purple-50",
        dot:      "bg-purple-500",
    },
    SC: {
        active:   "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-200 border-transparent",
        inactive: "bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50",
        dot:      "bg-yellow-500",
    },
};

const makeDefaultRoom = () => ({ id: Date.now(), adults: 2, children: [] });

// ✅ FIX — handles all 3 incoming shapes for room.children:
//   Shape A — { childAges: [5, 8] }            from BookingHotels direct navigate
//   Shape B — { children: 2, childAges: [5,8] } from buildHotelUrl (normalized)
//   Shape C — { children: [5, 8] }              legacy / direct URL typing
function parseRoomsParam(searchParams) {
    const roomsParam = searchParams.get("rooms");
    if (!roomsParam) return [makeDefaultRoom()];
    try {
        return JSON.parse(decodeURIComponent(roomsParam)).map((r, idx) => {
            let children;
            if (Array.isArray(r.childAges) && r.childAges.length > 0) {
                children = r.childAges.map((age, ci) => ({
                    id:  ci + 1,
                    age: typeof age === "number" ? age : (age?.age ?? 5),
                }));
            } else if (Array.isArray(r.children)) {
                children = r.children.map((age, ci) => ({
                    id:  ci + 1,
                    age: typeof age === "number" ? age : (age?.age ?? 5),
                }));
            } else {
                children = Array.from(
                    { length: typeof r.children === "number" ? r.children : 0 },
                    (_, ci) => ({ id: ci + 1, age: 5 })
                );
            }
            return { id: idx + 1, adults: r.adults ?? 2, children };
        });
    } catch {
        return [makeDefaultRoom()];
    }
}

const normalizeImage = (img) =>
    typeof img === "string" ? { Url: img, Alt: img } : img;

const getFacilityIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("wifi") || t.includes("internet")) return Wifi;
    if (t.includes("parking"))                         return Car;
    if (t.includes("restaurant") || t.includes("bar")) return Utensils;
    if (t.includes("piscine") || t.includes("plage"))  return Waves;
    if (t.includes("climatisation"))                   return Wind;
    if (t.includes("café") || t.includes("petit"))    return Coffee;
    if (t.includes("sport") || t.includes("gym"))     return Dumbbell;
    if (t.includes("spa") || t.includes("bien"))      return Sparkles;
    return CheckCircle2;
};

// ─── Component ────────────────────────────────────────────────────────────────
function HotelDetails() {
    const params         = useParams();
    const hotelId        = params.hotelId ?? params.id;
    const navigate       = useNavigate();
    const [searchParams] = useSearchParams();
    const location       = useLocation();

    const preloadedData         = location.state?.hotel;
    const preloadedSearchParams = location.state?.searchParams;

    const errorToastFiredRef = useRef(false);
    const hasAutoSearched    = useRef(false);

    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [mainImageIndex,     setMainImageIndex]     = useState(0);
    const [range, setRange] = useState({
        from: toDateObject(preloadedSearchParams?.checkIn || searchParams.get("checkin"))  ?? getDefaultCheckIn(),
        to:   toDateObject(preloadedSearchParams?.checkOut || searchParams.get("checkout")) ?? getDefaultCheckOut(),
    });
    const [rooms,             setRooms]             = useState(() => {
        if (preloadedSearchParams?.rooms) {
            return preloadedSearchParams.rooms.map((r, idx) => {
                let children;
                const childAges = Array.isArray(r.childAges) ? r.childAges : (Array.isArray(r.children) ? r.children : []);
                children = childAges.map((age, ci) => ({
                    id: ci + 1,
                    age: typeof age === "number" ? age : (age?.age ?? 5),
                }));
                return { id: idx + 1, adults: r.adults ?? 2, children };
            });
        }
        return parseRoomsParam(searchParams);
    });
    const [availableRooms,    setAvailableRooms]    = useState(() => preloadedData?.paxGroups?.flatMap(pg => pg.availableRooms) ?? []);
    const [isSearchingRooms,  setIsSearchingRooms]  = useState(false);
    const [hasSearched,       setHasSearched]       = useState(!!preloadedData);
    const [activeBoardingTab, setActiveBoardingTab] = useState(null);
    const [roomsByPax,        setRoomsByPax]        = useState(() => preloadedData?.paxGroups ?? []);
    const [selectedRoomTypes, setSelectedRoomTypes] = useState({});
    const [currentToken,      setCurrentToken]      = useState(preloadedData?.token || null);

    const checkInDate  = useMemo(() => toDateString(range.from), [range.from]);
    const checkOutDate = useMemo(() => toDateString(range.to),   [range.to]);
    const nights = useMemo(() => {
        if (!range.from || !range.to) return 1;
        return Math.max(1, Math.round((range.to - range.from) / 86400000));
    }, [range.from, range.to]);

    const { totalAdults, totalChildren } = useMemo(() => ({
        totalAdults:   rooms.reduce((acc, r) => acc + r.adults, 0),
        totalChildren: rooms.reduce((acc, r) => acc + r.children.length, 0),
    }), [rooms]);

    const boardingTabs = useMemo(() => {
        if (!availableRooms.length) return [];
        const seen = new Set(); const result = [];
        availableRooms.forEach((r) => {
            if (!seen.has(r.boardingCode)) {
                seen.add(r.boardingCode);
                result.push({
                    code:  r.boardingCode,
                    label: BOARDING_LABELS[r.boardingCode] ?? r.boardingName,
                    count: availableRooms.filter((x) => x.boardingCode === r.boardingCode).length,
                });
            }
        });
        return result;
    }, [availableRooms]);

    const filteredRooms = useMemo(
        () => !activeBoardingTab
            ? availableRooms
            : availableRooms.filter((r) => r.boardingCode === activeBoardingTab),
        [availableRooms, activeBoardingTab]
    );

    const effectiveRoomsByPax = useMemo(() => {
        if (roomsByPax.length > 0) {
            return roomsByPax.map(pg => ({
                ...pg,
                rooms: pg.availableRooms || pg.rooms
            }));
        }
        if (rooms.length === 0 || availableRooms.length === 0) return [];
        return rooms.map((room, idx) => ({ paxIndex: idx, adults: room.adults, rooms: availableRooms }));
    }, [roomsByPax, availableRooms, rooms]);

    // Initialize active boarding tab if preloaded data exists
    useEffect(() => {
        if (preloadedData && availableRooms.length > 0 && !activeBoardingTab) {
            setActiveBoardingTab(availableRooms[0].boardingCode);
        }
    }, [preloadedData, availableRooms, activeBoardingTab]);

    const computedTotalPrice = useMemo(() => {
        if (!effectiveRoomsByPax.length || !activeBoardingTab) return 0;
        let total = 0;
        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const roomId = selectedRoomTypes[i];
            if (!roomId) return 0;
            const room = effectiveRoomsByPax[i]?.rooms.find(
                (r) => r.id === roomId && r.boardingCode === activeBoardingTab
            );
            if (!room?.price) return 0;
            total += room.price; // FIX: API price is already total
        }
        return total;
    }, [effectiveRoomsByPax, selectedRoomTypes, activeBoardingTab]);

    const allSelected = useMemo(
        () => effectiveRoomsByPax.length > 0 && effectiveRoomsByPax.every((_, i) => !!selectedRoomTypes[i]),
        [effectiveRoomsByPax, selectedRoomTypes]
    );

    const { data: hotelData, isLoading, isError, error } = useQuery({
        queryKey: ["hotelDetail", hotelId],
        queryFn:  async () => {
            if (preloadedData) return preloadedData;
            const response = await apiClient.getHotelDetail(Number(hotelId));
            if (response.errorMessage?.length > 0) throw new Error(response.errorMessage.join(", "));
            return response.hotelDetail;
        },
        enabled:   !!hotelId && !isNaN(Number(hotelId)),
        staleTime: 5 * 60 * 1000,
        retry:     2,
    });

    useEffect(() => {
        if (isError && !errorToastFiredRef.current) {
            errorToastFiredRef.current = true;
            toast.error(error?.message ?? "Échec du chargement des détails de l'hôtel");
        }
        if (!isError) errorToastFiredRef.current = false;
    }, [isError, error]);

    const allImages = useMemo(() => {
        if (!hotelData) return [];
        const base = hotelData.Image ? [{ Url: hotelData.Image, Alt: hotelData.Name }] : [];
        return [...base, ...(hotelData.Album ?? []).map(normalizeImage)];
    }, [hotelData]);

    const hotelDescription = hotelData?.Description ?? hotelData?.ShortDescription ?? "";
    const hotelAddress     = hotelData?.Address ?? hotelData?.Adress ?? "";
    const facilities       = Array.isArray(hotelData?.Facilities) ? hotelData.Facilities.slice(0, 12) : [];

    const geoLat      = hotelData?.Localization?.Longitude ?? null;
    const geoLng      = hotelData?.Localization?.Latitude  ?? null;
    const hasCoords   = !!(geoLat && geoLng);
    const mapsUrl     = hasCoords ? `https://maps.google.com/?q=${geoLat},${geoLng}` : null;
    const osmEmbedUrl = hasCoords
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(geoLng) - 0.05},${parseFloat(geoLat) - 0.05},${parseFloat(geoLng) + 0.05},${parseFloat(geoLat) + 0.05}&layer=mapnik&marker=${geoLat},${geoLng}`
        : null;

    const resetSearchState = useCallback(() => {
        setHasSearched(false); setAvailableRooms([]); setActiveBoardingTab(null);
        setRoomsByPax([]); setSelectedRoomTypes({});
    }, []);

    const handleSetRange = useCallback((newRange) => {
        setRange(newRange);
        if (newRange.from && newRange.to) resetSearchState();
    }, [resetSearchState]);

    const handleBoardingTabChange = useCallback((code) => {
        setActiveBoardingTab(code); setSelectedRoomTypes({});
    }, []);

    const setRoomsWithReset = useCallback((updater) => {
        setRooms(updater); resetSearchState();
    }, [resetSearchState]);

    const handleSearchRooms = useCallback(async () => {
        if (!checkInDate || !checkOutDate) { toast.error("Veuillez sélectionner les dates de séjour"); return; }
        if (range.from >= range.to)        { toast.error("La date de départ doit être après la date d'arrivée"); return; }
        setIsSearchingRooms(true); setHasSearched(false); setSelectedRoomTypes({});
        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId:  Number(hotelId),
                checkIn:  checkInDate,
                checkOut: checkOutDate,
                rooms:    rooms.map((r) => ({
                    adults:    r.adults,
                    children:  r.children.length,
                    childAges: r.children.map((c) => c.age),
                })),
            });
            const fetchedRooms = response.rooms ?? [];
            setAvailableRooms(fetchedRooms);
            setRoomsByPax(response.roomsByPax ?? []);
            setActiveBoardingTab(fetchedRooms.length > 0 ? fetchedRooms[0].boardingCode : null);
            setHasSearched(true);
            setCurrentToken(response.token || null);
            if (fetchedRooms.length > 0)
                toast.success(`${fetchedRooms.length} option${fetchedRooms.length > 1 ? "s" : ""} disponible${fetchedRooms.length > 1 ? "s" : ""} !`);
            else
                toast.error(Array.isArray(response.errorMessage)
                    ? response.errorMessage.join(", ")
                    : (response.errorMessage ?? "Aucune chambre disponible pour ces critères"));
        } catch (err) {
            if (import.meta.env.DEV) console.error("Room search error", err);
            toast.error(err?.message ?? "Erreur lors de la recherche de chambres");
            setAvailableRooms([]); setHasSearched(true);
        } finally { setIsSearchingRooms(false); }
    }, [checkInDate, checkOutDate, range, hotelId, rooms]);

    useEffect(() => {
        if (hotelData && !hasAutoSearched.current && !preloadedData) {
            hasAutoSearched.current = true;
            handleSearchRooms();
        }
    }, [hotelData, handleSearchRooms, preloadedData]);

    // ✅ FIX: search in pax.rooms (same source as computedTotalPrice), not filteredRooms
    const handleReserve = useCallback(() => {
        if (!allSelected)           { toast.error("Veuillez sélectionner un type de chambre pour chaque chambre"); return; }
        if (computedTotalPrice <= 0) { toast.error("Veuillez rechercher les disponibilités d'abord"); return; }

        const selectedRoomsList = effectiveRoomsByPax.map((pax, i) => {
            const sel = pax.rooms.find(
                (r) => r.id === selectedRoomTypes[i] && r.boardingCode === activeBoardingTab
            );
            return {
                roomType:  sel?.name,
                roomId:    sel?.id,
                boardingCode: sel?.boardingCode,
                boardingName: sel?.boardingName,
                adults:    pax.adults,
                children:  rooms[i]?.children.length ?? 0,
                childAges: rooms[i]?.children.map((c) => c.age) ?? [],
                price:     sel?.price,
                total:     sel?.price ? sel.price : 0, // FIX: price is already total
            };
        });

        const bookingData = {
            hotelId:      Number(hotelId),
            hotelName:    hotelData?.Name,
            checkIn:      checkInDate,
            checkOut:     checkOutDate,
            nights,
            boardingType: activeBoardingTab,
            rooms:        selectedRoomsList,
            totalPrice:   computedTotalPrice,
            currency:     "DZD",
            token:        currentToken,
            hotel:        { ...hotelData, paxGroups: roomsByPax, token: currentToken }
        };
        navigate(`/booking/${hotelId}`, { state: bookingData });
        toast.success("Redirection vers la réservation...");
    }, [allSelected, computedTotalPrice, effectiveRoomsByPax, selectedRoomTypes, activeBoardingTab,
        rooms, hotelId, hotelData, checkInDate, checkOutDate, navigate, nights, currentToken, roomsByPax]);

    // ── Guards ────────────────────────────────────────────────────────────────
    if (!hotelId) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <h2 className="text-xl font-bold text-gray-700">URL Invalide</h2>
            <p className="text-gray-500 text-sm">Aucun identifiant d'hôtel trouvé dans l'URL.</p>
            <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all shadow-md">
                Retour à l'accueil
            </button>
        </div>
    );

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-sky-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-sky-600 animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-gray-700 font-bold text-base">Chargement de l'hôtel</p>
                    <p className="text-gray-400 text-sm mt-0.5">Veuillez patienter...</p>
                </div>
            </div>
        </div>
    );

    if (isError || !hotelData) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-700">Hôtel Non Trouvé</h2>
            <p className="text-gray-500 text-sm">{error?.message || "Impossible de charger les informations de l'hôtel"}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-all shadow-md">
                Retour
            </button>
        </div>
    );

    const { Name, Category, City, Vues, Type, Tag: Tags, Theme } = hotelData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-white to-slate-100/80">

            {/* ══════════════════ LIGHTBOX ══════════════════ */}
            {selectedImageIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    <button
                        onClick={() => setSelectedImageIndex(null)}
                        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm shadow-xl"
                    >
                        <X size={18} />
                    </button>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md border border-white/15 text-white/80 text-sm font-semibold px-5 py-2 rounded-full select-none pointer-events-none">
                        {selectedImageIndex + 1} / {allImages.length}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((p) => Math.max(0, p - 1)); }}
                        disabled={selectedImageIndex === 0}
                        className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm disabled:opacity-20 disabled:cursor-not-allowed shadow-xl"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <img
                        src={allImages[selectedImageIndex]?.Url}
                        alt={allImages[selectedImageIndex]?.Alt}
                        className="max-h-[78vh] max-w-[calc(100vw-160px)] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((p) => Math.min(allImages.length - 1, p + 1)); }}
                        disabled={selectedImageIndex === allImages.length - 1}
                        className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm disabled:opacity-20 disabled:cursor-not-allowed shadow-xl"
                    >
                        <ChevronRight size={22} />
                    </button>
                    {allImages.length > 1 && (
                        <div
                            className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-3 bg-black/50 backdrop-blur-md rounded-2xl border border-white/15 max-w-[80vw] overflow-x-auto"
                            onClick={(e) => e.stopPropagation()}
                            style={{ scrollbarWidth: "none" }}
                        >
                            {allImages.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i); }}
                                    className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                        i === selectedImageIndex
                                            ? "border-white scale-110 shadow-lg opacity-100"
                                            : "border-white/20 opacity-50 hover:opacity-90 hover:border-white/60"
                                    }`}
                                >
                                    <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="w-[95%] mx-auto py-3">

                {/* ── Back button ── */}
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sky-700 hover:text-sky-900 font-semibold mb-5 bg-white/80 hover:bg-white backdrop-blur-sm border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md px-4 py-2 rounded-full transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Retour aux Hôtels
                </button>

                {/* ══════════════════ HERO ══════════════════ */}
                <div className="relative h-[360px] sm:h-[480px] rounded-2xl overflow-hidden mb-6 shadow-xl">
                    <img
                        src={allImages[mainImageIndex]?.Url ?? "https://loremflickr.com/1200/500/hotel,luxury?lock=1"}
                        alt={allImages[mainImageIndex]?.Alt ?? Name}
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-14 flex flex-col gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            {Category?.Star && (
                                <div className="flex items-center gap-1.5 bg-orange-500 px-4 py-2 rounded-full shadow-lg shadow-orange-900/40">
                                    {Array(Category.Star).fill(null).map((_, i) => (
                                        <Star key={i} size={15} className="fill-white text-white" />
                                    ))}
                                </div>
                            )}
                            {Type && (
                                <span className="text-sm font-bold px-4 py-2 bg-sky-500 text-white rounded-full shadow-lg shadow-sky-900/30 tracking-wide">
                                    {Type}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-xl leading-tight tracking-tight">
                            {Name}
                        </h1>
                        <p className="flex items-center gap-2 text-white/80 text-base font-semibold">
                            <MapPin size={16} className="text-white/70 shrink-0" />
                            {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                        </p>
                    </div>
                    {allImages.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                            <div
                                className="h-full bg-white/60 transition-all duration-300"
                                style={{ width: `${((mainImageIndex + 1) / allImages.length) * 100}%` }}
                            />
                        </div>
                    )}
                    {allImages.length > 1 && (
                        <div className="absolute bottom-6 right-6 flex flex-col gap-1.5 items-center">
                            {allImages.slice(0, 6).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMainImageIndex(i)}
                                    className={`rounded-full transition-all ${
                                        mainImageIndex === i
                                            ? "bg-white w-2.5 h-8 shadow-sm"
                                            : "bg-white/50 hover:bg-white/80 w-2.5 h-2.5"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ══════════════════ QUICK INFO CARDS ══════════════════ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {Category && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                <Star size={18} className="text-amber-400 fill-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Catégorie</p>
                                <p className="text-sm font-extrabold text-gray-800 leading-tight">{Category.Title}</p>
                            </div>
                        </div>
                    )}
                    {Type && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                <Home size={18} className="text-sky-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Type</p>
                                <p className="text-sm font-extrabold text-gray-800 leading-tight">{Type}</p>
                            </div>
                        </div>
                    )}
                    {Vues?.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                                <Mountain size={18} className="text-teal-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Vues</p>
                                <p className="text-sm font-extrabold text-gray-800 leading-tight">{Vues[0]}</p>
                            </div>
                        </div>
                    )}
                    {City && (
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                <Navigation size={18} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Ville</p>
                                <p className="text-sm font-extrabold text-gray-800 leading-tight">{City.Name}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════════════════ TAGS & THEMES ══════════════════ */}
                {(Theme?.length > 0 || Tags?.length > 0) && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2.5">
                            <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full" />
                            Thèmes & Caractéristiques
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                            {Theme?.map((theme) => (
                                <span key={theme} className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold px-4 py-2 rounded-full hover:bg-purple-100 hover:border-purple-300 transition-colors">
                                    <Sparkles size={12} className="text-purple-400 shrink-0" /> {theme}
                                </span>
                            ))}
                            {Tags?.map((tag) => (
                                <span key={tag.Title ?? tag} className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 text-sm font-semibold px-4 py-2 rounded-full hover:bg-sky-100 hover:border-sky-300 transition-colors">
                                    <Users size={12} className="text-sky-400 shrink-0" /> {tag.Title ?? tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════ GALLERY + LOCATION ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

                    {/* ── Gallery ── */}
                    {allImages.length > 0 && (
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2.5">
                                    <Images size={16} className="text-sky-500" />
                                    <span className="text-base font-bold text-gray-800">Galerie Photos</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                                    {allImages.length} photo{allImages.length > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="p-3 pb-0">
                                {allImages.length === 1 && (
                                    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(0)}>
                                        <img src={allImages[0].Url} alt={allImages[0].Alt} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
                                            <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md text-gray-900 text-sm font-bold px-6 py-3 rounded-full shadow-2xl border border-white/60">
                                                <Eye size={15} className="text-sky-600" /> Voir en plein écran
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {allImages.length === 2 && (
                                    <div className="grid grid-cols-2 gap-2.5 h-[320px]">
                                        {allImages.slice(0, 2).map((img, i) => (
                                            <div key={i} className="relative rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(i)}>
                                                <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Eye size={22} className="text-white drop-shadow-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {allImages.length >= 3 && (
                                    <div className="grid grid-cols-3 gap-2.5 h-[340px]">
                                        <div className="col-span-2 relative rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(0)}>
                                            <img src={allImages[0].Url} alt={allImages[0].Alt} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                                                <Images size={11} /> {allImages.length} photos
                                            </div>
                                            <div className="absolute bottom-4 left-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <span className="flex items-center gap-2 text-white text-xs font-bold bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/30 shadow-lg">
                                                    <Eye size={13} /> Voir en plein écran
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            {allImages.slice(1, 3).map((img, i) => (
                                                <div key={i} className="relative flex-1 rounded-2xl overflow-hidden cursor-pointer group" onClick={() => setSelectedImageIndex(i + 1)}>
                                                    <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                                                    {i === 1 && allImages.length > 3 ? (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60 backdrop-blur-[1px]">
                                                            <div className="w-10 h-10 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mb-0.5">
                                                                <LayoutGrid size={18} className="text-white" />
                                                            </div>
                                                            <span className="text-white font-extrabold text-xl leading-none">+{allImages.length - 3}</span>
                                                            <span className="text-white/70 text-[10px] font-semibold tracking-widest uppercase">photos</span>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye size={18} className="text-white drop-shadow-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {allImages.length > 3 && (
                                <div className="px-3 pt-2.5">
                                    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                                        {allImages.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedImageIndex(i)}
                                                className={`relative shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                                                    i < 3
                                                        ? "border-sky-400 opacity-100 shadow-sm"
                                                        : "border-transparent opacity-60 hover:opacity-100 hover:border-sky-300"
                                                }`}
                                            >
                                                <img src={img.Url} alt={img.Alt} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {allImages.length > 1 && (
                                <div className="p-3 pt-2.5">
                                    <button
                                        onClick={() => setSelectedImageIndex(0)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all"
                                    >
                                        <Images size={14} /> Voir toutes les photos ({allImages.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Location & Contact ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-extrabold text-white leading-tight">Localisation</h2>
                                <p className="text-sky-200 text-xs font-medium">& Contact</p>
                            </div>
                            {hasCoords && (
                                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-green-200 bg-green-400/20 border border-green-300/30 px-2.5 py-1 rounded-full whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse shrink-0" />
                                    GPS disponible
                                </span>
                            )}
                        </div>
                        {osmEmbedUrl && (
                            <div className="relative w-full h-44 overflow-hidden border-b border-gray-100">
                                <iframe
                                    src={osmEmbedUrl}
                                    title="Carte de localisation"
                                    className="w-full h-full"
                                    style={{ border: "none", pointerEvents: "none" }}
                                    loading="lazy"
                                    scrolling="no"
                                />
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-end justify-end p-2.5 group"
                                >
                                    <span className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-gray-200 text-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600 transition-all">
                                        <ExternalLink size={11} /> Ouvrir la carte
                                    </span>
                                </a>
                            </div>
                        )}
                        <div className="flex flex-col flex-1 p-5 gap-4">
                            {City?.Name && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Building2 size={14} className="text-sky-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Ville</p>
                                        <p className="text-sm font-extrabold text-gray-800 leading-tight">{City.Name}</p>
                                        {City?.Country?.Name && (
                                            <p className="text-xs text-gray-400 mt-0.5">{City.Country.Name}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hotelAddress && (
                                <>
                                    <div className="border-t border-gray-100" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <Navigation size={14} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Adresse</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">{hotelAddress}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {hasCoords && (
                                <>
                                    <div className="border-t border-gray-100" />
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Coordonnées GPS</p>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lat</span>
                                                <span className="text-xs font-mono font-bold text-gray-700">{parseFloat(geoLat).toFixed(6)}°</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lng</span>
                                                <span className="text-xs font-mono font-bold text-gray-700">{parseFloat(geoLng).toFixed(6)}°</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="flex-1" />
                            {mapsUrl ? (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-200/50 transition-all active:scale-[0.98]"
                                >
                                    <MapPin size={15} />
                                    Voir sur Google Maps
                                    <ExternalLink size={13} className="opacity-70" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 w-full py-3 bg-gray-50 border border-gray-200 text-gray-400 text-sm font-medium rounded-xl justify-center">
                                    <MapPin size={15} /> Localisation non disponible
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ DESCRIPTION ══════════════════ */}
                {hotelDescription && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-1 h-6 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full shrink-0" />
                            <h2 className="text-base font-bold text-gray-800">À propos de l'hôtel</h2>
                        </div>
                        <p className="text-sm text-gray-600 leading-loose">{hotelDescription}</p>
                    </div>
                )}

                {/* ══════════════════ FACILITIES ══════════════════ */}
                {facilities.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full shrink-0" />
                            <h2 className="text-base font-bold text-gray-800">Équipements & Services</h2>
                            <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                                {facilities.length} services
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                            {facilities.map((f, i) => {
                                const Icon = getFacilityIcon(f.Title ?? f.Name ?? "");
                                return (
                                    <div
                                        key={f.Title ?? i}
                                        className="flex items-center gap-2.5 bg-gray-50 hover:bg-sky-50 border border-gray-100 hover:border-sky-200 rounded-xl px-3 py-2.5 transition-all group cursor-default"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 group-hover:border-sky-200 group-hover:bg-sky-50 flex items-center justify-center shrink-0 shadow-sm transition-all">
                                            <Icon size={13} className="text-sky-500 shrink-0" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 group-hover:text-sky-700 transition-colors leading-tight">
                                            {f.Title ?? f.Name ?? f}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ══════════════════ MAIN GRID: AVAILABILITY + SIDEBAR ══════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Availability panel ── */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Loading skeleton */}
                        {isSearchingRooms && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    <div>
                                        <p className="text-white font-extrabold text-sm">Recherche en cours...</p>
                                        <p className="text-sky-200 text-xs mt-0.5">Vérification des disponibilités</p>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex flex-col gap-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                                                <div className="h-3.5 w-36 bg-gray-200 rounded-full animate-pulse" />
                                            </div>
                                            <div className="h-10 bg-gray-200 rounded-xl animate-pulse mt-1" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results panel */}
                        {!isSearchingRooms && hasSearched && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-extrabold text-white">Résultats de disponibilité</h2>
                                        <p className="text-sky-200 text-sm mt-0.5">
                                            {availableRooms.length > 0
                                                ? `${availableRooms.length} option${availableRooms.length > 1 ? "s" : ""} trouvée${availableRooms.length > 1 ? "s" : ""}`
                                                : "Aucune disponibilité pour ces dates"}
                                        </p>
                                    </div>
                                    <span className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full ${
                                        availableRooms.length > 0
                                            ? "bg-green-400/25 text-green-100 border border-green-300/40"
                                            : "bg-red-400/25 text-red-100 border border-red-300/40"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${availableRooms.length > 0 ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
                                        {availableRooms.length > 0 ? "Disponible" : "Indisponible"}
                                    </span>
                                </div>

                                <div className="p-6">
                                    {/* Search context chips */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {[
                                            { icon: Calendar,  label: `${checkInDate} → ${checkOutDate}` },
                                            { icon: Clock,     label: `${nights} nuit${nights > 1 ? "s" : ""}` },
                                            { icon: BedDouble, label: `${rooms.length} chambre${rooms.length > 1 ? "s" : ""}` },
                                            { icon: Users,     label: `${totalAdults} adulte${totalAdults > 1 ? "s" : ""}${totalChildren > 0 ? ` · ${totalChildren} enfant${totalChildren > 1 ? "s" : ""}` : ""}` },
                                        ].map(({ icon: Icon, label }, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full font-semibold">
                                                <Icon size={11} className="text-sky-500 shrink-0" /> {label}
                                            </span>
                                        ))}
                                    </div>

                                    {availableRooms.length > 0 ? (
                                        <>
                                            {/* Boarding tabs */}
                                            <div className="mb-6">
                                                <p className="text-[10px] text-gray-400 font-extrabold mb-3 uppercase tracking-widest">Formule de pension</p>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {boardingTabs.map((tab) => {
                                                        const style    = BOARDING_TAB_STYLES[tab.code] ?? BOARDING_TAB_STYLES.ALL;
                                                        const isActive = activeBoardingTab === tab.code;
                                                        return (
                                                            <button
                                                                key={tab.code}
                                                                onClick={() => handleBoardingTabChange(tab.code)}
                                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                                                                    isActive ? `${style.active} scale-[1.03]` : style.inactive
                                                                }`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                                                                {tab.label}
                                                                <span className="text-xs opacity-60 font-semibold">{tab.count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Room selectors per pax */}
                                            <div className="flex flex-col gap-3 mb-5">
                                                {effectiveRoomsByPax.map((pax, idx) => {
                                                    const paxRooms     = pax.rooms.filter((r) => r.boardingCode === activeBoardingTab);
                                                    const selectedRoom = paxRooms.find((r) => r.id === selectedRoomTypes[idx]);
                                                    const isSlotDone   = !!selectedRoomTypes[idx];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                                                                isSlotDone
                                                                    ? "border-sky-300 bg-sky-50/50 shadow-sm shadow-sky-100"
                                                                    : "border-gray-200 bg-gray-50 hover:border-sky-200"
                                                            }`}
                                                        >
                                                            <div className="p-4 pl-5">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 transition-all ${
                                                                            isSlotDone ? "bg-sky-600 text-white" : "bg-gray-200 text-gray-500"
                                                                        }`}>
                                                                            {isSlotDone ? <CheckCircle2 size={15} /> : idx + 1}
                                                                        </span>
                                                                        <span className="text-sm font-bold text-gray-700">
                                                                            Chambre {idx + 1}
                                                                            <span className="mx-1.5 text-gray-300">·</span>
                                                                            <span className="text-sky-600">
                                                                                {pax.adults} adulte{pax.adults > 1 ? "s" : ""}
                                                                            </span>
                                                                            {rooms[idx]?.children.length > 0 && (
                                                                                <span className="text-amber-500 ml-1.5">
                                                                                    · {rooms[idx].children.length} enfant{rooms[idx].children.length > 1 ? "s" : ""}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    {isSlotDone && (
                                                                        <span className="text-[10px] font-bold text-sky-600 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full">
                                                                            ✓ Sélectionné
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {paxRooms.length === 0 ? (
                                                                    <p className="text-sm text-gray-400 italic">Aucune chambre disponible pour cette formule</p>
                                                                ) : (
                                                                    <>
                                                                        <div className="relative">
                                                                            <select
                                                                                value={selectedRoomTypes[idx] ?? ""}
                                                                                onChange={(e) => setSelectedRoomTypes((prev) => ({ ...prev, [idx]: e.target.value }))}
                                                                                className="w-full appearance-none bg-white border-2 border-gray-200 focus:border-sky-400 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-100 cursor-pointer font-medium transition-all"
                                                                            >
                                                                                <option value="" disabled>— Sélectionnez le type de chambre —</option>
                                                                                {paxRooms.map((room) => (
                                                                                    <option key={room.id} value={room.id}>
                                                                                        {room.name} — {new Intl.NumberFormat("fr-DZ").format(room.price)} DZD
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                                        </div>
                                                                        {selectedRoom && (
                                                                            <div className="mt-2.5 flex items-center justify-between bg-white border border-sky-200 rounded-xl px-4 py-2.5 shadow-sm">
                                                                                <span className="text-sm text-sky-600 font-semibold">
                                                                                    {BOARDING_LABELS[selectedRoom.boardingCode] ?? selectedRoom.boardingName}
                                                                                </span>
                                                                                <div className="flex items-baseline gap-1.5">
                                                                                    <span className="text-base font-extrabold text-sky-700">
                                                                                        {new Intl.NumberFormat("fr-DZ").format(selectedRoom.price)}
                                                                                    </span>
                                                                                    <span className="text-sm text-sky-400 font-medium">DZD</span>
                                                                                    {nights > 1 && (
                                                                                        <span className="text-xs text-gray-400 ml-1">
                                                                                            · {new Intl.NumberFormat("fr-DZ").format(Math.round(selectedRoom.price / nights))} / nuit
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Total price banner */}
                                            {computedTotalPrice > 0 && (
                                                <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-5 shadow-lg shadow-sky-200/60">
                                                    <div className="flex items-start justify-between flex-wrap gap-3">
                                                        <div>
                                                            <p className="text-sky-200 text-xs font-semibold mb-2 flex items-center gap-2">
                                                                <Clock size={11} /> {nights} nuit{nights > 1 ? "s" : ""}&nbsp;·&nbsp;
                                                                <BedDouble size={11} /> {rooms.length} chambre{rooms.length > 1 ? "s" : ""}
                                                            </p>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl font-extrabold text-white">
                                                                    {new Intl.NumberFormat("fr-DZ").format(computedTotalPrice)}
                                                                </span>
                                                                <span className="text-sky-200 font-bold text-base">DZD</span>
                                                            </div>
                                                            {nights > 1 && (
                                                                <p className="text-sky-300 text-xs mt-1">
                                                                    ≈ {new Intl.NumberFormat("fr-DZ").format(Math.round(computedTotalPrice / nights))} DZD / nuit
                                                                </p>
                                                            )}
                                                        </div>
                                                        {allSelected
                                                            ? <span className="flex items-center gap-2 text-sm font-bold text-green-200 bg-green-400/20 border border-green-300/40 px-4 py-2 rounded-full">
                                                                <CheckCircle2 size={14} /> Prêt à réserver
                                                              </span>
                                                            : <span className="flex items-center gap-2 text-sm font-bold text-amber-200 bg-amber-400/20 border border-amber-300/40 px-4 py-2 rounded-full">
                                                                <AlertCircle size={14} />
                                                                {effectiveRoomsByPax.filter((_, i) => !selectedRoomTypes[i]).length} chambre(s) restante(s)
                                                              </span>
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* Empty state */
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle size={28} className="text-amber-400" />
                                            </div>
                                            <h3 className="text-base font-extrabold text-gray-700 mb-1.5">Aucune chambre disponible</h3>
                                            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
                                                Aucune option disponible pour les dates et critères sélectionnés. Essayez d'autres dates.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Search Form Sidebar ── */}
                    <div className="lg:col-span-1" id="search-sidebar">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
                                    <h2 className="text-lg font-extrabold flex items-center gap-2 mb-1">
                                        <Search size={20} className="text-sky-400" /> Modifier la recherche
                                    </h2>
                                    <p className="text-sm text-slate-300 opacity-90">Ajustez vos dates ou voyageurs</p>
                                </div>
                                <div className="p-6">
                                    {/* Date picker */}
                                    <div className="mb-5">
                                        <label className="text-xs text-gray-500 font-semibold mb-1.5 flex items-center gap-1.5">
                                            <Calendar size={11} className="text-sky-500" /> Dates du séjour
                                        </label>
                                        <DateRangePicker range={range} setRange={handleSetRange} />
                                        {range.from && range.to && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs bg-sky-50 border border-sky-200 text-sky-600 font-bold px-3 py-1.5 rounded-full">
                                                    🌙 {nights} nuit{nights > 1 ? "s" : ""}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{checkInDate} → {checkOutDate}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Guest/room selector */}
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-500 font-semibold mb-1.5 flex items-center gap-1.5">
                                            <Users size={11} className="text-sky-500" /> Voyageurs & Chambres
                                        </label>
                                        <GuestRoomSelector rooms={rooms} setRooms={setRoomsWithReset} />
                                    </div>

                                    {/* Search button */}
                                    <button
                                        onClick={handleSearchRooms}
                                        disabled={isSearchingRooms}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-200/60 mb-4 active:scale-[0.98]"
                                    >
                                        {isSearchingRooms ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                Recherche...
                                            </>
                                        ) : (
                                            <>
                                                <Calendar size={14} /> Vérifier les disponibilités
                                            </>
                                        )}
                                    </button>

                                    {/* Total price display */}
                                    {computedTotalPrice > 0 && (
                                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 mb-4 text-center">
                                            <p className="text-[10px] text-sky-500 uppercase tracking-widest font-extrabold mb-1.5">Total du séjour</p>
                                            <p className="text-2xl font-extrabold text-sky-700 leading-none">
                                                {new Intl.NumberFormat("fr-DZ").format(computedTotalPrice)}
                                                <span className="text-sm font-semibold text-sky-400 ml-1.5">DZD</span>
                                            </p>
                                            {nights > 1 && (
                                                <p className="text-[11px] text-sky-400 mt-1.5 font-medium">
                                                    {nights} nuits · {rooms.length} chambre{rooms.length > 1 ? "s" : ""}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Reserve button */}
                                    <div className={`relative ${allSelected && computedTotalPrice > 0 ? "before:absolute before:inset-0 before:rounded-xl before:bg-orange-400/40 before:animate-ping before:scale-105" : ""}`}>
                                        <button
                                            onClick={handleReserve}
                                            disabled={!allSelected || computedTotalPrice <= 0}
                                            className="relative w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-white text-base font-extrabold rounded-xl transition-all shadow-md shadow-orange-200/60 active:scale-[0.98]"
                                        >
                                            Réserver maintenant
                                            {allSelected && computedTotalPrice > 0 && <ChevronRight size={18} />}
                                        </button>
                                    </div>

                                    {!allSelected && hasSearched && availableRooms.length > 0 && (
                                        <p className="text-center text-xs text-gray-400 mt-2.5 leading-relaxed">
                                            Sélectionnez une chambre par slot pour activer la réservation
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default HotelDetails;