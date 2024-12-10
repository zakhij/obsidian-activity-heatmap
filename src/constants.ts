import { ActivityHeatmapSettings } from './types';

export const METRIC_TYPES = ['wordCount', 'fileSize'] as const;

export const DATA_FOLDER = "activity_heatmap_data";
export const CURRENT_DATA_FILE = "data_v1.json";
export const CURRENT_DATA_SCHEMA = "V1";
export const LEGACY_DATA_SCHEMAS = ["V0"];


export const DEFAULT_SETTINGS: ActivityHeatmapSettings = {
    metricType: METRIC_TYPES[0],
    year: "Past year"
} as const;
