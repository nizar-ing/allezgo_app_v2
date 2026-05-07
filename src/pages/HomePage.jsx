// src/pages/HomePage.jsx
import Carousel from "../ui/Carrousel.jsx";
import useTestimonials from "../custom-hooks/useTestimonials.js";
import useCarousel from "../custom-hooks/useCarousel.js";
import BookingHotels from "../components/booking/BookingHotels.jsx";
import TestimonialCarousel from "../components/TestimonialsCarousel.jsx";
import Gallery from "../ui/Gallery.jsx";
import PartnerCarrousel from "../ui/PartnerCarrousel.jsx";
import HotelShowcase from "../components/HotelShowcase.jsx";

const API_BASE = "https://api.allezgoo.com";

function HomePage() {
    const { data: testimonials, loading: loadingTestimonials, error: errorTestimonials } = useTestimonials();
    const { data: carouselData, loading: loadingCarousel } = useCarousel();

    const mappedCarouselImages = carouselData?.map(item => ({
        ...item,
        url: item.url.startsWith('http') ? item.url : `${API_BASE}${item.url}`,
    })) || [];

    return (
        <section
            id="nos-atouts"
            className="flex flex-col text-white items-center justify-center scroll-mt-[100vh]"
        >
            {!loadingCarousel && mappedCarouselImages.length > 0 ? (
                <Carousel images={mappedCarouselImages} />
            ) : (
                <div className="w-full h-[calc(63vh-80px)] md:h-[calc(73vh-80px)] bg-slate-900/50 animate-pulse flex items-center justify-center rounded-2xl">
                    <span className="text-sky-300">Chargement...</span>
                </div>
            )}
            <BookingHotels />
            {/* ✅ Ce composant utilise listHotelEnhanced */}
            <HotelShowcase cityId={34} />
            <Gallery />
            <TestimonialCarousel
                testimonials={testimonials}
                loading={loadingTestimonials}
                error={errorTestimonials}
            />
            <PartnerCarrousel />
        </section>
    );
}

export default HomePage;