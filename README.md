# allezgo_app_v2

The AllezGo travel-booking front end — hotel search and booking, organised trips, e-visa applications, and an admin back office.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![React Query](https://img.shields.io/badge/React%20Query-v5-FF4154?logo=reactquery&logoColor=white)

## Overview

AllezGo is a French-language travel agency web app. Visitors search hotels by
city and date range, work through a stepped booking flow, browse organised
trips, and apply for e-visas. Staff sign in to an admin dashboard covering
bookings, content and analytics.

The app talks to **two separate backends**:

- **`api.allezgoo.com`** — AllezGo's own API (auth, bookings, destinations, e-visas, testimonials, users, carousel, settings), wrapped by `services/allezgo-api/allezGoApi.js`.
- **`admin.ipro-booking.com`** — the iPro Booking hotel inventory API (countries, cities, hotels, availability, booking creation/cancellation), wrapped by `services/ApiClient.js`.

Notable implementation details:

- **A hardened hotel API client.** `ApiClient` is a singleton class with an in-memory `CacheManager` (5-minute TTL), automatic retries with exponential backoff (3 attempts, 1s→5s), request cancellation, per-request-type timeouts (60s standard, 120s search), batched hotel fetching, and bilingual (en/fr) error messages.
- **React Query as the server-state layer**, tuned to complement that client: `staleTime` 5 min matching the `ApiClient` TTL, `gcTime` 10 min, and `retry: 0` so retries are not duplicated at both levels.
- **Server-driven cache invalidation.** `GlobalCacheListener` listens for an `allezgo:refresh-data` window event (raised from an `X-Refresh-Data` response header) and invalidates the whole React Query cache so open screens refetch in the background.
- **Route-level code splitting** — every page is `React.lazy`-loaded behind a shared `Loader`; only the `Layout` shell is eager.
- **Role-based guards** — `ProtectedRoute` accepts an `allowedRoles` array, redirecting anonymous users to `/sign-in` and wrong-role users to `/`.
- **JWT decoded client-side** on login to derive the user's id, email and role, which are persisted in `localStorage`.
- **React Compiler** is enabled through `babel-plugin-react-compiler` in the Vite React plugin.

## Requirements

- Node.js 18+ (Vite 7)
- npm
- Credentials for the iPro Booking hotel API

## Installation

```bash
git clone https://github.com/nizar-ing/allezgo_app_v2.git
cd allezgo_app_v2
npm install
```

Create a `.env` (gitignored) with the iPro credentials — the app throws a fatal
error at startup without them:

```dotenv
VITE_API_LOGIN=your-ipro-login
VITE_API_PASSWORD=your-ipro-password
```

Then:

```bash
npm run dev
```

Vite serves the app on <http://localhost:5173>.

## Usage

In development, `vite.config.js` proxies `/api` and `/carousel` to
`https://api.allezgoo.com`, and `.env.development` sets
`VITE_API_BASE_URL=/` so AllezGo API calls go through that proxy and avoid CORS.
The iPro hotel API is called directly at its own base URL.

Querying hotels through the React Query hooks:

```jsx
import { useCities, useHotels, useHotelDetail } from "@/custom-hooks/useHotelQueries.js";

function CityHotels({ cityId }) {
  const { data: hotels, isLoading } = useHotels(cityId);
  if (isLoading) return <Loader />;
  return hotels.map((h) => <HotelCard key={h.id} hotel={h} />);
}
```

Calling the AllezGo API directly:

```js
import AllezGoApi from "@/services/allezgo-api/allezGoApi.js";

const { data } = await AllezGoApi.Destinations.getAll();
await AllezGoApi.Bookings.updateStatus(bookingId, "CONFIRMED");
```

`@` is aliased to `src/` in `vite.config.js`.

### Routes

| Path | Guard | Description |
| --- | --- | --- |
| `/` | public | Home — carousel, hotel search, showcase, testimonials, partners |
| `/hotels/:cityId` | public | Hotels in a city |
| `/hotel/:hotelId` | public | Hotel detail |
| `/search` | public | General search results |
| `/hotels-search` | public | Hotel search results |
| `/booking/:hotelId` | public | Three-step booking: *Informations* → *Confirmation & Paiement* → *Succès* |
| `/voyages-organises` | public | Organised trips listing |
| `/voyages-organises/:tripId` | public | Trip detail |
| `/e-visa` | public | E-visa offers, with per-country duration and pricing modes |
| `/sign-in` | public | Login |
| `/profile` | `client`, `admin` | User profile and bookings |
| `/admin` | `admin` | Admin dashboard |
| `*` | public | 404 |

### Admin dashboard

`/admin` is a tabbed console:

| Tab | Covers |
| --- | --- |
| Voyages Organisés | Organised-trip destinations CRUD |
| E-Visas | E-visa offer CRUD |
| Réservations | Bookings — statuses `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`, with verify, cancel and voucher modals |
| Témoignages | Testimonials CRUD |
| Utilisateurs | User management |
| Carrousel | Home carousel — upload, reorder, delete |
| My Business Stats | Recharts analytics |
| Paramètres | Site settings |

### API surface

**`AllezGoApi`** (`src/services/allezgo-api/allezGoApi.js`)

| Namespace | Base route | Methods |
| --- | --- | --- |
| `Auth` | `/api/auth` | `register`, `login` |
| `Users` | `/api/users` | `create`, `getAll`, `getById`, `update`, `remove` |
| `Bookings` | `/api/bookings` | `create` (multipart), `getMine`, `getAll`, `updateStatus`, `remove` |
| `Destinations` | `/api/destinations` | `create`, `getAll`, `getById`, `update`, `remove`, `uploadImage` |
| `EVisas` | `/api/e-visas` | `create`, `getAll`, `getById`, `update`, `remove` |
| `Testimonials` | `/api/testimonials` | `create`, `getAll`, `getById`, `update`, `remove` |
| `Carousel` | `/carousel` | `getAll`, `upload`, `reorder`, `remove` |
| `Settings` | `/api/settings` | `get`, `update` |

**`ApiClient`** (`src/services/ApiClient.js`) — hotel inventory:
`listCountry`, `listCity`, `listCategorie`, `listTag`, `listBoarding`,
`listCurrency`, `listHotel`, `listHotelEnhanced`, `getHotel`, `getHotelDetail`,
`getHotelsBatch`, `searchHotel`, `searchRoomAvailability`, `createBooking`,
`cancelBooking`.

Full reference lives in `src/services/API_GUIDE.md` and
`src/services/allezgo-api/API_GUIDE.md`.

### Custom hooks

| Hook | Purpose |
| --- | --- |
| `useHotelQueries.js` | ~19 exported React Query hooks over `ApiClient` (`useCities`, `useHotels`, `useHotelSearch`, `useDebouncedHotelSearch`, `useCacheManager`, …) |
| `useAuth` | Login/logout, JWT decode, `localStorage` persistence |
| `useBooking` / `useBookingValidation` | Booking creation and form validation |
| `useMyBookings` / `useAdminBookings` | Guest and admin booking lists |
| `useBusinessAnalytics` | Admin analytics data |
| `useDestinations`, `useEVisas`, `useTestimonials`, `useUsers`, `useSettings`, `useCarousel` | Admin content resources |
| `useDebounce` | Input debouncing |

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_LOGIN` | **yes** | — | iPro Booking API login. The app throws a fatal error at startup if unset |
| `VITE_API_PASSWORD` | **yes** | — | iPro Booking API password |
| `VITE_API_BASE_URL` | no | `https://api.allezgoo.com` | AllezGo API base. `.env.development` sets it to `/` to route through the Vite dev proxy |

`ApiClient.CONFIG` holds the tuneable constants — timeouts, batch size and
delay, `MAX_HOTELS_PER_SEARCH` (20), retry policy and cache TTL. The iPro base
URL (`https://admin.ipro-booking.com/api/hotel`) is hard-coded there rather than
read from the environment.

`.env` and `.env.*.local` are gitignored; `.env.development` is committed and
contains only the proxy base URL.

## Project structure

```
index.html
vite.config.js            # @ alias, React Compiler, Tailwind 4, dev proxy to api.allezgoo.com
tailwind.config.js
generate-context.js       # Dev tool: concatenates the source tree into frontend_context.md
src/
├── main.jsx              # QueryClient config, BrowserRouter, GlobalCacheListener
├── App.jsx               # Lazy route table, Toaster, ScrollToTop
├── pages/                # Route components
│   └── admin/            # AdminDashboard, BusinessStats, SettingsPanel, CRUD modals
├── components/           # Header, Footer, hotel cards, filtering, ProtectedRoute,
│   ├── booking/          #   DateRangePicker, GuestInfoForm, GuestRoomSelector, LocationSearch, …
│   └── admin/            #   VerifyBookingModal, CancelBookingModal, VoucherModal, CarouselAdmin, …
├── custom-hooks/         # React Query hooks + useAuth, useDebounce, …
├── services/
│   ├── ApiClient.js      # iPro Booking hotel API client (cache, retry, batching)
│   ├── HotelSearchSchema.json
│   └── allezgo-api/      # AllezGo API namespaces
├── ui/                   # Button, Loader, Stars, carousels, Gallery, HotelsListView
├── utils/                # dateHelpers, normalizeHotel, pricingHelpers, validateVisaData
└── data/                 # Static carousel and seed data
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR and the API proxy |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the project |

## Notes

- The UI is written in French; code comments mix French and English.
- `frontend_context.md` is generated output from `generate-context.js`, not hand-maintained.
- `.playwright-mcp/` holds captured browser logs from a debugging session and is not part of the build.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` before opening a PR,
and keep API-surface changes in sync with the `API_GUIDE.md` files under `src/services/`.
