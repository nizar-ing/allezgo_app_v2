// src/pages/E_Visa.jsx
import {
    useState,
    memo,
    useCallback,
    useMemo,
    useEffect,
    useRef
} from "react";
import { flushSync } from "react-dom"; // ✅ THE ULTIMATE FIX: Forces instant DOM paint
import {
    FileText,
    ChevronDown,
    Plane,
    Clock,
    AlertCircle,
    CheckCircle,
    Menu,
    X,
    Loader2
} from "lucide-react";
import { validateVisaData } from "../utils/validateVisaData.js";
import useEVisas from "../custom-hooks/useEVisas.js"; 
import Loader from "../ui/Loader.jsx"; 

/* -------------------------------------------------------------------------- */
/* Helper Functions & Sub-Components                                          */
/* -------------------------------------------------------------------------- */

const hasDurationMode = (country) => {
    return country?.durationMode && country?.durationMode?.duration;
};

const getCurrentPrice = (country, durationIndex, demandeIndex) => {
    if (!hasDurationMode(country)) return country?.price;
    const { durationMode } = country;
    if (durationMode?.demandeOccurrence) return durationMode.price[demandeIndex];
    return durationMode.price[durationIndex];
};

const getCurrentDuration = (country, durationIndex) => {
    if (!hasDurationMode(country)) return country?.duration;
    return country.durationMode.duration[durationIndex];
};

const getCurrentDescription = (country, durationIndex, demandeIndex) => {
    if (Array.isArray(country?.description)) {
        if (country.durationMode?.demandeOccurrence) {
            return country.description[demandeIndex] || country.description[0];
        }
        return country.description[durationIndex] || country.description[0];
    }
    return country?.description;
};

const getCurrentRequirements = (country, durationIndex, demandeIndex) => {
    if (country?.requirementsByDemande) {
        if (country.durationMode?.demandeOccurrence) {
            const demandeType = country.durationMode.demandeOccurrence[demandeIndex];
            return country.requirementsByDemande[demandeType] ||
                country.requirementsByDemande[Object.keys(country.requirementsByDemande)[0]] ||
                [];
        }
        if (country.durationMode?.duration) {
            const durationType = country.durationMode.duration[durationIndex];
            return country.requirementsByDemande[durationType] ||
                country.requirementsByDemande[Object.keys(country.requirementsByDemande)[0]] ||
                [];
        }
    }
    return country?.requirements || [];
};

const formatPrice = (price) => {
    if (!price && price !== 0) return "N/A";
    if (typeof price === 'string') return price;
    return `${price.toLocaleString('fr-DZ')} DZD`;
};

const SelectionCard = memo(function SelectionCard({ title, options = [], selectedIndex, onChange, icon }) {
    if (!options.length) return null;
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                {icon}
                {title}
            </label>
            <div className="space-y-2" role="radiogroup" aria-label={title}>
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onChange(index)}
                        role="radio"
                        aria-checked={selectedIndex === index}
                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                            selectedIndex === index
                                ? "bg-gradient-to-r from-cyan-500 to-sky-700 text-white shadow-md"
                                : "bg-slate-50 text-slate-700 hover:bg-cyan-50"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
});

const CountryButton = memo(function CountryButton({ index, country, flagUrl, isSelected, onSelect }) {
    const handleClick = useCallback(() => {
        onSelect(index);
    }, [index, onSelect]);

    return (
        <button
            onClick={handleClick}
            aria-pressed={isSelected}
            aria-label={`Sélectionner ${country}`}
            className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
                isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-sky-700 text-white shadow-lg scale-105"
                    : "bg-slate-50 hover:bg-cyan-50 text-slate-700"
            }`}
        >
            <img
                src={flagUrl || '/placeholder-flag.png'}
                alt={`Drapeau de ${country}`}
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                fetchpriority="low"
                className="rounded-md shrink-0 w-8 h-8 sm:w-10 sm:h-10 object-cover"
            />
            <span className="font-semibold truncate flex-1 text-sm sm:text-base text-left">{country}</span>
            <ChevronDown
                className={`w-4 h-4 transition-transform shrink-0 ${
                    isSelected ? "rotate-180" : ""
                }`}
                aria-hidden="true"
            />
        </button>
    );
});

const DescriptionTab = memo(function DescriptionTab({ country, durationIndex, demandeIndex }) {
    const currentDuration = getCurrentDuration(country, durationIndex);
    const currentPrice = getCurrentPrice(country, durationIndex, demandeIndex);
    const currentDescription = getCurrentDescription(country, durationIndex, demandeIndex);
    const currentRequirements = getCurrentRequirements(country, durationIndex, demandeIndex);

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <InfoCard icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>} title="Durée" value={currentDuration || "Non spécifié"} color="bg-cyan-500" />
                <InfoCard icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>} title="Traitement" value={country.processingTime || "Standard"} color="bg-purple-500" />
                <InfoCard icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white"/>} title="Prix" value={formatPrice(currentPrice)} color="bg-emerald-500" />
            </div>

            <Section title="Description du visa" icon={<FileText/>}>
                {currentDescription || "Aucune description disponible pour le moment."}
            </Section>

            <Section title="Documents requis" icon={<CheckCircle/>}>
                {currentRequirements && currentRequirements.length > 0 ? (
                    <ul className="space-y-2" role="list">
                        {currentRequirements.map((req, i) => (
                            <li key={i} className="flex gap-2">
                                <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-500 text-white text-xs sm:text-sm font-bold shrink-0 mt-0.5" aria-hidden="true">{i + 1}</span>
                                <span className="text-slate-700 text-sm sm:text-base">{req}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-sm italic">Aucun document requis spécifié pour cette sélection.</p>
                )}
            </Section>
        </div>
    );
});

const ConditionTab = memo(function ConditionTab({country}) {
    return (
        <Section title="Conditions importantes" icon={<AlertCircle/>}>
            <p className="whitespace-pre-line text-slate-700 text-sm sm:text-base">
                {country.constraints || "Aucune condition particulière."}
            </p>
        </Section>
    );
});

const InfoCard = memo(({icon, title, value, color}) => (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 flex items-center gap-2 sm:gap-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl flex items-center justify-center shadow-md shrink-0`} aria-hidden="true">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">{title}</p>
            <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{value}</p>
        </div>
    </div>
));

const Section = memo(({title, icon, children}) => (
    <section className="bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-xl p-4 sm:p-6 border border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
            <span className="text-cyan-600" aria-hidden="true">{icon}</span>
            {title}
        </h3>
        <div className="text-slate-700">{children}</div>
    </section>
));

const TabButton = memo(function TabButton({active, onClick, icon, label}) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2.5 sm:py-3 font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 text-sm sm:text-base ${
                active ? "text-sky-700 border-b-2 border-sky-800" : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
            }`}
            aria-selected={active}
            role="tab"
            aria-label={label}
        >
            <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center" aria-hidden="true">{icon}</span>
            {label}
        </button>
    );
});

/* -------------------------------------------------------------------------- */
/* Memoized Heavy Main Content                                                */
/* -------------------------------------------------------------------------- */

const MemoizedHeavyContent = memo(function MemoizedHeavyContent({
    selectedCountry,
    currentPrice,
    durationIndex,
    setDurationIndex,
    demandeIndex,
    setDemandeIndex,
    activeTab,
    setActiveTab
}) {
    return (
        <>
            <header className="bg-gradient-to-r from-[#1e3a5f] via-[#2c5f7c] to-[#1e3a5f] p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <img
                            src={selectedCountry.flagUrl || '/placeholder-flag.png'}
                            alt={`Drapeau de ${selectedCountry.country}`}
                            width={80}
                            height={80}
                            loading="eager"
                            decoding="async"
                            fetchpriority="high"
                            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-28 lg:h-28 rounded-lg shadow-lg border-2 border-white/20 shrink-0 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {selectedCountry.country.toUpperCase()}
                                </h2>
                                <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white border border-white/30 w-fit">
                                    E-Visa
                                </span>
                            </div>
                            <p className="text-cyan-100 mt-1 flex items-center gap-2 text-xs sm:text-sm">
                                <Plane className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true"/>
                                Demande de visa électronique
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl p-3 sm:p-4 shadow-xl border border-white/20 w-full sm:w-auto sm:min-w-[180px] lg:min-w-[200px]">
                        <p className="text-cyan-100 text-xs font-medium mb-1">
                            À partir de
                        </p>
                        <p className="text-white text-xl sm:text-2xl font-bold">
                            {formatPrice(currentPrice)}
                        </p>
                        <p className="text-cyan-100 text-xs mt-1">
                            par personne
                        </p>
                    </div>
                </div>
            </header>

            <div className="p-3 sm:p-4 md:p-6">
                {hasDurationMode(selectedCountry) && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectionCard
                            title="Choisir la durée"
                            options={selectedCountry.durationMode.duration}
                            selectedIndex={durationIndex}
                            onChange={setDurationIndex}
                            icon={<Clock className="w-4 h-4" />}
                        />
                        {selectedCountry.durationMode.demandeOccurrence && (
                            <SelectionCard
                                title="Type de demande"
                                options={selectedCountry.durationMode.demandeOccurrence}
                                selectedIndex={demandeIndex}
                                onChange={setDemandeIndex}
                                icon={<FileText className="w-4 h-4" />}
                            />
                        )}
                    </div>
                )}

                <div className="flex border-b border-slate-300 mb-4 sm:mb-6" role="tablist" aria-label="Informations sur le visa">
                    <TabButton
                        active={activeTab === "description"}
                        onClick={() => setActiveTab("description")}
                        icon={<FileText/>}
                        label="Description"
                    />
                    <TabButton
                        active={activeTab === "condition"}
                        onClick={() => setActiveTab("condition")}
                        icon={<AlertCircle/>}
                        label="Conditions"
                    />
                </div>

                <div role="tabpanel" aria-label={activeTab === "description" ? "Description du visa" : "Conditions du visa"}>
                    {activeTab === "description" ? (
                        <DescriptionTab
                            country={selectedCountry}
                            durationIndex={durationIndex}
                            demandeIndex={demandeIndex}
                        />
                    ) : (
                        <ConditionTab country={selectedCountry}/>
                    )}
                </div>
            </div>
        </>
    );
});


/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function EVisa() {
    const { data: visaData, loading, error } = useEVisas();

    const [sidebarIndex, setSidebarIndex] = useState(0); 
    const [contentIndex, setContentIndex] = useState(0); 
    const [isPending, setIsPending] = useState(false); 

    const [activeTab, setActiveTab] = useState("description");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [durationIndex, setDurationIndex] = useState(0);
    const [demandeIndex, setDemandeIndex] = useState(0);

    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const sidebarIndexRef = useRef(0);

    const selectedCountry = useMemo(() => {
        if (!visaData || visaData.length === 0) return null;
        return visaData[contentIndex] || visaData[0];
    }, [visaData, contentIndex]);

    const currentPrice = useMemo(() => {
        if (!selectedCountry) return 0;
        return getCurrentPrice(selectedCountry, durationIndex, demandeIndex);
    }, [selectedCountry, durationIndex, demandeIndex]);

    useEffect(() => {
        if (visaData && visaData.length > 0) {
            const validation = validateVisaData(visaData);
            if (!validation.valid) {
                console.error('Invalid visa data structure detected:', validation.errors);
            }
        }
    }, [visaData]);

    useEffect(() => {
        if (selectedCountry?.flagUrl) {
            const img = new Image();
            img.src = selectedCountry.flagUrl;
        }
    }, [selectedCountry?.flagUrl]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isSidebarOpen) setIsSidebarOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isSidebarOpen]);

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isSidebarOpen]);

    // ✅ THE FLUSHSYNC FIX: Forces the browser to paint the button instantly
    const handleCountrySelect = useCallback((index) => {
        if (sidebarIndexRef.current === index) return; 
        sidebarIndexRef.current = index;

        // 1. flushSync completely overrides React's background rendering
        // and guarantees this state updates the DOM immediately at 0ms.
        flushSync(() => {
            setSidebarIndex(index);
            setIsSidebarOpen(false); 
            setIsPending(true);
        });
        
        // 2. Now that the button is blue, tell React to load the heavy content
        // We add a 50ms delay to ensure the browser has fully processed the paint cycle
        setTimeout(() => {
            setContentIndex(index);
            setDurationIndex(0);
            setDemandeIndex(0);
            setActiveTab("description");
            setIsPending(false); 
        }, 50); 
    }, []);

    const handleTouchStart = useCallback((e) => setTouchStart(e.touches[0].clientX), []);
    const handleTouchMove = useCallback((e) => setTouchEnd(e.touches[0].clientX), []);
    const handleTouchEnd = useCallback(() => {
        if (touchStart - touchEnd > 75) setIsSidebarOpen(false);
        setTouchStart(0);
        setTouchEnd(0);
    }, [touchStart, touchEnd]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-slate-50">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h3>
                <p className="text-gray-600">{error.message || "Impossible de charger les E-Visas."}</p>
            </div>
        );
    }

    if (!visaData || visaData.length === 0 || !selectedCountry) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
                 <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Aucun E-Visa disponible</h3>
                <p className="text-gray-600">Revenez plus tard pour voir nos offres de visas.</p>
            </div>
        );
    }

    return (
        <section
            className="min-h-screen w-11/12 mx-auto bg-gradient-to-r from-slate-300 via-sky-800 to-slate-300 p-3 sm:p-4 md:p-6 border-slate-600 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.1),inset_4px_4px_8px_rgba(255,255,255,0.9),8px_8px_16px_rgba(0,0,0,0.2)]"
            aria-label="Demande de visa électronique"
        >
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8 text-white">
                DEMANDE DE VISA
            </h1>

            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 bg-gradient-to-r from-cyan-500 to-sky-700 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isSidebarOpen}
                aria-controls="sidebar-navigation"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-fadeIn"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
                <aside
                    id="sidebar-navigation"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`bg-white rounded-xl shadow-md p-3 sm:p-4 space-y-2 border border-slate-200 lg:relative lg:translate-x-0 lg:h-auto fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] h-full transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} overflow-y-auto`}
                    aria-label="Navigation des destinations"
                >
                    <div className="sticky top-0 bg-white pb-3 z-10 border-b border-slate-100 lg:border-0">
                        <div className="flex items-center justify-between lg:justify-center">
                            <h2 className="font-bold text-sky-800 flex items-center gap-2 text-lg sm:text-xl lg:text-2xl">
                                <Plane className="text-sky-700" size={24} aria-hidden="true"/>
                                Destinations
                            </h2>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Fermer le menu des destinations"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <nav className="space-y-2 pb-4" role="navigation" aria-label="Liste des pays">
                        {visaData.map((visa, index) => (
                            <CountryButton
                                key={visa.country}
                                index={index}
                                country={visa.country}
                                flagUrl={visa.flagUrl}
                                isSelected={index === sidebarIndex}
                                onSelect={handleCountrySelect}
                            />
                        ))}
                    </nav>
                </aside>

                <main className="lg:col-span-4 relative bg-white rounded-xl shadow-md overflow-hidden border border-slate-200" role="main">
                    
                    {/* Transition Overlay */}
                    {isPending && (
                        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200">
                            <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                                <span className="font-semibold text-sky-800">Chargement...</span>
                            </div>
                        </div>
                    )}

                    <div className={`transition-all duration-300 ${isPending ? 'opacity-50 blur-[1px] scale-[0.99]' : 'opacity-100 blur-0 scale-100'}`}>
                        <MemoizedHeavyContent
                            selectedCountry={selectedCountry}
                            currentPrice={currentPrice}
                            durationIndex={durationIndex}
                            setDurationIndex={setDurationIndex}
                            demandeIndex={demandeIndex}
                            setDemandeIndex={setDemandeIndex}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                </main>
            </div>
        </section>
    );
}