import axios from "axios";

const AUTH_STORAGE_KEY = "access_token";

const ROUTES = {
  DESTINATIONS: "/api/destinations",
  E_VISAS: "/api/e-visas",
  TESTIMONIALS: "/api/testimonials",
  USERS: "/api/users",
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  BOOKINGS: "/api/bookings",
  CAROUSEL: "/carousel",
};

/** Same origin as API_GUIDE.md example; override with `VITE_API_BASE_URL`. */
const DEFAULT_API_BASE_URL = "https://api.allezgoo.com";

function resolveApiBaseURL() {
  const fromEnv =
    typeof import.meta.env.VITE_API_BASE_URL === "string"
      ? import.meta.env.VITE_API_BASE_URL.trim()
      : "";
  const raw = fromEnv || DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, "");
}

/**
 * @typedef {Object} DestinationDuration
 * @property {number} days
 * @property {number} nights
 */

/**
 * @typedef {Object} DestinationAccommodation
 * @property {number} [id]
 * @property {string} [name]
 * @property {Record<string, any>} [details]
 */

/**
 * @typedef {Object} DestinationItinerary
 * @property {number} [id]
 * @property {number} [day]
 * @property {string} [title]
 * @property {string} [description]
 * @property {Record<string, any>} [details]
 */

/**
 * @typedef {Object} Destination
 * @property {number} [id]
 * @property {string} name
 * @property {string} image_url
 * @property {string[]} mainCities
 * @property {DestinationDuration} duration
 * @property {string} departureFrom
 * @property {string} airline
 * @property {Record<string, any>} flightDetails
 * @property {string[]} highlights
 * @property {string} mealPlan
 * @property {string[]} included
 * @property {string[]} [notIncluded]
 * @property {Record<string, any>|string} [visaInfo]
 * @property {Record<string, any>[]} [departureDates]
 * @property {Record<string, any>} pricing
 * @property {string[]} keyAttractions
 * @property {DestinationAccommodation[]} [accommodations]
 * @property {DestinationItinerary[]} [itineraries]
 */

/**
 * @typedef {Destination} CreateDestinationDto
 */

/**
 * @typedef {Partial<CreateDestinationDto>} UpdateDestinationDto
 */

/**
 * @typedef {Object} EVisaDurationMode
 * @property {string[]} duration
 * @property {number[]} price
 * @property {string[]} [demandeOccurrence]
 */

/**
 * @typedef {Object} EVisa
 * @property {number} [id]
 * @property {string} country
 * @property {string} flagUrl
 * @property {number} [price]
 * @property {string} [duration]
 * @property {EVisaDurationMode} [durationMode]
 * @property {string} processingTime
 * @property {string|string[]} [description]
 * @property {string[]} requirements
 * @property {Record<string, string[]>} [requirementsByDemande]
 * @property {string} constraints
 */

/**
 * @typedef {EVisa} CreateEVisaDto
 */

/**
 * @typedef {Partial<CreateEVisaDto>} UpdateEVisaDto
 */

/**
 * @typedef {Object} Testimonial
 * @property {number} [id]
 * @property {string} imageUrl
 * @property {string} name
 * @property {string} citation
 */

/**
 * @typedef {Testimonial} CreateTestimonialDto
 */

/**
 * @typedef {Partial<CreateTestimonialDto>} UpdateTestimonialDto
 */

/**
 * @typedef {"admin"|"client"} UserRole
 */

/**
 * @typedef {Object} User
 * @property {number} [id]
 * @property {string} email
 * @property {string} [password]
 * @property {string} firstName
 * @property {string} lastName
 * @property {UserRole} [role]
 * @property {string} [createdAt]
 */

/**
 * @typedef {User} CreateUserDto
 */

/**
 * @typedef {Partial<CreateUserDto>} UpdateUserDto
 */

/**
 * @typedef {Object} LoginDto
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} access_token
 */

/**
 * @typedef {Object} CarouselMedia
 * @property {string} id
 * @property {string} filename
 * @property {string} originalName
 * @property {string} mimeType
 * @property {string} url
 * @property {string|null} alt
 * @property {number} displayOrder
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} ReorderItemDto
 * @property {string} id
 * @property {number} displayOrder
 */

const axiosInstance = axios.create({
  baseURL: resolveApiBaseURL(),
});

/**
 * True when the request was aborted (e.g. AbortController, React Strict Mode
 * dev double-mount, or navigation away). Not an API or network failure.
 *
 * @param {any} error
 * @returns {boolean}
 */
export function isRequestCanceled(error) {
  if (!error) return false;
  if (error.code === "ERR_CANCELED") return true;
  if (error.name === "CanceledError" || error.name === "AbortError") return true;
  if (typeof error.message === "string" && error.message.toLowerCase().includes("cancel")) {
    return true;
  }
  return axios.isCancel?.(error) === true;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    // Strictly return the data payload so TanStack Query receives the arrays directly
    return response.data;
  },
  (error) => {
    if (isRequestCanceled(error)) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error("[AllezGoApi] Request failed", {
      status,
      message: error?.message,
      data: payload,
      url: error?.config?.url,
      method: error?.config?.method,
    });

    if (status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event("allezgo:unauthorized"));
    }

    /** @type {ApiErrorResponse} */
    const normalizedError = {
      status,
      message: payload?.message || error?.message || "Request failed",
      data: payload,
    };

    return Promise.reject(normalizedError);
  }
);

/**
 * @param {string|number} id
 * @returns {string}
 */
const withId = (id) => `/${id}`;

const Destinations = {
  /**
   * @param {CreateDestinationDto} payload
   * @returns {Promise<Destination>}
   */
  create: (payload) => axiosInstance.post(ROUTES.DESTINATIONS, payload),

  /**
   * @returns {Promise<Destination[]>}
   */
  getAll: (config) => axiosInstance.get(ROUTES.DESTINATIONS, config),

  /**
   * @param {string|number} id
   * @returns {Promise<Destination>}
   */
  getById: (id) => axiosInstance.get(`${ROUTES.DESTINATIONS}${withId(id)}`),

  /**
   * API guide specifies PUT for destination updates.
   * @param {string|number} id
   * @param {UpdateDestinationDto} payload
   * @returns {Promise<Destination>}
   */
  update: (id, payload) =>
    axiosInstance.put(`${ROUTES.DESTINATIONS}${withId(id)}`, payload),

  /**
   * @param {string|number} id
   * @returns {Promise<void|Destination>}
   */
  remove: (id) => axiosInstance.delete(`${ROUTES.DESTINATIONS}${withId(id)}`),
};

const EVisas = {
  /**
   * @param {CreateEVisaDto} payload
   * @returns {Promise<EVisa>}
   */
  create: (payload) => axiosInstance.post(ROUTES.E_VISAS, payload),

  /**
   * @returns {Promise<EVisa[]>}
   */
  getAll: (config) => axiosInstance.get(ROUTES.E_VISAS, config),

  /**
   * @param {string|number} id
   * @returns {Promise<EVisa>}
   */
  getById: (id) => axiosInstance.get(`${ROUTES.E_VISAS}${withId(id)}`),

  /**
   * @param {string|number} id
   * @param {UpdateEVisaDto} payload
   * @returns {Promise<EVisa>}
   */
  update: (id, payload) => axiosInstance.patch(`${ROUTES.E_VISAS}${withId(id)}`, payload),

  /**
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  remove: (id) => axiosInstance.delete(`${ROUTES.E_VISAS}${withId(id)}`),
};

const Testimonials = {
  /**
   * @param {CreateTestimonialDto} payload
   * @returns {Promise<Testimonial>}
   */
  create: (payload) => axiosInstance.post(ROUTES.TESTIMONIALS, payload),

  /**
   * @returns {Promise<Testimonial[]>}
   */
  getAll: (config) => axiosInstance.get(ROUTES.TESTIMONIALS, config),

  /**
   * @param {string|number} id
   * @returns {Promise<Testimonial>}
   */
  getById: (id) => axiosInstance.get(`${ROUTES.TESTIMONIALS}${withId(id)}`),

  /**
   * @param {string|number} id
   * @param {UpdateTestimonialDto} payload
   * @returns {Promise<Testimonial>}
   */
  update: (id, payload) =>
    axiosInstance.patch(`${ROUTES.TESTIMONIALS}${withId(id)}`, payload),

  /**
   * @param {string|number} id
   * @returns {Promise<Testimonial>}
   */
  remove: (id) => axiosInstance.delete(`${ROUTES.TESTIMONIALS}${withId(id)}`),
};

const Users = {
  /**
   * @param {CreateUserDto} payload
   * @returns {Promise<User>}
   */
  create: (payload) => axiosInstance.post(ROUTES.USERS, payload),

  /**
   * @returns {Promise<User[]>}
   */
  getAll: (config) => axiosInstance.get(ROUTES.USERS, config),

  /**
   * @param {string|number} id
   * @returns {Promise<User>}
   */
  getById: (id) => axiosInstance.get(`${ROUTES.USERS}${withId(id)}`),

  /**
   * @param {string|number} id
   * @param {UpdateUserDto} payload
   * @returns {Promise<User>}
   */
  update: (id, payload) => axiosInstance.patch(`${ROUTES.USERS}${withId(id)}`, payload),

  /**
   * @param {string|number} id
   * @returns {Promise<User>}
   */
  remove: (id) => axiosInstance.delete(`${ROUTES.USERS}${withId(id)}`),
};

const Auth = {
  /**
   * @param {CreateUserDto} payload
   * @returns {Promise<Omit<User, "password">>}
   */
  register: (payload) => axiosInstance.post(ROUTES.AUTH_REGISTER, payload),

  /**
   * @param {LoginDto} payload
   * @returns {Promise<LoginResponse>}
   */
  login: (payload) => axiosInstance.post(ROUTES.AUTH_LOGIN, payload),
};

const Bookings = {
  /**
   * @param {FormData} formData
   * @returns {Promise<any>}
   */
  create: (formData) => axiosInstance.post(ROUTES.BOOKINGS, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * Fetch all bookings belonging to the currently authenticated client.
   * @returns {Promise<any[]>}
   */
  getMine: () => axiosInstance.get(`${ROUTES.BOOKINGS}/my`),

  /**
   * @returns {Promise<any[]>}
   */
  getAll: (config) => axiosInstance.get(ROUTES.BOOKINGS, config),

  /**
   * @param {string|number} id
   * @param {string} status
   * @returns {Promise<any>}
   */
  updateStatus: (id, status) => axiosInstance.patch(`${ROUTES.BOOKINGS}${withId(id)}/status`, { status }),

  /**
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  remove: async (id) => {
      const response = await axiosInstance.delete(`${ROUTES.BOOKINGS}/${id}`);
      // L'intercepteur Axios renvoie déjà response.data
      return response?.data || response;
  }
};

const Carousel = {
  /**
   * @returns {Promise<CarouselMedia[]>}
   */
  getAll: () => axiosInstance.get(ROUTES.CAROUSEL),

  /**
   * @param {FormData} formData
   * @returns {Promise<CarouselMedia>}
   */
  upload: (formData) => axiosInstance.post(`${ROUTES.CAROUSEL}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  /**
   * @param {ReorderItemDto[]} items
   * @returns {Promise<CarouselMedia[]>}
   */
  reorder: (items) => axiosInstance.patch(`${ROUTES.CAROUSEL}/reorder`, { items }),

  /**
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  remove: (id) => axiosInstance.delete(`${ROUTES.CAROUSEL}${withId(id)}`),
};

/**
 * Fetches bookings specific to the authenticated client.
 * @param {number|string} userId - The ID of the current user
 */
export const getMyBookings = async (userId) => {
    // Note: Our axios instance interceptor already returns the data payload
    const response = await axiosInstance.get(`/api/bookings`, {
        params: { userId } 
    });
    return response;
};

export const AllezGoApi = {
  client: axiosInstance,
  Destinations,
  EVisas,
  Testimonials,
  Users,
  Auth,
  Bookings,
  Carousel,
  async getMine() {
      // Hits the secure B2C endpoint
      return this.client.get('/api/bookings/my');
  }
};

export default AllezGoApi;
