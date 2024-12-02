import type { MetricType, FilePath, DateString } from './metrics';

export type CheckpointDataLegacy1_0_4 = Record<MetricType, Record<FilePath, number>>;
export type ActivityOverTimeDataLegacy1_0_4 = Record<MetricType, Record<DateString, number>>;

export interface ActivityHeatmapDataLegacy1_0_4 {
    checkpoints: CheckpointDataLegacy1_0_4;
    activityOverTime: ActivityOverTimeDataLegacy1_0_4;
}