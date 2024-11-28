import { METRIC_TYPES } from '../constants';

export type FilePath = string;
export type DateString = string; // Format: YYYY-MM-DD
export type MetricType = typeof METRIC_TYPES[number];

export type FileCheckpointMetrics = Record<MetricType, number>;

export interface FileCheckpointData extends FileCheckpointMetrics {
    mtime: number;
}

export type CheckpointData = Record<FilePath, FileCheckpointData>;

export type DateActivityMetrics = Record<MetricType, number>;
export type ActivityOverTimeData = Record<DateString, DateActivityMetrics>;

export interface ActivityHeatmapData {
    version: string;
    checkpoints: CheckpointData;
    activityOverTime: ActivityOverTimeData;
}

export type HeatmapActivityData = Record<DateString, number>;