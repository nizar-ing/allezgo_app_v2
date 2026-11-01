import { useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import {
    Plane, Hotel, Calendar, Users, MapPin, CheckCircle2,
    XCircle, Star, Utensils, Baby, Info, Phone,
    ChevronDown, ChevronUp, Globe, Bed, ShieldCheck, Compass,
} from "lucide-react";
import { useDestination } from "../custom-hooks/useDestinations.js";
import useSettings from "../custom-hooks/useSettings.js";
import { resolveMediaUrl } from "../utils/resolveMediaUrl.js";
import { formatDateForAPI } from "../utils/dateHelpers.js";
import PageLoader from "../ui/PageLoader.jsx";
import Button from "../ui/Button.jsx";

const formatPrice = (value, currency = 'DZD') =>
    `${new Intl.NumberFormat('fr-DZ').format(value)} ${currency}`;

function OrganizedTrip() {
    const { tripId: id } = useParams();
    const { data: destination, isLoading, error } = useDestination(id);
    const { settings } = useSettings();
    const waNumber = settings?.contact_whatsapp || '213770932563';
    const [expandedDay, setExpandedDay] = useState(null);

    if (isLoading) return <PageLoader section />;
    if (error || !destination) return <Navigate to="/not-found" replace />;

    const pricing = destination.pricing || {};
    const currency = pricing.currency || 'DZD';

    const today = new Date().toISOString().slice(0, 10);

    /** Effective price for one AccommodationPrice row (promo if active, else base). */
    const effectivePrice = (p) => {
        const promoOn = p.promoPrice != null &&
            (!p.promoStartsAt || p.promoStartsAt <= today) &&
            (!p.promoEndsAt || p.promoEndsAt >= today);
        return { price: promoOn ? Number(p.promoPrice) : Number(p.pricePerAdult), promoOn, p };
    };

    const ROOM_LABELS = { single: 'Single', double: 'Double', triple: 'Triple', quadruple: 'Quadruple' };

    const mainPriceRows = [
        { label: 'Chambre Double', value: pricing.double },
        { label: 'Chambre Triple', value: pricing.triple },
        { label: 'Chambre Single', value: pricing.single },
    ].filter(({ value }) => typeof value === 'number' && value > 0);

    const childPriceRows = [
        { label: 'Enfant (< 4 ans)',  value: pricing.child_under4  },
        { label: 'Enfant (< 12 ans)', value: pricing.child_under12 },
        { label: '2e enfant',          value: pricing.second_child  },
        { label: 'Bébé',              value: pricing.infant        },
    ].filter(({ value }) => typeof value === 'number' && value > 0);

    const itineraries = destination.itineraries ?? [];
    const accommodations = destination.accommodations ?? [];

    const today = formatDateForAPI(new Date());
    const futureDates = (destination.departureDates ?? [])
        .filter(d => d.outbound >= today)
        .sort((a, b) => (a.outbound < b.outbound ? -1 : 1));
    const fmtDepartureDate = (iso) =>
        new Intl.DateTimeFormat('fr-DZ', { day: 'numeric', month: 'short', year: 'numeric' })
            .format(new Date(iso + 'T00:00:00'));

    return (
        <section className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-12">

                {/* Hero */}
                <div className="relative h-[260px] sm:h-[340px] md:h-[420px] rounded-3xl overflow-hidden mb-8 sm:mb-10 shadow-2xl group">
                    <img
                        src={resolveMediaUrl(destination.image_url) || '/placeholder-image.jpg'}
                        alt={destination.name}
                        loading="lazy"
                        width="1200"
                        height="500"
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                                <Compass className="w-3.5 h-3.5" />
                                Voyage Organisé
                            </span>
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Garanti
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
                            {destination.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-base">
                            {destination.mainCities?.length > 0 && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="truncate">{destination.mainCities.join(" • ")}</span>
                                </div>
                            )}
                            {(destination.duration?.days || destination.duration?.nights) && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>{destination.duration?.days} jours / {destination.duration?.nights} nuits</span>
                                </div>
                            )}
                            {destination.airline && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Plane className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>{destination.airline}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* ── Left column ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* About */}
                        <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                                À propos de ce voyage
                            </h2>
                            <div className="text-gray-600 leading-relaxed space-y-3 sm:space-y-4">
                                <p className="text-base sm:text-lg">
                                    Découvrez la beauté envoûtante de{" "}
                                    <span className="font-semibold text-gray-900">{destination.name}</span>,
                                    une destination qui combine histoire millénaire, culture fascinante et paysages à couper le souffle.
                                    Ce voyage organisé de {destination.duration?.days} jours est conçu pour vous offrir une expérience complète et inoubliable.
                                </p>
                                {destination.departureFrom && (
                                    <p className="text-sm sm:text-base">
                                        Au départ de{" "}
                                        <span className="font-semibold">{destination.departureFrom}</span>
                                        {destination.airline && <>{" "}avec {destination.airline}</>},
                                        vous profiterez d&apos;un programme soigneusement élaboré incluant les sites les plus emblématiques,
                                        un hébergement de qualité, et l&apos;accompagnement de guides expérimentés pour enrichir votre découverte.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Highlights */}
                        {destination.highlights?.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                    <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full" />
                                    Points forts du voyage
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {destination.highlights.map((highlight, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-all duration-200"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="font-medium text-gray-700 text-sm sm:text-base">{highlight}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Accommodations */}
                        {accommodations.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                    <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full" />
                                    Hébergement
                                </h2>
                                <div className="space-y-3 sm:space-y-4">
                                    {accommodations.map((acc, index) => {
                                        const accPrices = (acc.prices ?? [])
                                            .map(effectivePrice)
                                            .sort((a, b) => a.price - b.price);
                                        const accCurrency = accPrices[0]?.p?.currency ?? currency;
                                        return (
                                            <div
                                                key={acc.id ?? index}
                                                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-start justify-between mb-2 gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Hotel className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 shrink-0" />
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{acc.hotel}</h3>
                                                            {acc.location && (
                                                                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                                    {acc.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {acc.stars > 0 && (
                                                        <div className="flex items-center gap-0.5 px-2.5 py-1 bg-yellow-50 rounded-full border border-yellow-200 shrink-0">
                                                            {[...Array(acc.stars)].map((_, i) => (
                                                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {acc.nights > 0 && (
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                                                        <Bed className="w-4 h-4 text-purple-400" />
                                                        <span className="font-medium">{acc.nights} nuits</span>
                                                    </div>
                                                )}

                                                {/* Per-hotel prices */}
                                                {accPrices.length > 0 && (
                                                    <div className="mt-2 space-y-1.5">
                                                        {accPrices.map(({ price, promoOn, p }) => (
                                                            <div key={p.id ?? p.roomType} className="flex items-center justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-600">{ROOM_LABELS[p.roomType] ?? p.roomType}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {promoOn && p.promoLabel && (
                                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">{p.promoLabel}</span>
                                                                    )}
                                                                    {promoOn && (
                                                                        <span className="line-through text-gray-400 text-xs">{formatPrice(Number(p.pricePerAdult), accCurrency)}</span>
                                                                    )}
                                                                    <span className={`font-bold ${promoOn ? 'text-green-600' : 'text-blue-600'}`}>
                                                                        {formatPrice(price, accCurrency)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Réserver button per hotel */}
                                                <Link
                                                    to={`/voyages-organises/${destination.id}/reserver${acc.id ? `?accId=${acc.id}` : ''}`}
                                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Réserver
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                                {destination.mealPlan && (
                                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
                                            <Utensils className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold">Formule: {destination.mealPlan}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Itinerary */}
                        {itineraries.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                    <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full" />
                                    Programme détaillé
                                </h2>
                                <div className="space-y-3">
                                    {itineraries.map((day, index) => (
                                        <div
                                            key={day.id ?? index}
                                            className="border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all duration-200"
                                        >
                                            <button
                                                onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                                                className="w-full px-3 py-4 sm:p-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-orange-50 hover:to-white transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg text-sm sm:text-base shrink-0">
                                                        {day.day}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[11px] sm:text-xs text-orange-500 font-semibold uppercase tracking-wide mb-0.5">
                                                            Jour {day.day}
                                                        </p>
                                                        <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight">
                                                            {day.title || "Programme du jour"}
                                                        </h3>
                                                    </div>
                                                </div>
                                                {expandedDay === index
                                                    ? <ChevronUp className="w-4 h-4 text-orange-500 shrink-0" />
                                                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                                                }
                                            </button>
                                            {expandedDay === index && (
                                                <div className="p-4 sm:p-5 bg-white border-t border-gray-100">
                                                    <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">
                                                        {day.description || `Journée de découvertes. ${day.title}. Accompagnement par guide local francophone.`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Attractions */}
                        {destination.keyAttractions?.length > 0 && (
                            <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-gray-100">
                                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
                                    <div className="w-1 h-7 sm:h-8 bg-gradient-to-b from-sky-500 to-sky-600 rounded-full" />
                                    Sites & Attractions
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {destination.keyAttractions.map((attraction, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                                        >
                                            <Globe className="w-5 h-5 text-sky-500 shrink-0" />
                                            <span className="font-medium text-gray-700 text-sm sm:text-base">{attraction}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Included / Not included */}
                        {(destination.included?.length > 0 || destination.notIncluded?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {destination.included?.length > 0 && (
                                    <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-green-100">
                                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-green-700">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            Inclus dans le prix
                                        </h3>
                                        <ul className="space-y-2.5 sm:space-y-3">
                                            {destination.included.map((item, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {destination.notIncluded?.length > 0 && (
                                    <div className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-8 border border-red-100">
                                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-red-700">
                                            <XCircle className="w-5 h-5 text-red-500" />
                                            Non inclus
                                        </h3>
                                        <ul className="space-y-2.5 sm:space-y-3">
                                            {destination.notIncluded.map((item, index) => (
                                                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Right sidebar ── */}
                    <div className="lg:sticky lg:top-24 h-fit space-y-4">

                        {/* Pricing card */}
                        <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-5 sm:p-7 border-2 border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 opacity-50" />
                            <div className="relative">
                                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                                    Tarifs & Réservation
                                </h3>

                                {/* Main price rows */}
                                {mainPriceRows.length > 0 && (
                                    <div className="space-y-3 mb-4">
                                        {mainPriceRows.map(({ label, value }) => (
                                            <div
                                                key={label}
                                                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
                                            >
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-blue-600 shrink-0" />
                                                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{label}</span>
                                                    </div>
                                                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                                                        {formatPrice(value, currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Child price rows */}
                                {childPriceRows.length > 0 && (
                                    <div className="p-3 sm:p-4 rounded-xl bg-pink-50 border border-pink-200 mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Baby className="w-4 h-4 text-pink-600" />
                                            <span className="font-semibold text-gray-900 text-sm sm:text-base">Tarifs Enfants</span>
                                        </div>
                                        <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                                            {childPriceRows.map(({ label, value }) => (
                                                <div key={label} className="flex justify-between">
                                                    <span>{label}:</span>
                                                    <span className="font-semibold">{formatPrice(value, currency)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Departure dates */}
                                {futureDates.length > 0 && (
                                    <div className="mb-4 sm:mb-6">
                                        <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            Dates disponibles
                                        </h4>
                                        <div className="space-y-2">
                                            {futureDates.map((date, index) => (
                                                <div
                                                    key={index}
                                                    className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-blue-300 transition-all duration-200"
                                                >
                                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                                        <span className="text-gray-700">
                                                            {fmtDepartureDate(date.outbound)}{date.return && ` → ${fmtDepartureDate(date.return)}`}
                                                        </span>
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Visa info */}
                                {destination.visaInfo && (
                                    <div className="mb-4 p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="flex items-start gap-2">
                                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="text-xs sm:text-sm text-gray-700">
                                                <span className="font-semibold text-amber-800">Visa :</span>{" "}
                                                {destination.visaInfo.required ? (
                                                    <>
                                                        Requis
                                                        {destination.visaInfo.price && ` • ${destination.visaInfo.price}`}
                                                        {destination.visaInfo.duration && ` • ${destination.visaInfo.duration}`}
                                                        {destination.visaInfo.notes && (
                                                            <span className="block text-gray-600 mt-0.5">{destination.visaInfo.notes}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    "Non requis"
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Guarantee */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6 border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-green-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                                                Garantie & Sécurité
                                            </h4>
                                            <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                                                Départ garanti • Assurance voyage incluse • Paiement sécurisé
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <Link
                                    to={`/voyages-organises/${destination.id}/reserver`}
                                    className="block w-full"
                                >
                                    <Button
                                        variant="primary"
                                        className="w-full py-3.5 sm:py-4 text-sm sm:text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 mb-2.5 sm:mb-3"
                                    >
                                        Réserver maintenant
                                    </Button>
                                </Link>

                                <p className="text-[10px] sm:text-xs text-center text-gray-500 flex items-center justify-center gap-1.5 sm:gap-2">
                                    <Info className="w-3 h-3" />
                                    Places limitées • Réservez dès maintenant
                                </p>
                            </div>
                        </div>

                        {/* Support card */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 sm:p-6 border border-orange-200">
                            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div className="bg-white p-2.5 sm:p-3 rounded-full shadow-md">
                                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-sm sm:text-base">
                                        Besoin d&apos;aide ?
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                        Notre équipe est disponible 24/7 pour répondre à vos questions.
                                    </p>
                                </div>
                            </div>
                            <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour, j'ai besoin d'aide concernant le voyage "${destination.name}".`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-100 font-semibold text-xs sm:text-sm transition-all duration-200"
                                >
                                    Contacter le support
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </section>
    );
}

export default OrganizedTrip;
