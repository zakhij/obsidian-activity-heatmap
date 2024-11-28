import type { DateString } from '../types/';

/**
 * Calculates the start date and range based on the selected year.
 * @param year - The selected year or 'Past Year'.
 * @returns An object containing the start date and range.
 */
export function calculateDateRange(year: string) {
    const startDate = new Date();
    let range: number;

    if (year === 'Past year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
        range = 13;
    } else {
        startDate.setFullYear(parseInt(year), 0, 1);
        range = 12;
    }

    return { startDate, range };
}


/**
 * Gets the current date in ISO format (YYYY-MM-DD).
 * @returns The current date as a string.
 */
export function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Converts a timestamp to a date string.
 * @param timestamp - The timestamp to convert.
 * @returns The date string.
 */
export function getDateStringFromTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
}

