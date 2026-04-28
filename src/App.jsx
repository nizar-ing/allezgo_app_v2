// src/App.jsx
import { useEffect, lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Loader from "./ui/Loader.jsx";

// Eager — Layout is the app shell (Header + Footer)
import Layout from "./pages/Layout.jsx";

// Lazy — page bundles
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const HotelDetails = lazy(() => import("./pages/HotelDetails.jsx"));
const HotelsPerCityPage = lazy(() => import("./pages/HotelsPerCityPage.jsx"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage.jsx"));
const HotelsSearchResultsPage = lazy(() => import("./pages/HotelsSearchResultsPage.jsx"));
const BookingPage = lazy(() => import("./pages/BookingPage.jsx"));
const OrganizedTrips = lazy(() => import("./pages/OrganizedTrips.jsx"));
const OrganizedTrip = lazy(() => import("./pages/OrganizedTrip.jsx"));
const EVisa = lazy(() => import("./pages/E_Visa.jsx")); // ✅ Back to Lazy Loading
const SignInPage = lazy(() => import("./pages/SignInPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));

import ProtectedRoute from "./components/ProtectedRoute.jsx";

function SuspenseRoute({ children }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        containerStyle={{
          top: '30%', // Forces the Y-axis to exactly 30% down the screen
        }}
        toastOptions={{
          duration: 2500,
          style: {
            minWidth: '380px', // Increased width
            padding: '20px 32px', // Increased height and breathing room
            fontSize: '1.05rem',
            fontWeight: '600',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            color: '#ffffff', // White text for solid backgrounds
          },
          success: {
            style: {
              background: '#10b981', // Premium Emerald Green
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444', // Premium Bold Red
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<Layout />}>
            {/* Home */}
            <Route index element={<HomePage />} />

            {/* Hotels */}
            <Route path="hotels/:cityId" element={<HotelsPerCityPage />} />
            <Route path="hotel/:hotelId" element={<HotelDetails />} />
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="hotels-search" element={<HotelsSearchResultsPage />} />

            {/* Booking */}
            <Route path="booking/:hotelId" element={<BookingPage />} />

            {/* Organized trips */}
            <Route path="voyages-organises" element={<OrganizedTrips />} />
            <Route path="voyages-organises/:tripId" element={<OrganizedTrip />} />

            {/* Other pages */}
            <Route path="e-visa" element={<EVisa />} /> {/* ✅ Renders the lazy component */}
            <Route path="sign-in" element={<SignInPage />} />
            
            {/* Profile - Protected for both */}
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['client', 'admin']}>
                <SuspenseRoute><ProfilePage /></SuspenseRoute>
              </ProtectedRoute>
            } />

            {/* Admin Dashboard - Strictly Admin */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SuspenseRoute><AdminDashboard /></SuspenseRoute>
              </ProtectedRoute>
            } />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;