// src/components/HotelLightCard.jsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, MapPin, Star, Wifi, Car, Utensils, Waves, Wind, Coffee,
    Dumbbell, Sparkles, ChevronRight, CheckCircle2, AlertCircle,
    ChevronDown, ChevronUp, Loader2, Baby,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/ApiClient';

// ── Utilities ──────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('fr-DZ').format(price);
};

const stripHtml = (html = '') => {
    if (!html) return '';
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const text = doc.body.textContent || '';
        return text.replace(/\s+/g, ' ').trim();
    } catch {
        return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    }
};

const getFacilityIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('wifi') || t.includes('internet')) return Wifi;
    if (t.includes('parking')) return Car;
    if (t.includes('restaurant') || t.includes('bar')) return Utensils;
    if (t.includes('piscine') || t.includes('plage')) return Waves;
    if (t.includes('climatisation')) return Wind;
    if (t.includes('café') || t.includes('petit')) return Coffee;
    if (t.includes('sport') || t.includes('gym')) return Dumbbell;
    if (t.includes('spa') || t.includes('bien')) return Sparkles;
    return CheckCircle2;
};

const getFreeChildInfo = (freeChild) => {
    if (!Array.isArray(freeChild) || freeChild.length === 0) return null;
    const maxAge = Math.max(...freeChild.map((fc) => fc.Age));
    return { count: freeChild.length, maxAge };
};

const buildBoardingFromRooms = (rooms) => {
    if (!rooms?.length) return [];
    const map = new Map();
    rooms.forEach(room => {
        if (room?.boardingCode && !map.has(room.boardingCode))
            map.set(room.boardingCode, { code: room.boardingCode, label: room.boardingName });
    });
    return Array.from(map.values());
};

const buildDetailUrl = (hotelId, searchParams) => {
    const p = new URLSearchParams();
    if (searchParams?.checkIn) p.set('checkin', searchParams.checkIn);
    if (searchParams?.checkOut) p.set('checkout', searchParams.checkOut);
    if (searchParams?.rooms?.length) {
        try {
            const normalized = searchParams.rooms.map(r => ({
                adults: r.adults ?? 2,
                children: Array.isArray(r.children) ? r.children.length : (r.children ?? 0),
                childAges: Array.isArray(r.children) ? r.children : (r.childAges ?? []),
            }));
            p.set('rooms', encodeURIComponent(JSON.stringify(normalized)));
        } catch { /* skip */
        }
    }
    const qs = p.toString();
    return `/hotel/${hotelId}${qs ? `?${qs}` : ''}`;
};

const getDiscountInfo = (room) => {
    if (!room?.basePrice || !room?.price || room.basePrice <= room.price) return null;
    const pct = Math.round(((room.basePrice - room.price) / room.basePrice) * 100);
    return pct > 0 ? { pct, saving: room.basePrice - room.price } : null;
};

// ── Component ──────────────────────────────────────────────────────────────────
function HotelLightCard({
    hotel,
    onFavoriteToggle,
    pricing = null,
    paxGroups: preloadedPaxGroups = null,
    onBook = null,
    onViewDetail = null,
    showBookButton = false,
    nights = 1,
    searchParams = null,
    initialIsFavorite = false,
}) {
    const navigate = useNavigate();

    const cardRef = useRef(null);
    const showTarifsRef = useRef(false);
    const searchParamsRef = useRef(searchParams);
    const isFetchingRef = useRef(false);
    const hasRealFetchRef = useRef(false);

    useEffect(() => {
        searchParamsRef.current = searchParams;
    }, [searchParams]);

    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showTarifs, setShowTarifs] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [paxGroups, setPaxGroups] = useState(preloadedPaxGroups);
    const [noAvailability, setNoAvailability] = useState(false);
    const [hasFetched, setHasFetched] = useState(() => preloadedPaxGroups !== null);
    // 🛡️ ATOMIC STATE: Merged boarding + room selection to prevent ghost renders
    const [boardingState, setBoardingState] = useState({ selectedBoarding: null, selectedRooms: {} });
    const { selectedBoarding, selectedRooms } = boardingState;
    const [currentToken, setCurrentToken] = useState(hotel?.token || pricing?.token || null);

    useEffect(() => {
        if (preloadedPaxGroups === null) return;
        if (hasRealFetchRef.current) return;

        const allPreloadedRooms = preloadedPaxGroups.flatMap(pg => pg.availableRooms);
        const boardings = buildBoardingFromRooms(allPreloadedRooms);

        setPaxGroups(preloadedPaxGroups);
        setNoAvailability(preloadedPaxGroups.length === 0);
        setHasFetched(true);
        setBoardingState({
            selectedBoarding: boardings[0]?.code ?? null,
            selectedRooms: {}
        });
    }, [preloadedPaxGroups]);

    const {
        Id, Name, Category, City,
        ShortDescription, Description,
        Image, Album = [], Facilities = [], FreeChild,
    } = hotel;

    const allRooms = useMemo(() => (paxGroups ?? []).flatMap(pg => pg.availableRooms), [paxGroups]);
    const availableBoarding = useMemo(() => buildBoardingFromRooms(allRooms), [allRooms]);

    useEffect(() => {
        if (availableBoarding.length > 0 && !selectedBoarding) {
            setBoardingState(prev => ({ ...prev, selectedBoarding: availableBoarding[0].code }));
        }
    }, [availableBoarding, selectedBoarding]);

    const hotelImage = useMemo(() => {
        if (Album.length > 0) return Album[0];
        return Image || 'https://loremflickr.com/600/400/hotel,luxury?lock=42';
    }, [Album, Image]);

    const shortDesc = useMemo(() => stripHtml(ShortDescription || Description || ''), [ShortDescription, Description]);
    const stars = useMemo(() => (Category?.Star ? Array(Math.min(Category.Star, 5)).fill(0) : []), [Category?.Star]);
    const topFacilities = useMemo(() => Facilities.slice(0, 4), [Facilities]);
    const freeChildInfo = useMemo(() => getFreeChildInfo(FreeChild), [FreeChild]);
    const detailUrl = useMemo(() => buildDetailUrl(Id, searchParams), [Id, searchParams]);

    const effectiveRoomsByPax = useMemo(() => {
        if (!paxGroups) return [];
        return paxGroups.map(pg => ({
            ...pg,
            rooms: pg.availableRooms,
            children: Array.isArray(pg.children) ? pg.children.length : (pg.children || 0),
            childAges: Array.isArray(pg.children) ? pg.children : (pg.childAges || []),
        }));
    }, [paxGroups]);

    const derivedMinPrice = useMemo(() => {
        if (pricing?.minPrice) return pricing.minPrice;
        if (!effectiveRoomsByPax || effectiveRoomsByPax.length === 0) return null;

        let calcMinPrice = null;
        const availableBoardings = buildBoardingFromRooms(allRooms);

        availableBoardings.forEach(b => {
            const bCode = b.code;
            let comboPrice = 0;
            let isValid = true;

            for (let i = 0; i < effectiveRoomsByPax.length; i++) {
                const paxSlot = effectiveRoomsByPax[i];
                // Exclut les chambres stopReservation pour le prix d'appel
                const bookableRooms = paxSlot.rooms.filter(r => r.boardingCode === bCode && !r.stopReservation);
                if (bookableRooms.length === 0) {
                    isValid = false;
                    break;
                }
                comboPrice += Math.min(...bookableRooms.map(r => r.price));
            }

            if (isValid) {
                if (calcMinPrice === null || comboPrice < calcMinPrice) calcMinPrice = comboPrice;
            }
        });

        return calcMinPrice;
    }, [pricing?.minPrice, effectiveRoomsByPax, allRooms]);

    const totalPrice = derivedMinPrice;

    // ✅ NOUVELLE LOGIQUE: Prise en charge explicite du "Sur demande"
    const cardAvailabilityStatus = useMemo(() => {
        if (pricing?.availabilityStatus) return pricing.availabilityStatus;
        if (noAvailability) return 'full';
        if (!hasFetched || !allRooms.length) return null;

        const bookableRooms = allRooms.filter(r => !r.stopReservation);
        if (bookableRooms.length === 0) return 'full';

        // Si toutes les chambres réservables nécessitent une confirmation
        if (bookableRooms.every(r => r.onRequest)) return 'on_request';

        if (allRooms.some(r => r.stopReservation)) return 'last';
        return 'available';
    }, [hasFetched, allRooms, noAvailability, pricing?.availabilityStatus]);

    const computedTotalPrice = useMemo(() => {
        if (!effectiveRoomsByPax?.length || !selectedBoarding) return 0;
        let total = 0;
        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const paxSlot = effectiveRoomsByPax[i];
            const roomId = selectedRooms[i];
            if (!roomId) return 0;
            // 🛡️ ARCHITECT FIX: Prevent ID Collision by matching Boarding Code
            const room = paxSlot.rooms.find(r => String(r.id) === String(roomId) && r.boardingCode === selectedBoarding);
            if (!room?.price) return 0;
            total += room.price;
        }
        return total;
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding]);

    // 🛡️ ARCHITECT FIX: Dynamic Fallback Price
    // Calculates the cheapest base price combination specifically for the active Meal Plan
    const dynamicMinPrice = useMemo(() => {
        if (!effectiveRoomsByPax || effectiveRoomsByPax.length === 0 || !selectedBoarding) {
            return derivedMinPrice;
        }

        let comboPrice = 0;
        let isValid = true;

        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const paxSlot = effectiveRoomsByPax[i];

            // Get bookable rooms for this specific pax slot that match the active tab
            const bookableRooms = paxSlot.rooms.filter(r => r.boardingCode === selectedBoarding && !r.stopReservation);

            if (bookableRooms.length === 0) {
                isValid = false;
                break;
            }
            // Add the absolute cheapest room for this specific slot to the total
            comboPrice += Math.min(...bookableRooms.map(r => r.price));
        }

        // Return the exact combo price for this tab, or fallback if invalid
        return isValid ? comboPrice : derivedMinPrice;
    }, [effectiveRoomsByPax, selectedBoarding, derivedMinPrice]);

    const filteredRooms = useMemo(() => {
        if (!selectedBoarding) return allRooms;
        return allRooms.filter(r => r.boardingCode === selectedBoarding);
    }, [allRooms, selectedBoarding]);

    const fetchAvailability = useCallback(async () => {
        const sp = searchParamsRef.current;
        if (!sp?.checkIn || !sp?.checkOut) return;
        if (isFetchingRef.current) return;

        if (!hasFetched) setIsLoading(true);
        isFetchingRef.current = true;

        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId: Id,
                checkIn: sp.checkIn,
                checkOut: sp.checkOut,
                rooms: sp.rooms?.map(r => ({
                    adults: r.adults ?? 2,
                    children: Array.isArray(r.children) ? r.children.length : (r.children ?? 0),
                    childAges: Array.isArray(r.children) ? r.children : (r.childAges ?? []),
                })) ?? [{ adults: 2, children: 0, childAges: [] }],
            });

            if (!response.roomsByPax?.length || response.roomsByPax.every(p => p.rooms.length === 0)) {
                setNoAvailability(true);
                setPaxGroups([]);
                return;
            }

            const newPaxGroups = response.roomsByPax.map(pax => ({
                ...pax,
                availableRooms: pax.rooms,
            }));

            hasRealFetchRef.current = true;
            setPaxGroups(newPaxGroups);
            setHasFetched(true);
            setNoAvailability(false);
            setCurrentToken(response.token || null);

            // 🛡️ ROOT CAUSE 3 FIX: Always reset boarding + rooms atomically on fresh fetch
            const allNewRooms = newPaxGroups.flatMap(pg => pg.availableRooms);
            const newBoardings = buildBoardingFromRooms(allNewRooms);
            setBoardingState({
                selectedBoarding: newBoardings[0]?.code ?? null,
                selectedRooms: {}
            });
        } catch (err) {
            if (!err.isCancelled) {
                if (showTarifsRef.current) toast.error('Erreur lors de la recherche de disponibilités.');
                if (!paxGroups) {
                    setNoAvailability(true);
                    setPaxGroups([]);
                }
            }
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [Id, hasFetched, paxGroups]);

    useEffect(() => {
        if (!searchParamsRef.current?.checkIn || !searchParamsRef.current?.checkOut) return;
        if (hasFetched) return;

        const el = cardRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    void fetchAvailability();
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasFetched, fetchAvailability]);

    const handleToggleTarifs = useCallback(() => {
        const next = !showTarifs;
        showTarifsRef.current = next;
        setShowTarifs(next);
        if (next && !hasFetched && !isFetchingRef.current) {
            void fetchAvailability();
        }
    }, [showTarifs, hasFetched, fetchAvailability]);

    const handleRefresh = useCallback(() => {
        hasRealFetchRef.current = false;
        isFetchingRef.current = false;
        void fetchAvailability();
    }, [fetchAvailability]);

    // 🛡️ ROOT CAUSE 1 FIX: Single atomic update prevents ghost render with mismatched state
    const handleBoardingChange = useCallback((code) => {
        setBoardingState({ selectedBoarding: code, selectedRooms: {} });
    }, []);

    const handleFavoriteClick = useCallback((e) => {
        e.stopPropagation();
        const next = !isFavorite;
        setIsFavorite(next);
        onFavoriteToggle?.(Id, next);
        toast.success(next ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }, [isFavorite, Id, onFavoriteToggle]);

    const handleBook = useCallback((room) => {
        const originalPax = searchParams?.rooms?.[0] || { adults: 2, children: [] };
        const childrenCount = Array.isArray(originalPax.children) ? originalPax.children.length : (originalPax.children || 0);
        const childAgesArray = Array.isArray(originalPax.children) ? originalPax.children : (originalPax.childAges || []);

        const roomsData = [{
            roomType: room.name,
            roomId: room.id,
            Id: room.Id ?? room.id ?? null,
            Boarding: room.Boarding ?? (room.boardingId != null ? { Id: room.boardingId } : null),
            adults: originalPax.adults ?? 2,
            children: childrenCount,
            childAges: childAgesArray,
            price: room.price,
            total: room.price,
            boardingCode: room.boardingCode,
            boardingName: room.boardingName,
            Option: room.Option ?? hotel?.Option ?? [],
        }];

        if (onBook) {
            onBook(hotel, roomsData);
            return;
        }

        const bookingData = {
            hotelId: Number(Id),
            hotelName: Name,
            checkIn: searchParams?.checkIn,
            checkOut: searchParams?.checkOut,
            nights,
            boardingType: room.boardingCode,
            rooms: roomsData,
            totalPrice: room.price,
            currency: room.currency || hotel.currency || "DZD",
            Token: room?._raw?.Token || hotel?.Token || currentToken,
            token: currentToken,
            selectedRooms: roomsData,
            Option: hotel?.Option ?? [],
            hotel: { ...hotel, paxGroups, token: currentToken, Token: hotel?.Token || currentToken }
        };
        navigate(`/booking/${Id}`, { state: bookingData });
    }, [onBook, hotel, navigate, Id, Name, searchParams, nights, currentToken, paxGroups]);

    const handleBookAll = useCallback(() => {
        if (!effectiveRoomsByPax || effectiveRoomsByPax.length === 0) return;

        const selectedRoomsList = effectiveRoomsByPax
            .map((pax, idx) => {
                const roomId = selectedRooms[idx];
                if (!roomId) return null;

                // 🛡️ ARCHITECT FIX: Prevent ID Collision in booking payload
                const room = pax.rooms.find(r => String(r.id) === String(roomId) && r.boardingCode === selectedBoarding);
                if (!room) return null;

                return {
                    roomType: room.name,
                    roomId: room.id,
                    Id: room.Id ?? room.id ?? null,
                    Boarding: room.Boarding ?? (room.boardingId != null ? { Id: room.boardingId } : null),
                    boardingCode: room.boardingCode,
                    boardingName: room.boardingName,
                    adults: pax.adults,
                    children: pax.children,
                    childAges: pax.childAges,
                    price: room.price,
                    total: room.price,
                    Option: room.Option ?? hotel?.Option ?? [],
                };
            })
            .filter(Boolean);

        if (selectedRoomsList.length !== effectiveRoomsByPax.length) {
            toast.error("Veuillez sélectionner une chambre pour chaque groupe.");
            return;
        }

        if (onBook) {
            onBook(hotel, selectedRoomsList);
            return;
        }

        const bookingData = {
            hotelId: Number(Id),
            hotelName: Name,
            checkIn: searchParams?.checkIn,
            checkOut: searchParams?.checkOut,
            nights,
            boardingType: selectedBoarding,
            rooms: selectedRoomsList,
            totalPrice: computedTotalPrice,
            currency: hotel.currency || pricing?.currency || "DZD",
            Token: hotel?.Token || currentToken,
            token: currentToken,
            selectedRooms: selectedRoomsList,
            Option: hotel?.Option ?? [],
            hotel: { ...hotel, paxGroups, token: currentToken, Token: hotel?.Token || currentToken }
        };
        navigate(`/booking/${Id}`, { state: bookingData });
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding, onBook, hotel, navigate, Id, Name, searchParams, nights, computedTotalPrice, currentToken, paxGroups, pricing?.currency]);

    const handleViewDetail = useCallback(() => {
        if (onViewDetail) {
            onViewDetail(Id);
            return;
        }
        navigate(detailUrl, { state: { hotel: { ...hotel, paxGroups, token: currentToken }, searchParams } });
    }, [onViewDetail, navigate, Id, detailUrl, hotel, paxGroups, currentToken, searchParams]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div
            ref={cardRef}
            className="group bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row min-h-[220px] sm:min-h-[210px]">

                {/* ── Image ── */}
                <div className="relative sm:w-80 lg:w-[360px] shrink-0 overflow-hidden bg-gray-200">
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                    )}
                    <img
                        src={hotelImage}
                        alt={Name}
                        className={`w-full h-60 sm:h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.src = 'https://loremflickr.com/600/400/hotel,luxury?lock=42';
                            setImageLoaded(true);
                        }}
                        loading="lazy"
                    />
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Stars */}
                    {stars.length > 0 && (
                        <div
                            className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
                            {stars.map((_, i) => <Star key={i} size={11}
                                className="fill-amber-400 text-amber-400 drop-shadow" />)}
                        </div>
                    )}

                    <button
                        onClick={handleFavoriteClick}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${isFavorite
                            ? 'bg-rose-500 border border-rose-400'
                            : 'bg-white/80 border border-white/50 hover:bg-white'
                            }`}
                    >
                        <Heart size={15} className={isFavorite ? 'fill-white text-white' : 'text-gray-500'} />
                    </button>

                    {/* Discount badge */}
                    {pricing?.discountPercent != null && (
                        <div
                            className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-rose-400/30 flex items-center gap-1">
                            🏷 -{pricing.discountPercent}%
                        </div>
                    )}

                    {/* Price overlay ou Complet */}
                    {cardAvailabilityStatus !== 'full' && derivedMinPrice ? (
                        <div
                            className="absolute bottom-3 right-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border border-orange-300/30">
                            <div className="text-[10px] font-normal opacity-80 tracking-wide uppercase">À partir de</div>
                            <div className="text-sm font-extrabold">
                                {formatPrice(computedTotalPrice > 0 ? computedTotalPrice : dynamicMinPrice)}{' '}
                                <span className="font-normal opacity-80 text-[11px]">DZD</span>
                            </div>
                            {nights > 1 && (
                                <div
                                    className="text-[10px] font-normal opacity-75">{formatPrice(Math.round((computedTotalPrice > 0 ? computedTotalPrice : dynamicMinPrice) / nights))} /
                                    nuit</div>
                            )}
                        </div>
                    ) : cardAvailabilityStatus === 'full' ? (
                        <div
                            className="absolute bottom-3 right-3 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-lg border border-red-400/30">
                            <div className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-1">
                                Complet
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col gap-2.5 min-w-0">

                    <div className="flex items-start gap-2 lg:gap-4 flex-wrap">
                        <h3 className="text-base lg:text-xl font-extrabold text-gray-600 leading-tight tracking-tight">{Name}</h3>
                        {freeChildInfo && (
                            <span
                                className="inline-flex items-center gap-1.5 bg-emerald-500 text-xs text-white border border-emerald-400 font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                                <Baby size={13} />
                                {freeChildInfo.count} enfant{freeChildInfo.count > 1 ? 's' : ''} gratuit{freeChildInfo.count > 1 ? 's' : ''} jusqu'à {freeChildInfo.maxAge} ans
                            </span>
                        )}
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <MapPin size={13} className="text-sky-500 shrink-0" />
                        {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ''}
                    </p>

                    {cardAvailabilityStatus && (
                        <div className="flex items-center">
                            {cardAvailabilityStatus === 'available' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Disponible
                                </span>
                            )}
                            {cardAvailabilityStatus === 'on_request' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Sur demande
                                </span>
                            )}
                            {cardAvailabilityStatus === 'last' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" /> Dernières chambres
                                </span>
                            )}
                            {cardAvailabilityStatus === 'full' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> Complet
                                </span>
                            )}
                        </div>
                    )}

                    {shortDesc && (
                        <p className="text-xs lg:text-sm text-gray-500 line-clamp-2 leading-relaxed">{shortDesc}</p>
                    )}

                    {topFacilities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {topFacilities.map((f, i) => {
                                const Icon = getFacilityIcon(f.Title || '');
                                return (
                                    <span key={f.Title ?? i}
                                        className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                        <Icon size={10} className="text-sky-500 shrink-0" />{f.Title}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {searchParams && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                🌙 {nights} nuit{nights > 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                👤 {searchParams.rooms?.reduce((s, r) => s + (r.adults || 0), 0)} adulte(s)
                            </span>
                            {searchParams.rooms?.some(r => Array.isArray(r.children) ? r.children.length > 0 : r.children > 0) && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                    🧒 {searchParams.rooms?.reduce((s, r) => s + (Array.isArray(r.children) ? r.children.length : (r.children || 0)), 0)} enfant(s)
                                </span>
                            )}
                            {searchParams.rooms?.length > 1 && (
                                <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                    🛏 {searchParams.rooms.length} chambres
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex-1" />

                    {/* Price row + action buttons */}
                    <div className="flex items-end justify-between gap-3 mt-1 flex-wrap pt-2 border-t border-gray-100">
                        {isLoading && !derivedMinPrice ? (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tarif</p>
                                <p className="text-sm font-semibold text-gray-400 italic flex items-center gap-1.5">
                                    <Loader2 size={12} className="animate-spin" /> Chargement...
                                </p>
                            </div>
                        ) : cardAvailabilityStatus === 'full' ? (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Tarif</p>
                                <p className="text-lg font-extrabold text-red-500 leading-none">Complet</p>
                            </div>
                        ) : derivedMinPrice ? (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">À partir
                                    de</p>
                                <p className="text-xl font-extrabold text-sky-700 leading-none">
                                    {formatPrice(computedTotalPrice > 0 ? computedTotalPrice : dynamicMinPrice)}
                                    <span className="text-sm font-semibold text-sky-400 ml-1">DZD</span>
                                </p>
                                {nights > 1 && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">{formatPrice(Math.round((computedTotalPrice > 0 ? computedTotalPrice : dynamicMinPrice) / nights))} / nuit</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tarif</p>
                                <p className="text-sm font-semibold text-gray-400 italic">Sur demande</p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {showBookButton && cardAvailabilityStatus !== 'full' && (
                                <button
                                    onClick={handleToggleTarifs}
                                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
                                >
                                    {showTarifs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    Tarifs & Chambres
                                </button>
                            )}
                            <button
                                onClick={handleViewDetail}
                                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-150"
                            >
                                Voir Détails <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tarifs & Chambres panel ── */}
            {showTarifs && cardAvailabilityStatus !== 'full' && (
                <div className="border-t border-gray-100 bg-gradient-to-b from-slate-50 to-white px-5 sm:px-6 py-5">

                    {/* Panel header */}
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-extrabold text-gray-700 tracking-tight flex items-center gap-2">
                            🛏 Tarifs & Chambres
                            {isLoading && <Loader2 size={13} className="animate-spin text-sky-500" />}
                        </h4>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold disabled:opacity-40 transition-colors"
                        >
                            ↻ Actualiser
                        </button>
                    </div>

                    {isLoading && !allRooms.length && (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!isLoading && noAvailability && (
                        <div
                            className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                            <p className="text-sm text-red-600 font-medium">Aucune disponibilité pour ces dates.</p>
                        </div>
                    )}

                    {/* ✅ FIX: Affiche les onglets de pension même s'il n'y en a qu'un seul */}
                    {!noAvailability && availableBoarding.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                            {availableBoarding.map(b => (
                                <button
                                    key={b.code}
                                    onClick={() => handleBoardingChange(b.code)}
                                    className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all duration-150 ${selectedBoarding === b.code
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300 hover:text-sky-700'
                                        }`}
                                >
                                    {b.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── Per-pax room selectors ── */}
                    {!noAvailability && effectiveRoomsByPax.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {effectiveRoomsByPax.map((paxSlot, idx) => {
                                // 🛡️ ARCHITECT FIX 3: Strict boarding filter without cross-tab fallback
                                const displayRooms = paxSlot.rooms.filter(r => r.boardingCode === selectedBoarding);
                                const selectedRoomId = selectedRooms[idx];
                                const selectedRoom = displayRooms.find(r => String(r.id) === String(selectedRoomId)) ?? null;
                                const discount = getDiscountInfo(selectedRoom);

                                return (
                                    <div key={idx}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">

                                        <p className="text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5">
                                            <span
                                                className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                                                Chambre {idx + 1}
                                            </span>
                                            👤 {paxSlot.adults} adulte{paxSlot.adults > 1 ? 's' : ''}
                                            {paxSlot.children > 0 && ` · 🧒 ${paxSlot.children} enfant${paxSlot.children > 1 ? 's' : ''}`}
                                        </p>

                                        {displayRooms.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">Aucune chambre disponible.</p>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <select
                                                        value={selectedRoomId ?? ''}
                                                        onChange={e => setBoardingState(prev => ({
                                                            ...prev,
                                                            selectedRooms: { ...prev.selectedRooms, [idx]: e.target.value }
                                                        }))}
                                                        className="w-full appearance-none bg-slate-50 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"
                                                    >
                                                        <option value="">— Choisir une chambre —</option>
                                                        {displayRooms.map(room => {
                                                            const d = getDiscountInfo(room);
                                                            return (
                                                                <option key={room.id} value={room.id}>
                                                                    {room.stopReservation ? '🔴 ' : room.onRequest ? '🔔 ' : ''}
                                                                    {room.name} — {formatPrice(room.price)} DZD
                                                                    {d ? ` (−${d.pct}%)` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <ChevronDown size={13}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>

                                                {selectedRoom && (
                                                    <div
                                                        className="mt-2.5 bg-sky-50 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className="text-[11px] text-sky-600 font-semibold">{selectedRoom.boardingName}</span>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-sm font-extrabold text-sky-700">
                                                                    {formatPrice(selectedRoom.price)}
                                                                </span>
                                                                <span
                                                                    className="text-[11px] font-semibold text-sky-500">DZD</span>
                                                                {nights > 1 && (
                                                                    <span className="text-[10px] text-gray-400 ml-1">
                                                                        · {formatPrice(Math.round(selectedRoom.price / nights))} / nuit
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {discount && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                                                    🏷 -{discount.pct}% · Économie {formatPrice(discount.saving)} DZD
                                                                </span>
                                                            )}
                                                            {selectedRoom.stopReservation ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                                                    🔴 Réservation suspendue
                                                                </span>
                                                            ) : selectedRoom.onRequest ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                                                    🔔 Sur demande
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    ✅ Disponible
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}

                            {effectiveRoomsByPax.length > 0 && (
                                <div
                                    className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 flex-wrap">
                                    <div>
                                        {computedTotalPrice > 0 ? (
                                            <>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total
                                                    séjour</p>
                                                <p className="text-lg font-extrabold text-sky-700 leading-none">
                                                    {formatPrice(computedTotalPrice)}
                                                    <span className="text-sm font-semibold text-sky-400 ml-1">DZD</span>
                                                </p>
                                                {nights > 1 && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {formatPrice(Math.round(computedTotalPrice / nights))} / nuit
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Sélectionnez une chambre par slot</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleBookAll}
                                        disabled={computedTotalPrice <= 0}
                                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
                                    >
                                        Réserver <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default HotelLightCard;