import { ActivityData, CheckpointData } from './types';

/**
 * Converts the activity data object into an array of date-value pairs.
 * @param data - The activity data object.
 * @returns An array of objects with date and value properties.
 */
export function convertDataToArray(data: ActivityData) {
    return Object.entries(data).map(([date, value]) => ({ date, value }));
}

/**
 * Calculates the maximum value in the activity data.
 * @param data - The activity data array.
 * @returns The maximum value in the data.
 */
export function calculateMaxValue(data: { value: number }[]) {
    return Math.max(...data.map(item => item.value));
}

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
 * Generates the color scale configuration for the heatmap.
 * @param maxValue - The maximum value in the data.
 * @returns The color scale configuration object.
 */
export function generateColorScale(maxValue: number) {
    return {
        type: 'threshold' as const,
        range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
        domain: [0, Math.floor(maxValue / 3), Math.floor((2 * maxValue) / 3), maxValue],
    };
}

/**
 * Generates the tooltip text for the heatmap.
 * @param metricType - The type of metric being displayed.
 * @returns A function that generates the tooltip text.
 */
export function generateTooltipText(metricType: string) {
    return function(date: any, value: any, dayjsDate: any) {
        return value 
            ? `${value} ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}` 
            : `No ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}`;
    };
}

/**
 * Gets the current date in ISO format (YYYY-MM-DD).
 * @returns The current date as a string.
 */
export function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Creates mock activity data for development purposes.
 * @param months - Number of months to generate data for.
 * @returns Mock activity data.
 */
export function createMockData(months: number = 15): ActivityData {
    const today = new Date();
    const endDate = today;
    const startDate = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
    const mockData: ActivityData = {};

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        mockData[dateString] = Math.floor(Math.random() * 100);
    }

    return mockData;
}

/**
 * Calculates the absolute difference between two numbers.
 * @param current - The current value.
 * @param previous - The previous value.
 * @returns The absolute difference.
 */
export function calculateAbsoluteDifference(current: number, previous: number | undefined): number {
    if (previous === undefined) {
        return current;
    }
    return Math.abs(current - previous);
}

/**
 * Checks if it's the first checkpoint for a metric.
 * @param checkpoints - The checkpoints data for a metric.
 * @returns True if it's the first checkpoint, false otherwise.
 */
export function isFirstCheckpoint(checkpoints: CheckpointData | undefined): boolean {
    return !checkpoints || Object.keys(checkpoints).length === 0;
}
