// src/ui/Carrousel.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { IoChevronBack, IoChevronForward, IoPause, IoPlay, IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';

const Carrousel = ({
                       images = [],
                       autoPlayInterval = 6000,
                       showControls = true,
                       showDots = true,
                       showPlayPause = true,
                       videoAutoPlay = true,
                       videoMuted = true,
                   }) => {
    const [currentIndex,    setCurrentIndex]    = useState(0);
    const [isAutoPlaying,   setIsAutoPlaying]   = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMuted,         setIsMuted]         = useState(videoMuted);
    const [isFirstLoad,     setIsFirstLoad]     = useState(true);
    const videoRefs = useRef([]);

    const isVideo = (url) => {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    const currentMedia    = images[currentIndex];
    const isCurrentVideo  = currentMedia ? isVideo(currentMedia.url) : false;

    const goToSlide = useCallback((index) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        const currentVideoRef = videoRefs.current[currentIndex];
        if (currentVideoRef) {
            currentVideoRef.pause();
            currentVideoRef.currentTime = 0;
        }
        setCurrentIndex(index);
        setTimeout(() => {
            setIsTransitioning(false);
            const newVideoRef = videoRefs.current[index];
            if (newVideoRef && videoAutoPlay) {
                newVideoRef.play().catch(err => console.log('Video autoplay failed:', err));
            }
        }, 500);
    }, [isTransitioning, currentIndex, videoAutoPlay]);

    const goToNext = useCallback(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        goToSlide(nextIndex);
    }, [currentIndex, images.length, goToSlide]);

    const goToPrevious = useCallback(() => {
        const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
        goToSlide(prevIndex);
    }, [currentIndex, images.length, goToSlide]);

    const toggleAutoPlay = useCallback(() => {
        setIsAutoPlaying(prev => !prev);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newMutedState = !prev;
            videoRefs.current.forEach(video => {
                if (video) video.muted = newMutedState;
            });
            return newMutedState;
        });
    }, []);

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(goToNext, autoPlayInterval);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext, autoPlayInterval]);

    // Autoplay first video on initial load
    useEffect(() => {
        if (isFirstLoad && images.length > 0) {
            const firstVideoRef = videoRefs.current[0];
            const firstMedia    = images[0];
            if (firstVideoRef && isVideo(firstMedia.url) && videoAutoPlay) {
                const timer = setTimeout(() => {
                    firstVideoRef.play()
                        .then(() => console.log('First video autoplayed successfully'))
                        .catch(err => console.log('First video autoplay failed:', err));
                }, 100);
                setIsFirstLoad(false);
                return () => clearTimeout(timer);
            }
            setIsFirstLoad(false);
        }
    }, [isFirstLoad, images, videoAutoPlay]);

    // Play current video when changing slides
    useEffect(() => {
        if (!isFirstLoad) {
            const currentVideoRef = videoRefs.current[currentIndex];
            if (currentVideoRef && videoAutoPlay) {
                currentVideoRef.play().catch(err => console.log('Video autoplay failed:', err));
            }
        }
    }, [currentIndex, videoAutoPlay, isFirstLoad]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (event) => {
            // ✅ THE FIX: ignore keyboard events when user is typing in any input/textarea.
            // Previously, window.addEventListener captured ALL keydown events globally —
            // including those fired from the LocationSearch <input>. The space key handler
            // called event.preventDefault() unconditionally, which cancelled the space
            // character before the input's onChange could receive it, making it impossible
            // to type multi-word queries like "el mouradi".
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (
                tag === 'input'    ||
                tag === 'textarea' ||
                document.activeElement?.isContentEditable
            ) return;

            if (event.key === 'ArrowLeft')              goToPrevious();
            if (event.key === 'ArrowRight')             goToNext();
            if (event.key === ' ') {
                event.preventDefault(); // safe — only fires when NOT in an input
                toggleAutoPlay();
            }
            if (event.key === 'm' || event.key === 'M') toggleMute();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [goToNext, goToPrevious, toggleAutoPlay, toggleMute]);

    const handleScroll = (e) => {
        e.preventDefault();
        const currentScroll  = window.pageYOffset;
        const isMobile       = window.innerWidth <= 768;
        const scrollDistance = isMobile ? window.innerHeight * 0.7 : window.innerHeight;
        const targetScroll   = currentScroll + scrollDistance;
        window.scrollTo({ top: targetScroll * 0.89, behavior: 'smooth' });
    };

    const handleVideoEnd = useCallback(() => {
        goToNext();
    }, [goToNext]);

    return (
        <div className="relative w-full h-[calc(63vh-80px)] md:h-[calc(73vh-80px)] overflow-hidden -mt-2 rounded-2xl custom-shadow-heavy">

            {/* Main carousel container */}
            <div
                className="flex transition-all duration-300 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((media, index) => {
                    const isVideoSlide = isVideo(media.url);
                    return (
                        <div key={index} className="relative flex-shrink-0 w-full h-full">
                            {isVideoSlide ? (
                                <video
                                    ref={el => videoRefs.current[index] = el}
                                    src={media.url}
                                    className="w-full h-full object-cover"
                                    muted={isMuted}
                                    loop={false}
                                    playsInline
                                    preload="auto"
                                    autoPlay={index === 0 && videoAutoPlay}
                                    onEnded={handleVideoEnd}
                                    aria-label={media.alt}
                                />
                            ) : (
                                <img
                                    src={media.url}
                                    alt={media.alt}
                                    className="w-full h-full object-cover"
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                />
                            )}

                            {/* Overlay with title and subtitle */}
                            {(media.title || media.subtitle) && (
                                <div className="absolute inset-0 flex flex-col justify-center items-center gap-14 md:gap-20 text-white px-8 text-center bg-black/10">
                                    <div className="flex flex-col justify-center items-center md:gap-2">
                                        {media.title && (
                                            <h2 className="text-lg md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg animate-fade-in">
                                                {media.title}
                                            </h2>
                                        )}
                                        {media.subtitle && (
                                            <p className="text-sm md:text-xl lg:text-2xl max-w-3xl opacity-90 drop-shadow-md animate-slide-up">
                                                {media.subtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Navigation arrows */}
            {showControls && (
                <>
                    <button
                        onClick={goToPrevious}
                        disabled={isTransitioning}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous slide"
                    >
                        <IoChevronBack className="w-6 h-6 text-sky-700 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={isTransitioning}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next slide"
                    >
                        <IoChevronForward className="w-6 h-6 text-sky-700 group-hover:scale-110 transition-transform" />
                    </button>
                </>
            )}

            {/* Control buttons — Top Right */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Mute/Unmute — only when current slide is video */}
                {isCurrentVideo && (
                    <button
                        onClick={toggleMute}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer"
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                        title={isMuted ? 'Activer le son' : 'Désactiver le son'}
                    >
                        {isMuted
                            ? <IoVolumeMute className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                            : <IoVolumeHigh className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                        }
                    </button>
                )}

                {/* Play/Pause */}
                {showPlayPause && (
                    <button
                        onClick={toggleAutoPlay}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group cursor-pointer"
                        aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                        title={isAutoPlaying ? 'Mettre en pause' : 'Lecture automatique'}
                    >
                        {isAutoPlaying
                            ? <IoPause className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                            : <IoPlay  className="w-5 h-5 text-sky-700 group-hover:scale-110 transition-transform" />
                        }
                    </button>
                )}
            </div>

            {/* Media type indicator badge */}
            <div className="absolute top-4 left-4 z-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isCurrentVideo ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-white text-sm font-semibold">
            {isCurrentVideo ? 'Vidéo' : 'Image'}
          </span>
                </div>
            </div>

            {/* Dot indicators */}
            {showDots && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex space-x-3">
                    {images.map((media, index) => {
                        const isDotVideo = isVideo(media.url);
                        return (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`relative transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'w-3 h-3 scale-150'
                                        : 'w-3 h-3 hover:scale-125'
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                                title={isDotVideo ? 'Vidéo' : 'Image'}
                            >
                                <div className={`w-full h-full rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'bg-orange-600 shadow-lg shadow-orange-500/50'
                                        : 'bg-white/50 hover:bg-white/75'
                                }`} />
                                {isDotVideo && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                <div
                    className="h-full bg-gradient-to-r from-sky-200 to-sky-900 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                />
            </div>

            {/* Slide counter */}
            <div className="absolute bottom-16 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
        <span className="text-white text-sm font-semibold">
          {currentIndex + 1} / {images.length}
        </span>
            </div>

        </div>
    );
};

export default Carrousel;