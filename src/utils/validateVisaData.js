// src/utils/validateVisaData.js

/**
 * Visa Data Validator
 *
 * Validates the structure of visa entries before E_Visa.jsx renders them.
 * Returns a result object instead of a bare boolean so callers can surface
 * specific errors to the UI or log them in development.
 */

// ─── Field Contract ────────────────────────────────────────────────────────────

/**
 * Fields every visa entry must have at the top level.
 * Extend this array to enforce new required fields without touching the logic.
 */
const REQUIRED_VISA_FIELDS = ["country", "flagUrl", "processingTime"];

// ─── Validator ─────────────────────────────────────────────────────────────────

/**
 * Validates an array of visa data objects.
 *
 * @param {Array} data - The visa data array to validate (e.g. from src/data/visaData.js)
 * @returns {{ valid: boolean, errors: string[] }}
 *   - valid:  true only if all entries pass all checks
 *   - errors: human-readable list of all validation failures found
 *
 * @example
 * const { valid, errors } = validateVisaData(visaData);
 * if (!valid) {
 *   errors.forEach(e => toast.error(e));
 * }
 */
export const validateVisaData = (data) => {
    const errors = [];

    // ── Top-level check ────────────────────────────────────────────────────────
    if (!Array.isArray(data) || data.length === 0) {
        errors.push("Visa data must be a non-empty array.");
        return { valid: false, errors };
    }

    // ── Per-entry checks ───────────────────────────────────────────────────────
    data.forEach((visa, index) => {
        const label = `Visa[${index}] (${visa?.country ?? "unknown"})`;

        // Required string fields
        REQUIRED_VISA_FIELDS.forEach((field) => {
            if (!visa[field]) {
                errors.push(`${label}: missing required field "${field}".`);
            }
        });

        // Pricing — at least one of visa.price or visa.durationMode.price must exist
        const hasPrice = typeof visa.price === "number" && visa.price > 0;
        const hasDurationPrice =
            typeof visa.durationMode?.price === "number" && visa.durationMode.price > 0;
        if (!hasPrice && !hasDurationPrice) {
            errors.push(`${label}: no valid price found in "price" or "durationMode.price".`);
        }

        // Duration — at least one of visa.duration or visa.durationMode.duration must exist
        const hasDuration = Boolean(visa.duration);
        const hasDurationModeDuration = Boolean(visa.durationMode?.duration);
        if (!hasDuration && !hasDurationModeDuration) {
            errors.push(`${label}: no valid duration found in "duration" or "durationMode.duration".`);
        }

        // Requirements — must be a non-empty array
        if (!Array.isArray(visa.requirements)) {
            errors.push(`${label}: "requirements" must be an array.`);
        } else if (visa.requirements.length === 0) {
            errors.push(`${label}: "requirements" array is empty.`);
        }
    });

    // ── Dev logging ───────────────────────────────────────────────────────────
    if (errors.length > 0 && import.meta.env.DEV) {
        console.group("❌ validateVisaData — validation failed");
        errors.forEach((e) => console.error(e));
        console.groupEnd();
    }

    return { valid: errors.length === 0, errors };
};