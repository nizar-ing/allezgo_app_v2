// src/services/ApiClient.js
import axios from 'axios';

// All iPro calls now go through the AllezGo backend, which injects credentials server-side.
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://api.allezgoo.com').replace(/\/+$/, '');

const CONFIG = {
    BASE_URL: `${BACKEND_BASE}/api/hotels`,
    TIMEOUT: { DEFAULT: 60000, SEARCH: 120000 },
    BATCH: { DEFAULT_SIZE: 5, DEFAULT_DELAY: 100 },
    LIMITS: { MAX_HOTELS_PER_SEARCH: 300 },
    RETRY: { MAX_ATTEMPTS: 3, BASE_DELAY: 1000, MAX_DELAY: 5000 },
    CACHE: { TTL: 5 * 60 * 1000, ENABLED: true },
};

// ==================== CUSTOM ERROR ====================
class ApiError extends Error {
    constructor(message, status, originalError = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.isApiError = true;
        this.isNetworkError = !status;
        this.isTimeout = message.toLowerCase().includes('timeout');
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

// ==================== ERROR MESSAGES ====================
const ERROR_MESSAGES = {
    en: {
        TIMEOUT: (count) => `Search took too long (${count} hotels). Please reduce the number of hotels.`,
        NETWORK: 'Network error: Unable to contact server. Check your connection.',
        HOTEL_ID_REQUIRED: 'Hotel ID is required',
        HOTEL_NOT_FOUND: (id) => `Hotel with ID ${id} not found`,
        CHECKIN_REQUIRED: 'checkIn is a required parameter',
        CHECKOUT_REQUIRED: 'checkOut is a required parameter',
        HOTELS_REQUIRED: 'hotels is a required parameter and must be a non-empty array',
        ROOMS_REQUIRED: 'rooms is a required parameter and must be a non-empty array',
        INVALID_DATE_FORMAT: (field) => `${field} must be in YYYY-MM-DD format`,
        UNAUTHORIZED: 'Unauthorized access - check credentials',
        NOT_FOUND: 'Resource not found',
        SERVER_ERROR: 'Internal server error',
        REQUEST_FAILED: 'API request failed',
        BOARDING_TYPE_INVALID: 'Invalid boarding type. Must be one of: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE: 'Check-out date must be after check-in date',
        NO_ROOMS_AVAILABLE: 'No rooms available for the selected dates and criteria',
    },
    fr: {
        TIMEOUT: (count) => `La recherche a pris trop de temps (${count} hôtels). Veuillez réduire le nombre d'hôtels.`,
        NETWORK: 'Erreur réseau: impossible de contacter le serveur. Vérifiez votre connexion.',
        HOTEL_ID_REQUIRED: "L'ID de l'hôtel est requis",
        HOTEL_NOT_FOUND: (id) => `Hôtel avec l'ID ${id} introuvable`,
        CHECKIN_REQUIRED: "La date d'arrivée est requise",
        CHECKOUT_REQUIRED: 'La date de départ est requise',
        HOTELS_REQUIRED: "La liste des hôtels est requise et ne doit pas être vide",
        ROOMS_REQUIRED: 'La liste des chambres est requise et ne doit pas être vide',
        INVALID_DATE_FORMAT: (field) => `${field} doit être au format YYYY-MM-DD`,
        UNAUTHORIZED: 'Accès non autorisé - vérifiez les identifiants',
        NOT_FOUND: 'Ressource introuvable',
        SERVER_ERROR: 'Erreur interne du serveur',
        REQUEST_FAILED: 'La requête API a échoué',
        BOARDING_TYPE_INVALID: 'Type de pension invalide. Doit être: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE: "La date de départ doit être après la date d'arrivée",
        NO_ROOMS_AVAILABLE: 'Aucune chambre disponible pour les dates et critères sélectionnés',
    },
};

// ==================== CACHE MANAGER ====================
class CacheManager {
    constructor(ttl = CONFIG.CACHE.TTL) {
        this.cache = new Map();
        this.ttl = ttl;
    }
    set(key, value) { this.cache.set(key, { value, timestamp: Date.now() }); }
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.ttl) { this.cache.delete(key); return null; }
        return item.value;
    }
    has(key) { return this.get(key) !== null; }
    clear() { this.cache.clear(); }
    delete(key) { this.cache.delete(key); }
    getStats() { return { size: this.cache.size, keys: Array.from(this.cache.keys()) }; }
}

// ==================== API CLIENT ====================
class ApiClient {
    constructor(language = 'en') {
        this.language = language;
        this.messages = ERROR_MESSAGES[language] || ERROR_MESSAGES.en;
        this.client = axios.create({
            baseURL: CONFIG.BASE_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: CONFIG.TIMEOUT.DEFAULT,
        });
        this.cache = new CacheManager(CONFIG.CACHE.TTL);
        this.cancelTokens = new Map();
        this.setupInterceptors();
    }

    setLanguage(lang) {
        if (ERROR_MESSAGES[lang]) {
            this.language = lang;
            this.messages = ERROR_MESSAGES[lang];
        }
    }

    setupInterceptors() {
        this.client.interceptors.request.use(
            (config) => config,
            (error) => Promise.reject(error)
        );
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (axios.isCancel(error)) return Promise.reject(new ApiError('Request cancelled', null, error));
                let status = error.response?.status;
                let message = status === 401 ? this.messages.UNAUTHORIZED : this.messages.REQUEST_FAILED;
                return Promise.reject(new ApiError(message, status, error));
            }
        );
    }

    async retryRequest(requestFn, maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try { return await requestFn(); } catch (error) {
                lastError = error;
                // Never retry client errors — the request is definitively bad
                if (error?.status >= 400 && error?.status < 500) break;
                if (attempt === maxAttempts) break;
                const delay = Math.min(CONFIG.RETRY.BASE_DELAY * Math.pow(2, attempt - 1), CONFIG.RETRY.MAX_DELAY);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    createCancelToken(key) {
        this.cancelRequest(key);
        const source = axios.CancelToken.source();
        this.cancelTokens.set(key, source);
        return source;
    }
    cancelRequest(key) {
        const source = this.cancelTokens.get(key);
        if (source) { source.cancel(`Request ${key} cancelled`); this.cancelTokens.delete(key); }
    }
    cancelAllRequests() {
        this.cancelTokens.forEach((source) => source.cancel('All requests cancelled'));
        this.cancelTokens.clear();
    }

    // ==================== LIST METHODS ====================

    async listCountry() {
        const cacheKey = 'countries';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/countries', {});
            return response.data.ListCountry || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listCity() {
        const cacheKey = 'cities';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/cities', {});
            return response.data.ListCity || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listCategorie() {
        const cacheKey = 'categories';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/categories', {});
            return response.data.ListCategorie || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listTag() {
        const cacheKey = 'tags';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/tags', {});
            return response.data.ListTag || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listBoarding() {
        const cacheKey = 'boarding';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/boarding', {});
            return response.data.ListBoarding || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listCurrency() {
        const cacheKey = 'currencies';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/currencies', {});
            return { currencies: response.data.ListCurrency || [], countResults: response.data.CountResults || 0 };
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async listHotel(cityId = null) {
        const cacheKey = cityId ? `hotels_city_${cityId}` : 'hotels_all';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/list/hotels', cityId ? { cityId } : {});
            return response.data.ListHotel || [];
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async getHotel(hotelId) {
        if (!hotelId) throw new ApiError(this.messages.HOTEL_ID_REQUIRED, 400);
        const cacheKey = `hotel_${hotelId}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/detail', { hotelId });
            if (!response.data.HotelDetail) throw new ApiError(this.messages.HOTEL_NOT_FOUND(hotelId), 404);
            return response.data.HotelDetail; // markup already applied server-side
        });
        this.cache.set(cacheKey, data);
        return data;
    }

    async getHotelDetail(hotelId) {
        const hotelDetail = await this.getHotel(hotelId);
        return { hotelDetail, errorMessage: [], timing: null };
    }

    async getHotelsBatch(hotelIds = [], options = {}) {
        if (!hotelIds?.length) return {};
        const { batchSize = CONFIG.BATCH.DEFAULT_SIZE, delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY } = options;
        const hotelsMap = {};
        for (let i = 0; i < hotelIds.length; i += batchSize) {
            const batch = hotelIds.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(id => this.getHotel(id).catch(() => null)));
            results.forEach((h, idx) => { if (h) hotelsMap[batch[idx]] = h; });
            if (i + batchSize < hotelIds.length) await new Promise(r => setTimeout(r, delayBetweenBatches));
        }
        return hotelsMap;
    }

    // ==================== SEARCH TRANSFORMATION ====================

    // ✅ Engine de Statut Intégré
    _transformHotelSearchResponse(response, requestedRooms) {
        if (!response?.HotelSearch) return [];

        const getPaxKey = (pax) => {
            const adults = pax.Adult ?? pax.adults ?? 0;
            const children = Array.isArray(pax.Child) ? pax.Child : (Array.isArray(pax.children) ? pax.children : []);
            const childAges = [...children].sort((a, b) => a - b).join(',');
            return `A${adults}-C${childAges}`;
        };

        return response.HotelSearch.map(hotelData => {
            const { Hotel, Token, Price, Currency, Source } = hotelData;
            const roomsByPaxKey = new Map();

            if (Price?.Boarding) {
                Price.Boarding.forEach(boarding => {
                    boarding.Pax?.forEach(pax => {
                        const paxKey = getPaxKey(pax);
                        if (!roomsByPaxKey.has(paxKey)) roomsByPaxKey.set(paxKey, []);

                        pax.Rooms?.forEach(room => {
                            const price = Number(room.Price);
                            if (!isNaN(price)) {
                                const normalizedRoomId = room.Id ?? room.id ?? room.Code ?? `${boarding.Code}-${paxKey}-${room.Name}`;
                                const normalizedBoardingId = boarding?.Id ?? room?.Boarding?.Id ?? room?.Boarding ?? null;
                                const normalizedBoarding = room?.Boarding ?? (normalizedBoardingId != null ? { Id: normalizedBoardingId } : null);
                                roomsByPaxKey.get(paxKey).push({
                                    id: normalizedRoomId,
                                    Id: normalizedRoomId,
                                    name: room.Name || room.RoomName || 'Chambre Standard',
                                    boardingCode: boarding.Code,
                                    boardingName: boarding.Name,
                                    boardingId: normalizedBoardingId,
                                    Boarding: normalizedBoarding,
                                    Option: room?.Option ?? [],
                                    price: price,
                                    basePrice: Number(room.BasePrice) || price,
                                    stopReservation: room.StopReservation === true || room.StopReservation === "true" || !!(room.StopSales?.Title?.trim()),
                                    stopSalesTitle: room.StopSales?.Title?.trim() || null,
                                    onRequest: room.OnRequest === true || room.OnRequest === "true",
                                    offerId: room.OfferId ?? room.offerId ?? null,
                                    _raw: room,
                                });
                            }
                        });
                    });
                });
            }

            const paxGroups = (requestedRooms || []).map((reqRoom, index) => {
                const reqPaxKey = getPaxKey(reqRoom);
                const availableRooms = roomsByPaxKey.get(reqPaxKey) || [];
                return {
                    paxIndex: index,
                    adults: reqRoom.Adult || 2,
                    children: reqRoom.Child || [],
                    availableRooms: availableRooms.sort((a, b) => a.price - b.price),
                };
            });

            // Logique de Disponibilité Avancée
            let hotelMinPrice = null;
            let hasImmediateCombo = false;
            let hasOnRequestCombo = false;

            const allBoardingCodes = new Set();
            paxGroups.forEach(pg => pg.availableRooms.forEach(r => allBoardingCodes.add(r.boardingCode)));

            allBoardingCodes.forEach(bCode => {
                let comboPrice = 0;
                let isValidCombo = true;
                let isComboOnRequest = false;

                for (const pg of paxGroups) {
                    const bookableRooms = pg.availableRooms.filter(r => r.boardingCode === bCode && !r.stopReservation);

                    if (bookableRooms.length === 0) {
                        isValidCombo = false;
                        break;
                    }

                    const cheapestRoom = bookableRooms[0];
                    comboPrice += cheapestRoom.price;

                    if (cheapestRoom.onRequest) {
                        isComboOnRequest = true;
                    }
                }

                if (isValidCombo) {
                    if (isComboOnRequest) hasOnRequestCombo = true;
                    else hasImmediateCombo = true;

                    if (hotelMinPrice === null || comboPrice < hotelMinPrice) {
                        hotelMinPrice = comboPrice;
                    }
                }
            });

            const allRoomsFlat = Array.from(roomsByPaxKey.values()).flat();
            const hasAnyRooms = allRoomsFlat.length > 0;
            const hasAnyBookableRoom = allRoomsFlat.some(r => !r.stopReservation);
            const hasStopReservationRooms = allRoomsFlat.some(r => r.stopReservation);

            let finalStatus = 'full';
            if (hasImmediateCombo) {
                finalStatus = hasStopReservationRooms ? 'last' : 'available';
            } else if (hasOnRequestCombo) {
                finalStatus = 'on_request';
            } else if (hasAnyRooms && !hasAnyBookableRoom) {
                finalStatus = 'stop_sales';
            }
            const discounts = allRoomsFlat
                .filter(r => !r.stopReservation && r.basePrice && r.price && r.basePrice > r.price)
                .map(r => Math.round(((r.basePrice - r.price) / r.basePrice) * 100));

            return {
                id: Hotel.Id,
                name: Hotel.Name,
                token: Token,
                source: Source,
                image: Hotel.Image,
                category: Hotel.Category,
                city: Hotel.City,
                isAvailable: finalStatus !== 'full',
                availabilityStatus: finalStatus,
                currency: Currency,
                minPrice: hotelMinPrice,
                maxDiscount: discounts.length > 0 ? Math.max(...discounts) : null,
                paxGroups,
                _raw: hotelData,
            };
        });
    }

    async searchHotel(searchParams = {}) {
        const cancelToken = this.createCancelToken('hotelSearch');
        try {
            const roomsForRequest = searchParams.rooms.map(room => ({
                Adult: room.adult || room.adults || 2,
                Child: Array.isArray(room.child) ? room.child : (room.childAges || [])
            }));

            // ✅ DUAL-MODE: City geo-targeting vs. explicit Hotel IDs
            const useCityStrategy = !!searchParams.cityId && !searchParams.hotels?.length;

            // Market params (GuestNationality, Currency) are injected server-side by the adapter
            const bookingDetails = {
                CheckIn: searchParams.checkIn,
                CheckOut: searchParams.checkOut,
            };

            if (useCityStrategy) {
                // ✅ GEO-TARGETING: Let iPro resolve all available hotels for this city
                bookingDetails.City = String(searchParams.cityId);
                bookingDetails.GroupingHotel = true;
                bookingDetails.CombinationRooms = false;
                if (import.meta.env.DEV) console.log('🌍 searchHotel: CITY geo-targeting mode — City:', searchParams.cityId);
            } else {
                // ✅ LEGACY: Explicit hotel ID array (single-hotel, legacy pages)
                bookingDetails.Hotels = searchParams.hotels.slice(0, CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH);
                if (import.meta.env.DEV) console.log('🏨 searchHotel: HOTELS array mode —', searchParams.hotels?.length, 'hotels');
            }

            // ✅ Inject Source: "all" for city strategy to search across all suppliers
            const filters = useCityStrategy
                ? { Source: "all", OnlyAvailable: false, ...(searchParams.filters || {}) }
                : (searchParams.filters || {});

            const response = await this.retryRequest(async () => {
                return await this.client.post('/search', {
                    SearchDetails: {
                        BookingDetails: bookingDetails,
                        Filters: filters,
                        Rooms: roomsForRequest,
                    },
                }, { timeout: CONFIG.TIMEOUT.SEARCH, cancelToken: cancelToken.token });
            });

            // Markup is applied server-side — transform only
            const transformedData = this._transformHotelSearchResponse(response.data, roomsForRequest);
            return {
                hotelSearch: response.data.HotelSearch || [],
                transformedHotels: transformedData,
                countResults: response.data.CountResults || 0,
                searchId: response.data.SearchId || null,
            };
        } finally {
            this.cancelTokens.delete('hotelSearch');
        }
    }

    async searchRoomAvailability(params = {}) {
        const cancelToken = this.createCancelToken('roomAvailability');
        try {
            // Market params are injected server-side by the adapter
            const response = await this.retryRequest(async () => {
                return await this.client.post('/availability', {
                    SearchDetails: {
                        BookingDetails: {
                            CheckIn: params.checkIn,
                            CheckOut: params.checkOut,
                            Hotels: [params.hotelId],
                        },
                        // ✅ FIX CRITIQUE: OnlyAvailable passe à FALSE pour ne pas bloquer les "Sur demande"
                        Filters: { OnlyAvailable: false },
                        Rooms: params.rooms.map(r => ({ Adult: r.adults || 2, Child: r.childAges || [] }))
                    },
                }, { timeout: CONFIG.TIMEOUT.SEARCH, cancelToken: cancelToken.token });
            });

            // Markup is applied server-side
            const allProviders = response.data.HotelSearch || [];
            if (!allProviders.length) return { rooms: [], roomsByPax: [] };

            const primary = allProviders[0];
            // Collect rooms from ALL providers, each tagged with its provider's token/source
            const allRooms = allProviders.flatMap(h =>
                this._processRoomResults(h, params.boardingType).map(r => ({
                    ...r,
                    _token: h.Token,
                    _source: h.Source,
                }))
            );

            const roomsByPax = (params.rooms || []).map((req, idx) => ({
                paxIndex: idx,
                adults: req.adults || req.adult || 2,
                children: req.children || req.child || [],
                childAges: req.childAges || [],
                availableRooms: allRooms,
            }));

            return {
                rooms: allRooms,
                roomsByPax,
                token: primary.Token,
                source: primary.Source,
            };
        } finally {
            this.cancelTokens.delete('roomAvailability');
        }
    }

    _processRoomResults(hotelResult, boardingType = null) {
        const rooms = [];
        hotelResult.Price?.Boarding?.forEach((b, bIdx) => {
            if (boardingType && b.Code !== boardingType) return;
            b.Pax?.forEach((p, pIdx) => {
                p.Rooms?.forEach((r, rIdx) => {
                    const normalizedRoomId = r.Id ?? r.id ?? `${hotelResult.Hotel?.Id}_${bIdx}_${pIdx}_${rIdx}`;
                    const normalizedBoardingId = b?.Id ?? r?.Boarding?.Id ?? r?.Boarding ?? null;
                    const normalizedBoarding = r?.Boarding ?? (normalizedBoardingId != null ? { Id: normalizedBoardingId } : null);
                    rooms.push({
                        id: normalizedRoomId,
                        Id: normalizedRoomId,
                        name: r.Name || r.RoomName || 'Chambre Standard',
                        price: Number(r.Price),
                        basePrice: Number(r.BasePrice || r.Price),
                        boardingCode: b.Code,
                        boardingName: b.Name,
                        boardingId: normalizedBoardingId,
                        Boarding: normalizedBoarding,
                        Option: r?.Option ?? [],
                        stopReservation: r.StopReservation === true || r.StopReservation === "true" || !!(r.StopSales?.Title?.trim()),
                        stopSalesTitle: r.StopSales?.Title?.trim() || null,
                        onRequest: r.OnRequest === true || r.OnRequest === "true",
                        offerId: r.OfferId ?? r.offerId ?? null,
                        _raw: r,
                    });
                });
            });
        });
        return rooms.sort((a, b) => a.price - b.price);
    }

    _processRoomsByPax(hotelResult, requestedRooms = [], boardingType = null) {
        return (requestedRooms || []).map((req, idx) => ({
            paxIndex: idx,
            adults: req.adults || 2,
            availableRooms: this._processRoomResults(hotelResult, boardingType)
        }));
    }

    async listHotelEnhanced(cityId = null, options = {}) {
        const { batchSize = CONFIG.BATCH.DEFAULT_SIZE, delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY } = options;
        const hotelsList = await this.listHotel(cityId);
        if (!hotelsList?.length) return [];
        const enhancedHotels = [];
        for (let i = 0; i < hotelsList.length; i += batchSize) {
            const batch = hotelsList.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(hotel => this.getHotel(hotel.Id).then(detail => this._mergeHotelData(hotel, detail)).catch(() => ({ ...hotel, _enhanced: false }))));
            enhancedHotels.push(...results);
            if (i + batchSize < hotelsList.length) await new Promise(r => setTimeout(r, delayBetweenBatches));
        }
        return enhancedHotels;
    }

    _mergeHotelData(listData, detailData) {
        if (!detailData) return { ...listData, _enhanced: false };
        return {
            ...listData, ...detailData,
            Category: { ...listData.Category, ...detailData.Category },
            City: { ...listData.City, ...detailData.City },
            _enhanced: true, _mergedAt: new Date().toISOString(),
        };
    }

    clearCache() { this.cache.clear(); }
    getCacheStats() { return this.cache.getStats(); }
}

const apiClient = new ApiClient('fr');
export default apiClient;
export { ApiClient, ApiError, CONFIG, ERROR_MESSAGES };
export const cancelAllRequests = () => apiClient.cancelAllRequests();
