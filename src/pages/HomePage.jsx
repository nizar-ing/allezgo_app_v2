import Carousel from "../ui/Carrousel.jsx";
import { carouselImages, testimonials } from "../data";
import BookingHotels from "../components/booking/BookingHotels.jsx";
import TestimonialCarousel from "../components/TestimonialsCarousel.jsx";
import Gallery from "../ui/Gallery.jsx";
import PartnerCarrousel from "../ui/PartnerCarrousel.jsx";
import HotelShowcase from "../components/HotelShowcase.jsx";

function HomePage() {
  return (
      <section
          id="nos-atouts"
          className="flex flex-col text-white items-center justify-center scroll-mt-[100vh]"
      >
        <Carousel images={carouselImages} />
        <BookingHotels />
        <HotelShowcase cityId={34} />
        <Gallery />
        <TestimonialCarousel testimonials={testimonials} />
        <PartnerCarrousel />
      </section>
  );
}

export default HomePage;
