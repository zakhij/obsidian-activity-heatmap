import type { MetricType, FilePath, HeatmapActivityData } from './metrics';

export type CheckpointDataSchemaV0 = Record<MetricType, Record<FilePath, number>>;
export type ActivityOverTimeDataSchemaV0 = Record<MetricType, HeatmapActivityData>;

export interface ActivityHeatmapDataSchemaV0 {
    checkpoints: CheckpointDataSchemaV0;
    activityOverTime: ActivityOverTimeDataSchemaV0;
}