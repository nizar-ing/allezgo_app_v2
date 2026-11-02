
/**
 * Normalizes a legacy tiered pricing object to the canonical flat shape.
 * Picks the cheapest tier (hotel3Star → hotel4Star → hotel5Star).
 * @param {Record<string, any>} pricing
 * @returns {Record<string, any>}
 */
function normalizePricing(pricing) {
    if (!pricing || typeof pricing !== 'object') return { currency: 'DZD' };

    // Already flat — has direct numeric fields
    if (typeof pricing.double === 'number' || typeof pricing.single === 'number') {
        return pricing;
    }

    // Legacy tiered: pick cheapest tier
    const tier =
        pricing.hotel3Star ??
        pricing.hotel4Star ??
        pricing.hotel5Star ??
        null;

    if (!tier) return { currency: pricing.currency ?? 'DZD' };

    return {
        double:        tier.double        ?? undefined,
        triple:        tier.triple        ?? undefined,
        single:        tier.single        ?? undefined,
        infant:        tier.infant        ?? undefined,
        child_under4:  tier.child_under4  ?? tier.child_2to4  ?? tier.child_2to5  ?? undefined,
        child_under12: tier.child_under12 ?? tier.child_5to11 ?? tier.child_6to12 ?? undefined,
        second_child:  tier.second_child  ?? undefined,
        currency:      pricing.currency   ?? 'DZD',
    };
}

/**
 * Normalizes legacy flat flightDetails {via, arrival, departure} to the
 * canonical structured shape {outbound, return, type, via?}.
 * @param {Record<string, any>} fd
 * @returns {Record<string, any>}
 */
function normalizeFlightDetails(fd) {
    if (!fd || typeof fd !== 'object') return {};

    // Already structured
    if (fd.outbound || fd.return) return fd;

    // Legacy flat: {via, departure, arrival}
    return {
        outbound: {
            departure: fd.departure ?? '',
            arrival:   fd.arrival   ?? '',
        },
        return: { departure: '', arrival: '' },
        type: fd.type ?? (fd.via ? 'Avec escale' : 'Vol direct'),
        via:  fd.via  ?? undefined,
    };
}

/**
 * Normalizes departureDates to [{outbound, return?}] regardless of source format.
 * @param {any} dates
 * @returns {Array<{outbound: string, return?: string}>}
 */
function normalizeDepartureDates(dates) {
    if (!Array.isArray(dates)) return [];
    return dates.map((d) => {
        if (typeof d === 'string') return { outbound: d };
        return d;
    });
}

/**
 * Normalizes visaInfo to {required, price?, duration?, notes?}.
 * Handles: null, string, old-shape objects (supplement, description, documents).
 * @param {any} vi
 * @returns {{ required: boolean, price?: string, duration?: string, notes?: string } | null}
 */
function normalizeVisaInfo(vi) {
    if (!vi) return null;

    if (typeof vi === 'string') {
        return { required: true, notes: vi };
    }

    if (typeof vi === 'object') {
        // Already canonical
        if (typeof vi.required === 'boolean') return vi;

        // Legacy shape: {supplement, description, documents}
        const notes = [
            vi.description,
            ...(Array.isArray(vi.documents) ? vi.documents : []),
        ]
            .filter(Boolean)
            .join('. ');

        return {
            required: true,
            price:    vi.supplement ? `${vi.supplement} DZD` : undefined,
            notes:    notes || undefined,
        };
    }

    return null;
}

/**
 * Maps any API destination response to a stable view-model.
 * Safe to call on null/undefined — returns null.
 *
 * @param {Record<string, any> | null | undefined} raw
 * @returns {Record<string, any> | null}
 */
export function normalizeDestination(raw) {
    if (!raw) return null;

    return {
        ...raw,
        image_url:      raw.image_url,
        pricing:        normalizePricing(raw.pricing),
        flightDetails:  normalizeFlightDetails(raw.flightDetails),
        departureDates: normalizeDepartureDates(raw.departureDates),
        visaInfo:       normalizeVisaInfo(raw.visaInfo),
        images:         Array.isArray(raw.images)          ? raw.images         : [],
        accommodations: Array.isArray(raw.accommodations) ? raw.accommodations : [],
        itineraries:    Array.isArray(raw.itineraries)    ? raw.itineraries    : [],
        mainCities:     Array.isArray(raw.mainCities)     ? raw.mainCities     : [],
        highlights:     Array.isArray(raw.highlights)     ? raw.highlights     : [],
        included:       Array.isArray(raw.included)       ? raw.included       : [],
        notIncluded:    Array.isArray(raw.notIncluded)    ? raw.notIncluded    : [],
        keyAttractions: Array.isArray(raw.keyAttractions) ? raw.keyAttractions : [],
    };
}
