// src/pages/HomePage.jsx
import Carousel from "../ui/Carrousel.jsx";
import useTestimonials from "../custom-hooks/useTestimonials.js";
import useCarousel from "../custom-hooks/useCarousel.js";
import BookingHotels from "../components/booking/BookingHotels.jsx";
import TestimonialCarousel from "../components/TestimonialsCarousel.jsx";
import Gallery from "../ui/Gallery.jsx";
import PartnerCarrousel from "../ui/PartnerCarrousel.jsx";
import HotelShowcase from "../components/HotelShowcase.jsx";
import WhyBookWithUs from "../components/WhyBookWithUs.jsx";

const API_BASE = "https://api.allezgoo.com";

const DEFAULT_IMAGES = [
    { url: '/images/landing_carousel.jpeg', alt: 'AllezGo — Votre agence de voyage' },
];

function HomePage() {
    const { data: testimonials, loading: loadingTestimonials, error: errorTestimonials } = useTestimonials();
    const { data: carouselData, loading: loadingCarousel } = useCarousel();

    const mappedCarouselImages = carouselData?.map(item => ({
        ...item,
        url: item.url.startsWith('http') ? item.url : `${API_BASE}${item.url}`,
    })) || [];

    const displayImages =
        !loadingCarousel && mappedCarouselImages.length > 0
            ? mappedCarouselImages
            : DEFAULT_IMAGES;

    return (
        <section
            id="nos-atouts"
            className="flex flex-col text-white items-center justify-center scroll-mt-[100vh]"
        >
            <div className={`w-full transition-opacity duration-500 ${loadingCarousel ? 'opacity-90' : 'opacity-100'}`}>
                <Carousel images={displayImages} />
            </div>
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
            <WhyBookWithUs />
        </section>
    );
}

export default HomePage;