// src/components/BookingHotels.jsx
import { useState, useTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import Button from "../../ui/Button.jsx";
import LocationSearch from './LocationSearch';
import DateRangePicker from './DateRangePicker';
import GuestRoomSelector from './GuestRoomSelector';
import { formatDateForAPI, calculateNights } from '../../utils/dateHelpers';
import apiClient from "../../services/apiClient.js";

const DEFAULT_CITY_ID = 34; // Sousse

const getDefaultRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 1);

    return { from: tomorrow, to: afterTomorrow };

};

function BookingHotels() {
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectionType, setSelectionType] = useState('city');
    const [range, setRange] = useState(getDefaultRange);
    const [rooms, setRooms] = useState([{ id: 1, adults: 2, children: [] }]);

    const defaultCityAppliedRef = useRef(false);

    const { data: citiesData } = useQuery({
        queryKey: ['cities'],
        queryFn: () => apiClient.listCity(),
        staleTime: 10 * 60 * 1000,
    });

    const defaultCity = useMemo(() => {
        if (!Array.isArray(citiesData)) return null;
        return citiesData.find(c => c?.Id === DEFAULT_CITY_ID) ?? null;
    }, [citiesData]);

    useEffect(() => {
        if (!defaultCity) return;
        if (defaultCityAppliedRef.current) return;
        defaultCityAppliedRef.current = true;
        setTimeout(() => {
            setSelectedCity(defaultCity);
        }, 0);
        setTimeout(() => {
            setSelectedHotel(null);
        }, 0);
        setTimeout(() => {
            setSelectionType('city');
        }, 0);
    }, [defaultCity]);

    const handleCitySelect = useCallback((city) => {
        setSelectedCity(city);
        setSelectedHotel(null);
        setSelectionType('city');
    }, []);

    const handleHotelSelect = useCallback((hotel) => {
        setSelectedHotel(hotel);
        setSelectedCity(null); // ✅ FIX: don't set selectedCity on hotel selection —
        // it pollutes selectionLabel in LocationSearch which
        // checks selectedCity first, causing the city name to
        // be shown instead of the hotel name (hotel selection
        // appears ignored). Hotel city info is read directly
        // from selectedHotel.City inside handleSearch.
        setSelectionType('hotel');
    }, []);

    const handleClearLocation = useCallback(() => {
        setSelectedCity(null);
        setSelectedHotel(null);
        setSelectionType(null);
    }, []);

    const validateSearch = useCallback(() => {
        if (!selectedCity && !selectedHotel) {
            toast.error("Veuillez sélectionner une ville ou un hôtel", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (!range.from || !range.to) {
            toast.error("Veuillez sélectionner les dates de séjour", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (range.from >= range.to) {
            toast.error("La date de départ doit être après la date d'arrivée", { duration: 4000, position: 'top-center' });
            return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (range.from < today) {
            toast.error("La date d'arrivée ne peut pas être dans le passé", { duration: 4000, position: 'top-center' });
            return false;
        }
        if (rooms.length === 0) {
            toast.error("Veuillez configurer au moins une chambre", { duration: 4000, position: 'top-center' });
            return false;
        }
        return true;
    }, [selectedCity, selectedHotel, range, rooms.length]);

    const handleSearch = useCallback(() => {
        if (!validateSearch()) return;

        const checkInFormatted = formatDateForAPI(range.from);
        const checkOutFormatted = formatDateForAPI(range.to);
        const nights = calculateNights(range.from, range.to);

        const searchParams = new URLSearchParams();
        searchParams.append('selectionType', selectionType);

        if (selectionType === 'city') {
            searchParams.append('cityId', String(Number(selectedCity.Id)));
            searchParams.append('cityName', selectedCity.Name);
            if (selectedCity.Country?.Name) {
                searchParams.append('countryName', selectedCity.Country.Name);
                // ✅ MODIFIER: Append countryCode for market-identity logic
                const code = selectedCity.Country.Name.toLowerCase().includes('tunisie') ? 'TN' : 'DZ';
                searchParams.append('countryCode', code);
            }
        } else if (selectionType === 'hotel') {
            searchParams.append('hotelId', String(Number(selectedHotel.Id)));
            searchParams.append('hotelName', selectedHotel.Name);
            // ✅ city info is read from selectedHotel.City (selectedCity is null by design)
            if (selectedHotel.City?.Id) searchParams.append('cityId', String(Number(selectedHotel.City.Id)));
            if (selectedHotel.City?.Name) searchParams.append('cityName', selectedHotel.City.Name);
            if (selectedHotel.City?.Country?.Name) {
                searchParams.append('countryName', selectedHotel.City.Country.Name);
                // ✅ MODIFIER: Append countryCode for market-identity logic
                const code = selectedHotel.City.Country.Name.toLowerCase().includes('tunisie') ? 'TN' : 'DZ';
                searchParams.append('countryCode', code);
            }
        }

        searchParams.append('checkIn', checkInFormatted);
        searchParams.append('checkOut', checkOutFormatted);

        const roomsData = rooms.map(room => ({
            adults: room.adults,
            children: room.children.map(child => child.age),
        }));

        searchParams.append('rooms', JSON.stringify(roomsData));
        searchParams.append('nights', nights);

        if (import.meta.env.DEV) {
            console.log('🔍 Search Params:', {
                selectionType,
                cityId: selectedCity?.Id ?? selectedHotel?.City?.Id,
                hotelId: selectedHotel?.Id,
                checkIn: checkInFormatted,
                checkOut: checkOutFormatted,
                rooms: roomsData,
                nights,
            });
        }

        toast.loading("Recherche en cours...", { id: 'search-loading', duration: 2000 });

        startTransition(() => {
            navigate(`/search?${searchParams.toString()}`);
        });
    }, [validateSearch, range, selectionType, selectedCity, selectedHotel, rooms, navigate]);

    return (
        <div className="relative w-full max-w-7xl mx-auto -mt-16 z-10 px-4 py-8">

            {/* Decorative glow orbs */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-10 right-10 h-56 w-56 rounded-full bg-slate-400/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-4 left-4 h-40 w-40 rounded-full bg-slate-500/10 blur-3xl" />

            {/* Box volume wrapper — depth layers render first (behind) */}
            <div className="relative">

                {/* Box depth: far layer */}
                <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-slate-700/45 translate-x-3 translate-y-4" />
                {/* Box depth: near edge layer */}
                <div aria-hidden="true" className="absolute inset-0 rounded-2xl bg-slate-500/55 translate-x-1.5 translate-y-2" />

                {/* Gradient border wrapper — padding becomes the border */}
                <div className="relative p-0.5 rounded-2xl bg-[linear-gradient(to_right,#f97316,#2dd4bf,#0ea5e9,#f97316)] shadow-xl shadow-sky-900/20 transition-all duration-300 hover:-translate-y-1">

                    {/* Corner geometric accents */}
                    <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full bg-linear-to-br from-orange-400/70 to-amber-500/35" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-5 -left-5 h-20 w-20 rounded-full bg-linear-to-tr from-amber-400/65 to-orange-400/30" />

                    {/* White card face */}
                    <div className="relative rounded-[14px] bg-white">
                        {/* Inner content with sky gradient wash */}
                        <div className="bg-linear-to-br from-sky-50/70 via-white to-slate-50/60 rounded-[14px] p-4 md:p-6">
                            <div className="flex flex-wrap gap-3 items-center">

                                <div className="flex-1 min-w-55">
                                    <div className="rounded-xl border border-sky-100 bg-white shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md">
                                        <LocationSearch
                                            selectedCity={selectedCity}
                                            selectedHotel={selectedHotel}
                                            onCitySelect={handleCitySelect}
                                            onHotelSelect={handleHotelSelect}
                                            onClear={handleClearLocation}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-65">
                                    <div className="rounded-xl border border-sky-100 bg-white shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md">
                                        <DateRangePicker range={range} setRange={setRange} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-55">
                                    <div className="rounded-xl border border-sky-100 bg-white shadow-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md">
                                        <GuestRoomSelector rooms={rooms} setRooms={setRooms} />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSearch}
                                    disabled={isPending}
                                    variant="primary"
                                    className="w-full lg:w-auto rounded-xl font-bold hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <span className="flex justify-center items-center gap-2 px-4">
                                        {isPending
                                            ? <Loader2 size={20} className="animate-spin" />
                                            : <Search size={20} />
                                        }
                                        {isPending ? 'Recherche...' : 'Rechercher'}
                                    </span>
                                </Button>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookingHotels;