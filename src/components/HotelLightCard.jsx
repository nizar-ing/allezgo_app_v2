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
        const doc  = new DOMParser().parseFromString(html, 'text/html');
        const text = doc.body.textContent || '';
        return text.replace(/\s+/g, ' ').trim();
    } catch {
        return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    }
};

const getFacilityIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('wifi') || t.includes('internet')) return Wifi;
    if (t.includes('parking'))                        return Car;
    if (t.includes('restaurant') || t.includes('bar')) return Utensils;
    if (t.includes('piscine') || t.includes('plage')) return Waves;
    if (t.includes('climatisation'))                  return Wind;
    if (t.includes('café') || t.includes('petit'))   return Coffee;
    if (t.includes('sport') || t.includes('gym'))    return Dumbbell;
    if (t.includes('spa') || t.includes('bien'))     return Sparkles;
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
        if (!map.has(room.boardingCode))
            map.set(room.boardingCode, { code: room.boardingCode, label: room.boardingName });
    });
    return Array.from(map.values());
};

const buildDetailUrl = (hotelId, searchParams) => {
    const p = new URLSearchParams();
    if (searchParams?.checkIn)  p.set('checkin',  searchParams.checkIn);
    if (searchParams?.checkOut) p.set('checkout', searchParams.checkOut);
    if (searchParams?.rooms?.length) {
        try {
            const normalized = searchParams.rooms.map(r => ({
                adults:    r.adults    ?? 2,
                children:  Array.isArray(r.children) ? r.children.length : (r.children ?? 0),
                childAges: Array.isArray(r.children) ? r.children : (r.childAges ?? []),
            }));
            p.set('rooms', encodeURIComponent(JSON.stringify(normalized)));
        } catch { /* skip */ }
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
                            pricing             = null,
                            preloadedAvailability = null,
                            onBook              = null,
                            onViewDetail        = null,
                            showBookButton      = false,
                            nights              = 1,
                            searchParams        = null,
                            initialIsFavorite   = false,
                        }) {
    const navigate = useNavigate();

    const cardRef         = useRef(null);
    const showTarifsRef   = useRef(false);
    const searchParamsRef = useRef(searchParams);
    const isFetchingRef   = useRef(false);
    const hasRealFetchRef = useRef(false);

    useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);

    const [isFavorite,        setIsFavorite]        = useState(initialIsFavorite);
    const [imageLoaded,       setImageLoaded]       = useState(false);
    const [showTarifs,        setShowTarifs]        = useState(false);
    const [isLoading,         setIsLoading]         = useState(false);
    const [allRooms,          setAllRooms]          = useState(() => preloadedAvailability ?? []);
    const [availableBoarding, setAvailableBoarding] = useState(() => buildBoardingFromRooms(preloadedAvailability));
    const [selectedBoarding,  setSelectedBoarding]  = useState(() => preloadedAvailability?.[0]?.boardingCode ?? null);
    const [noAvailability,    setNoAvailability]    = useState(false);
    const [hasFetched,        setHasFetched]        = useState(() => preloadedAvailability !== null && preloadedAvailability.length > 0);
    const [roomsByPax,        setRoomsByPax]        = useState([]);
    const [selectedRooms,     setSelectedRooms]     = useState({});

    useEffect(() => {
        if (preloadedAvailability === null) return;
        if (hasRealFetchRef.current) return;
        const boarding = buildBoardingFromRooms(preloadedAvailability);
        setAllRooms(preloadedAvailability);
        setAvailableBoarding(boarding);
        setSelectedBoarding(boarding[0]?.code ?? null);
        setNoAvailability(false);
        setHasFetched(preloadedAvailability.length > 0);
        setRoomsByPax([]);
        setSelectedRooms({});
    }, [preloadedAvailability]);

    const {
        Id, Name, Category, City,
        ShortDescription, Description,
        Image, Album = [], Facilities = [], FreeChild,
    } = hotel;

    const hotelImage = useMemo(() => {
        if (Album.length > 0) return Album[0];
        return Image || 'https://loremflickr.com/600/400/hotel,luxury?lock=42';
    }, [Album, Image]);

    const shortDesc     = useMemo(() => stripHtml(ShortDescription || Description || ''), [ShortDescription, Description]);
    const stars         = useMemo(() => (Category?.Star ? Array(Math.min(Category.Star, 5)).fill(0) : []), [Category?.Star]);
    const topFacilities = useMemo(() => Facilities.slice(0, 4), [Facilities]);
    const freeChildInfo = useMemo(() => getFreeChildInfo(FreeChild), [FreeChild]);
    const detailUrl     = useMemo(() => buildDetailUrl(Id, searchParams), [Id, searchParams]);

    const derivedMinPrice = useMemo(() => {
        if (pricing?.minPrice) return pricing.minPrice;
        if (!allRooms.length) return null;
        const prices = allRooms.map(r => r.price).filter(p => p != null && p > 0);
        return prices.length > 0 ? Math.min(...prices) : null;
    }, [pricing?.minPrice, allRooms]);

    const totalPrice = useMemo(() => {
        if (!derivedMinPrice || !nights) return null;
        return derivedMinPrice * nights;
    }, [derivedMinPrice, nights]);

    const cardAvailabilityStatus = useMemo(() => {
        if (noAvailability) return 'full';
        if (!hasFetched || !allRooms.length) return null;
        if (allRooms.every(r => r.stopReservation)) return 'full';
        if (allRooms.some(r => r.stopReservation))  return 'last';
        return 'available';
    }, [hasFetched, allRooms, noAvailability]);

    const effectiveRoomsByPax = useMemo(() => {
        if (roomsByPax.length > 0) return roomsByPax;
        const requestedRooms = searchParams?.rooms ?? [];
        if (requestedRooms.length === 0 || allRooms.length === 0) return [];
        const adultCountToRooms = new Map();
        allRooms.forEach(room => {
            const key = room.adults ?? 2;
            if (!adultCountToRooms.has(key)) adultCountToRooms.set(key, []);
            adultCountToRooms.get(key).push(room);
        });
        const availableCounts = Array.from(adultCountToRooms.keys()).sort((a, b) => a - b);
        return requestedRooms.map((room, idx) => {
            const requestedAdults = room.adults ?? 2;
            let matchedRooms = adultCountToRooms.get(requestedAdults) ?? [];
            if (matchedRooms.length === 0 && availableCounts.length > 0) {
                const closest = availableCounts.reduce((prev, curr) =>
                    Math.abs(curr - requestedAdults) < Math.abs(prev - requestedAdults) ? curr : prev
                );
                matchedRooms = adultCountToRooms.get(closest) ?? [];
            }
            return {
                paxIndex:  idx,
                adults:    requestedAdults,
                children:  room.children  ?? 0,
                childAges: Array.isArray(room.children) ? room.children : (room.childAges ?? []),
                rooms:     [...matchedRooms].sort((a, b) => a.price - b.price),
            };
        });
    }, [roomsByPax, allRooms, searchParams?.rooms]);

    const computedTotalPrice = useMemo(() => {
        if (!effectiveRoomsByPax.length || !selectedBoarding) return null;
        let total = 0;
        for (let i = 0; i < effectiveRoomsByPax.length; i++) {
            const roomId = selectedRooms[i];
            const room   = effectiveRoomsByPax[i]?.rooms.find(
                r => r.id === roomId && r.boardingCode === selectedBoarding
            );
            if (!room?.price) return null;
            total += room.price * nights;
        }
        return total;
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding, nights]);

    const filteredRooms = useMemo(() => {
        if (!selectedBoarding) return allRooms;
        return allRooms.filter(r => r.boardingCode === selectedBoarding);
    }, [allRooms, selectedBoarding]);

    const fetchAvailability = useCallback(async () => {
        const sp = searchParamsRef.current;
        if (!sp?.checkIn || !sp?.checkOut) return;
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsLoading(true);
        setNoAvailability(false);
        setAllRooms([]);
        setAvailableBoarding([]);
        setSelectedBoarding(null);
        setRoomsByPax([]);
        setSelectedRooms({});
        try {
            const response = await apiClient.searchRoomAvailability({
                hotelId:  Id,
                checkIn:  sp.checkIn,
                checkOut: sp.checkOut,
                rooms: sp.rooms?.map(r => ({
                    adults:    r.adults    ?? 2,
                    children:  Array.isArray(r.children) ? r.children.length : 0,
                    childAges: Array.isArray(r.children) ? r.children : [],
                })) ?? [{ adults: 2, children: 0, childAges: [] }],
            });
            if (!response.rooms?.length) {
                setNoAvailability(true);
                return;
            }
            const boarding  = buildBoardingFromRooms(response.rooms);
            const firstCode = boarding[0]?.code ?? null;
            const paxData   = response.roomsByPax ?? [];
            hasRealFetchRef.current = true;
            setAllRooms(response.rooms);
            setAvailableBoarding(boarding);
            setSelectedBoarding(firstCode);
            setRoomsByPax(paxData);
            setHasFetched(true);
            setSelectedRooms({});
        } catch (err) {
            if (!err.isCancelled) {
                if (showTarifsRef.current) toast.error('Erreur lors de la recherche de disponibilités.');
                setNoAvailability(true);
                setAvailableBoarding([]);
            }
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [Id]);

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
        if (next && !hasFetched && !isFetchingRef.current) void fetchAvailability();
    }, [showTarifs, hasFetched, fetchAvailability]);

    const handleRefresh = useCallback(() => {
        hasRealFetchRef.current = false;
        isFetchingRef.current   = false;
        void fetchAvailability();
    }, [fetchAvailability]);

    const handleBoardingChange = useCallback((code) => {
        setSelectedBoarding(code);
        setSelectedRooms({});
    }, []);

    const handleFavoriteClick = useCallback((e) => {
        e.stopPropagation();
        const next = !isFavorite;
        setIsFavorite(next);
        onFavoriteToggle?.(Id, next);
        toast.success(next ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }, [isFavorite, Id, onFavoriteToggle]);

    const handleBook = useCallback((room) => {
        if (onBook) { onBook(hotel, room); return; }
        navigate(detailUrl);
    }, [onBook, hotel, navigate, detailUrl]);

    // ✅ FIX: merge pax-level children + childAges into each room object
    const handleBookAll = useCallback(() => {
        const selectedRoomsList = effectiveRoomsByPax
            .map((pax, idx) => {
                const room = pax.rooms.find(
                    r => r.id === selectedRooms[idx] && r.boardingCode === selectedBoarding
                ) ?? null;
                if (!room) return null;
                return {
                    ...room,
                    children:  pax.children  ?? 0,
                    childAges: Array.isArray(pax.childAges) ? pax.childAges : [],
                };
            })
            .filter(Boolean);
        if (onBook) { onBook(hotel, selectedRoomsList); return; }
        navigate(detailUrl);
    }, [effectiveRoomsByPax, selectedRooms, selectedBoarding, onBook, hotel, navigate, detailUrl]);

    const handleViewDetail = useCallback(() => {
        if (onViewDetail) { onViewDetail(Id); return; }
        navigate(detailUrl);
    }, [onViewDetail, navigate, Id, detailUrl]);

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
                        onError={(e) => { e.target.src = 'https://loremflickr.com/600/400/hotel,luxury?lock=42'; setImageLoaded(true); }}
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Stars */}
                    {stars.length > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full shadow-sm">
                            {stars.map((_, i) => <Star key={i} size={11} className="fill-amber-400 text-amber-400 drop-shadow" />)}
                        </div>
                    )}

                    {/* Favorite */}
                    <button
                        onClick={handleFavoriteClick}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                            isFavorite
                                ? 'bg-rose-500 border border-rose-400'
                                : 'bg-white/80 border border-white/50 hover:bg-white'
                        }`}
                        aria-label="Favoris"
                    >
                        <Heart size={15} className={isFavorite ? 'fill-white text-white' : 'text-gray-500'} />
                    </button>

                    {/* Discount badge */}
                    {pricing?.discountPercent != null && (
                        <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md border border-rose-400/30 flex items-center gap-1">
                            🏷 -{pricing.discountPercent}%
                        </div>
                    )}

                    {/* Price overlay */}
                    {derivedMinPrice && (
                        <div className="absolute bottom-3 right-3 bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-lg border border-orange-300/30">
                            <div className="text-[10px] font-normal opacity-80 tracking-wide uppercase">À partir de</div>
                            <div className="text-sm font-extrabold">
                                {formatPrice(totalPrice ?? derivedMinPrice)}{' '}
                                <span className="font-normal opacity-80 text-[11px]">DZD</span>
                            </div>
                            {nights > 1 && (
                                <div className="text-[10px] font-normal opacity-75">{formatPrice(derivedMinPrice)} / nuit</div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col gap-2.5 min-w-0">

                    {/* Name + FreeChild badge */}
                    <div className="flex items-start gap-2 lg:gap-4 flex-wrap">
                        <h3 className="text-base lg:text-xl font-extrabold text-gray-600 leading-tight tracking-tight">{Name}</h3>
                        {freeChildInfo && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-xs text-white border border-emerald-400 font-bold px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                                <Baby size={13} />
                                {freeChildInfo.count} enfant{freeChildInfo.count > 1 ? 's' : ''} gratuit{freeChildInfo.count > 1 ? 's' : ''} jusqu'à {freeChildInfo.maxAge} ans
                            </span>
                        )}
                    </div>

                    {/* City */}
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <MapPin size={13} className="text-sky-500 shrink-0" />
                        {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ''}
                    </p>

                    {/* Card-level availability badge */}
                    {cardAvailabilityStatus && (
                        <div className="flex items-center">
                            {cardAvailabilityStatus === 'available' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    Disponible
                                </span>
                            )}
                            {cardAvailabilityStatus === 'last' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    Dernières chambres
                                </span>
                            )}
                            {cardAvailabilityStatus === 'full' && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                    Complet
                                </span>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    {shortDesc && (
                        <p className="text-xs lg:text-sm text-gray-500 line-clamp-2 leading-relaxed">{shortDesc}</p>
                    )}

                    {/* Facilities */}
                    {topFacilities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {topFacilities.map((f, i) => {
                                const Icon = getFacilityIcon(f.Title || '');
                                return (
                                    <span key={f.Title ?? i} className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                        <Icon size={10} className="text-sky-500 shrink-0" />{f.Title}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Nights + guests summary */}
                    {searchParams && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                🌙 {nights} nuit{nights > 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                                👤 {searchParams.rooms?.reduce((s, r) => s + (r.adults || 0), 0)} adulte(s)
                            </span>
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
                        ) : derivedMinPrice ? (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">À partir de</p>
                                <p className="text-xl font-extrabold text-sky-700 leading-none">
                                    {formatPrice(totalPrice ?? derivedMinPrice)}
                                    <span className="text-sm font-semibold text-sky-400 ml-1">DZD</span>
                                </p>
                                {nights > 1 && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">{formatPrice(derivedMinPrice)} / nuit</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tarif</p>
                                <p className="text-sm font-semibold text-gray-400 italic">Sur demande</p>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {showBookButton && (
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
            {showTarifs && (
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

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* No availability */}
                    {!isLoading && noAvailability && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                            <AlertCircle size={16} className="text-red-400 shrink-0" />
                            <p className="text-sm text-red-600 font-medium">Aucune disponibilité pour ces dates.</p>
                        </div>
                    )}

                    {/* Boarding tabs */}
                    {!isLoading && !noAvailability && availableBoarding.length > 1 && (
                        <div className="flex gap-2 flex-wrap mb-4">
                            {availableBoarding.map(b => (
                                <button
                                    key={b.code}
                                    onClick={() => handleBoardingChange(b.code)}
                                    className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all duration-150 ${
                                        selectedBoarding === b.code
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
                    {!isLoading && !noAvailability && effectiveRoomsByPax.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {effectiveRoomsByPax.map((paxSlot, idx) => {
                                const boardingRooms  = paxSlot.rooms.filter(r => r.boardingCode === selectedBoarding);
                                const displayRooms   = boardingRooms.length > 0 ? boardingRooms : paxSlot.rooms;
                                const selectedRoomId = selectedRooms[idx];
                                const selectedRoom   = displayRooms.find(r => r.id === selectedRoomId) ?? null;
                                const discount       = getDiscountInfo(selectedRoom);

                                return (
                                    <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">

                                        {/* Slot header */}
                                        <p className="text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5">
                                            <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                                                Chambre {idx + 1}
                                            </span>
                                            👤 {paxSlot.adults} adulte{paxSlot.adults > 1 ? 's' : ''}
                                            {paxSlot.children > 0 && ` · ${paxSlot.children} enfant${paxSlot.children > 1 ? 's' : ''}`}
                                        </p>

                                        {displayRooms.length === 0 ? (
                                            <p className="text-xs text-gray-400 italic">Aucune chambre disponible.</p>
                                        ) : (
                                            <>
                                                {/* Room selector */}
                                                <div className="relative">
                                                    <select
                                                        value={selectedRoomId ?? ''}
                                                        onChange={e => setSelectedRooms(prev => ({ ...prev, [idx]: e.target.value }))}
                                                        className="w-full appearance-none bg-slate-50 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"
                                                    >
                                                        <option value="">— Choisir une chambre —</option>
                                                        {displayRooms.map(room => {
                                                            const d = getDiscountInfo(room);
                                                            return (
                                                                <option key={room.id} value={room.id}>
                                                                    {room.stopReservation ? '🔴 ' : room.onRequest ? '🔔 ' : ''}
                                                                    {room.name} — {formatPrice(room.price * nights)} DZD
                                                                    {d ? ` (−${d.pct}%)` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>

                                                {/* Selected room summary + badges */}
                                                {selectedRoom && (
                                                    <div className="mt-2.5 bg-sky-50 rounded-xl px-3 py-2.5 flex flex-col gap-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] text-sky-600 font-semibold">{selectedRoom.boardingName}</span>
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-sm font-extrabold text-sky-700">
                                                                    {formatPrice(selectedRoom.price * nights)}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-sky-500">DZD</span>
                                                                {nights > 1 && (
                                                                    <span className="text-[10px] text-gray-400 ml-1">
                                                                        · {formatPrice(selectedRoom.price)} / nuit
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {discount && (
                                                                <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                                                    🏷 -{discount.pct}% · Économie {formatPrice(discount.saving)} DZD
                                                                </span>
                                                            )}
                                                            {selectedRoom.stopReservation ? (
                                                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                                                    🔴 Réservation suspendue
                                                                </span>
                                                            ) : selectedRoom.onRequest ? (
                                                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                                                    🔔 Sur confirmation
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    ✅ Disponible à la réservation
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

                            {/* Multi-room total + book CTA */}
                            {effectiveRoomsByPax.length > 0 && (
                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 flex-wrap">
                                    <div>
                                        {computedTotalPrice ? (
                                            <>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total séjour</p>
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
                                        disabled={!computedTotalPrice}
                                        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
                                    >
                                        Réserver <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Flat room list fallback (no pax data) ── */}
                    {!isLoading && !noAvailability && effectiveRoomsByPax.length === 0 && filteredRooms.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {filteredRooms.map((room) => {
                                const discount = getDiscountInfo(room);
                                return (
                                    <div
                                        key={room.id}
                                        className="group/row flex items-center justify-between gap-3 bg-white hover:bg-sky-50 border border-gray-100 hover:border-sky-200 rounded-2xl px-4 py-3 transition-all duration-150"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 group-hover/row:text-sky-700 transition-colors flex items-center gap-1.5 flex-wrap">
                                                {room.name}
                                                {discount && (
                                                    <span className="inline-flex items-center bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                                                        -{discount.pct}%
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                {room.boardingName}
                                                {room.stopReservation ? (
                                                    <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-200">
                                                        Suspendu
                                                    </span>
                                                ) : room.onRequest ? (
                                                    <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                                                        Sur confirmation
                                                    </span>
                                                ) : null}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <p className="text-sm font-extrabold text-sky-700 leading-none">
                                                    {formatPrice(room.price * nights)}
                                                    <span className="text-[11px] font-semibold text-sky-400 ml-1">DZD</span>
                                                </p>
                                                {nights > 1 && (
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{formatPrice(room.price)} / nuit</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleBook(room)}
                                                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-extrabold px-3 py-2 rounded-xl transition-all duration-150 shadow-sm whitespace-nowrap"
                                            >
                                                Réserver <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default HotelLightCard;