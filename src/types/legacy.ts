import type { MetricType, FilePath, HeatmapActivityData } from './metrics';

export type CheckpointDataLegacy1_0_4 = Record<MetricType, Record<FilePath, number>>;
export type ActivityOverTimeDataLegacy1_0_4 = Record<MetricType, HeatmapActivityData>;

export interface ActivityHeatmapDataLegacy1_0_4 {
    checkpoints: CheckpointDataLegacy1_0_4;
    activityOverTime: ActivityOverTimeDataLegacy1_0_4;
}