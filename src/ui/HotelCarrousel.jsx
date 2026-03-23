import { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

/**
 * Enhanced Responsive Carousel - Max 3 Cards with Smart Responsive Behavior
 */
function HotelCarousel({
                           items = [],
                           renderItem,
                           accentColor = "bg-sky-700",
                           showArrows = true,
                           showIndicators = true,
                           autoPlay = false,
                           autoPlayInterval = 5000,
                           className = ""
                       }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerView, setCardsPerView] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const containerRef = useRef(null);
    const autoPlayRef = useRef(null);

    // Responsive cards per view with max 3
    useEffect(() => {
        const updateCardsPerView = () => {
            const width = window.innerWidth;

            if (width < 640) {
                // Mobile: 1 card
                setCardsPerView(1);
            } else if (width >= 640 && width < 1024) {
                // Tablet: 2 cards
                setCardsPerView(2);
            } else {
                // Desktop: 3 cards (maximum)
                setCardsPerView(3);
            }
        };

        updateCardsPerView();

        window.addEventListener('resize', updateCardsPerView);
        return () => window.removeEventListener('resize', updateCardsPerView);
    }, []);

    // Calculate max scroll index
    const maxIndex = Math.max(0, items.length - cardsPerView);

    // Auto-play
    useEffect(() => {
        if (!autoPlay || items.length <= cardsPerView) return;

        autoPlayRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev >= maxIndex) return 0;
                return prev + 1;
            });
        }, autoPlayInterval);

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [autoPlay, autoPlayInterval, items.length, cardsPerView, maxIndex]);

    // Pause auto-play on hover
    const handleMouseEnter = useCallback(() => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (!autoPlay || items.length <= cardsPerView) return;

        autoPlayRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, autoPlayInterval);
    }, [autoPlay, autoPlayInterval, items.length, cardsPerView, maxIndex]);

    // Navigation
    const handlePrev = useCallback(() => {
        if (isTransitioning || currentIndex === 0) return;

        setIsTransitioning(true);
        setCurrentIndex((prev) => Math.max(0, prev - 1));

        setTimeout(() => setIsTransitioning(false), 500);
    }, [currentIndex, isTransitioning]);

    const handleNext = useCallback(() => {
        if (isTransitioning || currentIndex >= maxIndex) return;

        setIsTransitioning(true);
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

        setTimeout(() => setIsTransitioning(false), 500);
    }, [currentIndex, maxIndex, isTransitioning]);

    const goToSlide = useCallback((index) => {
        if (isTransitioning || index === currentIndex) return;

        setIsTransitioning(true);
        setCurrentIndex(Math.min(index, maxIndex));

        setTimeout(() => setIsTransitioning(false), 500);
    }, [currentIndex, maxIndex, isTransitioning]);

    // Touch handlers for mobile swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                handlePrev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleNext();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(maxIndex);
                break;
            default:
                break;
        }
    }, [handlePrev, handleNext, goToSlide, maxIndex]);

    if (!items || items.length === 0) {
        return (
            <div className="w-full text-center py-12 text-gray-500 font-medium">
                Aucun élément à afficher
            </div>
        );
    }

    // Static grid for few items (no carousel needed)
    if (items.length <= cardsPerView) {
        return (
            <div className={`w-full ${className}`}>
                <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, index) => (
                        <div key={item.id || index} className="w-full">
                            {renderItem(item)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full group ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Carrousel d'hôtels"
            aria-live={autoPlay ? "off" : "polite"}
        >
            {/* Carousel Track */}
            <div className="relative w-full overflow-hidden px-1 py-4">
                <div
                    className="grid transition-transform duration-500 ease-out"
                    style={{
                        gridTemplateColumns: `repeat(${items.length}, 100%)`,
                        gap: '0',
                        transform: `translateX(-${currentIndex * 100}%)`,
                    }}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {items.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="w-full px-2 sm:px-3"
                            aria-hidden={
                                index < currentIndex || index >= currentIndex + cardsPerView
                            }
                        >
                            {/* Grid for visible cards within each slide */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                                {items.slice(index, index + cardsPerView).map((slideItem, slideIndex) => (
                                    <div
                                        key={slideItem.id || slideIndex}
                                        className="w-full"
                                        style={{
                                            display: index + slideIndex < items.length ? 'block' : 'none'
                                        }}
                                    >
                                        {renderItem(slideItem)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium Navigation Arrows */}
            {showArrows && items.length > cardsPerView && (
                <>
                    {/* Left Arrow */}
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="absolute -left-2 sm:-left-3 md:-left-4 lg:-left-5 xl:-left-6
                                   top-1/2 -translate-y-1/2 z-30
                                   w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                                   bg-white/95 backdrop-blur-md
                                   rounded-full
                                   shadow-[0_4px_20px_rgba(0,0,0,0.15)]
                                   flex items-center justify-center
                                   transition-all duration-300 ease-out
                                   border-2 border-gray-200
                                   opacity-0 group-hover:opacity-100
                                   hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)]
                                   hover:scale-110
                                   hover:border-blue-300
                                   hover:bg-white
                                   active:scale-95
                                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                                   focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                        aria-label="Diapositive précédente"
                        aria-disabled={currentIndex === 0}
                    >
                        <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-700 hover:text-blue-600 transition-colors duration-300" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={handleNext}
                        disabled={currentIndex >= maxIndex}
                        className="absolute -right-2 sm:-right-3 md:-right-4 lg:-right-5 xl:-right-6
                                   top-1/2 -translate-y-1/2 z-30
                                   w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16
                                   bg-white/95 backdrop-blur-md
                                   rounded-full
                                   shadow-[0_4px_20px_rgba(0,0,0,0.15)]
                                   flex items-center justify-center
                                   transition-all duration-300 ease-out
                                   border-2 border-gray-200
                                   opacity-0 group-hover:opacity-100
                                   hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)]
                                   hover:scale-110
                                   hover:border-blue-300
                                   hover:bg-white
                                   active:scale-95
                                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
                                   focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                        aria-label="Diapositive suivante"
                        aria-disabled={currentIndex >= maxIndex}
                    >
                        <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-700 hover:text-blue-600 transition-colors duration-300" />
                    </button>
                </>
            )}

            {/* Elegant Indicators */}
            {showIndicators && items.length > cardsPerView && (
                <div
                    className="flex justify-center items-center gap-2 mt-6 sm:mt-7 lg:mt-8"
                    role="tablist"
                    aria-label="Navigation du carrousel"
                >
                    {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full
                                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
                                       ${
                                index === currentIndex
                                    ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-8 sm:w-10 md:w-12 h-2.5 sm:h-3 shadow-lg shadow-blue-300/50'
                                    : 'bg-gray-300 hover:bg-gray-400 w-2.5 sm:w-3 h-2.5 sm:h-3 hover:scale-125'
                            }`}
                            aria-label={`Aller à la diapositive ${index + 1}`}
                            aria-current={index === currentIndex ? 'true' : 'false'}
                            role="tab"
                        />
                    ))}
                </div>
            )}

            {/* Screen Reader Info */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                Affichage de {cardsPerView} carte{cardsPerView > 1 ? 's' : ''} - Diapositive {currentIndex + 1} sur {maxIndex + 1}
            </div>
        </div>
    );
}

export default HotelCarousel;