import { useState, useEffect } from "react";
import TestimonialCard from "./TestimonialCard.jsx";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

function TestimonialCarousel({ testimonials = [] }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="relative min-h-screen w-full bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center py-6 sm:py-8 md:py-10 px-4 sm:px-6 overflow-hidden">
      {/* Top Decorative Border */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 z-10">
        {/* Base gradient line with glow */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-orange-500 to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-linear-to-r from-orange-600/50 via-orange-400/50 to-orange-600/50 blur-sm"></div>

        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
          style={{
            animation: "shimmer 3s ease-in-out infinite",
          }}
        ></div>

        {/* Decorative geometric shapes - Center diamond */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-orange-500 rotate-45 shadow-lg shadow-orange-500/70 border border-orange-300"></div>

        {/* Left side decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden sm:block absolute left-[5%] top-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/60 border-2 border-orange-300/50"></div>
        <div className="hidden md:block absolute left-[12%] top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-300 rounded-full shadow-md"></div>
        <div className="hidden lg:block absolute left-[18%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400/80 rounded-full"></div>
        <div className="hidden xl:block absolute left-[25%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-orange-500/60 rotate-45 border border-orange-300/40"></div>

        {/* Right side decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden sm:block absolute right-[5%] top-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/60 border-2 border-orange-300/50"></div>
        <div className="hidden md:block absolute right-[12%] top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-300 rounded-full shadow-md"></div>
        <div className="hidden lg:block absolute right-[18%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400/80 rounded-full"></div>
        <div className="hidden xl:block absolute right-[25%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-orange-500/60 rotate-45 border border-orange-300/40"></div>
      </div>

      {/* Top Border Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-orange-600 via-orange-400 to-orange-600 opacity-70"></div>

      {/* Bottom Decorative Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 z-10">
        {/* Base gradient line with glow */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-orange-500 to-transparent opacity-90"></div>
        <div className="absolute inset-0 bg-linear-to-r from-orange-600/50 via-orange-400/50 to-orange-600/50 blur-sm"></div>

        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
          style={{
            animation: "shimmer 3s ease-in-out infinite",
          }}
        ></div>

        {/* Decorative geometric shapes - Center diamond */}
        <div className="absolute left-1/2 bottom-1/2 translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-orange-500 rotate-45 shadow-lg shadow-orange-500/70 border border-orange-300"></div>

        {/* Left side decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden sm:block absolute left-[5%] bottom-1/2 translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/60 border-2 border-orange-300/50"></div>
        <div className="hidden md:block absolute left-[12%] bottom-1/2 translate-y-1/2 w-2 h-2 bg-orange-300 rounded-full shadow-md"></div>
        <div className="hidden lg:block absolute left-[18%] bottom-1/2 translate-y-1/2 w-1.5 h-1.5 bg-orange-400/80 rounded-full"></div>
        <div className="hidden xl:block absolute left-[25%] bottom-1/2 translate-y-1/2 w-2.5 h-2.5 bg-orange-500/60 rotate-45 border border-orange-300/40"></div>

        {/* Right side decorative elements - Hidden on mobile, visible on larger screens */}
        <div className="hidden sm:block absolute right-[5%] bottom-1/2 translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-orange-400 rounded-full shadow-lg shadow-orange-400/60 border-2 border-orange-300/50"></div>
        <div className="hidden md:block absolute right-[12%] bottom-1/2 translate-y-1/2 w-2 h-2 bg-orange-300 rounded-full shadow-md"></div>
        <div className="hidden lg:block absolute right-[18%] bottom-1/2 translate-y-1/2 w-1.5 h-1.5 bg-orange-400/80 rounded-full"></div>
        <div className="hidden xl:block absolute right-[25%] bottom-1/2 translate-y-1/2 w-2.5 h-2.5 bg-orange-500/60 rotate-45 border border-orange-300/40"></div>
      </div>

      {/* Bottom Border Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-orange-600 via-orange-400 to-orange-600 opacity-70"></div>

      {/* CSS Animation for Shimmer Effect */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-15deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Optional Header */}
      <div className="text-center mb-8 sm:mb-12 md:mb-16 max-w-3xl px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 font-bold text-white bg-clip-text">
          Ce que disent nos clients
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
          Ne nous croyez pas sur parole - découvrez l'avis de nos clients
          satisfaits
        </p>
      </div>

      {/* Main Carousel Container - Full width utilization */}
      <div className="w-full max-w-7xl flex-1 flex items-center justify-center px-2 sm:px-4">
        <div className="relative w-full h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] flex items-center justify-center overflow-hidden">
          {/* Overlapping Cards with Enhanced Effects */}
          {testimonials.map((testimonial, index) => {
            const position = index - activeIndex;
            const isActive = index === activeIndex;

            // Responsive card spacing based on window width
            const cardSpacing =
              windowWidth < 640
                ? 280
                : windowWidth < 768
                ? 320
                : windowWidth < 1024
                ? 350
                : 380;
            const cardScale = isActive
              ? windowWidth < 640
                ? 1
                : 1.05
              : windowWidth < 640
              ? 0.9
              : 0.85;
            const translateY = isActive
              ? windowWidth < 640
                ? "-5px"
                : "-10px"
              : "0px";
            const opacity =
              Math.abs(position) > 1
                ? 0
                : isActive
                ? 1
                : windowWidth < 640
                ? 0.6
                : 0.4;
            const blur = isActive ? 0 : windowWidth < 640 ? 1 : 2;
            const brightness = isActive ? 1 : windowWidth < 640 ? 0.8 : 0.7;

            return (
              <div
                key={index}
                onClick={() => setActiveIndex(index)}
                className="absolute transition-all duration-700 ease-in-out cursor-pointer"
                style={{
                  transform: `translateX(${
                    position * cardSpacing
                  }px) scale(${cardScale}) translateY(${translateY})`,
                  zIndex: isActive ? 40 : 30 - Math.abs(position),
                  opacity: opacity,
                  pointerEvents: Math.abs(position) > 1 ? "none" : "auto",
                  filter: `brightness(${brightness}) blur(${blur}px)`,
                }}
              >
                <TestimonialCard {...testimonial} isActive={isActive} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls - Enhanced Design */}
      <div className="mt-6 sm:mt-8 md:mt-12 space-y-4 sm:space-y-6">
        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "bg-orange-500 w-8 h-3 sm:w-10 sm:h-3.5 md:w-12 md:h-4 shadow-lg shadow-orange-500/50"
                  : "bg-orange-300/60 hover:bg-orange-400 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 hover:scale-110 hover:shadow-md hover:shadow-orange-400/50"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <div className="flex justify-center gap-3 sm:gap-4">
          <button
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeIndex === 0}
            className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-[#F5F5F5] rounded-lg sm:rounded-xl border border-gray-300/50 text-gray-800 font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:bg-[#F5F5F5] disabled:hover:text-gray-800 disabled:hover:border-gray-300/50 disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <IoChevronBack className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>
          <button
            onClick={() =>
              setActiveIndex((prev) =>
                Math.min(testimonials.length - 1, prev + 1)
              )
            }
            disabled={activeIndex === testimonials.length - 1}
            className="group flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 bg-[#F5F5F5] rounded-lg sm:rounded-xl border border-gray-300/50 text-gray-800 font-semibold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:bg-[#F5F5F5] disabled:hover:text-gray-800 disabled:hover:border-gray-300/50 disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <IoChevronForward className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default TestimonialCarousel;
