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
VITE_API_BASE_URL=https://api.allezgoo.com  # optional, this is the default
```

Note: `VITE_API_LOGIN`/`VITE_API_PASSWORD` were removed — iPro credentials are now server-side only.

---

## Architecture Overview

### High-Level Data Flow

```
User → React Router (pages + suspense)
  → TanStack React Query (caching + mutations)
    → ApiClient.js       (NestJS /api/hotels/* — hotel search & rates, markup server-side)
    → allezgo-api.js     (AllezGo NestJS backend — auth, bookings, admin)
```

### State Management
- **TanStack React Query** is the primary state layer: `useQuery` for server data with per-type stale/GC config, `useMutation` with optimistic cache invalidation.
- **Local state** via `useState` + `react-hook-form` for forms.
- Auth token + user info persisted to `localStorage`; React Query cache cleared on logout.

### API Architecture

**`src/services/ApiClient.js`** — AllezGo backend hotel integration
- All calls go to NestJS `/api/hotels/*` which proxies iPro server-side. Markup is applied by the backend — prices returned already include `benefit_marge`. `VITE_API_LOGIN`/`VITE_API_PASSWORD` are gone; the only frontend env var needed is the optional `VITE_API_BASE_URL`.
- Built-in in-memory cache (5 min TTL), retry logic (3× exponential backoff), and axios cancel tokens.
- **Dual-mode search**: city geo-targeting (single backend call) OR explicit hotel ID arrays (looped, max 300).
- Tunisian city handling (IDs 34–38) and `DZ`/`DZD` market params are injected server-side by `IproAdapter` (inside `SuppliersModule`).

**`src/services/allezgo-api/allezGoApi.js`** — AllezGo custom backend
- JWT login/register, user CRUD, destinations, e-visas, testimonials, settings.
- Booking management with admin verification workflow. Includes `Bookings.getById(id)` and `Bookings.confirmWithAlternative(id, supplier)`.
- Admin namespaces (Phase 7): `Suppliers` (list/update/health/stats), `Fx` (list/update FX rates), `Catalog` (matches, boardings, sync), `Analytics` (`getWilayaStats(days)`).
- `VisaApplications` namespace: `list()`, `updateStatus(id, dto)`, `getDocumentUrl(filename)` — used by `VisaApplicationsPanel`.
- Emits `allezgo:refresh-data` event to trigger `GlobalCacheListener` → invalidates all React Query.
- Exports a named `isRequestCanceled(err)` helper used by hooks to silently swallow abort-controller cancellations.

### Routing Structure
- Layout outlet pattern: `Layout` wraps all pages with Header + Footer.
- All pages except `Layout` use `React.lazy()` with `<Suspense>` + `<PageLoader>` fallback (default/no-props variant).
- `<ProtectedRoute allowedRoles={[...]}>` enforces JWT + role checks; non-admins hitting `/admin` are redirected home.

| Path | Page | Notes |
|---|---|---|
| `/` | `HomePage` | |
| `/hotels/:cityId` | `HotelsPerCityPage` | |
| `/hotel/:hotelId` | `HotelDetails` | |
| `/search` | `SearchResultsPage` | Two-step search (hotel details `useQuery` + pricing `useQuery`), client-side `useInfiniteQuery` pagination, `HotelsFiltering` sidebar |
| `/hotels-search` | `HotelsSearchResultsPage` | Batch search by hotel ID array — reads results from `location.state` or `sessionStorage` |
| `/booking/:hotelId` | `BookingPage` | |
| `/voyages-organises` | `OrganizedTrips` | List page — debounced name search + sort (price, duration, name) |
| `/voyages-organises/:tripId` | `OrganizedTrip` | Detail — uses `useDestination(id)` from React Query |
| `/voyages-organises/:tripId/reserver` | `VoyageOrganiseBooking` | VO booking form — departure date select, room quantities, client info, payment method select; POSTs via `AllezGoApi.VoBookings.create()` to `POST /api/vo-bookings` (BST-06b done); reads `?date=YYYY-MM-DD` to pre-select a departure date when navigated from trip detail date links |
| `/omra` | `Omra` | Omra list page — same shape as `OrganizedTrips` but filtered to `category=omra` |
| `/omra/:tripId` | `OmraDetail` | Detail page — same as `OrganizedTrip` with `holy_city` badge and `distance_to_haram` per accommodation |
| `/omra/:tripId/reserver` | `OmraBooking` | Thin wrapper around `VoyageOrganiseBooking` with `basePath="/omra"` |
| `/e-visa` | `E_Visa` | |
| `/e-visa/:id/demande` | `VisaDemandePage` | Public visa application form — name/email/phone/travel date/travelers + optional document upload; shows `VISA-XXXXX` reference on success |
| `/sign-in` | `SignInPage` | |
| `/profile` | `ProfilePage` | Protected: client + admin |
| `/admin` | `AdminDashboard` | Protected: admin only |
| `*` | `NotFoundPage` | Catch-all 404 |

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
3. Guest info collected via `GuestInfoForm` + `react-hook-form` (booking subcomponents live in `src/components/booking/`).
4. `useBooking()` mutation POSTs `FormData` to AllezGo backend (includes `offerIds` array, passengers grouped by room, optional receipt file, `paymentMethod`: `AGENCE` | `VIREMENT`). Backend reprices from `offer_quotes` — `clientPrice` is ignored when `offerIds` are present.
   - **Guest bookings are allowed**: the backend reads the JWT optionally and skips the user relation if unauthenticated.
5. Admin dashboard: admin confirms payment → backend calls `apiClient.createBooking()` on iPro. Admin can also download payment receipts via `GET /api/bookings/receipt/:filename`.

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

### SearchResultsPage URL Params
`/search` reads these params (all strings):

| Param | Values | Description |
|---|---|---|
| `selectionType` | `"city"` \| `"hotel"` | Drives dual-mode search |
| `cityId` | integer string | Required when `selectionType=city` |
| `cityName` | string | Display only |
| `countryName` | string | Display only |
| `countryCode` | `"DZ"` \| `"TN"` | Set by `HotelsPopup` |
| `hotelId` | integer string | Required when `selectionType=hotel` |
| `hotelName` | string | Display only |
| `checkIn` | `YYYY-MM-DD` | |
| `checkOut` | `YYYY-MM-DD` | |
| `rooms` | JSON `[{adults,children:[]}]` | Defaults to `[{adults:2,children:[]}]` if missing/invalid |
| `nights` | integer string | Falls back to computed diff if missing |

### SearchResultsPage Query Architecture
Three-phase data assembly:
1. **`useQuery("hotelDetails")`** — for city search returns `{hotels:[], hotelIds:[]}` immediately (iPro resolves hotels by geo-targeting, no pre-fetch needed); for hotel search fetches full detail via `getHotel()`.
2. **`useQuery("hotelSearch")`** — calls `ApiClient.searchHotel()` with either `cityId` (geo-targeting) or `hotels` (explicit IDs). Raw results are merged with full hotel details and deduped (geo-targeting can return duplicate hotel IDs from multiple suppliers). The merged shape adds `preloadedRooms`, `paxGroups`, `pricing` (incl. `minPrice`, `availabilityStatus`, `discountPercent`, `token`), and `dataSource` to each hotel.
3. **`useInfiniteQuery("hotels-paginated")`** — client-side pagination of the already-merged+filtered+sorted result set (15 hotels/page). Not a network call. Query key: `["hotels-paginated", searchIdentity, sortBy, nameFilter, filters]`.

**`searchIdentity`** — a `useMemo`-derived string composing all URL search params (`selectionType|cityId|hotelId|checkIn|checkOut|rooms`). Used as the `key` prop on `BookingHotels` and `HotelLightCard` to force a clean remount when any param changes, preventing stale internal state (selected boarding, fetched availability, refs). Also included in the `hotels-paginated` query key so stale page data can never be served across searches whose result-set length happens to match.

**Filter state** (`filters` object + siblings):
- Booleans: `hotelRecommander` (≥4 stars), `tarifEnPromotion` (has discount), `disponibleSeulement` (available only), `annulationGratuite`
- Arrays: `arrangements` (boarding plan IDs), `categories` (star ratings), `roomTypes`, `services`
- Range: `budgetMin` / `budgetMax` (0–1000 default)
- `nameFilter` (string) — free-text hotel name search shown in the results bar
- `sortBy` — `"recommended"` | `"price-asc"` | `"price-desc"` | `"rating"` | `"name-asc"`

**`ARRANGEMENT_KEYWORD_MAP`** — maps boarding arrangement IDs (e.g. `"petit-dejeuner"`, `"all-inclusive"`) to French/English keyword arrays. Used to match `preloadedRooms[].boardingName` when filtering by meal plan.

**`SERVICE_KEYWORDS`** — maps service filter slugs (e.g. `'thalasso-spa'`, `'sport-loisirs'`) to keyword strings matched against `h.Theme` in `SearchResultsPage`. Returns `false` when `h.Theme` is absent — correct until `POST /api/admin/catalog/sync-themes` backfills hotel themes at production deploy.

**`COUNTRY_BANNERS`** — maps lowercase `countryName` param (`"tunisie"`, `"algerie"`) to a banner image path for the results page header. Falls back to the Tunisian banner.

### HotelDetails Page (`/hotel/:hotelId`)
Fetches full hotel detail and room availability via `ApiClient`. UI is split into tabs:
- **Chambres** — room list filtered by boarding plan (RO/BB/HB/FB/AI/SC tabs) and room type. Each room card shows occupancy limits, `FreeChild` age/count info, and an inline check-in/check-out date picker with `GuestRoomSelector` to refetch availability on demand.
- **Équipements** — facility list with keyword-matched icons from `BOARDING_BADGE_STYLES` / `FACILITY_ICON_MAP`.
- **Galerie** — photo grid.
- **À propos** — HTML description stripped via `DOMParser` (`stripHtml` utility defined locally).

Availability states per room: `available` (bookable now), `on_request`, `full` (pax limit exceeded).

### Booking Payload Handling
`createBooking()` contains unwrapper logic to prevent double-nesting: accepts raw or pre-wrapped payloads, deep-clones (to break React Query cache freeze), injects Maghreb contract rules for Tunisian cities, then wraps once before the API call.

### Query Key Stability
```js
QUERY_KEYS = {
  countries:   ["countries"],
  cities:      ["cities"],
  categories:  ["categories"],
  tags:        ["tags"],
  boardings:   ["boardings"],
  currencies:  ["currencies"],
  hotels:      ["hotels"],
  hotelsByCity:  (cityId)   => ["hotels", "city", cityId],
  hotelDetail:   (hotelId)  => ["hotel", hotelId],
  hotelSearch:   (params)   => ["hotelSearch", params],
  hotelsBatch:   (ids)      => ["hotels", "batch", [...ids].sort().join(",")],
}
```

### React Query Global Defaults
`main.jsx` sets `retry: 0` globally — retries are handled by `ApiClient.js` (3× exponential backoff). `refetchOnWindowFocus` is also `false` globally. React Query Devtools are mounted in DEV mode only.

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
- **Réservations** — booking list with status + supplier filters; "Fournisseur" and "Économie" columns; PENDING → CONFIRMED (triggers iPro `HotelBooking` POST) or REJECTED or CANCELLED. `VerifyBookingModal` handles payment confirmation, shows `BookingOfferComparison` data (quoted vs. confirmed price, outcome badge), and handles 409 conflicts: `ALREADY_CONFIRMING` (banner), `PRICE_CHANGED` (shows diff + confirm-with-alternative form), `OFFER_UNAVAILABLE` (banner); `VoucherModal` generates the client PDF voucher; `CancelBookingModal` handles cancellation.
- **Destinations** — organized trip CRUD (`useDestinations`).
- **Témoignages** — testimonial CRUD (`useTestimonials`).
- **Utilisateurs** — user CRUD (`useUsers`).
- **Carousel** — homepage banner image management (`CarouselAdmin`, `/carousel` endpoint).
- **Statistiques** — `BusinessStats` page using `useBusinessAnalytics` + Recharts (composed charts, bar, pie). KPIs derived from admin bookings. Also includes `WilayaStats` component: period presets (7j/30j/365j), KPI cards, top-10 wilaya bar chart, full ranked table, CSV export; calls `AllezGoApi.Analytics.getWilayaStats(days)` → `GET /api/analytics/wilaya-stats`.
- **Paramètres** — `SettingsPanel` tab: (1) `benefit_marge` editor — changes take effect immediately via `useSettings` which clears `apiClient` cache + invalidates `hotelSearch`; (2) contact info form (`contact_phone`, `contact_whatsapp`, `contact_email`) — separate save button with `isContactDirty` guard.
- **Fournisseurs** (`SuppliersPanel`) — supplier mode/priority/markup/timeout editor; mode → live requires explicit confirmation dialog; inline health check per supplier; 24h stats table (calls, errors, p95ms, win rate).
- **Taux de change** (`FxRatesPanel`) — inline FX rate editor with history; pencil opens input, Enter saves.
- **Mapping hôtels** (`HotelMappingPanel`) — pending match review queue; status + supplier filters; confirm/reject actions for pending rows.
- **Demandes Visa** (`VisaApplicationsPanel`) — lists all visa applications; inline status + notes editing; auth-gated document download via `AllezGoApi.VisaApplications`.
- **Omra** — same CRUD as Destinations tab but scoped to `category=omra`; `CreateDestinationModal`/`EditDestinationModal` gain a category selector and Omra-specific accommodation fields (`holy_city`, `distance_to_haram`).

Booking statuses: `PENDING` | `CONFIRMED` | `REJECTED` | `CANCELLED`. Only CONFIRMED triggers the iPro side; the AllezGo backend status is always updated first regardless.

**Receipt image display**: `VerifyBookingModal` fetches payment receipts as authenticated blobs — it calls `GET /api/bookings/receipt/:filename` with `responseType: "blob"` via `AllezGoApi.client`, creates an object URL via `URL.createObjectURL()`, and revokes it on cleanup. Never render receipt URLs directly in `<img src>` — the endpoint requires a Bearer token.

---

## Utilities & UI Primitives

**`src/utils/`** — pure functions, no side effects:
- `pricingHelpers.js` — `getStartingPrice()`, `formatPrice()`, `getStartingPriceLabel()`. Hotel pricing shapes: flat `{double, triple}` or tiered `{hotel3Star, hotel4Star, hotel5Star}`. **Destination pricing** is a separate shape: `{double, triple, single, child_under4, child_under12, second_child, infant, currency}` — all number fields optional, shown selectively by `DestinationCard` and `OrganizedTrip`.
- `normalizeHotel.js` — `normalizeHotelForCard()` maps any raw iPro API hotel shape to the stable `HotelCard` contract used by all listing components.
- `normalizeDestination.js` — `normalizeDestination(raw)` maps any API destination response to a stable view-model. Normalizes `pricing` (tiered→flat), `flightDetails` (legacy flat→structured), `departureDates` (string[]→`{outbound,return?}`[]), `visaInfo` (string|legacy obj→canonical shape), and all array fields (ensures `[]` fallback). Passes `images` array through as-is (BST-05 photo gallery; `OrganizedTrip` hero becomes a carousel when `images.length > 1`, falls back to `image_url`).
- `resolveMediaUrl.js` — `resolveMediaUrl(url)` resolves relative backend media paths to absolute URLs using `VITE_API_BASE_URL` (falls back to `https://api.allezgoo.com`). Use this instead of defining `const BACKEND_BASE` locally in each component.
- `dateHelpers.js` — French-locale date formatting (`formatDate`), API date serialization (`formatDateForAPI` → `YYYY-MM-DD` local time), calendar math. Import `API_DATE_REGEX` as the single source of truth for date validation.
- `validateVisaData.js` — e-visa form field validation.

**`src/ui/`** — reusable presentational primitives: `Button`, `Loader`, `PageLoader`, `Stars`, `Gallery`, `HotelCarrousel`, `HotelsListView`, `Carrousel`, `PartnerCarrousel`.

### Loading Pattern Convention
- **`<PageLoader>`** (`src/ui/PageLoader.jsx`) — animated airplane GIF loader, 4 variants:
  - Default (no props) — full-page `<Suspense>` fallback and route transitions (`App.jsx`).
  - `section` — section-height loading inside a page zone (e.g. `HotelsSearchResultsPage`).
  - `overlay` — fixed backdrop + floating card for search overlays.
  - `compact` — smaller inline variant for admin panels.
- **Skeletons** (layout-accurate, animate-pulse) for page-level initial loads. All live in `src/components/`:
  - `SearchResultsSkeleton` — sidebar + search bar + 3 hotel card stubs; used on `SearchResultsPage`.
  - `HotelShowcaseSkeleton` — section header + 3-column card grid × 2; used on `HotelShowcase`.
  - `OrganizedTripsSkeleton` — card grid stubs; used on `OrganizedTrips` (list page).
  - `OrganizedTripSkeleton` — hero + content stubs; used on `OrganizedTrip` (detail page).
- **`<Loader>` spinner** only for in-button/inline/modal scenarios (e.g., a button's own pending state, modal confirmation spinners). Do not use `<Loader>` as a page-level or overlay loading fallback — use `<PageLoader>` instead.

**`src/components/booking/`** — booking-flow UI subcomponents: `DateRangePicker` (wraps `react-day-picker`), `GuestRoomSelector`, `GuestInfoForm`, `LocationSearch`, `BookingSummaryCard`, `BookingHotels`.

**`src/components/DateRoomsPickerBanner.jsx`** — search refinement banner used on `HotelsPerCityPage` (not in the `booking/` subfolder); accepts all picker state + handlers as props. `SearchResultsPage` uses `BookingHotels` instead.

**`src/components/booking/BookingHotels.jsx`** — dual-mode search widget. Without `embedded` prop: renders as a hero overlay on `HomePage` (negative top margin, full decoration). With `embedded={true}`: renders as an inline search-refinement bar inside `SearchResultsPage`. Defaults the city to Sousse (`cityId=34`) when no initial selection is provided.

**`src/components/HotelCard.jsx`** — full-featured hotel card used exclusively by `HotelShowcase.jsx` on the homepage. Renders facility icons from a keyword-matching map (`FACILITY_ICON_MAP`), star rating, and a favorites heart toggle. Uses `lucide-react` icons.

**`src/components/HotelLightCard.jsx`** — compact hotel card used in search results (`SearchResultsPage`, `HotelsPerCityPage`) and via `HotelsListView`; reads `Album[0]` for the hero image from the normalized shape produced by `normalizeHotelForCard()`.

**`src/components/HotelsPopup.jsx`** — flyout panel rendered inside `Header.jsx` when the user clicks "Hôtels". Receives `enrichedCountries` (countries + their cities) as props; city clicks navigate to `/search?selectionType=city&...` with today+1/today+2 as default dates; country-level clicks go to `/hotels/:cityId`.

**`src/components/HotelShowcase.jsx`** — hotel grid widget for a given `cityId`; used on `HomePage` (currently Sousse, `cityId=34`).

**`src/components/DestinationCard.jsx`** — 3D CSS flip card for organized trips. Front face: hero image, name, cities, duration, up to 2 highlights, next departure date, lowest price banner. Back face (red-to-orange gradient): accommodations list (hotel/stars/location/nights), child price rows, key attractions, itinerary day preview (first 4 days), CTA link to `/voyages-organises/:id`. Flip is triggered by hover, focus, and click. Used by `OrganizedTrips`.

**`src/components/TestimonialCard.jsx`** — card for a single testimonial (avatar, name, quote). Active card is visually emphasized via an `isActive` prop.

**`src/components/TestimonialsCarousel.jsx`** — auto-advancing carousel of `TestimonialCard`s; accepts `testimonials`, `loading`, `error` props; rendered on `HomePage` using data from the AllezGo backend.

**`src/components/SocialFloatingWidget.jsx`** — floating social-media links widget; rendered in `Layout.jsx` so it appears on every page.

**`src/data/`** — static data barrel; currently re-exports `carouselImages` from `carouselData.js`.

**`src/components/VisaErrorBoundary.jsx`** — the only class component in the codebase; a React error boundary that wraps the E_Visa page to catch render-time failures.

**`favoriteHotels` localStorage key** — JSON array of hotel IDs (integers). Read/written by `SearchResultsPage`, `HotelsPerCityPage`, and `HotelsListView`. No hook wrapper — accessed inline in each component.

---

## UI Language & Icons

- All user-facing labels are in **French** (`fr-DZ` locale, DZD currency by default).
- Two icon libraries are in use (mixed by page origin):
  - `lucide-react` — admin dashboard, modals, and most public components (e.g. `HotelLightCard`, `SearchResultsPage`, `OrganizedTrip`, `OrganizedTrips`, `DestinationCard`).
  - `react-icons` (`fa`, `md`, `io5`) — a few older public-facing pages (e.g. `E_Visa`, `TestimonialsCarousel`).
- Backend images from AllezGo use relative paths; resolve them with `resolveMediaUrl(url)` from `src/utils/resolveMediaUrl.js`. Do not define `const BACKEND_BASE` locally — the utility handles `VITE_API_BASE_URL` and the fallback host.

---

## Custom Hooks Reference

**`src/custom-hooks/useHotelQueries.js`** — primary hook library  
- Lookup: `useCountries()`, `useCities()`, `useCategories()`, `useTags()`, `useBoardings()`, `useCurrencies()`
- Hotel data: `useHotels(cityId)`, `useHotelsBatch(hotelIds)`, `useHotelsEnhanced(cityId)` (rich detail, used on HomePage), `useHotelDetail(hotelId)`
- Search: `useHotelSearch(params, {enabled})`, `useDebouncedHotelSearch(params, 500)`
- Utilities: `useFilterData()`, `useInvalidateHotels()`, `useCacheManager()`, `useApiClientLanguage()`

**Note on `HotelsFiltering`**: The filter counts (e.g. `count: 4`) shown in the sidebar are static hardcoded placeholders — they are not derived from actual search results.

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
- `useDestinations` (default export) — list of all destinations, normalized via `normalizeDestination`.
- `useDestination(id)` (named export) — single destination by ID; used by `OrganizedTrip`/`OmraDetail` detail pages.
- `useOmraDestinations()` (named export) — same as `useDestinations` but filters to `category=omra`. **Shortcut**: category filtering is client-side (post-normalizeDestination) until the backend migration is deployed to production; `normalizeDestination` defaults `category` to `'voyage_organise'` so existing records sort correctly.

**`src/custom-hooks/useEVisas.js`**  
- Full CRUD for e-visa records; query key `["eVisas"]`; uses `isRequestCanceled` guard on all queries.

**`src/custom-hooks/useCarousel.js`**  
- Carousel image CRUD for the `CarouselAdmin` component.

**`src/custom-hooks/useSettings.js`**  
- Fetches/updates `AllezGoApi.Settings`; syncs `apiClient.setBenefitRate(benefit_marge / 100)` both **synchronously during render** (so cached settings propagate before any search query fires) and in a `useEffect` (which also calls `apiClient.clearCache()` to evict stale results cached before the correct rate was known).

**`src/custom-hooks/useBusinessAnalytics.js`** (`useBusinessAnalytics(bookings, selectedYear)`)  
- Pure computation hook (no network calls); derives KPIs, monthly revenue, status breakdown, top destinations, and seasonal pattern from admin bookings. Reads `benefit_marge` from `useSettings`.
- Margin formula (Phase 7 fix): uses stored `marginDzd` for Phase 5+ bookings; falls back to `clientPrice × r / (1 + r)` for legacy rows (not `clientPrice × r`).
- Phase 7 KPIs: `supplierWins` (object keyed by supplier code), `avgSavingsPct`, `shareWithAlternative` (% of confirmed-with-supplier bookings that used a non-iPro supplier).

**`src/custom-hooks/useBookingValidation.js`** (`useBookingValidation()`)  
- Returns `validateSearch({ selectedCity, selectedHotel, range, rooms })` — shows toast and returns `false` on invalid input for the search form.

**`src/custom-hooks/useVisitorStats.js`**  
- Fetches `GET /api/analytics/stats` (admin-only); query key `["visitor-stats"]`. Used alongside `useBusinessAnalytics` in the admin Statistiques tab.

**`src/custom-hooks/useDebounce.js`** — generic debounce primitive used by `useDebouncedHotelSearch`.

---

## Configuration

**`vite.config.js`**: path alias `@` → `src/`; React Babel plugin with React Compiler; Tailwind via `@tailwindcss/vite`; dev proxy for `/api/*`, `/carousel`, and `/uploads` → `https://api.allezgoo.com` (override with `API_TARGET=http://localhost:3000 npm run dev` to target a local backend — `API_TARGET` is a Node env var, not a `VITE_` prefix). `vite-plugin-prerender` runs a headless Puppeteer pass over `/`, `/voyages-organises`, `/omra`, `/e-visa` during `npm run build`; if the build hangs, it is a Chromium/Puppeteer issue in the environment.

**SEO layer** (shipped as one commit, `15f0137`):
- **React 19 document metadata** — `<title>` + `<meta>` hoisted to `<head>` on 7 pages (no extra library; React 19 handles hoisting natively). JSON-LD structured data: `TravelAgency` on `HomePage`, `TouristDestination` on `OrganizedTrip` and `OmraDetail`.
- **`middleware.js`** — Vercel Edge middleware; intercepts bot/social-crawler requests and injects page-specific `og:` tags by calling the backend `GET /api/og-meta?path=...` endpoint.
- **`vercel.json`** — SPA fallback rewrite: all non-asset paths → `index.html`.
- **`public/sitemap.xml`** — static top-level routes only; dynamic per-destination and per-e-visa URLs are served by the backend `GET /sitemap.xml`.
- **`public/robots.txt`** — disallows private routes (`/admin`, `/profile`, `/booking`); references both sitemaps.

**`tailwind.config.js`**: content paths `index.html` + `src/**/*.{js,jsx}`.

**`eslint.config.js`**: React Hooks plugin + React Refresh; `no-unused-vars` ignores uppercase identifiers.

### Key Dependencies
- React 19.2, Vite 7.2, React Router 7.12, TanStack React Query 5.90
- Tailwind CSS 4.1, React Hook Form 7.69, Axios 1.13.5
- `react-day-picker` — date range picker used in `DateRangePicker` booking component.
- `recharts` — charts used in `BusinessStats` admin analytics.
- `react-hot-toast` — global toast notifications (configured once in `App.jsx`, centered at 30% viewport height).
- `babel-plugin-react-compiler` (auto-memoization — may affect build times)
- `react-window` — listed in `package.json` but **not used** in `src/`; safe to ignore

---

## Known Constraints

- **Tunisian city IDs** — authoritative list is `TUNISIAN_CITY_IDS` in `allez-go_backend/src/suppliers/core/constants.ts`; client-side market injection was removed in Phase 6. Update the backend constant if market expands.
- **Max 300 hotels per explicit-ID search** — configured in `ApiClient::CONFIG.LIMITS`.
- **JWT decoded manually** (no library) — assumes standard HS256 payload claims.
- **Markup** — `benefit_marge` is stored in the backend's `Settings` table and applied server-side. Prices returned by `ApiClient.js` already include the markup. Never recalculate in the booking flow.

---

## References

- `src/services/API_GUIDE.md` — API integration guide
- AllezGo backend lives in `../allez-go_backend/` (same monorepo); read its `CLAUDE.md` before touching backend behavior
- Swagger UI (live): `https://api.allezgoo.com/api/docs` | (local): `http://localhost:3000/api/docs`