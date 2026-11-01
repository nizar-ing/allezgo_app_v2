// src/components/HotelsFiltering.jsx
import { useState, useMemo, useCallback } from "react";
import {
    SlidersHorizontal, Star, Bed, UtensilsCrossed,
    Waves, Dumbbell, Car, Sparkles, Users, ChevronDown,
    ChevronUp, X, Filter,
} from "lucide-react";

const ARRANGEMENTS = [
    { id: "petit-dejeuner",        label: "Petit Déjeuner"        },
    { id: "demi-pension-plus",     label: "Demi Pension Plus"      },
    { id: "pension-complete-plus", label: "Pension Complète Plus"  },
    { id: "demi-pension",          label: "Demi Pension"           },
    { id: "all-inclusive",         label: "All Inclusive"          },
    { id: "pension-complete",      label: "Pension Complète"       },
];

const ROOM_TYPES = [
    { id: "chambre-triple",         label: "Chambre Triple"         },
    { id: "chambre-double-vue-mer", label: "Chambre Double Vue Mer" },
    { id: "chambre-standard",       label: "Chambre Standard"       },
    { id: "chambre-double",         label: "Chambre Double"         },
    { id: "suite",                  label: "Suite"                  },
];

const SERVICES = [
    { id: "famille",               label: "Famille",                   icon: Users          },
    { id: "thalasso-spa",          label: "Thalasso Spa",              icon: Sparkles       },
    { id: "sport-loisirs",         label: "Sport & Loisirs",           icon: Dumbbell       },
    { id: "bord-mer",              label: "Bord de Mer",               icon: Waves          },
    { id: "tout-inclus",           label: "All Inclusive",             icon: UtensilsCrossed },
    { id: "internet-celibataires", label: "Interdit aux célibataires", icon: Users          },
    { id: "degustation",           label: "Dégustation",               icon: UtensilsCrossed },
    { id: "interdit-parking",      label: "Interdit le parking",       icon: Car            },
    { id: "affaires",              label: "Affaires",                  icon: Bed            },
    { id: "golf",                  label: "Golf",                      icon: Dumbbell       },
    { id: "luxe",                  label: "Luxe",                      icon: Star           },
];

const TARIFS_OPTIONS = [
    { key: "hotelRecommander",    label: "Hôtel à recommander" },
    { key: "tarifEnPromotion",    label: "Tarifs en promotion"  },
    { key: "disponibleSeulement", label: "Disponible seulement" },
    { key: "annulationGratuite",  label: "Annulation Gratuite"  },
];

const ARRAY_FILTER_KEYS = new Set(["arrangements", "categories", "roomTypes", "services"]);

const DEFAULT_FILTERS = {
    hotelRecommander:    false,
    tarifEnPromotion:    false,
    disponibleSeulement: false,
    annulationGratuite:  false,
    arrangements:        [],
    categories:          [],
    budgetMin:           0,
    budgetMax:           1000,
    roomTypes:           [],
    services:            [],
};

// ── Component ──────────────────────────────────────────────────────────────────

function HotelsFiltering({ onFilterChange, initialFilters, className }) {
    const [filters, setFilters] = useState(() => ({
        ...DEFAULT_FILTERS,
        ...initialFilters,
    }));

    const [expandedSections, setExpandedSections] = useState({
        tarifs:       true,
        arrangements: true,
        categorie:    true,
        budget:       true,
        chambres:     true,
        services:     true,
    });

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.hotelRecommander)    count++;
        if (filters.tarifEnPromotion)    count++;
        if (filters.disponibleSeulement) count++;
        if (filters.annulationGratuite)  count++;
        count += filters.arrangements.length;
        count += filters.categories.length;
        count += filters.roomTypes.length;
        count += filters.services.length;
        if (filters.budgetMin > 0 || filters.budgetMax < 1000) count++;
        return count;
    }, [filters]);

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const handleFilterChange = useCallback((filterType, value) => {
        const updated = ARRAY_FILTER_KEYS.has(filterType)
            ? {
                ...filters,
                [filterType]: filters[filterType].includes(value)
                    ? filters[filterType].filter(item => item !== value)
                    : [...filters[filterType], value],
            }
            : { ...filters, [filterType]: value };

        setFilters(updated);
        onFilterChange?.(updated);
    }, [filters, onFilterChange]);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        onFilterChange?.(DEFAULT_FILTERS);
    }, [onFilterChange]);

    return (
        <div className={className ?? "bg-white rounded-2xl shadow-xl p-6 sticky top-6"}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-sky-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 rounded-lg">
                        <Filter className="text-sky-600" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Filtrer</h2>
                    {activeFilterCount > 0 && (
                        <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                    >
                        <X size={16} /> Réinitialiser
                    </button>
                )}
            </div>

            {/* Tarifs et disponibilités */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("tarifs")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Tarifs et disponibilités</span>
                    {expandedSections.tarifs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.tarifs && (
                    <div className="space-y-3 pl-1">
                        {TARIFS_OPTIONS.map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters[key]}
                                    onChange={(e) => handleFilterChange(key, e.target.checked)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200 my-4" />

            {/* Arrangements */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("arrangements")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Arrangements</span>
                    {expandedSections.arrangements ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.arrangements && (
                    <div className="space-y-3 pl-1">
                        {ARRANGEMENTS.map((arrangement) => (
                            <label key={arrangement.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.arrangements.includes(arrangement.id)}
                                    onChange={() => handleFilterChange("arrangements", arrangement.id)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{arrangement.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200 my-4" />

            {/* Catégorie */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("categorie")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Catégorie</span>
                    {expandedSections.categorie ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.categorie && (
                    <div className="space-y-3 pl-1">
                        {[5, 4, 3].map((starCount) => (
                            <label key={starCount} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.categories.includes(starCount)}
                                    onChange={() => handleFilterChange("categories", starCount)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: starCount }, (_, i) => (
                                        <Star key={i} size={16} fill="#f97316" className="text-orange-500" />
                                    ))}
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200 my-4" />

            {/* Budget */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("budget")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Budget</span>
                    {expandedSections.budget ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.budget && (
                    <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Min DA</label>
                                <input
                                    type="number"
                                    value={filters.budgetMin}
                                    onChange={(e) => handleFilterChange("budgetMin", Number(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Max DA</label>
                                <input
                                    type="number"
                                    value={filters.budgetMax}
                                    onChange={(e) => handleFilterChange("budgetMax", Number(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                                    placeholder="1000"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full">
                                {filters.budgetMin} DA
                            </span>
                            <span className="text-gray-400">—</span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                                {filters.budgetMax} DA
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200 my-4" />

            {/* Type de chambres */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("chambres")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Type de chambres</span>
                    {expandedSections.chambres ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.chambres && (
                    <div className="space-y-3 pl-1">
                        {ROOM_TYPES.map((room) => (
                            <label key={room.id} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.roomTypes.includes(room.id)}
                                    onChange={() => handleFilterChange("roomTypes", room.id)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900">{room.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            <div className="border-t border-gray-200 my-4" />

            {/* Services */}
            <div className="mb-6">
                <button
                    onClick={() => toggleSection("services")}
                    className="flex items-center justify-between w-full mb-3 font-bold text-gray-800 hover:text-sky-600 transition-colors"
                >
                    <span className="text-base">Service</span>
                    {expandedSections.services ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {expandedSections.services && (
                    <div className="space-y-3 pl-1 max-h-80 overflow-y-auto filter-scroll">
                        {SERVICES.map((service) => {
                            const Icon = service.icon;
                            return (
                                <label key={service.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={filters.services.includes(service.id)}
                                        onChange={() => handleFilterChange("services", service.id)}
                                        className="w-4 h-4 rounded border-2 border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                    />
                                    <Icon size={16} className="text-gray-400 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{service.label}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Apply Button */}
            <div className="mt-6 pt-4 border-t-2 border-sky-100">
                <button
                    onClick={() => onFilterChange?.(filters)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                    <SlidersHorizontal size={20} /> Appliquer les Filtres
                </button>
            </div>
        </div>
    );
}

export default HotelsFiltering;
