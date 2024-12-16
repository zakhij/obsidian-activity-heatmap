
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
 * Gets the timezone offset in minutes for the current system
 * @returns The timezone offset in minutes
 */
const getSystemTimezoneOffset = (): number => {
    return new Date().getTimezoneOffset();
};

/**
 * Converts a timestamp to a date string, accounting for system timezone.
 * @param timestamp - The timestamp to convert.
 * @returns The date string in YYYY-MM-DD format for the local timezone.
 */
export function getDateStringFromTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const localDate = new Date(date.getTime() - (getSystemTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
}


