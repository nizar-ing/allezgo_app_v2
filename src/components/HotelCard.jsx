// src/components/HotelCard.jsx
import { memo, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    MapPin, Star, Images, Eye, Sparkles,
    Utensils, Wifi, Dumbbell, Car, Waves,
    Flower2, BellRing, Umbrella, Heart,
    Mountain, Building2, TreePine, Users, Briefcase,
} from "lucide-react";

// ── Fallback image (module-level constant) ────────────────────────────────────
const FALLBACK_IMAGE = "https://loremflickr.com/600/400/hotel,luxury?lock=42";

// ── Module-level icon/style maps ──────────────────────────────────────────────

const FACILITY_ICON_MAP = [
    { test: (s) => s.includes("wifi")       || s.includes("internet"),                    Icon: Wifi },
    { test: (s) => s.includes("piscine")    || s.includes("pool"),                        Icon: Waves },
    { test: (s) => s.includes("spa")        || s.includes("wellness"),                    Icon: Flower2 },
    { test: (s) => s.includes("parking")    || s.includes("garage"),                      Icon: Car },
    { test: (s) => s.includes("fitness")    || s.includes("gym") || s.includes("sport"),  Icon: Dumbbell },
    { test: (s) => s.includes("restaurant") || s.includes("bar"),                         Icon: Utensils },
    { test: (s) => s.includes("plage")      || s.includes("beach"),                       Icon: Umbrella },
    { test: (s) => s.includes("concierge")  || s.includes("service"),                     Icon: BellRing },
];

const getFacilityIcon = (title) => {
    const lower = title?.toLowerCase() || "";
    return FACILITY_ICON_MAP.find(({ test }) => test(lower))?.Icon ?? Sparkles;
};

const THEME_STYLE_MAP = [
    {
        test:     (s) => s.includes("famille")  || s.includes("family"),
        Icon:     Users,      iconColor: "text-pink-500",
        gradient: "from-pink-500 to-rose-500",
        bg:       "from-pink-50 to-rose-50",    border: "border-pink-200",
    },
    {
        test:     (s) => s.includes("business") || s.includes("affaire"),
        Icon:     Briefcase,  iconColor: "text-slate-600",
        gradient: "from-slate-600 to-gray-700",
        bg:       "from-slate-50 to-gray-50",   border: "border-slate-300",
    },
    {
        test:     (s) => s.includes("plage")    || s.includes("beach"),
        Icon:     Umbrella,   iconColor: "text-cyan-500",
        gradient: "from-cyan-500 to-blue-500",
        bg:       "from-cyan-50 to-blue-50",    border: "border-cyan-200",
    },
    {
        test:     (s) => s.includes("romance")  || s.includes("couple"),
        Icon:     Heart,      iconColor: "text-red-500",
        gradient: "from-red-500 to-pink-500",
        bg:       "from-red-50 to-pink-50",     border: "border-red-200",
    },
    {
        test:     (s) => s.includes("montagne") || s.includes("mountain"),
        Icon:     Mountain,   iconColor: "text-emerald-600",
        gradient: "from-emerald-600 to-teal-600",
        bg:       "from-emerald-50 to-teal-600", border: "border-emerald-300",
    },
    {
        test:     (s) => s.includes("ville")    || s.includes("city"),
        Icon:     Building2,  iconColor: "text-indigo-500",
        gradient: "from-indigo-500 to-purple-500",
        bg:       "from-indigo-50 to-purple-50", border: "border-indigo-200",
    },
    {
        test:     (s) => s.includes("nature")   || s.includes("eco"),
        Icon:     TreePine,   iconColor: "text-green-600",
        gradient: "from-green-600 to-lime-600",
        bg:       "from-green-50 to-lime-50",   border: "border-green-300",
    },
];

const getThemeStyle = (theme) => {
    const lower = theme?.toLowerCase() || "";
    return THEME_STYLE_MAP.find(({ test }) => test(lower)) ?? {
        Icon:     Sparkles, iconColor: "text-purple-500",
        gradient: "from-purple-500 to-indigo-500",
        bg:       "from-purple-50 to-indigo-50",  border: "border-purple-200",
    };
};

const buildDetailUrl = (id, searchParams) => {
    const params = new URLSearchParams(searchParams);
    const qs = params.toString();
    return `/hotel/${id}${qs ? `?${qs}` : ""}`;
};

// ─────────────────────────────────────────────────────────────────────────────

const HotelCard = memo(function HotelCard({ hotel, searchParams: searchParamsProp, className = "" }) {
    if (!hotel) return null;

    const {
        Id,
        Name,
        Category,
        City,
        Adress,
        Image,
        Album      = [],
        Facilities = [],
        Tag        = [],
        Boarding   = [],
        Theme      = [],
        _enhanced,     // Indicator from ApiClient.listHotelEnhanced
        minPrice,      // Marked-up price (already a Number from ApiClient)
        currency = "DZD"
    } = hotel;

    const navigate = useNavigate();
    const [urlSearchParams] = useSearchParams();

    // Stable URL: preserves search context
    const detailUrl = useMemo(
        () => buildDetailUrl(Id, searchParamsProp ?? urlSearchParams),
        [Id, searchParamsProp, urlSearchParams]
    );

    const imageSrc = Image || FALLBACK_IMAGE;
    const primaryBoarding = Boarding?.[0];
    const topFacilities   = Facilities.slice(0, 4);
    const topThemes       = Theme.slice(0, 3);
    const primaryTag      = Tag?.[0];

    return (
        <article
            className={`
                group bg-white rounded-xl sm:rounded-2xl overflow-hidden
                border border-gray-200 hover:border-sky-300
                shadow-md hover:shadow-2xl hover:shadow-sky-500/10
                h-full flex flex-col
                w-full mx-auto
                transition-all duration-500 ease-out
                hover:-translate-y-2
                ${className}
            `}
        >
            {/* ── Image Section ─────────────────────────────────────────── */}
            <div className="relative h-48 sm:h-52 md:h-60 lg:h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-sky-50">
                <img
                    src={imageSrc}
                    alt={Name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* ✅ Premium Badge (Synchronisé avec listHotelEnhanced) */}
                {_enhanced && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-xl border-2 border-white/30 animate-in fade-in duration-500">
                            <Sparkles className="w-3 h-3" />
                            <span>Premium</span>
                        </div>
                    </div>
                )}

                {/* ✅ Badge de Prix (Inclut la marge de 8% et formatage DZD sécurisé) */}
                {minPrice > 0 && (
                    <div className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-sky-100 text-right">
                        <p className="text-[9px] text-sky-500 font-bold uppercase tracking-tighter leading-none mb-0.5">À partir de</p>
                        <p className="text-sm font-extrabold text-sky-700 leading-none">
                            {new Intl.NumberFormat("fr-DZ").format(minPrice)}
                            <span className="text-[10px] font-bold text-sky-400 ml-1">{currency}</span>
                        </p>
                    </div>
                )}

                {/* Photo Count (fallback top right if no price) */}
                {Album.length > 0 && !minPrice && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-white/20">
                            <Images className="w-3 h-3" />
                            <span>{Album.length}</span>
                        </div>
                    </div>
                )}

                {/* Star Rating */}
                <div className="absolute bottom-2 left-2 z-10">
                    <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg shadow-lg border border-white/50">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                        i < (Category?.Star || 0)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-gray-300 fill-gray-200"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-800">{Category?.Star || 0}★</span>
                    </div>
                </div>

                {/* Primary Tag */}
                {primaryTag && (
                    <div className="absolute bottom-2 right-2 z-10">
                        <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white/30">
                            {primaryTag.Title}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Content Section ───────────────────────────────────────── */}
            <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col">

                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-sky-600 transition-colors line-clamp-2 leading-tight">
                    {Name}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                    <div className="bg-gradient-to-br from-sky-100 to-blue-100 p-1.5 rounded-lg shrink-0 shadow-sm">
                        <MapPin className="text-sky-600 w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-700 line-clamp-1">
                            {City?.Name}{City?.Country?.Name ? `, ${City.Country.Name}` : ""}
                        </p>
                        {Adress && (
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1" title={Adress}>
                                {Adress}
                            </p>
                        )}
                    </div>
                </div>

                {/* Boarding */}
                {primaryBoarding && (
                    <div className="mb-3">
                        <div className="relative overflow-hidden rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-2.5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-2xl" />
                            <div className="relative flex items-center gap-2">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                    <Utensils className="text-emerald-600 w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-emerald-800 line-clamp-1">{primaryBoarding.Name}</p>
                                    <p className="text-xs text-emerald-600 font-semibold">{primaryBoarding.Code}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Facility Badges */}
                {topFacilities.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Équipements</h4>
                        <div className="flex flex-wrap gap-2">
                            {topFacilities.map((facility, index) => {
                                const FacilityIcon = getFacilityIcon(facility.Title);
                                return (
                                    <div
                                        key={index}
                                        className="group/badge relative inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-sky-300 rounded-lg text-xs font-semibold text-gray-700 hover:text-sky-700 transition-all duration-300 shadow-sm hover:shadow-md cursor-default overflow-hidden"
                                    >
                                        <FacilityIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-600 group-hover/badge:text-sky-700 transition-colors flex-shrink-0" />
                                        <span className="hidden sm:inline truncate max-w-[72px]">
                                            {facility.Title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Theme Badges (Logic Business Synchronisée) */}
                {topThemes.length > 0 && (
                    <div className="mb-3 hidden sm:block">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Thèmes</h4>
                        <div className="flex flex-wrap gap-2">
                            {topThemes.map((theme, index) => {
                                const { Icon: ThemeIcon, iconColor, gradient, bg, border } = getThemeStyle(theme);
                                return (
                                    <div
                                        key={index}
                                        className={`group/theme relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br ${bg} border-2 ${border} rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 cursor-default overflow-hidden`}
                                    >
                                        <ThemeIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${iconColor} flex-shrink-0`} />
                                        <span className={`text-transparent bg-gradient-to-r ${gradient} bg-clip-text`}>
                                            {theme}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-[8px]" />

                {/* CTA Button */}
                <button
                    onClick={() => navigate(detailUrl)}
                    className="group/btn relative w-full inline-flex justify-center items-center gap-2 font-bold text-white rounded-xl overflow-hidden transition-all duration-300 py-3 px-4 text-sm shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-300/50"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500 via-sky-700 to-sky-800" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    <Eye className="w-5 h-5 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10 tracking-wide">Voir les détails</span>
                </button>
            </div>
        </article>
    );
});

export default HotelCard;