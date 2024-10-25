export type FilePath = string;
export type DateString = string; // Format: YYYY-MM-DD

export interface MetricData {
    [key: string]: number
}

export interface CheckpointData {
    [filePath: FilePath]: number;
}

export interface ActivityData {
    [date: DateString]: number;
}

export type MetricType = 'fileSize' | 'wordCount';

export interface ActivityHeatmapData {
    checkpoints: Record<MetricType, CheckpointData>;
    activityOverTime: Record<MetricType, ActivityData>;
}

export interface ActivityHeatmapSettings{
    metricType: 'fileSize' | 'wordCount';
    updateIntervalSeconds: number;
    useMockData?: boolean;
    year: string;
}
