import type { MetricType, FilePath, HeatmapActivityData } from './metrics';

export type CheckpointDataLegacyDataV0 = Record<MetricType, Record<FilePath, number>>;
export type ActivityOverTimeDataLegacyDataV0 = Record<MetricType, HeatmapActivityData>;

export interface ActivityHeatmapDataLegacyDataV0 {
    checkpoints: CheckpointDataLegacyDataV0;
    activityOverTime: ActivityOverTimeDataLegacyDataV0;
}