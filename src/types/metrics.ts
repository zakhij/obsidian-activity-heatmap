import { METRIC_TYPES } from '../constants';

export type FilePath = string;
export type DateString = string; // Format: YYYY-MM-DD
export type MetricType = typeof METRIC_TYPES[number];

export interface FileCheckpointMetrics extends Record<MetricType, number> {
    mtime: number;
}

export type CheckpointData = Record<FilePath, FileCheckpointMetrics>;

export type HeatmapActivityData = Record<DateString, number>;

export type DateActivityMetrics = Record<MetricType, number>;

export type ActivityOverTimeData = Record<DateString, DateActivityMetrics>;

export interface ActivityHeatmapData {
    version: string;
    checkpoints: CheckpointData;
    activityOverTime: ActivityOverTimeData;
}