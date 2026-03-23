// src/components/HotelsPopup.jsx
import {useRef, useState} from "react";
import {Link} from "react-router-dom";

/**
 * HotelsPopup Component - Receives enriched data from parent
 * ✅ City clicks route to HotelsPerCityPage (/hotels/:cityId)
 *    which owns its own date/room state with sensible defaults.
 */
const HotelsPopup = ({
                         onClose,
                         isVisible,
                         enrichedCountries = [],
                         citiesLoading     = false,
                         citiesError       = false,
                         className         = "",
                         style             = {}
                     }) => {
    const popupRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);

    const totalCities = enrichedCountries.reduce(
        (acc, country) => acc + (country.citiesData?.length || 0),
        0
    );

    const activeCountry = enrichedCountries[activeTab] || {};

    return (
        <div
            ref={popupRef}
            className={`absolute left-0 mt-0.5 bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 ease-out backdrop-blur-sm ${
                isVisible
                    ? "opacity-100 visible translate-y-0 scale-100"
                    : "opacity-0 invisible -translate-y-4 scale-95 pointer-events-none"
            } ${className}`}
            onMouseLeave={onClose}
            style={{
                minWidth: "min(680px, 95vw)",
                maxWidth: "95vw",
                maxHeight: "85vh",
                zIndex: 50,
                ...style
            }}
        >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-sky-100 via-sky-50 to-sky-100 rounded-t-2xl border-b border-gray-100 p-3 sm:p-5 pb-2 sm:pb-3 z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                        <h2 className="text-base sm:text-xl font-bold text-sky-800 flex items-center gap-1.5 sm:gap-2">
                            <span className="text-xl sm:text-2xl">🏨</span>
                            <span className="leading-tight">Choisir votre destination</span>
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-600 font-mono mt-0.5 sm:mt-1">
                            {citiesLoading ? (
                                <span className="animate-pulse">Chargement...</span>
                            ) : (
                                <span>{totalCities} destinations disponibles</span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        aria-label="Close"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div role="tablist" aria-label="Country selection" className="flex gap-2 sm:gap-3">
                    {enrichedCountries.map((country, index) => (
                        <button
                            key={country.name}
                            role="tab"
                            aria-selected={activeTab === index}
                            aria-controls={`tabpanel-${index}`}
                            id={`tab-${index}`}
                            onClick={() => setActiveTab(index)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base lg:text-xl transition-all duration-300 ${
                                activeTab === index
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]"
                                    : "bg-white text-sky-700 hover:bg-gray-100 hover:text-sky-800 border border-slate-300"
                            }`}
                            style={{touchAction: 'manipulation'}}
                        >
                            <span className="text-xl">{country.icon}</span>
                            <span className="font-bold">{country.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                activeTab === index
                                    ? "bg-sky-700/40 text-white"
                                    : "bg-gray-200 text-gray-600"
                            }`}>
                                {country.citiesData?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Panel - Cities Content */}
            <div
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className="overflow-y-auto p-3 sm:p-5 pt-4 sm:pt-5"
                style={{maxHeight: "calc(85vh - 160px)"}}
            >
                {/* Loading State */}
                {citiesLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto mb-4"/>
                            <p className="text-gray-600 font-semibold">Chargement des destinations...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {citiesError && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <p className="text-gray-800 font-bold mb-2">Erreur de chargement</p>
                            <p className="text-gray-600 text-sm">Impossible de charger les destinations</p>
                        </div>
                    </div>
                )}

                {/* Cities Content */}
                {!citiesLoading && !citiesError && (
                    <div className="hotels-fade-in">

                        {/* Country Header */}
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-gradient">
                            <div className="perspective-normal">
                                <img
                                    src={activeCountry.flag_url}
                                    alt={activeCountry.name}
                                    loading="lazy"
                                    className="size-12 rounded-lg shadow-2xl transform-3d hover:rotate-x-12 hover:rotate-y-12 hover:scale-110 transition-all duration-300 ease-out object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl sm:text-2xl font-bold text-sky-800 flex items-center gap-2">
                                    {activeCountry.name}
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5 font-mono">
                                    Sélectionnez votre ville préférée
                                </p>
                            </div>
                        </div>

                        {/* Cities Grid */}
                        {activeCountry.citiesData && activeCountry.citiesData.length > 0 ? (
                            <div className="hotels-grid gap-2 sm:gap-3">
                                {activeCountry.citiesData.map((city, cityIndex) => (
                                    <Link
                                        key={city.Id}
                                        to={`/hotels/${city.Id}`}
                                        onClick={onClose}
                                        className="group/btn relative px-3 sm:px-4 py-3 sm:py-3.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left overflow-hidden block"
                                        style={{
                                            animationDelay: `${cityIndex * 30}ms`,
                                            touchAction: 'manipulation'
                                        }}
                                    >
                                        <div className="relative flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                                <svg
                                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover/btn:text-white transition-colors flex-shrink-0"
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                                <span className="truncate font-semibold">{city.Name}</span>
                                            </span>
                                            <svg
                                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all flex-shrink-0"
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M9 5l7 7-7 7"/>
                                            </svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none"
                                     stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <p className="text-gray-600 font-semibold">Aucune ville disponible</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-br from-gray-50 to-white rounded-b-2xl border-t border-gray-100 px-3 sm:px-5 py-2 sm:py-3">
                <p className="text-xs font-mono text-gray-500 text-center">
                    {!citiesLoading && !citiesError && (
                        <>
                            <span className="font-semibold text-orange-600">
                                {activeCountry.citiesData?.length || 0} villes
                            </span>{" "}
                            disponibles en {activeCountry.name}
                        </>
                    )}
                </p>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes hotels-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                .hotels-fade-in { animation: hotels-fade-in 0.3s ease-out forwards; }
                .hotels-grid {
                    display: grid;
                    grid-template-columns: repeat(1, minmax(0, 1fr));
                }
                @media (min-width: 375px) { .hotels-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (min-width: 640px) { .hotels-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (min-width: 768px) { .hotels-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
                .border-gradient { border-image: linear-gradient(to right, #fb923c, #f97316, transparent) 1; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}}/>
        </div>
    );
};

export default HotelsPopup;