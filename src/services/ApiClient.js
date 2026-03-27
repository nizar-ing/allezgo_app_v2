// src/services/ApiClient.js
import axios from 'axios';

// ==================== CONSTANTS ====================
const CONFIG = {
    BASE_URL: 'https://admin.ipro-booking.com/api/hotel',
    TIMEOUT: { DEFAULT: 60000, SEARCH: 120000 },
    BATCH:   { DEFAULT_SIZE: 5, DEFAULT_DELAY: 100 },
    LIMITS:  { MAX_HOTELS_PER_SEARCH: 300 },
    RETRY:   { MAX_ATTEMPTS: 3, BASE_DELAY: 1000, MAX_DELAY: 5000 },
    CACHE:   { TTL: 5 * 60 * 1000, ENABLED: true },
};

// ==================== CREDENTIALS ====================
const CREDENTIALS = {
    Login:    import.meta.env.VITE_API_LOGIN,
    Password: import.meta.env.VITE_API_PASSWORD,
};

if (!CREDENTIALS.Login || !CREDENTIALS.Password) {
    throw new Error(
        'FATAL: API credentials (VITE_API_LOGIN, VITE_API_PASSWORD) are not configured in .env file.'
    );
}

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
        TIMEOUT:              (count) => `Search took too long (${count} hotels). Please reduce the number of hotels.`,
        NETWORK:              'Network error: Unable to contact server. Check your connection.',
        HOTEL_ID_REQUIRED:    'Hotel ID is required',
        HOTEL_NOT_FOUND:      (id) => `Hotel with ID ${id} not found`,
        CHECKIN_REQUIRED:     'checkIn is a required parameter',
        CHECKOUT_REQUIRED:    'checkOut is a required parameter',
        HOTELS_REQUIRED:      'hotels is a required parameter and must be a non-empty array',
        ROOMS_REQUIRED:       'rooms is a required parameter and must be a non-empty array',
        INVALID_DATE_FORMAT:  (field) => `${field} must be in YYYY-MM-DD format`,
        UNAUTHORIZED:         'Unauthorized access - check credentials',
        NOT_FOUND:            'Resource not found',
        SERVER_ERROR:         'Internal server error',
        REQUEST_FAILED:       'API request failed',
        BOARDING_TYPE_INVALID:'Invalid boarding type. Must be one of: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE:   'Check-out date must be after check-in date',
        NO_ROOMS_AVAILABLE:   'No rooms available for the selected dates and criteria',
    },
    fr: {
        TIMEOUT:              (count) => `La recherche a pris trop de temps (${count} hôtels). Veuillez réduire le nombre d'hôtels.`,
        NETWORK:              'Erreur réseau: impossible de contacter le serveur. Vérifiez votre connexion.',
        HOTEL_ID_REQUIRED:    "L'ID de l'hôtel est requis",
        HOTEL_NOT_FOUND:      (id) => `Hôtel avec l'ID ${id} introuvable`,
        CHECKIN_REQUIRED:     "La date d'arrivée est requise",
        CHECKOUT_REQUIRED:    'La date de départ est requise',
        HOTELS_REQUIRED:      "La liste des hôtels est requise et ne doit pas être vide",
        ROOMS_REQUIRED:       'La liste des chambres est requise et ne doit pas être vide',
        INVALID_DATE_FORMAT:  (field) => `${field} doit être au format YYYY-MM-DD`,
        UNAUTHORIZED:         'Accès non autorisé - vérifiez les identifiants',
        NOT_FOUND:            'Ressource introuvable',
        SERVER_ERROR:         'Erreur interne du serveur',
        REQUEST_FAILED:       'La requête API a échoué',
        BOARDING_TYPE_INVALID:'Type de pension invalide. Doit être: RO, BB, HB, FB, AI, SC',
        INVALID_DATE_RANGE:   "La date de départ doit être après la date d'arrivée",
        NO_ROOMS_AVAILABLE:   'Aucune chambre disponible pour les dates et critères sélectionnés',
    },
};

// ==================== CACHE MANAGER ====================
class CacheManager {
    constructor(ttl = CONFIG.CACHE.TTL) {
        this.cache = new Map();
        this.ttl   = ttl;
    }
    set(key, value)  { this.cache.set(key, { value, timestamp: Date.now() }); }
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.ttl) { this.cache.delete(key); return null; }
        return item.value;
    }
    has(key)      { return this.get(key) !== null; }
    clear()       { this.cache.clear(); }
    delete(key)   { this.cache.delete(key); }
    getStats()    { return { size: this.cache.size, keys: Array.from(this.cache.keys()) }; }
}

// ==================== API CLIENT ====================
class ApiClient {
    constructor(language = 'en') {
        this.language    = language;
        this.messages    = ERROR_MESSAGES[language] || ERROR_MESSAGES.en;
        this.client      = axios.create({
            baseURL: CONFIG.BASE_URL,
            headers: { 'Content-Type': 'application/json' },
            timeout: CONFIG.TIMEOUT.DEFAULT,
        });
        this.credentials  = CREDENTIALS;
        this.cache        = new CacheManager(CONFIG.CACHE.TTL);
        this.cancelTokens = new Map();
        this.setupInterceptors();
    }

    // ==================== LANGUAGE SETTER ====================
    setLanguage(lang) {
        if (ERROR_MESSAGES[lang]) {
            this.language = lang;
            this.messages = ERROR_MESSAGES[lang];
        }
    }

    // ==================== INTERCEPTORS ====================
    setupInterceptors() {
        this.client.interceptors.request.use(
            (config) => {
                if (import.meta.env.DEV) console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => Promise.reject(error)
        );
        this.client.interceptors.response.use(
            (response) => {
                if (import.meta.env.DEV) console.log('API Response:', response.status);
                return response;
            },
            (error) => {
                if (axios.isCancel(error)) {
                    if (import.meta.env.DEV) console.log('Request cancelled:', error.message);
                    return Promise.reject(new ApiError('Request cancelled', null, error));
                }

                let status = error.response?.status;
                let message;

                if (error.code === 'ECONNABORTED') {
                    message = this.messages.TIMEOUT(0);
                    status = 408; // Request Timeout
                } else if (!error.response) {
                    message = this.messages.NETWORK;
                    status = null; // Network Error
                } else {
                    switch (status) {
                        case 401: message = this.messages.UNAUTHORIZED; break;
                        case 404: message = this.messages.NOT_FOUND; break;
                        case 500: message = this.messages.SERVER_ERROR; break;
                        default:  message = this.messages.REQUEST_FAILED;
                    }
                }

                if (import.meta.env.DEV) {
                    console.error(`API Error: ${status || 'Network Error'} - ${message}`, error);
                }

                return Promise.reject(new ApiError(message, status, error));
            }
        );
    }

    // ==================== RETRY LOGIC ====================
    async retryRequest(requestFn, maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                if (error.isCancelled || (error instanceof ApiError && !this.isRetryableError(error))) {
                    throw error;
                }
                if (attempt === maxAttempts) break;

                const delay = Math.min(
                    CONFIG.RETRY.BASE_DELAY * Math.pow(2, attempt - 1),
                    CONFIG.RETRY.MAX_DELAY
                );
                if (import.meta.env.DEV) console.log(`🔄 Retry attempt ${attempt}/${maxAttempts} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        if (import.meta.env.DEV) console.error(`❌ All ${maxAttempts} retry attempts failed`);
        throw lastError;
    }

    isRetryableError(error) {
        if (error.isNetworkError) return true;
        if (error.isTimeout) return true;
        if (error.status >= 500) return true;
        if (error.status === 408 || error.status === 429) return true;
        return false;
    }

    // ==================== CANCEL TOKEN MANAGEMENT ====================
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

    // ==================== HELPER METHODS ====================
    createRequestBody(additionalData = {}) {
        return { Credential: this.credentials, ...additionalData };
    }

    // ==================== CACHED LIST ENDPOINTS ====================
    async listCountry() {
        const cacheKey = 'countries';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached countries');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCountry', this.createRequestBody());
            return response.data.ListCountry || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCity() {
        const cacheKey = 'cities';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached cities');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCity', this.createRequestBody());
            return response.data.ListCity || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCategorie() {
        const cacheKey = 'categories';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached categories');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCategorie', this.createRequestBody());
            return response.data.ListCategorie || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listTag() {
        const cacheKey = 'tags';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached tags');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListTag', this.createRequestBody());
            return response.data.ListTag || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listBoarding() {
        const cacheKey = 'boarding';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached boarding options');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListBoarding', this.createRequestBody());
            return response.data.ListBoarding || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async listCurrency() {
        const cacheKey = 'currencies';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log('✅ Using cached currencies');
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/ListCurrency', this.createRequestBody());
            return {
                currencies:   response.data.ListCurrency || [],
                countResults: response.data.CountResults || 0,
                errorMessage: response.data.ErrorMessage || [],
                timing:       response.data.Timing || null,
            };
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    // ==================== HOTEL ENDPOINTS ====================
    async listHotel(cityId = null) {
        const cacheKey = cityId ? `hotels_city_${cityId}` : 'hotels_all';
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log(`✅ Using cached hotel list (${cacheKey})`);
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const requestBody = cityId
                ? this.createRequestBody({ City: cityId })
                : this.createRequestBody();
            const response = await this.client.post('/ListHotel', requestBody);
            return response.data.ListHotel || [];
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async getHotel(hotelId) {
        if (!hotelId) throw new ApiError(this.messages.HOTEL_ID_REQUIRED, 400);
        const cacheKey = `hotel_${hotelId}`;
        if (CONFIG.CACHE.ENABLED && this.cache.has(cacheKey)) {
            if (import.meta.env.DEV) console.log(`✅ Using cached hotel detail (${hotelId})`);
            return this.cache.get(cacheKey);
        }
        const data = await this.retryRequest(async () => {
            const response = await this.client.post('/HotelDetail', this.createRequestBody({ Hotel: hotelId }));
            const hotelDetail = response.data.HotelDetail || null;
            if (!hotelDetail) {
                throw new ApiError(this.messages.HOTEL_NOT_FOUND(hotelId), 404);
            }
            return hotelDetail;
        });
        if (CONFIG.CACHE.ENABLED) this.cache.set(cacheKey, data);
        return data;
    }

    async getHotelDetail(hotelId) {
        const hotelDetail = await this.getHotel(hotelId);
        return { hotelDetail, errorMessage: [], timing: null };
    }

    async getHotelsBatch(hotelIds = [], options = {}) {
        if (!Array.isArray(hotelIds) || hotelIds.length === 0) return {};
        const {
            batchSize             = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches   = CONFIG.BATCH.DEFAULT_DELAY,
        } = options;
        if (import.meta.env.DEV) console.log(`🔄 Fetching ${hotelIds.length} hotels in batches of ${batchSize}...`);
        const hotelsMap   = {};
        const totalBatches = Math.ceil(hotelIds.length / batchSize);
        for (let i = 0; i < hotelIds.length; i += batchSize) {
            const batch        = hotelIds.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;
            if (import.meta.env.DEV) console.log(`📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);
            const batchPromises = batch.map(id =>
                this.getHotel(id)
                    .then(hotel  => ({ id, hotel, success: true }))
                    .catch(error => {
                        if (import.meta.env.DEV) console.error(`❌ Failed to fetch hotel ${id}:`, error.message);
                        return { id, hotel: null, success: false, error: error.message };
                    })
            );
            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(result => {
                if (result.success && result.hotel) hotelsMap[result.id] = result.hotel;
            });
            if (import.meta.env.DEV) console.log(`✅ Batch ${currentBatch}/${totalBatches} completed`);
            if (i + batchSize < hotelIds.length)
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
        if (import.meta.env.DEV)
            console.log(`✨ Fetched ${Object.keys(hotelsMap).length}/${hotelIds.length} hotels successfully`);
        return hotelsMap;
    }

    /**
     * @private
     * Transforms the raw API response from /HotelSearch into a UI-friendly format,
     * preserving the per-pax-group pricing structure.
     */
    _transformHotelSearchResponse(response, requestedRooms) {
        if (!response?.HotelSearch) return [];

        const getPaxKey = (pax) => {
            const adults = pax.Adult ?? pax.adults ?? 0;
            const children = Array.isArray(pax.Child) ? pax.Child : (Array.isArray(pax.children) ? pax.children : []);
            const childAges = [...children].sort((a, b) => a - b).join(',');
            return `A${adults}-C${childAges}`;
        };

        return response.HotelSearch.map(hotelData => {
            const { Hotel, Token, Price, FreeChild, Currency } = hotelData;

            const roomsByPaxKey = new Map();
            const allPrices = [];

            if (Price?.Boarding) {
                Price.Boarding.forEach(boarding => {
                    boarding.Pax?.forEach(pax => {
                        const paxKey = getPaxKey(pax);
                        if (!roomsByPaxKey.has(paxKey)) {
                            roomsByPaxKey.set(paxKey, []);
                        }

                        pax.Rooms?.forEach(room => {
                            const price = parseFloat(room.Price);
                            if (!isNaN(price)) {
                                allPrices.push(price);

                                roomsByPaxKey.get(paxKey).push({
                                    id: room.Id ?? room.Code ?? `${boarding.Code}-${paxKey}-${room.Name}`,
                                    name: room.Name || room.RoomName,
                                    boardingCode: boarding.Code,
                                    boardingName: boarding.Name,
                                    price: price,
                                    basePrice: parseFloat(room.BasePrice) || price,
                                    stopReservation: room.StopReservation === true || room.StopReservation === "true",
                                    onRequest: room.OnRequest === true || room.OnRequest === "true",
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
                    children: reqRoom.Child || [], // this is an array of ages like [5, 8]
                    availableRooms: availableRooms.sort((a, b) => a.price - b.price),
                };
            });

            const hasPrices = allPrices.length > 0;
            // A hotel is available if it has prices AND all requested pax groups have at least one room available
            const isAvailable = hasPrices && paxGroups.every(pg => pg.availableRooms.length > 0);
            
            const minPrice = hasPrices ? Math.min(...allPrices) : null;
            const hasChildrenInRequest = requestedRooms.some(r => r.Child?.length > 0);

            const isFreeChild = hasChildrenInRequest && FreeChild?.some(fc =>
                requestedRooms.some(rr =>
                    rr.Child?.some(age => age < fc.Age)
                )
            );

            const allRoomsFlat = Array.from(roomsByPaxKey.values()).flat();
            const discounts = allRoomsFlat
                .filter(r => r.basePrice && r.price && r.basePrice > r.price)
                .map(r => Math.round(((r.basePrice - r.price) / r.basePrice) * 100));

            return {
                id: Hotel.Id,
                name: Hotel.Name,
                token: Token,
                image: Hotel.Image,
                category: Hotel.Category,
                city: Hotel.City,
                address: Hotel.Adress,
                themes: Hotel.Theme || [],
                isAvailable: isAvailable,
                currency: Currency,
                minPrice: minPrice,
                maxDiscount: discounts.length > 0 ? Math.max(...discounts) : null,
                hasChildrenInRequest,
                isFreeChild,
                paxGroups,
                _raw: hotelData,
            };
        });
    }

    async searchHotel(searchParams = {}) {
        const cancelToken = this.createCancelToken('hotelSearch');
        try {
            if (!searchParams.checkIn)  throw new ApiError(this.messages.CHECKIN_REQUIRED, 400);
            if (!searchParams.checkOut) throw new ApiError(this.messages.CHECKOUT_REQUIRED, 400);
            if (!searchParams.hotels || !Array.isArray(searchParams.hotels) || searchParams.hotels.length === 0)
                throw new ApiError(this.messages.HOTELS_REQUIRED, 400);
            if (!searchParams.rooms || !Array.isArray(searchParams.rooms) || searchParams.rooms.length === 0)
                throw new ApiError(this.messages.ROOMS_REQUIRED, 400);

            const limitedHotels = searchParams.hotels.slice(0, CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH);
            const limitApplied  = searchParams.hotels.length > CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH;
            if (limitApplied) {
                console.warn(
                    `⚠️ [ApiClient.searchHotel] Search limited to ${CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH} hotels ` +
                    `(${searchParams.hotels.length} requested, ` +
                    `${searchParams.hotels.length - CONFIG.LIMITS.MAX_HOTELS_PER_SEARCH} dropped). `
                );
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(searchParams.checkIn)) {
                throw new ApiError(this.messages.INVALID_DATE_FORMAT('checkIn'), 400);
            }
            if (!dateRegex.test(searchParams.checkOut)) {
                throw new ApiError(this.messages.INVALID_DATE_FORMAT('checkOut'), 400);
            }

            const roomsForRequest = searchParams.rooms.map(room => {
                const roomObj = { Adult: room.adult || room.adults || room.Adult || 2 };
                // Ensure we capture children correctly whether passed as child, children, or childAges
                const childAges = room.child || room.children || room.childAges;
                if (Array.isArray(childAges) && childAges.length > 0) {
                    roomObj.Child = childAges;
                } else if (typeof childAges === 'number' && childAges > 0) {
                    roomObj.Child = Array(childAges).fill(5); // fallback if it was just a count
                }
                return roomObj;
            });

            // FIX: Sanitize the incoming filters object to match API expectations.
            // OnlyAvailable defaults to FALSE so the API returns all hotels (available + unavailable).
            // Hotels without pricing will have isAvailable: false in the transformed output,
            // allowing the UI to differentiate them without losing the full result set.
            const defaultFilters = { Keywords: "", Category: [], OnlyAvailable: false, Tags: [] };
            const incomingFilters = searchParams.filters || {};
            const finalFilters = {
                Keywords: incomingFilters.keywords ?? incomingFilters.Keywords ?? defaultFilters.Keywords,
                Category: incomingFilters.category ?? incomingFilters.Category ?? defaultFilters.Category,
                OnlyAvailable: incomingFilters.onlyAvailable ?? incomingFilters.OnlyAvailable ?? defaultFilters.OnlyAvailable,
                Tags: incomingFilters.tags ?? incomingFilters.Tags ?? defaultFilters.Tags,
            };

            if (typeof finalFilters.Category === 'string') {
                finalFilters.Category = finalFilters.Category ? [finalFilters.Category] : [];
            }
            if (typeof finalFilters.Tags === 'string') {
                finalFilters.Tags = finalFilters.Tags ? [finalFilters.Tags] : [];
            }

            const requestBody = this.createRequestBody({
                SearchDetails: {
                    BookingDetails: {
                        CheckIn:  searchParams.checkIn,
                        CheckOut: searchParams.checkOut,
                        Hotels:   limitedHotels,
                    },
                    Filters: finalFilters,
                    Rooms: roomsForRequest,
                },
            });

            if (import.meta.env.DEV) {
                console.log(`🔍 Searching ${limitedHotels.length} hotels...`);
                console.log(`📦 Request size: ${(JSON.stringify(requestBody).length / 1024).toFixed(2)} KB`);
            }

            const response = await this.retryRequest(async () => {
                return await this.client.post('/HotelSearch', requestBody, {
                    timeout:     CONFIG.TIMEOUT.SEARCH,
                    cancelToken: cancelToken.token,
                });
            });

            this.cancelTokens.delete('hotelSearch');

            const transformedData = this._transformHotelSearchResponse(response.data, roomsForRequest);

            if (import.meta.env.DEV)
                console.log(`✅ Search returned and transformed ${transformedData.length} results`);

            return {
                // Keep original structure for backward compatibility if needed elsewhere
                hotelSearch:       response.data.HotelSearch || [],
                // Add the new transformed data
                transformedHotels: transformedData,
                countResults:      response.data.CountResults || 0,
                errorMessage:      response.data.ErrorMessage || null,
                searchId:          response.data.SearchId || null,
                timing:            response.data.Timing || null,
                _limitApplied:     limitApplied,
                _requestedHotels:  searchParams.hotels.length,
                _searchedHotels:   limitedHotels.length,
            };
        } catch (error) {
            this.cancelTokens.delete('hotelSearch');
            if (error.isTimeout) {
                throw new ApiError(this.messages.TIMEOUT(searchParams.hotels?.length || 0), 408, error);
            }
            throw error;
        }
    }

    async searchRoomAvailability(params = {}) {
        const cancelToken = this.createCancelToken('roomAvailability');
        try {
            if (!params.hotelId)  throw new ApiError(this.messages.HOTEL_ID_REQUIRED, 400);
            if (!params.checkIn)  throw new ApiError(this.messages.CHECKIN_REQUIRED, 400);
            if (!params.checkOut) throw new ApiError(this.messages.CHECKOUT_REQUIRED, 400);
            if (!params.rooms || !Array.isArray(params.rooms) || params.rooms.length === 0)
                throw new ApiError(this.messages.ROOMS_REQUIRED, 400);

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(params.checkIn)) {
                throw new ApiError(this.messages.INVALID_DATE_FORMAT('checkIn'), 400);
            }
            if (!dateRegex.test(params.checkOut)) {
                throw new ApiError(this.messages.INVALID_DATE_FORMAT('checkOut'), 400);
            }

            const checkInDate  = new Date(params.checkIn);
            const checkOutDate = new Date(params.checkOut);
            if (checkOutDate <= checkInDate) throw new ApiError(this.messages.INVALID_DATE_RANGE, 400);

            const bookingDetails = {
                CheckIn:  params.checkIn,
                CheckOut: params.checkOut,
                Hotels:   [params.hotelId],
            };
            const rooms = params.rooms.map(room => {
                const roomObj = { Adult: room.adults ?? 2 };
                if (Array.isArray(room.childAges) && room.childAges.length > 0) {
                    roomObj.Child = room.childAges;
                } else if (Array.isArray(room.children) && room.children.length > 0) {
                    roomObj.Child = room.children;
                } else if (typeof room.children === 'number' && room.children > 0) {
                    roomObj.Child = room.childAges ?? Array(room.children).fill(5);
                }
                return roomObj;
            });
            const searchFilters = { Keywords: '', Category: [], OnlyAvailable: true, Tags: [] };
            if (params.boardingType) searchFilters.Boarding = [params.boardingType];

            const requestBody = this.createRequestBody({
                SearchDetails: { BookingDetails: bookingDetails, Filters: searchFilters, Rooms: rooms },
            });

            if (import.meta.env.DEV) {
                console.log(`🔍 Room availability — hotel ${params.hotelId}`);
                console.log(`📅 ${params.checkIn} → ${params.checkOut}`);
                console.log(`🛏️ ${rooms.length} room(s):`, rooms);
                if (params.boardingType) console.log(`🍽️ Boarding: ${params.boardingType}`);
            }

            const response = await this.retryRequest(async () => {
                return await this.client.post('/HotelSearch', requestBody, {
                    timeout:     CONFIG.TIMEOUT.SEARCH,
                    cancelToken: cancelToken.token,
                });
            });

            this.cancelTokens.delete('roomAvailability');

            const hotelResults = response.data.HotelSearch || [];
            if (hotelResults.length === 0) {
                if (import.meta.env.DEV) console.log('❌ No availability found for the specified dates');
                return { rooms: [], roomsByPax: [], errorMessage: [this.messages.NO_ROOMS_AVAILABLE], hotelInfo: null };
            }

            const hotelResult = hotelResults[0];
            if (!hotelResult.Price?.Boarding?.length) {
                if (import.meta.env.DEV) console.log('⚠️ Hotel found but no boarding/pricing data');
                return {
                    rooms: [], roomsByPax: [],
                    errorMessage: ['Aucune chambre disponible pour les dates et critères sélectionnés'],
                    hotelInfo: { hotelId: hotelResult.Hotel?.Id, hotelName: hotelResult.Hotel?.Name, available: false },
                };
            }

            const processedRooms = this._processRoomResults(hotelResult, params.boardingType);
            const roomsByPax     = this._processRoomsByPax(hotelResult, params.rooms, params.boardingType);

            if (import.meta.env.DEV) {
                console.log(`✅ Found ${processedRooms.length} room option(s) across ${roomsByPax.length} pax slot(s)`);
                roomsByPax.forEach((p, i) =>
                    console.log(` Slot ${i + 1}: ${p.adults} adult(s) → ${p.rooms.length} room option(s)`)
                );
            }

            return {
                rooms: processedRooms,
                roomsByPax,
                errorMessage: response.data.ErrorMessage || [],
                hotelInfo: {
                    hotelId:    hotelResult.Hotel?.Id,
                    hotelName:  hotelResult.Hotel?.Name,
                    available:  true,
                    totalRooms: processedRooms.length,
                },
                token:    hotelResult.Token || null,
                searchId: response.data.SearchId || null,
                timing:   response.data.Timing   || null,
            };
        } catch (error) {
            this.cancelTokens.delete('roomAvailability');
            if (error.isTimeout) {
                throw new ApiError('Room availability search timed out. Please try again.', 408, error);
            }
            throw error;
        }
    }

    /** @private */
    _processRoomResults(hotelResult, boardingType = null) {
        const rooms = [];
        hotelResult.Price?.Boarding?.forEach((boarding, boardingIndex) => {
            const boardingCode = boarding.Code || boarding.BoardingCode;
            const boardingName = boarding.Name || boarding.BoardingName || this._getBoardingName(boardingCode);
            if (boardingType && boardingCode !== boardingType) return;
            boarding.Pax?.forEach((pax, paxIndex) => {
                pax.Rooms?.forEach((room, roomIndex) => {
                    const roomCode  = room.RoomCode || room.Code || `room_${roomIndex}`;
                    const price     = parseFloat(room.Price)     || 0;
                    const basePrice = parseFloat(room.BasePrice) || price;
                    rooms.push({
                        id:                 `${hotelResult.Hotel?.Id}_${boardingIndex}_${paxIndex}_${roomIndex}_${roomCode}_${boardingCode}`,
                        roomCode,
                        name:               room.RoomName || room.Name || 'Chambre Standard',
                        boardingCode,
                        boardingName,
                        price,
                        basePrice,
                        stopReservation:    room.StopReservation === true || room.StopReservation === "true",
                        currency:           hotelResult.Currency || 'DZD',
                        available:          !(room.StopReservation === true || room.StopReservation === "true"),
                        onRequest:          room.OnRequest === true || room.OnRequest === "true",
                        quantity:           room.Quantity  ?? null,
                        cancellationPolicy: room.CancellationPolicy ?? [],
                        _raw: room,
                    });
                });
            });
        });
        rooms.sort((a, b) => a.price - b.price);
        return rooms;
    }

    /** @private */
    _processRoomsByPax(hotelResult, requestedRooms = [], boardingType = null) {
        const getPaxKey = (adults, childAges) => {
            const a = adults ?? 0;
            const c = childAges ?? [];
            const sortedC = [...c].sort((x, y) => x - y).join(',');
            return `A${a}-C${sortedC}`;
        };

        const roomsByPaxKey = new Map();

        hotelResult.Price?.Boarding?.forEach((boarding, boardingIndex) => {
            const boardingCode = boarding.Code || boarding.BoardingCode;
            const boardingName = boarding.Name || boarding.BoardingName || this._getBoardingName(boardingCode);
            if (boardingType && boardingCode !== boardingType) return;

            boarding.Pax?.forEach((pax) => {
                const paxKey = getPaxKey(pax.Adult, pax.Child);
                if (!roomsByPaxKey.has(paxKey)) roomsByPaxKey.set(paxKey, []);

                pax.Rooms?.forEach((room, roomIndex) => {
                    const roomCode  = room.RoomCode || room.Code || `room_${roomIndex}`;
                    const price     = parseFloat(room.Price)     || 0;
                    const basePrice = parseFloat(room.BasePrice) || price;

                    roomsByPaxKey.get(paxKey).push({
                        id:                 `${hotelResult.Hotel?.Id}_${paxKey}_${boardingIndex}_${roomIndex}_${roomCode}_${boardingCode}`,
                        roomCode,
                        name:               room.RoomName || room.Name || 'Chambre Standard',
                        boardingCode,
                        boardingName,
                        price,
                        basePrice,
                        stopReservation:    room.StopReservation === true || room.StopReservation === "true",
                        currency:           hotelResult.Currency || 'DZD',
                        adults:             pax.Adult ?? 2,
                        available:          !(room.StopReservation === true || room.StopReservation === "true"),
                        onRequest:          room.OnRequest === true || room.OnRequest === "true",
                        quantity:           room.Quantity  ?? null,
                        cancellationPolicy: room.CancellationPolicy ?? [],
                        _raw: room,
                    });
                });
            });
        });

        if (import.meta.env.DEV)
            console.log('📊 Available pax keys from API:', Array.from(roomsByPaxKey.keys()));

        return requestedRooms.map((requestedRoom, paxIndex) => {
            let childAgesArray = [];
            if (Array.isArray(requestedRoom.childAges) && requestedRoom.childAges.length > 0) {
                childAgesArray = requestedRoom.childAges;
            } else if (Array.isArray(requestedRoom.children) && requestedRoom.children.length > 0) {
                childAgesArray = requestedRoom.children;
            } else if (typeof requestedRoom.children === 'number' && requestedRoom.children > 0) {
                childAgesArray = Array(requestedRoom.children).fill(5);
            }

            const requestedAdults = requestedRoom.adults ?? 2;
            const reqPaxKey = getPaxKey(requestedAdults, childAgesArray);
            let matchedRooms = roomsByPaxKey.get(reqPaxKey) ?? [];

            if (matchedRooms.length === 0 && roomsByPaxKey.size > 0) {
                if (import.meta.env.DEV) {
                    console.warn(`⚠️ Slot ${paxIndex + 1}: No exact match for pax key ${reqPaxKey}.`);
                }
            }

            return {
                paxIndex,
                adults:    requestedAdults,
                children:  childAgesArray.length,
                childAges: childAgesArray,
                rooms:     [...matchedRooms].sort((a, b) => a.price - b.price),
            };
        });
    }

    /** @private */
    _getBoardingName(code) {
        const boardingMap = {
            RO: 'Chambre Seule', BB: 'Bed & Breakfast', HB: 'Demi-Pension',
            FB: 'Pension Complète', AI: 'Tout Inclus', SC: 'Self Catering',
            DP: 'Demi Pension', SALL: 'Soft All Inclusive', ALL: 'All Inclusive',
        };
        return boardingMap[code] || code;
    }

    cancelRoomAvailabilitySearch() {
        this.cancelRequest('roomAvailability');
        if (import.meta.env.DEV) console.log('🚫 Room availability search cancelled');
    }

    // ==================== LIST HOTELS ENHANCED ====================
    async listHotelEnhanced(cityId = null, options = {}) {
        const {
            batchSize           = CONFIG.BATCH.DEFAULT_SIZE,
            delayBetweenBatches = CONFIG.BATCH.DEFAULT_DELAY,
            onProgress          = null,
            onBatchComplete     = null,
        } =options;

        if (import.meta.env.DEV) console.log('📋 Fetching hotel list...');
        const hotelsList = await this.listHotel(cityId);
        if (!hotelsList || hotelsList.length === 0) {
            if (import.meta.env.DEV) console.log('❌ No hotels found');
            return [];
        }
        if (import.meta.env.DEV)
            console.log(`✅ Found ${hotelsList.length} hotels. Starting batch processing...`);

        const enhancedHotels = [];
        const totalBatches   = Math.ceil(hotelsList.length / batchSize);

        for (let i = 0; i < hotelsList.length; i += batchSize) {
            const batch        = hotelsList.slice(i, i + batchSize);
            const currentBatch = Math.floor(i / batchSize) + 1;
            if (import.meta.env.DEV)
                console.log(`🔄 Processing batch ${currentBatch}/${totalBatches} (${batch.length} hotels)`);

            const batchPromises = batch.map(hotel =>
                this.getHotel(hotel.Id)
                    .then(hotelDetail => {
                        const enhanced = this._mergeHotelData(hotel, hotelDetail);
                        if (import.meta.env.DEV) console.log(`✓ Enhanced: ${hotel.Name}`);
                        return enhanced;
                    })
                    .catch(error => {
                        if (import.meta.env.DEV)
                            console.error(`✗ Error for hotel ${hotel.Id} (${hotel.Name}):`, error.message);
                        return { ...hotel, _enhanced: false, _error: error.message };
                    })
            );

            const batchResults = await Promise.all(batchPromises);
            enhancedHotels.push(...batchResults);
            if (onProgress)     onProgress(enhancedHotels.length, hotelsList.length);
            if (onBatchComplete) onBatchComplete(currentBatch, totalBatches, batchResults);
            if (import.meta.env.DEV)
                console.log(`✅ Batch ${currentBatch}/${totalBatches} done (${enhancedHotels.length}/${hotelsList.length})`);

            if (i + batchSize < hotelsList.length) {
                if (import.meta.env.DEV) console.log(`⏳ Waiting ${delayBetweenBatches}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        if (import.meta.env.DEV) console.log(`🎉 All batches done! Enhanced ${enhancedHotels.length} hotels.`);
        return enhancedHotels;
    }

    _mergeHotelData(listHotelData, hotelDetailData) {
        if (!hotelDetailData) {
            return { ...listHotelData, _enhanced: false, _sourceListHotel: true, _sourceHotelDetail: false };
        }
        return {
            Id:       listHotelData.Id,
            Name:     listHotelData.Name,
            Category: {
                Id:    listHotelData.Category?.Id,
                Title: hotelDetailData.Category?.Title || listHotelData.Category?.Title,
                Star:  hotelDetailData.Category?.Star  || listHotelData.Category?.Star,
            },
            City: {
                Id:      listHotelData.City?.Id,
                Name:    listHotelData.City?.Name    || hotelDetailData.City?.Name,
                Country: listHotelData.City?.Country || { Name: hotelDetailData.City?.Country },
            },
            ShortDescription: listHotelData.ShortDescription,
            Address:          listHotelData.Adress   || listHotelData.Address,
            Adress:           listHotelData.Adress,
            Localization:     listHotelData.Localization,
            Facilities:       listHotelData.Facilities || [],
            FreeChild:        listHotelData.FreeChild  || hotelDetailData.FreeChild || [],
            Email:            hotelDetailData.Email,
            Phone:            hotelDetailData.Phone,
            Vues:             hotelDetailData.Vues    || [],
            Type:             hotelDetailData.Type,
            Album:            hotelDetailData.Album   || [],
            Tag:              hotelDetailData.Tag     || [],
            Boarding:         hotelDetailData.Boarding || [],
            Image:            listHotelData.Image     || hotelDetailData.Image,
            Images:           hotelDetailData.Album   || [listHotelData.Image].filter(Boolean),
            Description:      hotelDetailData.Description || listHotelData.ShortDescription,
            Theme:            hotelDetailData.Theme   || listHotelData.Theme || [],
            Equipments:       hotelDetailData.Equipments || listHotelData.Facilities || [],
            _enhanced:           true,
            _sourceListHotel:    true,
            _sourceHotelDetail:  true,
            _mergedAt:           new Date().toISOString(),
        };
    }

    // ==================== CACHE UTILITIES ====================
    clearCache()          { this.cache.clear();        if (import.meta.env.DEV) console.log('🗑️ Cache cleared'); }
    clearCacheEntry(key)  { this.cache.delete(key);    if (import.meta.env.DEV) console.log(`🗑️ Cache entry '${key}' cleared`); }
    getCacheStats()       { return this.cache.getStats(); }
}

// ==================== SINGLETON EXPORT ====================
const apiClient = new ApiClient('fr');
export default apiClient;
export { ApiClient, ApiError, CONFIG, ERROR_MESSAGES };
export const cancelAllRequests = () => apiClient.cancelAllRequests();