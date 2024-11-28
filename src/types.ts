import { METRIC_TYPES } from './constants';

export type FilePath = string;
export type DateString = string; // Format: YYYY-MM-DD
export type MetricType = typeof METRIC_TYPES[number];

export type CheckpointData = Record<FilePath, {
    value: number;
    mtime: number;
}>;

export type ActivityData = Record<DateString, number>;

export interface ActivityHeatmapData {
    checkpoints: Record<MetricType, CheckpointData>;
    activityOverTime: Record<MetricType, ActivityData>;
}

export interface ActivityHeatmapSettings {
    metricType: MetricType;
    useMockData?: boolean;
    year: string;
}
