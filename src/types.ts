


export interface CheckpointData {
    [metricName: string]: {
        [filePath: string]: number
    }
}

export interface ActivityData {
    [metricName: string]: {
        [date: string]: number
    }
}

export interface Checkpoints {
    [key: string]: CheckpointData
}

export interface ActivityValues {
    [key: string]: ActivityData
}

export interface ActivityHeatmapData {
    checkpoints: Checkpoints;
    activityOverTime: ActivityValues;
}

export interface ActivityHeatmapSettings{
    metric: string;
}

