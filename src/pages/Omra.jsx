import { useState, useMemo } from 'react';
import { MapPin, AlertCircle, Search, SlidersHorizontal, X } from "lucide-react";
import DestinationCard from "../components/DestinationCard.jsx";
import PageLoader from "../ui/PageLoader.jsx";
import { useOmraDestinations } from "../custom-hooks/useDestinations.js";
import useDebounce from "../custom-hooks/useDebounce.js";

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommandé' },
    { value: 'price-asc',   label: 'Prix croissant' },
    { value: 'price-desc',  label: 'Prix décroissant' },
    { value: 'duration',    label: 'Durée' },
    { value: 'name-asc',    label: 'Nom (A-Z)' },
];

function getMinPrice(pricing) {
    if (!pricing) return Infinity;
    const vals = [pricing.double, pricing.triple, pricing.single].filter(
        (v) => typeof v === 'number' && v > 0,
    );
    return vals.length ? Math.min(...vals) : Infinity;
}

function Omra() {
    const { data: destinations, loading, error } = useOmraDestinations();
    const [rawSearch, setRawSearch] = useState('');
    const [sortBy, setSortBy] = useState('recommended');

    const search = useDebounce(rawSearch, 300);

    const filtered = useMemo(() => {
        if (!Array.isArray(destinations)) return [];

        let list = destinations;

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (d) =>
                    d.name?.toLowerCase().includes(q) ||
                    (d.mainCities || []).some((c) => c.toLowerCase().includes(q)),
            );
        }

        switch (sortBy) {
            case 'price-asc':
                list = [...list].sort((a, b) => getMinPrice(a.pricing) - getMinPrice(b.pricing));
                break;
            case 'price-desc':
                list = [...list].sort((a, b) => getMinPrice(b.pricing) - getMinPrice(a.pricing));
                break;
            case 'duration':
                list = [...list].sort((a, b) => (a.duration?.days ?? 0) - (b.duration?.days ?? 0));
                break;
            case 'name-asc':
                list = [...list].sort((a, b) => a.name?.localeCompare(b.name, 'fr'));
                break;
            default:
                break;
        }

        return list;
    }, [destinations, search, sortBy]);

    const hasDestinations = Array.isArray(destinations) && destinations.length > 0;
    const hasResults = filtered.length > 0;

    if (loading) return <PageLoader section />;

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h3>
                <p className="text-gray-600">{error.message || "Impossible de charger les programmes Omra."}</p>
            </div>
        );
    }

    return (
        <section className="relative w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden min-h-screen">
            <title>Omra — AllezGoo | Packages Omra depuis l'Algérie</title>
            <meta name="description" content="Réservez votre Omra avec AllezGoo : packages complets depuis l'Algérie, hébergements à La Mecque et Médine, accompagnement spirituel." />
            <meta property="og:title" content="Omra — AllezGoo" />
            <meta property="og:url" content="https://allezgoo.com/omra" />
            <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-[1600px] mx-auto">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-4xl lg:text-5xl font-bold text-emerald-700 mb-3">
                            Nos Programmes Omra
                        </h2>
                        {hasDestinations && (
                            <p className="text-slate-500 text-base">
                                {destinations.length} programme{destinations.length > 1 ? 's' : ''} disponible{destinations.length > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Search + Sort bar */}
                    {hasDestinations && (
                        <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-2xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={rawSearch}
                                    onChange={(e) => setRawSearch(e.target.value)}
                                    placeholder="Rechercher un programme…"
                                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-emerald-100 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                                />
                                {rawSearch && (
                                    <button
                                        onClick={() => setRawSearch('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        aria-label="Effacer la recherche"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 rounded-xl border border-emerald-100 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none cursor-pointer w-full sm:w-auto"
                                >
                                    {SORT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Card grid */}
                    {!hasDestinations ? (
                        <div className="max-w-4xl mx-auto text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-6">
                                <MapPin className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                                Aucun programme disponible
                            </h3>
                            <p className="text-slate-500">
                                Nos prochains programmes Omra seront bientôt disponibles. Restez à l&apos;écoute !
                            </p>
                        </div>
                    ) : !hasResults ? (
                        <div className="max-w-4xl mx-auto text-center py-20">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-6">
                                <Search className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                                Aucun résultat pour votre recherche
                            </h3>
                            <p className="text-slate-500 mb-6">
                                Aucun programme ne correspond à «&nbsp;<strong>{rawSearch}</strong>&nbsp;».
                            </p>
                            <button
                                onClick={() => { setRawSearch(''); setSortBy('recommended'); }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
                            >
                                <X className="w-4 h-4" />
                                Effacer les filtres
                            </button>
                        </div>
                    ) : (
                        <div className="w-full px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-14 gap-y-8 lg:gap-x-20 lg:gap-y-10 xl:gap-x-28 xl:gap-y-12">
                                {filtered.map((destination, index) => (
                                    <div
                                        key={destination.id}
                                        className="animate-fade-in-up w-full"
                                        style={{ animationDelay: `${index * 80}ms` }}
                                    >
                                        <DestinationCard {...destination} basePath="/omra" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/50 to-emerald-400/0" />
        </section>
    );
}

export default Omra;
