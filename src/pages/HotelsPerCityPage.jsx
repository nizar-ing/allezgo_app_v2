// src/pages/HotelsPerCityPage.jsx
import {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {
    MapPin, X, ChevronDown, Search, Hotel, AlertCircle,
    Filter, ArrowUpDown, CheckCircle, Calendar, Users, RefreshCw,
} from 'lucide-react';
import {IoAddOutline, IoTrashOutline} from 'react-icons/io5';
import toast from 'react-hot-toast';
import {DayPicker} from 'react-day-picker';
import 'react-day-picker/style.css';
import apiClient from '../services/ApiClient';
import HotelsFiltering from '../components/HotelsFiltering.jsx';
import HotelLightCard from '../components/HotelLightCard.jsx';
import DateRoomsPickerBanner from '../components/DateRoomsPickerBanner.jsx';
import Loader from '../ui/Loader.jsx';
import {normalizeHotelForCard} from '../utils/normalizeHotel';

const COUNTRY_BANNERS = {
    tunisie:  '/images/tunisie_hotels.jpeg',
    algerie:  '/images/algerie_hotels.jpeg',
};

const FALLBACK_BANNER = '/images/tunisie_hotels.jpeg';

const getDefaultDates = () => {
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    return {
        checkIn:  tomorrow.toISOString().split('T')[0],
        checkOut: dayAfter.toISOString().split('T')[0],
    };
};

const defaultDates    = getDefaultDates();
const HOTELS_PER_PAGE = 10;

function HotelsPerCityPage() {
    const {cityId: cityIdParam} = useParams();
    const cityId  = Number(cityIdParam);
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────────
    const [filters,          setFilters]          = useState({});
    const [sortBy,           setSortBy]           = useState('recommended');
    const [showFilters,      setShowFilters]      = useState(false);
    const [cityInfo,         setCityInfo]         = useState(null);
    const [showDatePicker,   setShowDatePicker]   = useState(false);
    const [currentMonth,     setCurrentMonth]     = useState(new Date());
    const [searchParams,     setSearchParams]     = useState({
        checkIn:  defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        rooms:    [{adults: 2, children: []}],
    });
    const [tempSearchParams, setTempSearchParams] = useState({
        checkIn:  defaultDates.checkIn,
        checkOut: defaultDates.checkOut,
        rooms:    [{adults: 2, children: []}],
    });
    const [dateRange, setDateRange] = useState({
        from: new Date(defaultDates.checkIn),
        to:   new Date(defaultDates.checkOut),
    });
    const [favoriteIds, setFavoriteIds] = useState(() =>
        JSON.parse(localStorage.getItem('favoriteHotels') ?? '[]')
    );
    const [displayCount, setDisplayCount] = useState(HOTELS_PER_PAGE);
    const loadMoreRef = useRef(null);

    // ── Step 1 — Fetch hotels ──────────────────────────────────────────────────
    const {
        data:      allHotelsData,
        isLoading: isLoadingAll,
        isError:   isErrorAll,
        error:     errorAll,
    } = useQuery({
        queryKey: ['hotels-enhanced', cityId],
        queryFn:  async () =>
            await apiClient.listHotelEnhanced(cityId, {
                batchSize:           5,
                delayBetweenBatches: 150,
                onProgress: (current, total) => {
                    if (import.meta.env.DEV)
                        console.log(`Loading hotels ${current}/${total}`);
                },
            }),
        enabled:   !!cityId,
        staleTime: 10 * 60 * 1000,
        retry:     2,
    });

    // ── Step 2 — Fetch pricing + extract preloaded room availability ───────────
    const {
        data:      pricingData,
        isLoading: isLoadingPricing,
        isError:   isErrorPricing,
    } = useQuery({
        queryKey: ['hotel-pricing', cityId,
            searchParams.checkIn, searchParams.checkOut, searchParams.rooms],
        queryFn:  async () => {
            if (!allHotelsData?.length || !searchParams.checkIn || !searchParams.checkOut)
                return null;

            const hotelIds = allHotelsData.map(h => h.Id);
            const result   = await apiClient.searchHotel({
                checkIn:  searchParams.checkIn,
                checkOut: searchParams.checkOut,
                hotels:   hotelIds,
                rooms: searchParams.rooms.map(room => ({
                    adult:     room.adults,
                    child:     room.children, // ApiClient handles array or count transformation
                })),
                filters: {keywords: '', category: '', onlyAvailable: false, tags: ''},
            });

            const pricingMap = {};

            // ✅ Utilisation de transformedHotels pour récupérer isAvailable et paxGroups synchronisés
            result.transformedHotels.forEach(th => {
                pricingMap[th.id] = {
                    minPrice:           th.minPrice,
                    currency:           th.currency,
                    isAvailable:        th.isAvailable, // ✅ Fix: Synchronisé avec HotelLightCard status
                    availabilityStatus: th.availabilityStatus, // ✅ NOUVEAU: Transmet le statut "Sur demande" ou "Complet"
                    token:              th.token,
                    discountPercent:    th.maxDiscount,
                    paxGroups:          th.paxGroups,   // ✅ Fix: Données injectées pour affichage immédiat
                };
            });

            return pricingMap;
        },
        enabled:   !!allHotelsData && !!searchParams.checkIn && !!searchParams.checkOut,
        staleTime: 2 * 60 * 1000,
    });

    // ── Cities ─────────────────────────────────────────────────────────────────
    const {data: citiesData} = useQuery({
        queryKey: ['cities'],
        queryFn:  async () => apiClient.listCity(),
        staleTime: 10 * 60 * 1000,
    });

    // ── Effects ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (citiesData && cityId) setCityInfo(citiesData.find(c => c.Id === cityId));
    }, [citiesData, cityId]);

    useEffect(() => {
        if (isErrorPricing)
            toast.error('Impossible de charger les prix. Réessayez.', {duration: 4000});
    }, [isErrorPricing]);

    // ── Derived data ───────────────────────────────────────────────────────────
    const hotelsWithPricing = useMemo(() => {
        if (!allHotelsData) return [];
        return allHotelsData.map(hotel =>
            normalizeHotelForCard({
                ...hotel,
                pricing: pricingData?.[hotel.Id] ?? null,
            })
        );
    }, [allHotelsData, pricingData]);

    const filteredHotels = useMemo(() => {
        let result = [...hotelsWithPricing];
        if (filters.categories?.length > 0)
            result = result.filter(h => filters.categories.includes(h.Category?.Star));
        if (filters.services?.length > 0)
            result = result.filter(h =>
                h.Theme?.some(theme =>
                    filters.services.some(s => theme.toLowerCase().includes(s.toLowerCase()))
                )
            );
        // ✅ FIX : On masque uniquement les hôtels vraiment "full" si l'utilisateur coche la case "Disponible"
        if (filters.disponibleSeulement && pricingData)
            result = result.filter(h => h.pricing?.availabilityStatus !== 'full');
        if (filters.priceRange && pricingData)
            result = result.filter(h => {
                const p = h.pricing?.minPrice;
                if (!p) return false;
                return p >= filters.priceRange.min && p <= filters.priceRange.max;
            });
        return result;
    }, [hotelsWithPricing, filters, pricingData]);

    const sortedHotels = useMemo(() => {
        const sorted = [...filteredHotels];
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) =>
                    (a.pricing?.minPrice ?? Infinity) - (b.pricing?.minPrice ?? Infinity));
            case 'price-desc':
                return sorted.sort((a, b) =>
                    (b.pricing?.minPrice ?? 0) - (a.pricing?.minPrice ?? 0));
            case 'rating':
                return sorted.sort((a, b) =>
                    (b.Category?.Star ?? 0) - (a.Category?.Star ?? 0));
            case 'name-asc':
                return sorted.sort((a, b) => a.Name.localeCompare(b.Name));
            case 'recommended':
            default:
                return sorted.sort((a, b) => {
                    if (a.pricing && !b.pricing) return -1;
                    if (!a.pricing && b.pricing) return 1;
                    const starDiff = (b.Category?.Star ?? 0) - (a.Category?.Star ?? 0);
                    if (starDiff !== 0) return starDiff;
                    return a.Name.localeCompare(b.Name);
                });
        }
    }, [filteredHotels, sortBy]);

    useEffect(() => {
        setDisplayCount(HOTELS_PER_PAGE);
    }, [sortedHotels.length, filters, sortBy]);

    const displayedHotels = sortedHotels.slice(0, displayCount);
    const hasNextPage     = displayCount < sortedHotels.length;
    const loadMore        = () => setDisplayCount(prev => prev + HOTELS_PER_PAGE);

    // Intersection observer for infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current || !hasNextPage) return;
        const el       = loadMoreRef.current;
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore(); },
            {threshold: 0.1, rootMargin: '100px'}
        );
        observer.observe(el);
        return () => observer.unobserve(el);
    }, [hasNextPage]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const nights = searchParams.checkIn && searchParams.checkOut
        ? Math.ceil(
            (new Date(searchParams.checkOut) - new Date(searchParams.checkIn))
            / (1000 * 60 * 60 * 24))
        : 1;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleFilterChange = (newFilters) => setFilters(newFilters);

    const handleFavoriteToggle = useCallback((hotelId, isFav) => {
        setFavoriteIds(prev => {
            const next = isFav
                ? [...new Set([...prev, hotelId])]
                : prev.filter(id => id !== hotelId);
            localStorage.setItem('favoriteHotels', JSON.stringify(next));
            return next;
        });
    }, []);

    const handleDateRangeSelect = (range) => {
        setDateRange(range);
        setTempSearchParams(prev => ({
            ...prev,
            checkIn:  range?.from ? range.from.toISOString().split('T')[0] : '',
            checkOut: range?.to ? range.to.toISOString().split('T')[0] : '',
        }));
    };

    const handleSearchPricing = () => {
        if (!tempSearchParams.checkIn || !tempSearchParams.checkOut)
            return toast.error('Veuillez sélectionner les dates de séjour',
                {duration: 4000, position: 'top-center'});
        if (new Date(tempSearchParams.checkIn) >= new Date(tempSearchParams.checkOut))
            return toast.error("La date de départ doit être après la date d'arrivée",
                {duration: 4000, position: 'top-center'});
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(tempSearchParams.checkIn) < today)
            return toast.error("La date d'arrivée ne peut pas être dans le passé",
                {duration: 4000, position: 'top-center'});
        setSearchParams({
            checkIn:  tempSearchParams.checkIn,
            checkOut: tempSearchParams.checkOut,
            rooms:    tempSearchParams.rooms,
        });
        setShowDatePicker(false);
        toast.loading('Recherche des prix en cours...', {duration: 2000});
    };

    const buildHotelUrl = useCallback((hotelId) => {
        const p = new URLSearchParams();
        if (searchParams.checkIn)  p.set('checkin',  searchParams.checkIn);
        if (searchParams.checkOut) p.set('checkout', searchParams.checkOut);
        if (searchParams.rooms?.length) {
            try { p.set('rooms', encodeURIComponent(JSON.stringify(
                searchParams.rooms.map(r => ({
                    adults:    r.adults,
                    children:  r.children.length,
                    childAges: r.children,
                }))
            ))); } catch {}
        }
        const qs = p.toString();
        return `/hotel/${hotelId}${qs ? `?${qs}` : ''}`;
    }, [searchParams]);

    const handleViewHotelDetail = useCallback((hotelId) => {
        navigate(buildHotelUrl(hotelId));
    }, [navigate, buildHotelUrl]);

    const handleBookHotel = useCallback((hotel, selectedRooms) => {
        const roomsList  = Array.isArray(selectedRooms)
            ? selectedRooms
            : selectedRooms ? [selectedRooms] : [];
        const totalPrice = roomsList.reduce((acc, r) => acc + (r.price ?? 0), 0);
        navigate(`/booking/${hotel.Id}`, {
            state: {
                hotel,
                hotelId:      hotel.Id,
                hotelName:    hotel.Name,
                checkIn:      searchParams.checkIn,
                checkOut:     searchParams.checkOut,
                nights,
                boardingType: roomsList[0]?.boardingCode ?? null,
                rooms:        roomsList,
                totalPrice,
                currency:     hotel.pricing?.currency ?? 'DZD',
                selectedRooms: roomsList,
                searchParams: {
                    checkIn:  searchParams.checkIn,
                    checkOut: searchParams.checkOut,
                    rooms:    searchParams.rooms,
                },
            },
        });
    }, [navigate, searchParams, nights]);

    // ── Room management ────────────────────────────────────────────────────────
    const handleAddRoom = () =>
        setTempSearchParams(prev => ({
            ...prev, rooms: [...prev.rooms, {adults: 1, children: []}],
        }));

    const handleRemoveRoom = (index) => {
        if (tempSearchParams.rooms.length <= 1)
            return toast.error('Au moins une chambre requise');
        setTempSearchParams(prev => ({
            ...prev, rooms: prev.rooms.filter((_, i) => i !== index),
        }));
    };

    const handleUpdateRoomAdults = (index, value) => {
        const n = parseInt(value);
        if (n < 1 || n > 6) return;
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => i === index ? {...room, adults: n} : room),
        }));
    };

    const handleAddChild = (roomIndex) =>
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) => {
                if (i !== roomIndex) return room;
                if (room.children.length >= 4) {
                    toast.error('Maximum 4 enfants par chambre');
                    return room;
                }
                return {...room, children: [...room.children, 1]};
            }),
        }));

    const handleRemoveChild = (roomIndex, childIndex) =>
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === roomIndex
                    ? {...room, children: room.children.filter((_, ci) => ci !== childIndex)}
                    : room),
        }));

    const handleUpdateChildAge = (roomIndex, childIndex, age) => {
        const ageNum = parseInt(age);
        if (ageNum < 1 || ageNum > 11) return;
        setTempSearchParams(prev => ({
            ...prev,
            rooms: prev.rooms.map((room, i) =>
                i === roomIndex
                    ? {
                        ...room,
                        children: room.children.map((a, ci) =>
                            ci === childIndex ? ageNum : a),
                    }
                    : room),
        }));
    };

    // ── Rendering Helpers ──────────────────────────────────────────────────────
    const sortOptions = [
        {value: 'recommended', label: 'Recommandés'},
        {value: 'price-asc',   label: 'Prix croissant',   disabled: !pricingData},
        {value: 'price-desc',  label: 'Prix décroissant',  disabled: !pricingData},
        {value: 'rating',      label: 'Meilleures notes'},
        {value: 'name-asc',    label: 'Nom A-Z'},
    ];

    const getBannerImage = () => {
        const countryName  = cityInfo?.Country?.Name ?? '';
        const countryKey   = countryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const countryMatch = Object.keys(COUNTRY_BANNERS).find((key) => countryKey.includes(key));
        if (countryMatch) return COUNTRY_BANNERS[countryMatch];
        return FALLBACK_BANNER;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sélectionner';
        return new Date(dateString).toLocaleDateString('fr-FR',
            {weekday: 'short', day: 'numeric', month: 'short'});
    };

    const hotelCards = useMemo(() =>
            displayedHotels.map(hotel => (
                <HotelLightCard
                    key={hotel.Id}
                    hotel={hotel}
                    onFavoriteToggle={handleFavoriteToggle}
                    pricing={hotel.pricing}
                    // ✅ FIX: Passage de paxGroups pour affichage instantané et badge correct
                    paxGroups={hotel.pricing?.paxGroups ?? null}
                    onBook={handleBookHotel}
                    onViewDetail={handleViewHotelDetail}
                    showBookButton={true}
                    nights={nights}
                    searchParams={searchParams}
                    initialIsFavorite={favoriteIds.includes(hotel.Id)}
                />
            )),
        [displayedHotels, handleFavoriteToggle, handleBookHotel,
            handleViewHotelDetail, nights, searchParams, favoriteIds]
    );

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoadingAll && !allHotelsData) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">
                <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 overflow-hidden bg-gray-200 animate-pulse mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent"/>
                </div>
                <Loader
                    message={`Chargement des hôtels ${cityInfo?.Name ?? ''}...`}
                    submessage="Récupération des détails complets..."
                    fullHeight={true}
                />
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100">

            {/* Hero Banner */}
            <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 overflow-hidden mx-2 sm:mx-4 lg:mx-8 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
                <img
                    src={getBannerImage()}
                    alt={cityInfo?.Name}
                    className="w-full h-full object-fill"
                    onError={e =>
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"/>
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <MapPin className="text-white flex-shrink-0" size={20}/>
                            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-2xl leading-tight">
                                Hôtels {cityInfo?.Name ?? '...'}
                            </h1>
                        </div>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-xl font-medium drop-shadow-lg ml-7 sm:ml-8">
                            {cityInfo?.Country?.Name ?? 'Tunisie'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

                {/* Date Picker Banner */}
                <DateRoomsPickerBanner
                    searchParams={searchParams}
                    nights={nights}
                    pricingData={pricingData}
                    showDatePicker={showDatePicker}
                    tempSearchParams={tempSearchParams}
                    dateRange={dateRange}
                    currentMonth={currentMonth}
                    isLoadingPricing={isLoadingPricing}
                    onOpen={() => {
                        if (!showDatePicker) {
                            setTempSearchParams(searchParams);
                            setDateRange({
                                from: searchParams.checkIn ? new Date(searchParams.checkIn) : undefined,
                                to: searchParams.checkOut ? new Date(searchParams.checkOut) : undefined,
                            });
                            if (searchParams.checkIn) {
                                setCurrentMonth(new Date(searchParams.checkIn));
                            }
                        }
                        setShowDatePicker(!showDatePicker);
                    }}
                    onClose={() => setShowDatePicker(false)}
                    onMonthChange={setCurrentMonth}
                    onDateSelect={handleDateRangeSelect}
                    onSearch={handleSearchPricing}
                    onAddRoom={handleAddRoom}
                    onRemoveRoom={handleRemoveRoom}
                    onUpdateAdults={handleUpdateRoomAdults}
                    onAddChild={handleAddChild}
                    onRemoveChild={handleRemoveChild}
                    onUpdateChildAge={handleUpdateChildAge}
                    formatDate={formatDate}
                />

                {/* Pricing error */}
                {isErrorPricing && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0" size={24}/>
                            <div className="flex-1">
                                <p className="font-semibold text-red-800">Erreur lors de la recherche des prix</p>
                                <p className="text-sm text-red-600">Impossible de récupérer les prix pour les dates sélectionnées.</p>
                            </div>
                            <button
                                onClick={handleSearchPricing}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-red-200"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Bar */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6 sticky top-16 sm:top-20 lg:top-4 z-40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="p-1.5 sm:p-2 bg-sky-50 border border-sky-100 rounded-xl flex-shrink-0">
                                <Hotel className="text-sky-600" size={20}/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Résultats trouvés</p>
                                <p className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-800 truncate">
                                    {sortedHotels.length} hôtel{sortedHotels.length > 1 ? 's' : ''}
                                    <span className="text-xs sm:text-sm text-gray-400 font-medium ml-1 sm:ml-2">
                                        ({displayedHotels.length} affichés)
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-sky-300 hover:bg-sky-50 text-gray-700 hover:text-sky-700 text-sm sm:text-base font-bold rounded-xl transition-all shadow-sm active:scale-95 flex-1 sm:flex-initial justify-center focus:outline-none focus:ring-4 focus:ring-sky-100"
                            >
                                <Filter size={18}/>
                                <span className="hidden xs:inline">Filtres</span>
                            </button>
                            <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[160px]">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="appearance-none w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:border-sky-300 hover:shadow-md focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all cursor-pointer"
                                >
                                    {sortOptions.map(o => (
                                        <option key={o.value} value={o.value} disabled={o.disabled}>
                                            {o.label}{o.disabled ? ' (dates requises)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ArrowUpDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">

                    {/* Sidebar */}
                    <aside className="hidden lg:block lg:col-span-3 xl:col-span-1">
                        <div className="sticky top-32 lg:top-28">
                            <HotelsFiltering
                                onFilterChange={handleFilterChange}
                                initialFilters={filters}
                                showPriceFilter={!!pricingData}
                            />
                        </div>
                    </aside>

                    {/* Hotels list */}
                    <main className="lg:col-span-9 xl:col-span-3">

                        {isErrorAll && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center border border-gray-100">
                                <AlertCircle size={48} className="sm:w-16 sm:h-16 mx-auto text-red-500 mb-3 sm:mb-4"/>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-2 sm:mb-3">Erreur de chargement</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    {errorAll?.message ?? 'Impossible de charger les hôtels. Veuillez réessayer.'}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm sm:text-base font-bold rounded-xl transition-all shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-200"
                                >
                                    Réessayer
                                </button>
                            </div>
                        )}

                        {!isLoadingAll && !isErrorAll && sortedHotels.length === 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center border border-gray-100">
                                <Search size={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4"/>
                                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-2 sm:mb-3">Aucun hôtel trouvé</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                                    Essayez de modifier vos filtres ou critères de recherche.
                                </p>
                                <button
                                    onClick={() => setFilters({})}
                                    className="px-5 sm:px-6 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-bold rounded-xl transition-all shadow-lg active:scale-95 focus:outline-none focus:ring-4 focus:ring-orange-200"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        )}

                        {!isLoadingAll && !isErrorAll && displayedHotels.length > 0 && (
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                {hotelCards}
                            </div>
                        )}

                        {hasNextPage && (
                            <div ref={loadMoreRef} className="mt-6 sm:mt-8">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex justify-center p-4">
                                    <button
                                        onClick={loadMore}
                                        className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                    >
                                        <ChevronDown size={20} className="sm:w-5 sm:h-5"/>
                                        Charger plus d'hôtels
                                    </button>
                                </div>
                            </div>
                        )}

                        {!hasNextPage && displayedHotels.length > 0 && (
                            <div className="text-center py-6 sm:py-8 mt-4 sm:mt-6">
                                <div className="inline-flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm max-w-full mx-2">
                                    <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-green-600"/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-gray-800 font-extrabold text-sm sm:text-base">Tous les hôtels affichés !</p>
                                        <p className="text-gray-600 text-xs sm:text-sm font-medium">
                                            Vous avez vu les {sortedHotels.length} hôtel{sortedHotels.length > 1 ? 's' : ''} disponible{sortedHotels.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {showFilters && (
                <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
                    <div className="bg-white rounded-t-3xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-5 flex items-center justify-between z-10 shadow-sm">
                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                                <Filter size={22} className="text-sky-600"/>
                                Filtres
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-200">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto filter-scroll p-4 sm:p-5">
                            <HotelsFiltering
                                onFilterChange={(f) => { handleFilterChange(f); setShowFilters(false); }}
                                initialFilters={filters}
                                showPriceFilter={!!pricingData}
                            />
                        </div>
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-5 flex gap-3 shadow-lg">
                            <button
                                onClick={() => { setFilters({}); setShowFilters(false); }}
                                className="flex-1 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-200"
                            >Réinitialiser</button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-4 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-200"
                            >Appliquer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing loading overlay */}
            {isLoadingPricing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4">
                        <Loader
                            message="Recherche des prix et disponibilités..."
                            submessage={`Pour ${sortedHotels.length} hôtels sur ${nights} nuit${nights > 1 ? 's' : ''}`}
                            size="medium"
                            fullHeight={false}
                        />
                    </div>
                </div>
            )}

            {/* DayPicker custom styles */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-day-picker { --rdp-accent-color: #0284c7; --rdp-background-color: #e0f2fe; font-family: inherit; }
                .custom-day-picker .rdp-month { margin: 0; }
                .custom-day-picker .rdp-nav { display: none !important; }
                .custom-day-picker .rdp-caption { display: flex; justify-content: center; padding: 0.5rem 1rem !important; font-weight: 800; font-size: 1rem; color: #1f2937; }
                .custom-day-picker .rdp-head_cell { font-weight: 700; font-size: 0.875rem; color: #6b7280; text-transform: uppercase; padding: 0.5rem; }
                .custom-day-picker .rdp-day { width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; font-weight: 700; transition: all 0.2s; cursor: pointer; border: 2px solid transparent; }
                .custom-day-picker .rdp-day:hover:not(:disabled):not(.rdp-day_selected) { background: #e0f2fe; color: #0284c7; border-color: #bae6fd; }
                .custom-day-picker .rdp-day_selected { background: #0284c7; color: white; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2); }
                .custom-day-picker .rdp-day_selected:hover { background: #0369a1; }
                .custom-day-picker .rdp-day_range_middle { background: #e0f2fe; color: #0284c7; border-radius: 0; border: none; box-shadow: none; }
                .custom-day-picker .rdp-day_disabled { opacity: 0.3; cursor: not-allowed; }
                .custom-day-picker .rdp-day_today:not(.rdp-day_selected) { font-weight: 800; color: #0ea5e9; background: #f0f9ff; border-color: #e0f2fe; }
                .custom-day-picker .rdp-months { margin: 0 auto; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                @media (max-width: 1024px) { .custom-day-picker .rdp-months { flex-direction: column; } }
            `}}/>
        </div>
    );
}

export default HotelsPerCityPage;
