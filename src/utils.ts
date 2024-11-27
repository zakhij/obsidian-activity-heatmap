import { ActivityOverTimeData, MetricType, ActivityOverTimeDataLegacy1_0_4, ActivityHeatmapData, CheckpointData, CheckpointDataLegacy1_0_4, HeatmapActivityData } from './types';
import { METRIC_TYPES } from './constants';


/**
 * Type guard for CheckpointData (Record<FilePath, FileMetrics>)
 */
export function isCheckpointData(data: any): data is CheckpointData {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([filePath, metrics]) => 
        typeof filePath === 'string' &&
        typeof metrics === 'object' &&
        metrics !== null &&
        'mtime' in metrics &&
        typeof metrics.mtime === 'number' &&
        METRIC_TYPES.every(metricType =>
            metricType in metrics &&              
            typeof metrics[metricType] === 'number' 
        )
    );
}


/**
 * Type guard for CheckpointDataLegacy1_0_4 (Record<MetricType, Record<FilePath, number>>)
 */
export function isCheckpointDataLegacy1_0_4(data: any): data is CheckpointDataLegacy1_0_4 {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([metric, dateValues]) => 
        METRIC_TYPES.includes(metric as MetricType) &&
        typeof dateValues === 'object' &&
        dateValues !== null &&
        Object.entries(dateValues).every(([date, value]) =>
            typeof value === 'number'
        )
    );
}

/**
 * Type guard for ActivityOverTimeData (Record<DateString, Record<MetricType, number>>)
 */
export function isActivityOverTimeData(data: any): data is ActivityOverTimeData {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([date, metrics]) => 
        typeof metrics === 'object' &&
        metrics !== null &&
        !isNaN(Date.parse(date)) &&
        Object.entries(metrics).every(([metric, value]) =>
            METRIC_TYPES.includes(metric as MetricType) &&
            typeof value === 'number'
        )
    );
}

/**
 * Type guard for ActivityOverTimeDataLegacy1_0_4 (Record<MetricType, Record<DateString, number>>)
 */
export function isActivityOverTimeDataLegacy1_0_4(data: any): data is ActivityOverTimeDataLegacy1_0_4 {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([metric, dateValues]) => 
        METRIC_TYPES.includes(metric as MetricType) &&
        typeof dateValues === 'object' &&
        dateValues !== null &&
        Object.entries(dateValues).every(([date, value]) =>
            !isNaN(Date.parse(date)) && 
            typeof value === 'number'
        )
    );
}



/**
 * Converts the activity data object into an array of date-value pairs.
 * @param data - The activity data object.
 * @returns An array of objects with date and value properties.
 */
export function convertDataToArray(data: HeatmapActivityData) {
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
export function createMockData(months: number = 15): HeatmapActivityData {
    const today = new Date();
    const endDate = today;
    const startDate = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
    const mockData: HeatmapActivityData = {};

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
 * Converts a timestamp to a date string.
 * @param timestamp - The timestamp to convert.
 * @returns The date string.
 */
export function getDateStringFromTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().split('T')[0];
}
