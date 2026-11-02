import { useState, useMemo } from 'react';
import { Link } from "react-router-dom";
import {
    Calendar, MapPin, Moon, Star, Hotel,
    Map as MapIcon, Navigation, Sparkles, ArrowBigRight,
} from 'lucide-react';
import { resolveMediaUrl } from '../utils/resolveMediaUrl.js';

const formatPrice = (price, currency = 'DZD') =>
    `${new Intl.NumberFormat('fr-DZ').format(price)} ${currency}`;

function DestinationCard({
    id,
    name = "Destination",
    image_url,
    mainCities = [],
    duration = {},
    highlights = [],
    departureDates = [],
    pricing = null,
    accommodations = [],
    keyAttractions = [],
    itineraries = [],
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    const currency = pricing?.currency || 'DZD';

    const lowestPrice = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const perHotel = accommodations.flatMap((acc) =>
            (acc.prices ?? []).map((p) => {
                const promoOn = p.promoPrice != null &&
                    (!p.promoStartsAt || p.promoStartsAt <= today) &&
                    (!p.promoEndsAt || p.promoEndsAt >= today);
                return promoOn ? Number(p.promoPrice) : Number(p.pricePerAdult);
            })
        ).filter((v) => v > 0);
        if (perHotel.length) return Math.min(...perHotel);
        // fall back to trip-level pricing (legacy / trips without per-hotel prices)
        if (!pricing) return null;
        const candidates = [pricing.double, pricing.triple, pricing.single]
            .filter((v) => typeof v === 'number' && v > 0);
        return candidates.length ? Math.min(...candidates) : null;
    }, [pricing, accommodations]);

    const mainPriceRows = useMemo(() => {
        if (!pricing) return [];
        return [
            { label: 'Double',  value: pricing.double  },
            { label: 'Triple',  value: pricing.triple  },
            { label: 'Single',  value: pricing.single  },
        ].filter(({ value }) => typeof value === 'number' && value > 0);
    }, [pricing]);

    const childPriceRows = useMemo(() => {
        if (!pricing) return [];
        return [
            { label: 'Enfant (< 4 ans)',  value: pricing.child_under4  },
            { label: 'Enfant (< 12 ans)', value: pricing.child_under12 },
            { label: '2e enfant',          value: pricing.second_child  },
            { label: 'Bébé',              value: pricing.infant        },
        ].filter(({ value }) => typeof value === 'number' && value > 0);
    }, [pricing]);

    const handleFlip = () => setIsFlipped((prev) => !prev);

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Voir les détails de ${name}`}
            aria-pressed={isFlipped}
            className="relative w-full min-w-[300px] sm:min-w-[340px] md:min-w-[400px] h-[520px] md:h-[560px] cursor-pointer mx-auto outline-none focus-visible:ring-4 focus-visible:ring-sky-400 focus-visible:ring-offset-2 rounded-2xl"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            onFocus={() => setIsFlipped(true)}
            onBlur={() => setIsFlipped(false)}
            onClick={handleFlip}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFlip()}
        >
            <div
                className="relative w-full h-full transition-transform duration-700"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* ── FRONT ─────────────────────────────────────────────────── */}
                <div
                    className="absolute w-full h-full rounded-2xl overflow-hidden bg-white
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)]
                        hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] transition-shadow duration-300"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Hero image */}
                    <div className="relative h-64 sm:h-72 overflow-hidden">
                        <img
                            src={resolveMediaUrl(image_url) || '/placeholder-image.jpg'}
                            alt={name}
                            loading="lazy"
                            width="420"
                            height="288"
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-lg">{name}</h3>
                            <div className="flex items-center gap-2 text-white/95">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">{mainCities.join(', ')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[calc(100%-15rem)]">
                        {/* Duration */}
                        <div className="flex items-center gap-2 text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-2.5 shadow-sm">
                            <Moon className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-semibold text-xs sm:text-sm">
                                {duration?.nights || 0} Nuits / {duration?.days || 0} Jours
                            </span>
                        </div>

                        {/* Highlights */}
                        {highlights.length > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Points Forts</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {highlights.slice(0, 2).map((h, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                                bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-md"
                                        >
                                            <Star className="w-3 h-3 fill-white shrink-0" />
                                            {h.length > 26 ? `${h.substring(0, 26)}…` : h}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next departure — 1 date only */}
                        {departureDates.length > 0 && departureDates[0]?.outbound && (
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-gray-700">
                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium">{departureDates[0].outbound}</span>
                                {departureDates[0].return && (
                                    <span className="text-gray-400">→ {departureDates[0].return}</span>
                                )}
                            </div>
                        )}

                        {/* Best price banner */}
                        {lowestPrice && (
                            <div className="mt-auto pt-1">
                                <div className="p-2 rounded-xl shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                            <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">À partir de</span>
                                            <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
                                        </div>
                                        <div className="text-xl font-black text-white tracking-tight">
                                            {new Intl.NumberFormat('fr-DZ').format(lowestPrice)}
                                            <span className="text-base font-bold ml-1">{currency}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── BACK ──────────────────────────────────────────────────── */}
                <div
                    className="absolute w-full h-full rounded-2xl overflow-hidden text-white
                        shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3),0_10px_30px_-10px_rgba(0,0,0,0.2)]
                        transition-shadow duration-300"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(to bottom right, #991b1b, #b91c1c 55%, #ea580c)',
                    }}
                >
                    <div className="p-4 sm:p-5 h-full overflow-y-auto space-y-3">
                        <h3 className="text-xl sm:text-2xl font-bold border-b-2 border-white/30 pb-2">{name}</h3>

                        {/* Accommodations */}
                        {accommodations.length > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <Hotel className="w-4 h-4" />
                                    Hébergement
                                </h4>
                                {accommodations.map((hotel, i) => (
                                    <div
                                        key={i}
                                        className="bg-white/15 rounded-xl p-2.5 backdrop-blur-sm hover:bg-white/20 transition-colors"
                                    >
                                        <div className="font-semibold text-sm">{hotel?.hotel}</div>
                                        <div className="text-[10px] text-white/90 flex items-center gap-2 mt-0.5">
                                            <span className="flex items-center">
                                                {[...Array(hotel?.stars || 0)].map((_, j) => (
                                                    <Star key={j} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </span>
                                            {hotel?.location && <span>• {hotel.location}</span>}
                                            {hotel?.nights && <span>• {hotel.nights} nuits</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Child rates */}
                        {childPriceRows.length > 0 && (
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wide">Tarifs enfants</h4>
                                {childPriceRows.map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-xs bg-white/10 rounded-lg px-2.5 py-1">
                                        <span className="text-white/80">{label}:</span>
                                        <span className="font-semibold">{formatPrice(value, currency)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Key attractions */}
                        {keyAttractions.length > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <MapIcon className="w-4 h-4" />
                                    Attractions
                                </h4>
                                {keyAttractions.slice(0, 5).map((a, i) => (
                                    <div key={i} className="flex items-start gap-1.5 text-xs sm:text-sm">
                                        <span className="text-yellow-400 font-bold mt-0.5">✦</span>
                                        <span className="text-white/95">{a}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Itinerary preview */}
                        {itineraries.length > 0 && (
                            <div className="space-y-1.5">
                                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                                    <Navigation className="w-4 h-4" />
                                    Programme ({itineraries.length} jours)
                                </h4>
                                <div className="space-y-1 max-h-28 overflow-y-auto">
                                    {itineraries.slice(0, 4).map((day, i) => (
                                        <div key={i} className="text-[10px] sm:text-xs text-white/90 flex gap-1.5">
                                            <span className="font-bold text-yellow-400 shrink-0">J{day?.day}</span>
                                            <span>{day?.title}</span>
                                        </div>
                                    ))}
                                    {itineraries.length > 4 && (
                                        <div className="text-[10px] text-white/70 italic">
                                            + {itineraries.length - 4} autres jours…
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="pt-2">
                            <Link
                                to={`/voyages-organises/${id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full inline-flex justify-center items-center gap-3 text-white font-bold
                                    py-3 px-6 text-sm sm:text-base rounded-lg transition-all shadow-lg
                                    hover:shadow-xl hover:scale-[1.02] duration-200 focus-visible:ring-2 focus-visible:ring-white"
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
