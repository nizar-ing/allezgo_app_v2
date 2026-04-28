// src/pages/HomePage.jsx
import Carousel from "../ui/Carrousel.jsx";
import { carouselImages } from "../data";
import useTestimonials from "../custom-hooks/useTestimonials.js";
import BookingHotels from "../components/booking/BookingHotels.jsx";
import TestimonialCarousel from "../components/TestimonialsCarousel.jsx";
import Gallery from "../ui/Gallery.jsx";
import PartnerCarrousel from "../ui/PartnerCarrousel.jsx";
import HotelShowcase from "../components/HotelShowcase.jsx";

function HomePage() {
    const { data: testimonials, loading, error } = useTestimonials();

    return (
        <section
            id="nos-atouts"
            className="flex flex-col text-white items-center justify-center scroll-mt-[100vh]"
        >
            <Carousel images={carouselImages} />
            <BookingHotels />
            {/* ✅ Ce composant utilise listHotelEnhanced */}
            <HotelShowcase cityId={34} />
            <Gallery />
            <TestimonialCarousel
                testimonials={testimonials}
                loading={loading}
                error={error}
            />
            <PartnerCarrousel />
        </section>
    );
}

export default HomePage;