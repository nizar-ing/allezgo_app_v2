# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Allez Go** is a travel booking SPA that integrates hotel search, e-visa services, and organized trip packages. The frontend (React + Vite) communicates with a NestJS backend (AllezGo API) and the iPro Booking API for hotel reservations.

---

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # Run ESLint on all JS/JSX files
```

### Environment

Create a `.env` file with:
```
VITE_API_LOGIN=<ipro_login>
VITE_API_PASSWORD=<ipro_password>
VITE_API_BASE_URL=https://api.allezgoo.com  # optional, this is the default
```

---

## Architecture Overview

### High-Level Data Flow

```
User → React Router (pages + suspense)
  → TanStack React Query (caching + mutations)
    → ApiClient.js       (iPro Booking API — hotel search & reservations)
    → allezgo-api.js     (AllezGo NestJS backend — auth, bookings, admin)
```

### State Management
- **TanStack React Query** is the primary state layer: `useQuery` for server data with per-type stale/GC config, `useMutation` with optimistic cache invalidation.
- **Local state** via `useState` + `react-hook-form` for forms.
- Auth token + user info persisted to `localStorage`; React Query cache cleared on logout.

### API Architecture

**`src/services/ApiClient.js`** — iPro Booking supplier integration
- Handles hotel search, rates, and reservations against the iPro SOAP/REST API.
- Built-in in-memory cache (5 min TTL), retry logic (3× exponential backoff), and axios cancel tokens.
- Applies **8% agency markup** on all room prices via `_applyAgencyMarkup()`.
- **Dual-mode search**: city geo-targeting (single API call) OR explicit hotel ID arrays (looped, max 300).
- Special path for Tunisian cities (IDs 34–38): forces `DZ` nationality + `DZD` currency automatically.

**`src/services/allezgo-api/allezGoApi.js`** — AllezGo custom backend
- JWT login/register, user CRUD, destinations, e-visas, testimonials, settings.
- Booking management with admin verification workflow.
- Emits `allezgo:refresh-data` event to trigger `GlobalCacheListener` → invalidates all React Query.
- Exports a named `isRequestCanceled(err)` helper used by hooks to silently swallow abort-controller cancellations.

### Routing Structure
- Layout outlet pattern: `Layout` wraps all pages with Header + Footer.
- All pages except `Layout` use `React.lazy()` with `<Suspense>` + `Loader` fallback.
- `<ProtectedRoute allowedRoles={[...]}>` enforces JWT + role checks; non-admins hitting `/admin` are redirected home.

| Path | Page | Notes |
|---|---|---|
| `/` | `HomePage` | |
| `/hotels/:cityId` | `HotelsPerCityPage` | |
| `/hotel/:hotelId` | `HotelDetails` | |
| `/search` | `SearchResultsPage` | |
| `/hotels-search` | `HotelsSearchResultsPage` | |
| `/booking/:hotelId` | `BookingPage` | |
| `/voyages-organises` | `OrganizedTrips` | List page |
| `/voyages-organises/:tripId` | `OrganizedTrip` | Detail — uses raw `useEffect` not React Query |
| `/e-visa` | `E_Visa` | |
| `/sign-in` | `SignInPage` | |
| `/profile` | `ProfilePage` | Protected: client + admin |
| `/admin` | `AdminDashboard` | Protected: admin only |

### Authentication Flow
1. `SignInPage` → `useAuth().login()` → `AllezGoApi.Auth.login()` → JWT response.
2. Token decoded manually (no library) to extract `id`, `email`, `role`, names.
3. Stored in `localStorage` + React state. Requests include `Authorization: Bearer <token>`.
4. Logout clears `localStorage`, local state, and the entire React Query cache.
5. Global `allezgo:unauthorized` listener forces logout on any 401.

### Booking Flow
1. **Search**: `useHotelSearch()` → `ApiClient.searchHotel()` with pax + dates.
   - Computes availability status per hotel: `available` / `on_request` / `full`.
2. Navigate to `/booking/:hotelId` → fetch room availability via `searchRoomAvailability()`.
3. Guest info collected via `GuestInfoForm` + `react-hook-form`.
4. `useBooking()` mutation POSTs `FormData` to AllezGo backend (includes client price with markup, passenger data, optional receipt file).
5. Admin dashboard: admin confirms payment → backend calls `apiClient.createBooking()` on iPro.

### Cache Management
- **ApiClient internal cache**: in-memory `Map`, 5-min TTL, cleared on logout.
- **React Query** stale/GC times by data type:
  - Static (countries): 30 min stale / 1 hr GC
  - Semi-static (hotels by city): 15 min stale / 30 min GC
  - Dynamic (search results): 2 min stale / 5 min GC
- `GlobalCacheListener` listens for `allezgo:refresh-data` and calls `queryClient.invalidateQueries()`.

---

## Key Technical Details

### Availability Status Engine
`available` = at least one boarding + room combo is immediately bookable (not stopped, not on-request).  
`on_request` = all combos have at least one on-request room.  
`full` = no viable combo for requested pax/dates.

### Booking Payload Handling
`createBooking()` contains unwrapper logic to prevent double-nesting: accepts raw or pre-wrapped payloads, deep-clones (to break React Query cache freeze), injects Maghreb contract rules for Tunisian cities, then wraps once before the API call.

### Query Key Stability
```js
QUERY_KEYS = {
  countries: ["countries"],
  hotelsByCity: (cityId) => ["hotels", "city", cityId],
  hotelsBatch: (ids) => ["hotels", "batch", [...ids].sort().join(",")],
}
```

### Cache Invalidation Pattern After Mutations
```js
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["destinations"] });
  apiClient.clearCache(); // also clear ApiClient's internal cache
}
```

---

### Admin Dashboard
`AdminDashboard` is a single-page admin SPA with sidebar navigation. Tabs:
- **Réservations** — booking list; PENDING → CONFIRMED (triggers iPro `HotelBooking` POST) or REJECTED or CANCELLED. `VerifyBookingModal` handles payment confirmation; `VoucherModal` generates the client PDF voucher; `CancelBookingModal` handles cancellation.
- **Destinations** — organized trip CRUD (`useDestinations`).
- **Témoignages** — testimonial CRUD (`useTestimonials`).
- **Utilisateurs** — user CRUD (`useUsers`).
- **Carousel** — homepage banner image management (`CarouselAdmin`, `/carousel` endpoint).
- **Statistiques** — `BusinessStats` page using `useBusinessAnalytics` + Recharts (composed charts, bar, pie). KPIs derived from admin bookings.
- **Paramètres** — `SettingsPanel` tab for editing `benefit_marge` (the agency markup %) stored in the backend; changes take effect immediately via `useSettings` which syncs `apiClient.setBenefitRate()`.

Booking statuses: `PENDING` | `CONFIRMED` | `REJECTED` | `CANCELLED`. Only CONFIRMED triggers the iPro side; the AllezGo backend status is always updated first regardless.

---

## Utilities & UI Primitives

**`src/utils/`** — pure functions, no side effects:
- `pricingHelpers.js` — `getStartingPrice()`, `formatPrice()`, `getStartingPriceLabel()`. Pricing shapes: flat `{double, triple}` or tiered `{hotel3Star, hotel4Star, hotel5Star}`.
- `normalizeHotel.js` — `normalizeHotel()` maps any raw iPro API hotel shape to the stable `HotelCard` contract used by all listing components.
- `dateHelpers.js` — French-locale date formatting (`formatDate`), API date serialization (`formatDateForAPI` → `YYYY-MM-DD` local time), calendar math. Import `API_DATE_REGEX` as the single source of truth for date validation.
- `validateVisaData.js` — e-visa form field validation.

**`src/ui/`** — reusable presentational primitives: `Button`, `Loader`, `Stars`, `Gallery`, `HotelCarrousel`, `HotelsListView`, `Carrousel`, `PartnerCarrousel`.

**`src/data/`** — static data barrel; currently re-exports `carouselImages` from `carouselData.js`.

---

## UI Language & Icons

- All user-facing labels are in **French** (`fr-DZ` locale, DZD currency by default).
- Two icon libraries are in use (intentional split by page origin):
  - `lucide-react` — admin dashboard, modals, newer components.
  - `react-icons` (`fa`, `md`) — public-facing pages (e.g. `OrganizedTrip`, `E_Visa`).
- Backend images from AllezGo use relative paths; resolve them via the `BACKEND_BASE` constant (`https://api.allezgoo.com`) before rendering.

---

## Custom Hooks Reference

**`src/custom-hooks/useHotelQueries.js`** — primary hook library  
- `useHotels(cityId)`, `useHotelDetail(hotelId)`, `useHotelSearch(params, {enabled})`, `useDebouncedHotelSearch(params, 500)`, `useFilterData()`, `useInvalidateHotels()`, `useCacheManager()`

**`src/custom-hooks/useAuth.js`**  
- Token + user state; dispatches `allezgo:auth-sync` for multi-tab sync.

**`src/custom-hooks/useBooking.js`**  
- FormData booking mutation; invalidates `["my-bookings"]` on success.

**`src/custom-hooks/useMyBookings.js`**  
- Client-side booking list; query key `["my-bookings", user.id]`; parses `iproPayload` JSON to extract `hotelName` and `clientPrice`. Never surfaces errors to the UI (returns empty array on any failure).

**`src/custom-hooks/useAdminBookings.js`**  
- Admin booking list + `updateBookingStatus` mutation (handles CONFIRMED iPro call inline) + `removeBooking` mutation; query key `["admin-bookings"]`.

**`src/custom-hooks/useDestinations.js`, `useTestimonials.js`, `useUsers.js`**  
- Full CRUD for admin with optimistic cache updates and toast feedback.

**`src/custom-hooks/useEVisas.js`**  
- Full CRUD for e-visa records; query key `["eVisas"]`; uses `isRequestCanceled` guard on all queries.

**`src/custom-hooks/useCarousel.js`**  
- Carousel image CRUD for the `CarouselAdmin` component.

**`src/custom-hooks/useSettings.js`**  
- Fetches/updates `AllezGoApi.Settings`; on success syncs `apiClient.setBenefitRate(benefit_marge / 100)` so the markup change is live immediately.

**`src/custom-hooks/useBusinessAnalytics.js`** (`useBusinessAnalytics(bookings, selectedYear)`)  
- Pure computation hook (no network calls); derives KPIs, monthly revenue, status breakdown, top destinations, and seasonal pattern from admin bookings. Reads `benefit_marge` from `useSettings`.

**`src/custom-hooks/useBookingValidation.js`** (`useBookingValidation()`)  
- Returns `validateSearch({ selectedCity, selectedHotel, range, rooms })` — shows toast and returns `false` on invalid input for the search form.

---

## Configuration

**`vite.config.js`**: path alias `@` → `src/`; React Babel plugin with React Compiler; Tailwind via `@tailwindcss/vite`; dev proxy for `/api/*` and `/carousel` → `https://api.allezgoo.com`.

**`tailwind.config.js`**: content paths `index.html` + `src/**/*.{js,jsx}`.

**`eslint.config.js`**: React Hooks plugin + React Refresh; `no-unused-vars` ignores uppercase identifiers.

### Key Dependencies
- React 19.2, Vite 7.2, React Router 7.12, TanStack React Query 5.90
- Tailwind CSS 4.1, React Hook Form 7.69, Axios 1.13.5
- `babel-plugin-react-compiler` (auto-memoization — may affect build times)

---

## Known Constraints

- **Tunisian city IDs hardcoded** as `[34, 35, 36, 37, 38]` in `ApiClient.js` and booking hooks — update if market expands.
- **Max 300 hotels per explicit-ID search** — configured in `ApiClient::CONFIG.LIMITS`.
- **JWT decoded manually** (no library) — assumes standard HS256 payload claims.
- **Configurable markup** — `benefit_marge` is now stored in the backend (`/api/settings`) and editable by admin via the Paramètres tab. `useSettings` syncs it to `apiClient.setBenefitRate()` on load and on update. Default is 8% if the settings endpoint is unavailable. Never recalculate in the booking flow; prices served by ApiClient already include the markup.

---

## References

- `src/services/API_GUIDE.md` — API integration guide
- `backend_context.md` — NestJS backend structure overview
- AllezGo backend lives in a separate repository; referenced only via `allezgo-api.js`