// src/components/HotelShowcase.jsx
import { useMemo } from "react";
import { Crown, DollarSign, Users, Utensils, Hotel, Sparkles } from "lucide-react";
import HotelCard from "./HotelCard.jsx";
import HotelCarousel from "../ui/HotelCarrousel.jsx";
import Loader from "../ui/Loader.jsx";
import { useHotelsEnhanced } from "../custom-hooks/useHotelQueries.js";

// ── Module-level helpers ──────────────────────────────────────────────────────

const withId = (h) => ({ ...h, id: h.Id });

const SECTION_CONFIG = [
    {
        key: "luxury",
        title: "Hôtels de Luxe",
        subtitle: "Les meilleures adresses 4 et 5 étoiles",
        Icon: Crown,
        iconClass: "text-yellow-500",
        bgBadge: "bg-yellow-500",
        bgBadgeHover: "bg-yellow-600",
        dataKey: "luxuryHotels",
    },
    {
        key: "budget",
        title: "Bon Rapport Qualité/Prix",
        subtitle: "Des séjours confortables à prix accessibles",
        Icon: DollarSign,
        iconClass: "text-green-500",
        bgBadge: "bg-green-500",
        bgBadgeHover: "bg-green-600",
        dataKey: "budgetHotels",
    },
    {
        key: "family",
        title: "Hôtels Familiaux",
        subtitle: "Idéal pour les vacances en famille",
        Icon: Users,
        iconClass: "text-blue-500",
        bgBadge: "bg-sky-600",
        bgBadgeHover: "bg-sky-700",
        dataKey: "familyHotels",
    },
    {
        key: "allInclusive",
        title: "All Inclusive",
        subtitle: "Tout compris pour des vacances sans souci",
        Icon: Utensils,
        iconClass: "text-orange-500",
        bgBadge: "bg-orange-500",
        bgBadgeHover: "bg-orange-600",
        dataKey: "allInclusiveHotels",
    },
];

// ─────────────────────────────────────────────────────────────────────────────

function HotelShowcase({ cityId = null, className = "" }) {
    const { data: hotels, isLoading, error } = useHotelsEnhanced(cityId, { batchSize: 5 });

    const hotelCategories = useMemo(() => {
        if (!hotels || hotels.length === 0) return null;

        const luxuryHotels = hotels
            .filter(h => h.Category?.Star >= 4)
            .sort((a, b) => (b.Category?.Star || 0) - (a.Category?.Star || 0))
            .slice(0, 6)
            .map(withId);

        const budgetHotels = hotels
            .filter(h => h.Category?.Star <= 3)
            .sort((a, b) => (a.Category?.Star || 0) - (b.Category?.Star || 0))
            .slice(0, 6)
            .map(withId);

        const familyHotels = hotels
            .filter(h =>
                h.Theme?.some(theme =>
                    theme.toLowerCase().includes('famille') ||
                    theme.toLowerCase().includes('family')
                ) ||
                h.Tag?.some(tag =>
                    tag.Title?.toLowerCase().includes('famille') ||
                    tag.Title?.toLowerCase().includes('family')
                )
            )
            .slice(0, 6)
            .map(withId);

        const allInclusiveHotels = hotels
            .filter(h =>
                h.Boarding?.some(board =>
                    board.Name?.toLowerCase().includes('all inclusive') ||
                    board.Name?.toLowerCase().includes('tout compris') ||
                    board.Code?.toLowerCase().includes('ai') ||
                    board.Code?.toLowerCase().includes('tc')
                )
            )
            .slice(0, 6)
            .map(withId);

        return { luxuryHotels, budgetHotels, familyHotels, allInclusiveHotels };
    }, [hotels]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className={`w-full py-16 ${className}`}>
                <Loader
                    message="Chargement des hôtels..."
                    submessage="Récupération des collections en cours"
                />
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className={`w-full py-16 text-center ${className}`}>
                <Hotel className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-semibold text-lg">
                    {error?.message || "Impossible de charger les hôtels"}
                </p>
            </div>
        );
    }

    // ── Empty ─────────────────────────────────────────────────────────────────
    if (!hotelCategories) {
        return (
            <div className={`w-full py-16 text-center ${className}`}>
                <Hotel className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 font-semibold text-lg">
                    Nous n'avons pas d'hôtels à afficher
                </p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className={`w-full py-8 ${className}`}>

            {/* ✅ max-w-screen-2xl — wider than previous max-w-7xl */}
            <div className="max-w-screen-2xl mx-auto text-center mb-16 px-4">

                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2 bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 shadow-sm">
                    <Sparkles size={13} />
                    Sélection Exclusive
                    <Sparkles size={13} />
                </div>

                {/* Gradient headline */}
                <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-700 mb-4 leading-tight tracking-tight">
                    Nos Collections d'Hôtels
                </h2>

                {/* Underline accent */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-sky-400" />
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <div className="h-1 w-10 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-sky-400" />
                </div>

                <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                    Découvrez notre sélection d'hôtels soigneusement choisis
                    <span className="text-sky-700 font-semibold"> pour chaque type de voyageur</span>
                </p>
            </div>

            {/* ✅ max-w-screen-2xl — wider than previous max-w-7xl */}
            <div className="max-w-screen-2xl mx-auto space-y-20 px-4 md:px-8 lg:px-12">
                {SECTION_CONFIG.map(({ key, title, subtitle, Icon, iconClass, bgBadge, bgBadgeHover, dataKey }) => {
                    const sectionHotels = hotelCategories[dataKey];
                    if (!sectionHotels?.length) return null;

                    return (
                        <div key={key} className="relative">

                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    {/* Icon bubble */}
                                    <div className="p-3 rounded-2xl shadow-md bg-white border-2 border-gray-100">
                                        <Icon size={26} className={iconClass} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-0.5 font-medium">{subtitle}</p>
                                    </div>
                                </div>

                                {/* Count badge */}
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-white
                                 ${bgBadge} hover:${bgBadgeHover} transition-colors px-4 lg:px-6 py-2 rounded-full self-start sm:self-auto`}>
                                    {sectionHotels.length} hôtel{sectionHotels.length > 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Divider accent */}
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className={`h-1 w-12 rounded-full ${iconClass} opacity-60`}
                                    style={{ backgroundColor: "currentColor" }}
                                />
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                            </div>

                            <HotelCarousel
                                items={sectionHotels}
                                renderItem={(hotel) => <HotelCard hotel={hotel} />}
                                showArrows={true}
                                showIndicators={true}
                            />
                        </div>
                    );
                })}
            </div>

        </section>
    );
}

export default HotelShowcase;