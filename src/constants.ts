import { ActivityHeatmapSettings } from './types';

export const METRIC_TYPES = ['fileSize', 'wordCount'] as const;

export const DEFAULT_SETTINGS: ActivityHeatmapSettings = {
    metricType: METRIC_TYPES[0],
    year: "Past year"
} as const;
