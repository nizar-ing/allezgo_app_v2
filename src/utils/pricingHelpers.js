// src/utils/pricingHelpers.js

/**
 * Pricing Helper Functions
 *
 * Centralizes all price extraction and formatting logic for destination cards
 * and hotel listings. No component-specific logic here — pure functions only.
 */

// ─── Internal utils ───────────────────────────────────────────────────────────

/**
 * Safely normalizes any value to a positive number or null.
 * Accepts numbers or numeric strings like "15000".
 * @param {unknown} value
 * @returns {number|null}
 */
const toPositiveNumber = (value) => {
    if (value === null || value === undefined) return null;

    const n =
        typeof value === "number"
            ? value
            : typeof value === "string"
                ? Number(value.replace(/\s+/g, ""))
                : NaN;

    if (Number.isNaN(n) || n <= 0) return null;
    return n;
};

// ─── Price Extraction ──────────────────────────────────────────────────────────

/**
 * Extracts all available numeric prices from a destination's pricing object.
 * Handles all known pricing shapes: flat triple/double, hotel3Star, hotel4Star.
 * Also accepts numeric strings like "15000".
 * @param {Object} pricing - destination.pricing
 * @returns {number[]} Array of all valid prices found
 */
export const getAllPrices = (pricing) => {
    if (!pricing || typeof pricing !== "object") return [];

    const prices = [];

    // Flat pricing: { double: 15000, triple: 12000 }
    const flatDouble = toPositiveNumber(pricing.double);
    const flatTriple = toPositiveNumber(pricing.triple);
    if (flatDouble !== null) prices.push(flatDouble);
    if (flatTriple !== null) prices.push(flatTriple);

    // Nested hotel-tier pricing: { hotel3Star: { double, triple }, hotel4Star: { double, triple }, hotel5Star: {...} }
    const tiers = ["hotel3Star", "hotel4Star", "hotel5Star"];
    tiers.forEach((tier) => {
        const tierObj = pricing[tier];
        if (!tierObj || typeof tierObj !== "object") return;

        const tierDouble = toPositiveNumber(tierObj.double);
        const tierTriple = toPositiveNumber(tierObj.triple);
        if (tierDouble !== null) prices.push(tierDouble);
        if (tierTriple !== null) prices.push(tierTriple);
    });

    return prices;
};

/**
 * Returns the lowest available starting price for a destination.
 * Works for any destination ID — no hardcoded ID checks.
 * Returns null if no valid pricing data is found.
 * @param {Object} destination - Full destination object with a .pricing property
 * @returns {number|null}
 */
export const getStartingPrice = (destination) => {
    if (!destination?.pricing) return null;
    const prices = getAllPrices(destination.pricing);
    if (prices.length === 0) return null;
    return Math.min(...prices);
};

// ─── Price Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a numeric price for display with locale-aware thousand separators.
 * @param {number|null} price
 * @param {string} currency  Currency code, default "DZD"
 * @param {string} locale    BCP 47 locale tag, default "fr-DZ"
 * @param {Object} [options]
 * @param {boolean} [options.withCurrency=true]  When false, returns just the number (e.g. "15 000")
 * @returns {string} e.g. "15 000 DZD" or "—" if price is null
 */
export const formatPrice = (
    price,
    currency = "DZD",
    locale = "fr-DZ",
    options = {},
) => {
    const n = toPositiveNumber(price);
    if (n === null) return "—";

    const { withCurrency = true } = options;

    if (!withCurrency) {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);
    }

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
};

/**
 * Returns a "À partir de X DZD" label for a destination.
 * Convenience wrapper used directly in card components.
 * @param {Object} destination
 * @param {string} currency
 * @returns {string}
 */
export const getStartingPriceLabel = (destination, currency = "DZD") => {
    const price = getStartingPrice(destination);
    if (price === null) return "Prix sur demande";
    return `À partir de ${formatPrice(price, currency)}`;
};