import { useState, useEffect, useCallback } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

function PartnerCarrousel() {
    // Partner images from public/images/partenaires
    const partners = [
        { name: 'BHR', image: '/images/partenaires/bhr.webp' },
        { name: 'Concorde', image: '/images/partenaires/concorde.png' },
        { name: 'Iberostar', image: '/images/partenaires/iberostar.webp' },
        { name: 'Magic Hotels', image: '/images/partenaires/magic_hotels.png' },
        { name: 'Marhaba', image: '/images/partenaires/marhaba.webp' },
        { name: 'Medina Hotels & Resorts', image: '/images/partenaires/medina.png' },
        { name: 'Mouradi', image: '/images/partenaires/mouradi.jpeg' },
        { name: 'Mövenpick', image: '/images/partenaires/movembick.png' },
        { name: 'Radisson', image: '/images/partenaires/radisson.png' },
        { name: 'Le Sultan', image: '/images/partenaires/sultan.webp' },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(4);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Calculate items per view based on screen size
    useEffect(() => {
        const updateItemsPerView = () => {
            if (window.innerWidth >= 1024) {
                setItemsPerView(4); // Desktop: 4 items
            } else if (window.innerWidth >= 768) {
                setItemsPerView(3); // Tablet: 3 items
            } else if (window.innerWidth >= 640) {
                setItemsPerView(2); // Small mobile: 2 items
            } else {
                setItemsPerView(1); // Very small mobile: 1 item
            }
        };

        updateItemsPerView();
        window.addEventListener('resize', updateItemsPerView);
        return () => window.removeEventListener('resize', updateItemsPerView);
    }, []);

    const maxIndex = Math.max(0, partners.length - itemsPerView);

    const goToNext = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        setTimeout(() => setIsTransitioning(false), 300);
    }, [maxIndex, isTransitioning]);

    const goToPrevious = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
        setTimeout(() => setIsTransitioning(false), 300);
    }, [maxIndex, isTransitioning]);

    // Auto-play functionality
    useEffect(() => {
        const interval = setInterval(goToNext, 5000); // Auto-advance every 5 seconds
        return () => clearInterval(interval);
    }, [goToNext]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'ArrowLeft') goToPrevious();
            if (event.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [goToNext, goToPrevious]);

    return (
        <section className="relative w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-linear-to-br from-white via-slate-50 to-blue-50 overflow-x-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-14">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-sky-700 uppercase tracking-tight mb-2 sm:mb-3">
                        <span className="relative inline-block">
                            NOS PARTENAIRES
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-orange-500 to-transparent"></span>
                        </span>
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-3 sm:mt-4">
                        Découvrez nos partenaires de confiance
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrevious}
                        disabled={isTransitioning}
                        className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-md hover:shadow-lg rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                        aria-label="Partenaire précédent"
                    >
                        <IoChevronBack className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-orange-500 group-hover:text-orange-600 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={isTransitioning}
                        className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-md hover:shadow-lg rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                        aria-label="Partenaire suivant"
                    >
                        <IoChevronForward className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-orange-500 group-hover:text-orange-600 group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Carousel Track */}
                    <div className="overflow-hidden mx-8 sm:mx-10 md:mx-12 lg:mx-16">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                            }}
                        >
                            {partners.map((partner, index) => (
                                <div
                                    key={index}
                                    className="shrink-0 px-1.5 sm:px-2 md:px-3 lg:px-4"
                                    style={{ width: `${100 / itemsPerView}%` }}
                                >
                                    <div className="relative group h-28 sm:h-32 md:h-40 lg:h-48 bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
                                        {/* Logo Container */}
                                        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-6">
                                            <img
                                                src={partner.image}
                                                alt={partner.name}
                                                className="max-w-full max-h-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-linear-to-br from-sky-500/0 to-orange-500/0 group-hover:from-sky-500/5 group-hover:to-orange-500/5 transition-all duration-300"></div>

                                        {/* Partner Name (shown on hover) */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <p className="text-white text-xs md:text-sm font-semibold text-center truncate">
                                                {partner.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 md:mt-10">
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (!isTransitioning) {
                                        setIsTransitioning(true);
                                        setCurrentIndex(index);
                                        setTimeout(() => setIsTransitioning(false), 300);
                                    }
                                }}
                                className={`transition-all duration-300 rounded-full ${
                                    index === currentIndex
                                        ? 'w-8 h-2 bg-orange-500 shadow-md'
                                        : 'w-2 h-2 bg-orange-300 hover:bg-orange-400'
                                }`}
                                aria-label={`Aller au slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default PartnerCarrousel;