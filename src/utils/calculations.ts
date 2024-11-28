import type { HeatmapActivityData } from '../types';


/**
 * Converts the activity data object into an array of date-value pairs to be displayed in the heatmap.
 * @param data - The activity data object.
 * @returns An array of objects with date and value properties.
 */
export function convertDataToArray(data: HeatmapActivityData) {
    return Object.entries(data).map(([date, value]) => ({ date, value }));
}

/**
 * Calculates the maximum value in the activity data array, to be used for the color scale.
 * @param data - The activity data array.
 * @returns The maximum value in the data.
 */
export function calculateMaxValue(data: { value: number }[]) {
    return Math.max(...data.map(item => item.value));
}

/**
 * Calculates the absolute difference between two numbers, used for comparing checkpoint values.
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