// src/App.jsx

import { useEffect, lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Loader from "./ui/Loader.jsx";

// Eager — Layout is the app shell (Header + Footer)
import Layout from "./pages/Layout.jsx";


// Lazy — page bundles
const HomePage                = lazy(() => import("./pages/HomePage.jsx"));
const HotelDetails            = lazy(() => import("./pages/HotelDetails.jsx"));
const HotelsPerCityPage       = lazy(() => import("./pages/HotelsPerCityPage.jsx"));
const SearchResultsPage       = lazy(() => import("./pages/SearchResultsPage.jsx"));
const HotelsSearchResultsPage = lazy(() => import("./pages/HotelsSearchResultsPage.jsx"));
const BookingPage = lazy(() => import("./pages/BookingPage.jsx"));
const OrganizedTrips = lazy(() => import("./pages/OrganizedTrips.jsx"));
const OrganizedTrip           = lazy(() => import("./pages/OrganizedTrip.jsx"));       // detail
const EVisa                   = lazy(() => import("./pages/E_Visa.jsx"));
const SignInPage               = lazy(() => import("./pages/SignInPage.jsx"));
const NotFoundPage             = lazy(() => import("./pages/NotFoundPage.jsx"));

// ✅ Fix #3 — reusable per-route Suspense wrapper
function SuspenseRoute({ children }) {
    return <Suspense fallback={<Loader />}>{children}</Suspense>;
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" }); // ✅ Fix #2 — instant, not smooth
    }, [pathname]);
    return null;
}

function App() {
    return (
        <>
            <ScrollToTop />
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route element={<Layout />}>
                        {/* Home */}
                        <Route index element={<HomePage />} />

                        {/* Hotels */}
                        <Route path="hotels/:cityId"    element={<HotelsPerCityPage />} />
                        <Route path="hotel/:hotelId"    element={<HotelDetails />} />
                        <Route path="search"            element={<SearchResultsPage />} />
                        <Route path="hotels-search"     element={<HotelsSearchResultsPage />} />

                        {/* Booking */}
                        <Route path="booking/:hotelId" element={<BookingPage />} />

                        {/* Organized trips */}
                        <Route path="voyages-organises"     element={<OrganizedTrips />} />
                        <Route path="voyages-organises/:tripId" element={<OrganizedTrip />} />  {/* ← :id */}

                        {/* Other pages */}
                        <Route path="e-visa"   element={<EVisa />} />
                        <Route path="sign-in"  element={<SignInPage />} />

                        {/* Catch-all 404 */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </>
    );
}

export default App;