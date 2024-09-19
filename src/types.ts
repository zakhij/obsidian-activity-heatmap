export interface MetricData {
    [key: string]: number
}

export interface AllMetricData {
    [metricName: string]: MetricData
}

export interface ActivityHeatmapData {
    checkpoints: AllMetricData;
    activityOverTime: AllMetricData;
}

export interface ActivityHeatmapSettings{
    metric: string;
}

