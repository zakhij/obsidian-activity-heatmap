import { METRIC_TYPES } from './constants';

type FilePath = string;
type DateString = string; // Format: YYYY-MM-DD
export type MetricType = typeof METRIC_TYPES[number];


export interface FileMetrics extends Record<MetricType, number> {
    mtime: number;
}

export type CheckpointData = Record<FilePath, FileMetrics>;

export type CheckpointDataLegacy1_0_4 = Record<MetricType, Record<FilePath, number>>;

export type HeatmapActivityData = Record<DateString, number>;

export type DateMetrics = Record<MetricType, number>;

export type ActivityOverTimeData = Record<DateString, DateMetrics>;

export type ActivityOverTimeDataLegacy1_0_4 = Record<MetricType, Record<DateString, number>>;


export interface ActivityHeatmapData {
    version: string;
    checkpoints: CheckpointData;
    activityOverTime: ActivityOverTimeData;
}

export interface ActivityHeatmapDataLegacy1_0_4 {
    checkpoints: CheckpointDataLegacy1_0_4;
    activityOverTime: ActivityOverTimeDataLegacy1_0_4;
}

export interface ActivityHeatmapSettings {
    metricType: MetricType;
    useMockData?: boolean;
    year: string;
}
