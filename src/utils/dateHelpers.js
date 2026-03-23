// src/utils/dateHelpers.js

/**
 * Date Helper Functions for Booking System
 *
 * All functions are pure (no side effects) and null-safe.
 * French locale is the default display language.
 */

// ─── Display Labels ────────────────────────────────────────────────────────────

const DAYS_FR   = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const MONTHS_FR = [
    "jan.", "fév.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// ─── Internal utils ───────────────────────────────────────────────────────────

/**
 * Returns true if a value is a valid Date instance.
 * @param {any} value
 * @returns {boolean}
 */
const isValidDateObject = (value) =>
    value instanceof Date && !Number.isNaN(value.getTime());

/**
 * Returns a cloned Date truncated to midnight local time.
 * Does not mutate the original Date.
 * @param {Date} date
 * @returns {Date}
 */
const toLocalMidnight = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// ─── Formatting ────────────────────────────────────────────────────────────────

/**
 * Formats a Date object for human-readable display.
 * @param {Date|null} date
 * @returns {string} e.g. "Lun. 3 fév."
 */
export const formatDate = (date) => {
    if (!isValidDateObject(date)) return "";
    return `${DAYS_FR[date.getDay()]} ${date.getDate()} ${
        MONTHS_FR[date.getMonth()]
    }`;
};

/**
 * Formats a Date object to YYYY-MM-DD string for API calls.
 * Uses local time (not UTC) to avoid off-by-one timezone shifts.
 * @param {Date|null} date
 * @returns {string} e.g. "2026-03-15"
 */
export const formatDateForAPI = (date) => {
    if (!isValidDateObject(date)) return "";
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day   = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// ─── Validation ────────────────────────────────────────────────────────────────

/** Shared YYYY-MM-DD format regex — single source of truth for API date strings. */
export const API_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns true if the string is a valid YYYY-MM-DD date accepted by the API.
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidAPIDate = (dateStr) => {
    if (typeof dateStr !== "string" || !API_DATE_REGEX.test(dateStr)) return false;
    const d = new Date(dateStr);
    return isValidDateObject(d);
};

// ─── Calculations ──────────────────────────────────────────────────────────────

/**
 * Calculates the number of nights between two Date objects.
 * Returns 0 if either date is missing or invalid.
 * @param {Date|null} from  Check-in date
 * @param {Date|null} to    Check-out date
 * @returns {number}
 */
export const calculateNights = (from, to) => {
    if (!isValidDateObject(from) || !isValidDateObject(to)) return 0;
    const fromMidnight = toLocalMidnight(from);
    const toMidnight   = toLocalMidnight(to);
    const diffTime     = Math.abs(toMidnight - fromMidnight);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ─── Calendar Helpers ──────────────────────────────────────────────────────────

/**
 * Returns the number of days in the given month.
 * @param {Date} date
 * @returns {number}
 */
export const getDaysInMonth = (date) => {
    if (!isValidDateObject(date)) return 0;
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

/**
 * Returns the weekday index (0 = Sunday) of the first day of the given month.
 * @param {Date} date
 * @returns {number}
 */
export const getFirstDayOfMonth = (date) => {
    if (!isValidDateObject(date)) return 0;
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

// ─── Comparisons ──────────────────────────────────────────────────────────────

/**
 * Returns true if two Date objects represent the same calendar day.
 * @param {Date|null} date1
 * @param {Date|null} date2
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
    if (!isValidDateObject(date1) || !isValidDateObject(date2)) return false;
    return (
        date1.getDate()     === date2.getDate()  &&
        date1.getMonth()    === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
};

/**
 * Returns true if the given date is today.
 * @param {Date|null} date
 * @returns {boolean}
 */
export const isToday = (date) => {
    if (!isValidDateObject(date)) return false;
    return isSameDay(date, new Date());
};

/**
 * Returns true if a date falls strictly before today (ignoring time).
 * Used to disable past dates in DateRangePicker and validate in useBookingValidation.
 * @param {Date|null} date
 * @returns {boolean}
 */
export const isPastDate = (date) => {
    if (!isValidDateObject(date)) return false;
    const todayMidnight = toLocalMidnight(new Date());
    const dMidnight     = toLocalMidnight(date);
    return dMidnight < todayMidnight;
};

/**
 * Returns true if a date falls within a range (inclusive of both endpoints).
 * Used in DateRangePicker to highlight the selected range.
 * @param {Date|null} date
 * @param {Date|null} from  Range start
 * @param {Date|null} to    Range end
 * @returns {boolean}
 */
export const isDateInRange = (date, from, to) => {
    if (!isValidDateObject(date) || !isValidDateObject(from) || !isValidDateObject(to)) {
        return false;
    }
    const dMidnight    = toLocalMidnight(date).getTime();
    const fromMidnight = toLocalMidnight(from).getTime();
    const toMidnight   = toLocalMidnight(to).getTime();
    return dMidnight >= fromMidnight && dMidnight <= toMidnight;
};