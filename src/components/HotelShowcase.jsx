// src/components/HotelShowcase.jsx
import { useMemo } from "react";
import { Crown, Users, Utensils, Hotel, Sparkles } from "lucide-react";
import HotelCard from "./HotelCard.jsx";
import HotelCarousel from "../ui/HotelCarrousel.jsx";
import PageLoader from "../ui/PageLoader.jsx";
import { useHotelsEnhanced } from "../custom-hooks/useHotelQueries.js";

// ── Module-level helpers ──────────────────────────────────────────────────────

const withId = (h) => ({ ...h, id: h.Id });

const SECTION_CONFIG = [
    {
        key: "luxury",
        title: "Hôtels de Luxe",
        subtitle: "Les meilleures adresses 4 et 5 étoiles",
        Icon: Crown,
        iconClass: "text-amber-600",
        iconBg: "bg-amber-50 border-amber-200",
        barFrom: "#F59E0B",
        barTo: "#D97706",
        badgeGradient: "from-amber-500 to-yellow-500",
        dataKey: "luxuryHotels",
    },
    {
        key: "family",
        title: "Hôtels Familiaux",
        subtitle: "Idéal pour les vacances en famille",
        Icon: Users,
        iconClass: "text-sky-600",
        iconBg: "bg-sky-50 border-sky-200",
        barFrom: "#0EA5E9",
        barTo: "#0284C7",
        badgeGradient: "from-sky-500 to-blue-600",
        dataKey: "familyHotels",
    },
    {
        key: "allInclusive",
        title: "All Inclusive",
        subtitle: "Tout compris pour des vacances sans souci",
        Icon: Utensils,
        iconClass: "text-orange-600",
        iconBg: "bg-orange-50 border-orange-200",
        barFrom: "#F97316",
        barTo: "#EA580C",
        badgeGradient: "from-orange-500 to-red-500",
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
        return <PageLoader section />;
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
        <section className={`w-full py-6 bg-gradient-to-b from-slate-50/70 via-white to-white ${className}`}>

            <div className="max-w-screen-2xl mx-auto text-center mb-6 px-4">

                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-3 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                    Sélection Exclusive
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-sky-700 mb-3 leading-tight tracking-tight">
                    Nos Collections d'Hôtels
                </h2>

                {/* Underline accent */}
                <div className="flex items-center justify-center gap-2">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-sky-400" />
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <div className="h-1 w-10 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-sky-400" />
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto space-y-10 px-4 md:px-8 lg:px-12">
                {SECTION_CONFIG.map(({ key, title, subtitle, Icon, iconClass, iconBg, barFrom, barTo, badgeGradient, dataKey }) => {
                    const sectionHotels = hotelCategories[dataKey];
                    if (!sectionHotels?.length) return null;

                    return (
                        <div key={key} className="relative">

                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                                <div className="flex items-center gap-3">
                                    {/* Category-colored icon bubble */}
                                    <div className={`p-3 rounded-2xl border-2 shadow-sm ${iconBg}`}>
                                        <Icon size={24} className={iconClass} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-0.5 font-medium">{subtitle}</p>
                                    </div>
                                </div>

                                {/* Gradient count badge */}
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r ${badgeGradient} px-4 py-2 rounded-full self-start sm:self-auto shadow-sm`}>
                                    {sectionHotels.length} hôtel{sectionHotels.length > 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Category-colored accent bar */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="h-1 w-14 rounded-full flex-shrink-0"
                                    style={{ background: `linear-gradient(to right, ${barFrom}, ${barTo})` }}
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