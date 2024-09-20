export interface MetricData {
    [key: string]: number
}

export interface CheckpointData {
    [fileName: string]: number
}

export interface ActivityData {
    [date: string]: number
}

export interface ActivityHeatmapData {
    checkpoints: {
        [metricName: string]: CheckpointData
    };
    activityOverTime: {
        [metricName: string]: ActivityData
    };
}

export interface ActivityHeatmapSettings{
    metric: string;
}

