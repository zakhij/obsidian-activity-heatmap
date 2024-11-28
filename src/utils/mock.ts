import type { HeatmapActivityData } from '../types';

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