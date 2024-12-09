import { ActivityHeatmapSettings } from './types';

export const METRIC_TYPES = ['wordCount', 'fileSize'] as const;

export const DATA_FOLDER = "activity_heatmap_data";
export const CURRENT_DATA_FILE = "v1_0_5.json";
export const CURRENT_DATA_VERSION = "1.0.5";
export const LEGACY_DATA_VERSIONS = ["1.0.4"];

export const DEFAULT_SETTINGS: ActivityHeatmapSettings = {
    metricType: METRIC_TYPES[0],
    year: "Past year"
} as const;
