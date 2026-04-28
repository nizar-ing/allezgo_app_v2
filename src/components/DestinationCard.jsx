// src/components/DestinationCard.jsx
import { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import {
    Calendar,
    MapPin,
    Moon,
    Star,
    Hotel,
    Map as MapIcon,
    Navigation,
    Sparkles,
    ArrowBigRight
} from 'lucide-react';

const formatPrice = (price) =>
    new Intl.NumberFormat('fr-DZ').format(price);

function DestinationCard({
                             id,
                             name = "Destination",
                             image_url,
                             mainCities = [],
                             duration = {},
                             highlights = [],
                             departureDates = [],
                             pricing = null,
                             accommodations = [], // Changed from accommodation to match API
                             keyAttractions = [],
                             itineraries = []     // Changed from itinerary to match API
                         }) {
    const [isFlipped, setIsFlipped] = useState(false);

    const lowestPrice = useMemo(() => {
        if (!pricing) return null;
        if (pricing.double) {
            return Math.min(
                pricing.double ?? Infinity,
                pricing.triple ?? Infinity
            );
        }
        if (pricing.hotel3Star) return pricing.hotel3Star.double;
        if (pricing.hotel4Star) return pricing.hotel4Star.double;
        return null;
    }, [pricing]);

    const priceDisplay = useMemo(() => {
        if (!pricing?.double) return null;
        return (
            <div className="space-y-1.5">
                {[
                    { label: 'Double', value: pricing.double },
                    { label: 'Triple', value: pricing.triple },
                    { label: 'Single', value: pricing.single },
                ].map(({ label, value }) => (
                    <div
                        key={label}
                        className="flex justify-between items-center text-xs sm:text-sm bg-gray-50 rounded-lg px-2 sm:px-3 py-1.5"
                    >
                        <span className="text-gray-600 font-medium">{label}:</span>
                        <span className="font-bold text-gray-800">{formatPrice(value)} DA</span>
                    </div>
                ))}
            </div>
        );
    }, [pricing]);

    return (
        <div
            className="relative w-full min-w-[300px] sm:min-w-[340px] md:min-w-[420px] max-w-md h-[580px] md:h-[640px] cursor-pointer mx-auto"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onClick={() => setIsFlipped(prev => !prev)}
        >
            <div
                className="relative w-full h-full transition-transform duration-700"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* FRONT SIDE */}
                <div
                    className="absolute w-full h-full rounded-2xl overflow-hidden bg-white
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)]
                        hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4),0_15px_40px_-10px_rgba(0,0,0,0.25)]
                        transition-shadow duration-300"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Image */}
                    <div className="relative h-44 sm:h-48 md:h-52 overflow-hidden">
                        <img
                            src={image_url || '/placeholder-image.jpg'}
                            alt={name}
                            loading="lazy"
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">{name}</h3>
                            <div className="flex items-center gap-2 text-white/95">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">{mainCities?.join(', ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-3.5">
                        {/* Duration */}
                        <div className="flex items-center gap-2 sm:gap-3 text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2 sm:p-2.5 shadow-sm">
                            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            <span className="font-semibold text-xs sm:text-sm">
                                {duration?.nights || 0} Nuits / {duration?.days || 0} Jours
                            </span>
                        </div>

                        {/* Highlights */}
                        {highlights?.length > 0 && (
                            <div className="space-y-1 sm:space-y-1.5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Points Forts</h4>
                                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                    {highlights?.slice(0, 3).map((highlight, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold
                                                bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500
                                                text-white shadow-md hover:shadow-lg transition-shadow"
                                        >
                                            <Star className="w-3 h-3 mr-1 fill-white" />
                                            {highlight?.length > 24 ? highlight.substring(0, 24) + '...' : highlight}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Departure Dates */}
                        {departureDates?.length > 0 && (
                            <div className="space-y-1 sm:space-y-1.5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Prochains Départs
                                </h4>
                                <div className="text-sm text-gray-700 space-y-1">
                                    {departureDates?.slice(0, 2).map((date, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg px-2 sm:px-2.5 py-1.5 shadow-sm"
                                        >
                                            <span className="font-medium text-xs sm:text-sm">{date?.outbound}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="flex flex-col justify-between border-t-2 border-gray-100 pt-2 sm:pt-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tarifs</h4>
                            {priceDisplay}
                            {lowestPrice && (
                                <div className="mt-2 sm:mt-3 p-1 sm:p-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-xl shadow-xl">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
                                            <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                                                MEILLEUR PRIX
                                            </span>
                                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
                                        </div>
                                        <div className="text-xs sm:text-sm text-white/90 mb-0.5 font-medium">À partir de</div>
                                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                                            {formatPrice(lowestPrice)} <span className="text-lg sm:text-xl font-bold">DA</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div
                    className="absolute w-full h-full rounded-2xl overflow-hidden text-white
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)]
                        hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4),0_15px_40px_-10px_rgba(0,0,0,0.25)]
                        transition-shadow duration-300"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(to bottom right, #991b1b, #b91c1c 55%, #ea580c)',
                    }}
                >
                    <div className="p-4 sm:p-5 md:p-6 h-full overflow-y-auto space-y-3 sm:space-y-4">
                        <h3 className="text-xl sm:text-2xl font-bold border-b-2 border-white/30 pb-2 sm:pb-3">
                            {name}
                        </h3>

                        {/* Accommodation */}
                        {accommodations?.length > 0 && (
                            <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <Hotel className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Hébergement
                                </h4>
                                <div className="space-y-1.5 sm:space-y-2">
                                    {accommodations?.map((hotel, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/15 rounded-xl p-2 sm:p-3 backdrop-blur-sm shadow-md hover:bg-white/20 transition-colors"
                                        >
                                            <div className="font-semibold text-sm sm:text-base">{hotel?.hotel}</div>
                                            <div className="text-[10px] sm:text-xs text-white/90 flex items-center gap-1.5 sm:gap-2 mt-1">
                                                <span className="flex items-center">
                                                    {[...Array(hotel?.stars || 0)].map((_, i) => (
                                                        <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </span>
                                                {hotel?.location && <span>• {hotel.location}</span>}
                                                {hotel?.nights && <span>• {hotel.nights} nuits</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Attractions */}
                        {keyAttractions?.length > 0 && (
                            <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <MapIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Attractions Principales
                                </h4>
                                <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                                    {keyAttractions?.slice(0, 5).map((attraction, index) => (
                                        <div key={index} className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                            <span className="text-yellow-400 mt-0.5 font-bold">✦</span>
                                            <span className="text-white/95 font-medium">{attraction}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Itinerary Preview */}
                        {itineraries?.length > 0 && (
                            <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <Navigation className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Programme ({itineraries?.length || 0} jours)
                                </h4>
                                <div className="space-y-1 sm:space-y-1.5 max-h-28 sm:max-h-32 overflow-y-auto">
                                    {itineraries?.slice(0, 4).map((day, index) => (
                                        <div key={index} className="text-[10px] sm:text-xs text-white/90 flex gap-1.5 sm:gap-2">
                                            <span className="font-bold text-yellow-400">J{day?.day}</span>
                                            <span className="font-medium">{day?.title}</span>
                                        </div>
                                    ))}
                                    {itineraries?.length > 4 && (
                                        <div className="text-[10px] sm:text-xs text-white/70 italic">
                                            + {itineraries.length - 4} autres jours...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="pt-3 sm:pt-4">
                            <Link
                                to={`/voyages-organises/${id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full inline-flex justify-center items-center gap-3 text-white font-bold
                                    py-2.5 sm:py-3.5 px-4 sm:px-6 text-sm sm:text-base rounded-lg
                                    transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] duration-200"
                                style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                Voir les Détails
                                <ArrowBigRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DestinationCard;