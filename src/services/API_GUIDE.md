# ApiClient.js — API Guide

A comprehensive reference for the `ApiClient` service that wraps the **iPro Booking Hotel API**.

---

## Table of Contents

1. [Setup & Initialization](#1-setup--initialization)
2. [Configuration Reference](#2-configuration-reference)
3. [Cache Manager](#3-cache-manager)
4. [Error Handling & Retries](#4-error-handling--retries)
5. [Cancellation](#5-cancellation)
6. [API Methods](#6-api-methods)
    - [Lookup / List Endpoints](#lookup--list-endpoints)
    - [Hotel Endpoints](#hotel-endpoints)
    - [Search Endpoints](#search-endpoints)
7. [Data Structures](#7-data-structures)
8. [Language / i18n](#8-language--i18n)
9. [Advanced Patterns](#9-advanced-patterns)

---

## 1. Setup & Initialization

The module exports a ready-to-use **singleton** instance. Import it directly in any file:

```js
import apiClient from './ApiClient';
```

If you need a custom instance (e.g. a different language per user):

```js
import { ApiClient } from './ApiClient';

const frClient = new ApiClient('fr');
```

**Constructor signature:**

```ts
new ApiClient(language?: 'en' | 'fr')
```

| Parameter  | Default | Description                         |
|------------|---------|-------------------------------------|
| `language` | `'en'`  | Language for all error messages     |

---

## 2. Configuration Reference

All tuneable constants live in the exported `CONFIG` object.

```js
import { CONFIG } from './ApiClient';
```

| Key                          | Default       | Description                                    |
|------------------------------|---------------|------------------------------------------------|
| `BASE_URL`                   | (internal)    | Base URL for all API calls                     |
| `TIMEOUT.DEFAULT`            | `60 000` ms   | Timeout for standard requests                  |
| `TIMEOUT.SEARCH`             | `120 000` ms  | Timeout for hotel search requests              |
| `BATCH.DEFAULT_SIZE`         | `5`           | Hotels processed per batch                     |
| `BATCH.DEFAULT_DELAY`        | `100` ms      | Pause between batches                          |
| `LIMITS.MAX_HOTELS_PER_SEARCH` | `20`        | Hard cap on hotels per `searchHotel` call      |
| `RETRY.MAX_ATTEMPTS`         | `3`           | Retry count on transient failures              |
| `RETRY.BASE_DELAY`           | `1 000` ms    | Initial delay; doubles on each retry           |
| `RETRY.MAX_DELAY`            | `5 000` ms    | Upper bound for retry delay                    |
| `CACHE.TTL`                  | `300 000` ms  | Cache time-to-live (5 minutes)                 |
| `CACHE.ENABLED`              | `true`        | Toggle in-memory caching globally              |

---

## 3. Cache Manager

List endpoints and hotel detail calls are automatically cached. The cache is per-instance and stored in memory.

### Methods

```js
apiClient.clearCache();                // Wipe the entire cache
apiClient.clearCacheEntry('hotel_42'); // Remove a single entry
apiClient.getCacheStats();             // { size, keys[] }
```

### Cache Keys

| Cache Key                | Populated By            |
|--------------------------|-------------------------|
| `countries`              | `listCountry()`         |
| `cities`                 | `listCity()`            |
| `categories`             | `listCategorie()`       |
| `tags`                   | `listTag()`             |
| `boarding`               | `listBoarding()`        |
| `currencies`             | `listCurrency()`        |
| `hotels_all`             | `listHotel()`           |
| `hotels_city_{cityId}`   | `listHotel(cityId)`     |
| `hotel_{hotelId}`        | `getHotel(hotelId)`     |

> **Note:** `searchHotel`, `searchRoomAvailability`, `getHotelDetail`, and `getHotelsBatch` are **not** cached.

---

## 4. Error Handling & Retries

### Automatic Retries

Requests are retried up to `CONFIG.RETRY.MAX_ATTEMPTS` (default: 3) with **exponential backoff**.

Retries are triggered for:
- Network errors (no response)
- Timeouts (`ECONNABORTED`)
- HTTP 5xx responses
- HTTP 408 (Request Timeout) and HTTP 429 (Too Many Requests)

Retries are **not** triggered for:
- HTTP 4xx errors (except 408 and 429)
- Cancelled requests

### Error Object Shape

Errors thrown from the client contain:

```ts
{
  message: string;
  status?: number;         // HTTP status code (if a response was received)
  data?: any;              // Response body
  isNetworkError: boolean; // true when no response was received
  isTimeout: boolean;      // true when the request exceeded the timeout
  isCancelled?: boolean;   // true when cancelRequest() was called
  timestamp: string;       // ISO 8601
}
```

### Catching Errors

```js
try {
  const results = await apiClient.searchHotel({ ... });
} catch (error) {
  if (error.isCancelled) return; // User navigated away — safe to ignore
  if (error.isTimeout)  showToast('Search timed out, please try again');
  if (error.isNetworkError) showToast('No internet connection');
  console.error(error.message);
}
```

---

## 5. Cancellation

Long-running requests can be cancelled to avoid stale state on navigation.

```js
// Cancel the active hotel search
apiClient.cancelRequest('hotelSearch');

// Cancel the active room availability search
apiClient.cancelRoomAvailabilitySearch();

// Cancel every in-flight request
apiClient.cancelAllRequests();
```

> **Note:** Only one `hotelSearch` and one `roomAvailability` request can be active at a time. Starting a new one automatically cancels the previous.

---

## 6. API Methods

### Lookup / List Endpoints

All list endpoints return cached data after the first successful fetch.

---

#### `listCountry()`
Returns the full list of countries.

```js
const countries = await apiClient.listCountry();
// => Array<{ Id, Name, ... }>
```

---

#### `listCity()`
Returns the full list of cities.

```js
const cities = await apiClient.listCity();
// => Array<{ Id, Name, Country, ... }>
```

---

#### `listCategorie()`
Returns hotel category definitions (star ratings, etc.).

```js
const categories = await apiClient.listCategorie();
// => Array<{ Id, Title, Star, ... }>
```

---

#### `listTag()`
Returns available hotel tags (amenities, features, etc.).

```js
const tags = await apiClient.listTag();
// => Array<{ Id, Name, ... }>
```

---

#### `listBoarding()`
Returns supported meal plan / boarding codes.

```js
const boardingOptions = await apiClient.listBoarding();
// => Array<{ Code, Name, ... }>
```

| Code | Description      |
|------|------------------|
| `RO` | Room Only        |
| `BB` | Bed & Breakfast  |
| `HB` | Half Board       |
| `FB` | Full Board       |
| `AI` | All Inclusive    |
| `SC` | Self Catering    |

---

#### `listCurrency()`
Returns supported currencies.

```js
const { currencies, countResults, errorMessage, timing } = await apiClient.listCurrency();
```

---

### Hotel Endpoints

---

#### `listHotel(cityId?)`

Returns a flat list of hotels, optionally filtered by city.

```js
const allHotels  = await apiClient.listHotel();
const cityHotels = await apiClient.listHotel(42);
// => Array<{ Id, Name, Category, City, Image, ... }>
```

| Parameter | Type     | Required | Description                  |
|-----------|----------|----------|------------------------------|
| `cityId`  | `number` | No       | Filter results to this city  |

---

#### `getHotel(hotelId)`

Returns cached detailed data for a single hotel. Throws if the hotel is not found.

```js
const hotel = await apiClient.getHotel(101);
```

| Parameter | Type     | Required | Description  |
|-----------|----------|----------|--------------|
| `hotelId` | `number` | Yes      | Hotel ID     |

---

#### `getHotelDetail(hotelId)`

Like `getHotel`, but returns the raw API envelope (not cached).

```js
const { hotelDetail, errorMessage, timing } = await apiClient.getHotelDetail(101);
```

---

#### `getHotelsBatch(hotelIds, options?)`

Fetches multiple hotels in controlled batches. Failed hotels are silently skipped.

```js
const hotelsMap = await apiClient.getHotelsBatch([101, 102, 103], {
  batchSize: 5,             // hotels per batch (default: 5)
  delayBetweenBatches: 100, // ms between batches (default: 100)
});
// => { 101: HotelDetail, 102: HotelDetail, ... }
```

---

#### `listHotelEnhanced(cityId?, options?)`

Fetches the hotel list and enriches every entry with full detail data (two-step batch process). Ideal for building a hotel catalogue.

```js
const hotels = await apiClient.listHotelEnhanced(42, {
  batchSize: 5,
  delayBetweenBatches: 100,
  onProgress: (done, total) => setProgress(done / total),
  onBatchComplete: (batch, totalBatches, results) => console.log(`Batch ${batch}/${totalBatches}`),
});
```

| Option                | Type       | Default | Description                              |
|-----------------------|------------|---------|------------------------------------------|
| `batchSize`           | `number`   | `5`     | Hotels per batch                         |
| `delayBetweenBatches` | `number`   | `100`   | Milliseconds between batches             |
| `onProgress`          | `function` | `null`  | `(completedCount, totalCount) => void`   |
| `onBatchComplete`     | `function` | `null`  | `(batchNum, totalBatches, results) => void` |

---

### Search Endpoints

---

#### `searchHotel(searchParams)`

Search availability across multiple hotels.

```js
const result = await apiClient.searchHotel({
  checkIn:  '2025-09-01',
  checkOut: '2025-09-05',
  hotels:   [101, 102, 103],
  rooms: [
    { adult: 2 },
    { adult: 1, child: [7, 10] }, // child ages
  ],
  filters: {
    keywords:      '',
    category:      [],
    tags:          [],
    onlyAvailable: true,
  },
});
```

**Parameters:**

| Field                    | Type       | Required | Description                                       |
|--------------------------|------------|----------|---------------------------------------------------|
| `checkIn`                | `string`   | Yes      | Arrival date — `YYYY-MM-DD`                       |
| `checkOut`               | `string`   | Yes      | Departure date — `YYYY-MM-DD`                     |
| `hotels`                 | `number[]` | Yes      | Hotel IDs to search (capped at 20)                |
| `rooms`                  | `object[]` | Yes      | Room requirements (see below)                     |
| `filters.keywords`       | `string`   | No       | Keyword filter                                    |
| `filters.category`       | `number[]` | No       | Category IDs                                      |
| `filters.tags`           | `number[]` | No       | Tag IDs                                           |
| `filters.onlyAvailable`  | `boolean`  | No       | `true` by default — hide unavailable hotels       |

**Room object:**

```ts
{ adult: number; child?: number[] }
// child is an array of child ages, e.g. [5, 8]
```

**Return value:**

```ts
{
  hotelSearch:      HotelSearchResult[];
  countResults:     number;
  errorMessage:     string | null;
  searchId:         string | null;
  timing:           any | null;
  _limitApplied:    boolean;  // true if >20 hotels were requested
  _requestedHotels: number;
  _searchedHotels:  number;
}
```

---

#### `searchRoomAvailability(params)`

Fetch room options and pricing for a **single hotel**.

```js
const result = await apiClient.searchRoomAvailability({
  hotelId:      101,
  checkIn:      '2025-09-01',
  checkOut:     '2025-09-05',
  rooms: [
    { adults: 2 },
    { adults: 1, children: 1, childAges: [7] },
  ],
  boardingType: 'BB', // optional — omit to return ALL boarding types
});
```

**Parameters:**

| Field          | Type       | Required | Description                                            |
|----------------|------------|----------|--------------------------------------------------------|
| `hotelId`      | `number`   | Yes      | Hotel ID                                               |
| `checkIn`      | `string`   | Yes      | Arrival date — `YYYY-MM-DD`                            |
| `checkOut`     | `string`   | Yes      | Departure date — `YYYY-MM-DD`                          |
| `rooms`        | `object[]` | Yes      | Room requirements (see below)                          |
| `boardingType` | `string`   | No       | `RO` / `BB` / `HB` / `FB` / `AI` / `SC` — filter results |

**Room object:**

```ts
{
  adults:    number;       // required
  children?: number;       // count of children
  childAges?: number[];    // ages of children (falls back to age 5 if omitted)
}
```

**Return value:**

```ts
{
  rooms: ProcessedRoom[];
  errorMessage: string[];
  hotelInfo: {
    hotelId:    number;
    hotelName:  string;
    available:  boolean;
    totalRooms?: number;
  } | null;
  searchId: string | null;
  timing:   any | null;
}
```

**ProcessedRoom object:**

```ts
{
  id:           string;   // Unique composite key
  roomCode:     string;
  name:         string;   // Room name
  boardingCode: string;   // e.g. 'BB'
  boardingName: string;   // e.g. 'Bed & Breakfast'
  price:        number;   // Sorted cheapest-first
  currency:     string;   // e.g. 'DZD'
  available:    boolean;
  _raw:         object;   // Original API room object
}
```

---

## 7. Data Structures

### Merged Hotel Object (from `listHotelEnhanced` / `_mergeHotelData`)

```ts
{
  Id:               number;
  Name:             string;
  Category:         { Id, Title, Star };
  City:             { Id, Name, Country };
  ShortDescription: string;
  Address:          string;
  Localization:     any;
  Facilities:       any[];
  Email:            string;
  Phone:            string;
  Vues:             any[];
  Type:             any;
  Album:            any[];
  Tag:              any[];
  Boarding:         any[];
  Image:            string;
  Images:           string[];
  Description:      string;
  Theme:            any[];
  Equipments:       any[];
  _enhanced:        boolean;
  _sourceListHotel:   boolean;
  _sourceHotelDetail: boolean;
  _mergedAt:          string; // ISO 8601
}
```

---

## 8. Language / i18n

Switch the error message language at any time:

```js
apiClient.setLanguage('fr'); // 'en' or 'fr'
```

Or pass it to the constructor:

```js
const client = new ApiClient('fr');
```

All validation errors, timeout messages, and network errors will be returned in the chosen language. The `ERROR_MESSAGES` map is exported if you need to extend it:

```js
import { ERROR_MESSAGES } from './ApiClient';
```

---

## 9. Advanced Patterns

### Preloading reference data

Call list endpoints early so searches feel instant:

```js
await Promise.all([
  apiClient.listCountry(),
  apiClient.listCity(),
  apiClient.listCategorie(),
  apiClient.listTag(),
]);
```

### Progress-tracked hotel catalogue

```js
await apiClient.listHotelEnhanced(null, {
  batchSize: 10,
  onProgress: (done, total) => {
    progressBar.value = Math.round((done / total) * 100);
  },
});
```

### Cancelling on component unmount (React example)

```js
useEffect(() => {
  apiClient.searchRoomAvailability({ ... });
  return () => apiClient.cancelRoomAvailabilitySearch();
}, []);
```

### Clearing stale hotel cache after a backend update

```js
apiClient.clearCacheEntry('hotel_101');
apiClient.clearCacheEntry('hotels_all');
```

### Checking cache health

```js
const { size, keys } = apiClient.getCacheStats();
console.log(`${size} cached entries:`, keys);
```

---

*Last updated: February 2026*
