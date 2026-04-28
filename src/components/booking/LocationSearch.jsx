// src/components/booking/LocationSearch.jsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// ✅ useLayoutEffect removed — it was the root cause of the space bug
import { MapPin, X, Hotel, Globe, ChevronRight, AlertCircle } from 'lucide-react';
import { useCities, useHotels } from '../../custom-hooks/useHotelQueries';
import useDebounce from '../../custom-hooks/useDebounce';

function LocationSearch({
    selectedCity,
    selectedHotel,
    onCitySelect,
    onHotelSelect,
    onClear,
}) {
    const [inputValue, setInputValue] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    // ✅ isEditing state REMOVED — no longer needed

    const cityDropdownRef = useRef(null);
    const locationInputRef = useRef(null);
    // Tracks previous selection to detect EXTERNAL changes (e.g. default city)
    const prevSelectionRef = useRef({ city: null, hotel: null });

    const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
    const { data: hotels, isLoading: hotelsLoading, error: hotelsError } = useHotels();

    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log('Cities:', cities);
            console.log('Hotels:', hotels);
        }
    }, [cities, hotels]);

    // ── Label helper ───────────────────────────────────────────────────────────
    // ✅ selectedHotel checked first — prevents city name overriding hotel name
    const computeLabel = useCallback((city, hotel) => {
        if (hotel) {
            const name = hotel.Name || '';
            const cityName = hotel.City?.Name || '';
            return `${name}${cityName ? `, ${cityName}` : ''}`;
        }
        if (city) {
            const name = city.Name || '';
            const countryName = city.Country?.Name || '';
            return `${name}${countryName ? `, ${countryName}` : ''}`;
        }
        return '';
    }, []);

    // ── External selection sync ────────────────────────────────────────────────
    // ✅ useEffect (NOT useLayoutEffect) — fires AFTER paint, never mid-keystroke.
    // Only syncs when the PARENT changes selectedCity/selectedHotel from outside
    // (e.g. the default Sousse applied on mount in BookingHotels).
    // When the user types, onClear() sets selectedCity=null → label="" → the
    // `if (label)` guard prevents wiping the user's typed text.
    useEffect(() => {
        const prev = prevSelectionRef.current;
        if (prev.city === selectedCity && prev.hotel === selectedHotel) return;
        prevSelectionRef.current = { city: selectedCity, hotel: selectedHotel };

        const label = computeLabel(selectedCity, selectedHotel);
        if (label) setInputValue(label);
        // ← intentionally NOT resetting to '' on clear: handleLocationChange
        //   already set inputValue to the typed character at that point.
    }, [selectedCity, selectedHotel, computeLabel]);

    // ── Search filtering ───────────────────────────────────────────────────────
    const debouncedSearch = useDebounce(inputValue, 300);

    const { combinedResults, citiesCount, hotelsCount } = useMemo(() => {
        const results = [];

        // ✅ treat whitespace-only input as empty → show default city list
        if (!debouncedSearch || !debouncedSearch.trim()) {
            const citySlice = (cities || []).slice(0, 8);
            citySlice.forEach(city => results.push({ type: 'city', data: city }));
            return { combinedResults: results, citiesCount: citySlice.length, hotelsCount: 0 };
        }

        // ✅ .trim() removes trailing spaces before matching so "el " matches "el mouradi"
        const searchLower = debouncedSearch
            .trim()
            .toLowerCase()
            .replace(/\s{2,}/g, ' ');

        const filteredCities = (cities || [])
            .filter(city => {
                const cityName = city.Name?.toLowerCase() || '';
                const countryName = city.Country?.Name?.toLowerCase() || '';
                const regionName = city.Region?.toLowerCase() || '';
                return (
                    cityName.includes(searchLower) ||
                    countryName.includes(searchLower) ||
                    regionName.includes(searchLower)
                );
            })
            .slice(0, 5);

        filteredCities.forEach(city => results.push({ type: 'city', data: city }));

        const filteredHotels = (hotels || [])
            .filter(hotel => {
                const hotelName = hotel.Name?.toLowerCase() || '';
                const cityName = hotel.City?.Name?.toLowerCase() || '';
                const countryName = hotel.City?.Country?.Name?.toLowerCase() || '';
                return (
                    hotelName.includes(searchLower) ||
                    cityName.includes(searchLower) ||
                    countryName.includes(searchLower)
                );
            })
            .slice(0, 5);

        filteredHotels.forEach(hotel => results.push({ type: 'hotel', data: hotel }));

        return {
            combinedResults: results,
            citiesCount: filteredCities.length,
            hotelsCount: filteredHotels.length,
        };
    }, [cities, hotels, debouncedSearch]);

    // ── Click outside ──────────────────────────────────────────────────────────
    useEffect(() => {
        function handleClickOutside(event) {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
                // Restore label on dismiss (if a selection exists), otherwise clear
                const label = computeLabel(selectedCity, selectedHotel);
                setInputValue(label);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedCity, selectedHotel, computeLabel]);

    // Auto-scroll highlighted dropdown item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && cityDropdownRef.current) {
            cityDropdownRef.current
                .querySelector(`[data-index="${highlightedIndex}"]`)
                ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [highlightedIndex]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleLocationChange = useCallback((e) => {
        const next = e.target.value;
        // Clear parent selection first, then set input — no useLayoutEffect to fight
        if (selectedCity || selectedHotel) onClear();
        setInputValue(next);           // ✅ space, any char, always lands here safely
        setShowCityDropdown(true);
        setHighlightedIndex(-1);
    }, [onClear, selectedCity, selectedHotel]);

    const handleCitySelect = useCallback((city) => {
        // ✅ Set inputValue DIRECTLY — no useLayoutEffect dependency
        setInputValue(computeLabel(null, null) || computeLabel(city, null));
        setInputValue(`${city.Name || ''}${city.Country?.Name ? `, ${city.Country.Name}` : ''}`);
        onCitySelect(city);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    }, [onCitySelect, computeLabel]);

    const handleHotelSelect = useCallback((hotel) => {
        // ✅ Set inputValue DIRECTLY — no useLayoutEffect dependency
        setInputValue(`${hotel.Name || ''}${hotel.City?.Name ? `, ${hotel.City.Name}` : ''}`);
        onHotelSelect(hotel);
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
    }, [onHotelSelect]);

    const handleClearLocation = useCallback(() => {
        setInputValue('');             // ✅ explicit clear
        onClear();
        setShowCityDropdown(false);
        setHighlightedIndex(-1);
        locationInputRef.current?.focus();
    }, [onClear]);

    const handleLocationKeyDown = useCallback((e) => {
        if (!showCityDropdown || combinedResults.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < combinedResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < combinedResults.length) {
                    const selected = combinedResults[highlightedIndex];
                    if (selected.type === 'city') handleCitySelect(selected.data);
                    else handleHotelSelect(selected.data);
                }
                break;
            case 'Escape':
                setShowCityDropdown(false);
                setHighlightedIndex(-1);
                setInputValue(computeLabel(selectedCity, selectedHotel));
                break;
            default:
                break;
        }
    }, [
        showCityDropdown, combinedResults, highlightedIndex,
        handleCitySelect, handleHotelSelect,
        selectedCity, selectedHotel, computeLabel,
    ]);

    const isLoadingAny = citiesLoading || hotelsLoading;
    const hasError = citiesError || hotelsError;
    const hasSelection = !!(selectedCity || selectedHotel);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div ref={cityDropdownRef} className="relative w-full">

            {/* Input */}
            <div className={`
        flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 bg-white transition-all
        ${showCityDropdown
                    ? 'border-sky-500 ring-2 ring-sky-200'
                    : 'border-gray-200 hover:border-sky-300'}
      `}>
                <MapPin size={18} className="text-sky-500 flex-shrink-0" />

                <input
                    ref={locationInputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleLocationChange}
                    onFocus={() => setShowCityDropdown(true)}
                    onKeyDown={handleLocationKeyDown}
                    placeholder="Ville ou hôtel..."
                    className="flex-1 min-w-0 text-sm font-medium text-gray-800 placeholder:text-gray-400 bg-transparent outline-none"
                />

                {hasSelection && (
                    <button
                        type="button"
                        onClick={handleClearLocation}
                        className="flex-shrink-0 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Effacer la sélection"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showCityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-80 flex flex-col">

                    {/* Loading */}
                    {isLoadingAny && (
                        <div className="flex items-center justify-center gap-2 py-6 text-gray-400 text-sm">
                            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                            <span>Recherche...</span>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoadingAny && hasError && (
                        <div className="flex flex-col items-center gap-1 py-6 px-4 text-center">
                            <AlertCircle size={22} className="text-red-400" />
                            <p className="text-sm font-semibold text-gray-700">Erreur de chargement</p>
                            <p className="text-xs text-gray-400">Impossible de charger les données</p>
                        </div>
                    )}

                    {/* No results */}
                    {!isLoadingAny && !hasError && combinedResults.length === 0 && (
                        <div className="flex flex-col items-center gap-1 py-6 px-4 text-center">
                            <MapPin size={22} className="text-gray-300" />
                            <p className="text-sm font-semibold text-gray-600">Aucun résultat trouvé</p>
                            <p className="text-xs text-gray-400">Essayez avec un autre nom</p>
                        </div>
                    )}

                    {/* Results list */}
                    {!isLoadingAny && !hasError && combinedResults.length > 0 && (
                        <ul className="overflow-y-auto flex-1">
                            {combinedResults.map((item, index) => {
                                const isHighlighted = index === highlightedIndex;

                                if (item.type === 'city') {
                                    const city = item.data;
                                    const cityName = city.Name || '';
                                    const countryName = city.Country?.Name || '';
                                    return (
                                        <li
                                            key={`city-${city.Id ?? index}`}
                                            data-index={index}
                                            onMouseDown={() => handleCitySelect(city)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${isHighlighted ? 'bg-sky-50' : 'hover:bg-gray-50'}
                      `}
                                        >
                                            <div className="flex-shrink-0 p-1.5 bg-sky-100 rounded-lg">
                                                <Globe size={16} className="text-sky-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{cityName}</p>
                                                {countryName && (
                                                    <p className="text-xs text-gray-400 truncate">{countryName}</p>
                                                )}
                                            </div>
                                            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                                        </li>
                                    );
                                }

                                if (item.type === 'hotel') {
                                    const hotel = item.data;
                                    const hotelName = hotel.Name || '';
                                    const cityName = hotel.City?.Name || '';
                                    return (
                                        <li
                                            key={`hotel-${hotel.Id ?? index}`}
                                            data-index={index}
                                            onMouseDown={() => handleHotelSelect(hotel)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${isHighlighted ? 'bg-orange-50' : 'hover:bg-gray-50'}
                      `}
                                        >
                                            <div className="flex-shrink-0 p-1.5 bg-orange-100 rounded-lg">
                                                <Hotel size={16} className="text-orange-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{hotelName}</p>
                                                {cityName && (
                                                    <p className="text-xs text-gray-400 truncate">{cityName}</p>
                                                )}
                                            </div>
                                            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                                        </li>
                                    );
                                }

                                return null;
                            })}
                        </ul>
                    )}

                    {/* Footer count */}
                    {!isLoadingAny && !hasError && combinedResults.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <p className="text-xs text-gray-400 text-center">
                                {citiesCount} {citiesCount === 1 ? 'ville' : 'villes'}
                                {' · '}
                                {hotelsCount} {hotelsCount === 1 ? 'hôtel' : 'hôtels'}
                            </p>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

export default LocationSearch;