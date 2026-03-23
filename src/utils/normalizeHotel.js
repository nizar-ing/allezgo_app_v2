// src/utils/normalizeHotel.js

const FALLBACK_IMAGE = "https://loremflickr.com/600/400/hotel,luxury?lock=42";

/**
 * Resolves Album entries to plain URL strings regardless of
 * whether the API returned string[] or {Url, Alt}[].
 * @param {Array<string|{Url?: string, url?: string}>} album
 * @returns {string[]}
 */
const pickAlbumUrls = (album) => {
    if (!Array.isArray(album)) return [];
    return album
        .map((x) => {
            if (typeof x === "string") return x.trim();
            if (x && typeof x === "object") {
                const url = x.Url ?? x.url;
                return typeof url === "string" ? url.trim() : null;
            }
            return null;
        })
        .filter((url) => !!url);
};

/**
 * Normalizes any raw hotel object (from listHotelEnhanced, searchHotel,
 * getHotelsBatch…) into the single "HotelCard" contract consumed by
 * HotelLightCard, HotelsFiltering, and banner images.
 *
 * Contract:
 *   Id          → number
 *   Name        → string
 *   Category    → { Star?: number } | null
 *   City        → { Name?, Country?: { Name? } } | null
 *   Image       → string          (first usable URL, always non-empty)
 *   Album       → string[]        (always flat URL strings, may be [])
 *   Facilities  → any[]
 *   Theme       → any[]
 *   ShortDescription / Description → string
 */
export function normalizeHotelForCard(rawHotel) {
    const h = rawHotel ?? {};

    const albumUrls = pickAlbumUrls(h.Album);

    // Prefer explicit Image if valid, then Album[0], then global fallback
    const explicitImage =
        typeof h.Image === "string" && h.Image.trim() ? h.Image.trim() : null;

    const imageUrl = explicitImage ?? albumUrls[0] ?? FALLBACK_IMAGE;

    // Keep Album as a string[] — HotelLightCard does Album[0]
    const normalizedAlbum = albumUrls.length ? albumUrls : [imageUrl];

    if (import.meta.env.DEV) {
        if (normalizedAlbum.length && typeof normalizedAlbum[0] !== "string") {
            // eslint-disable-next-line no-console
            console.warn("[normalizeHotelForCard] Album[0] is not a string", h);
        }
    }

    return {
        // Preserve all original fields for backward compatibility
        ...h,

        // Canonical core fields
        Id: Number(h.Id),
        Name: h.Name ?? "",
        Category: h.Category ?? null,
        City: h.City ?? null,

        // Descriptions
        ShortDescription: h.ShortDescription ?? h.Description ?? "",
        Description: h.Description ?? h.ShortDescription ?? "",

        // Address – keep both spellings in sync as much as possible
        Adress: h.Adress ?? h.Address ?? "",
        Address: h.Address ?? h.Adress ?? "",

        // Media
        Image: imageUrl,
        Album: normalizedAlbum,

        // Arrays normalized
        Facilities: Array.isArray(h.Facilities) ? h.Facilities : [],
        Theme: Array.isArray(h.Theme) ? h.Theme : [],
    };
}