import { ActivityHeatmapData, ActivityHeatmapDataLegacy1_0_4, FilePath, DateString, FileCheckpointMetrics, MetricType, DateActivityMetrics, FileCheckpointData } from '../types';
import { METRIC_TYPES } from '../constants';

export function migrate1_0_4To1_0_5(data: ActivityHeatmapDataLegacy1_0_4): ActivityHeatmapData {
    // Create base structure
    const migratedData: ActivityHeatmapData = {
        version: '1.0.5',
        checkpoints: {},
        activityOverTime: {}
    };
    
    // Get all unique file paths
    const filePaths = new Set<FilePath>();
    METRIC_TYPES.forEach(metricType => {
        Object.keys(data.checkpoints[metricType]).forEach(path => filePaths.add(path));
    });

    // Build new checkpoint structure
    filePaths.forEach(filePath => {
        const metrics: FileCheckpointData = {
            mtime: 0, // We don't have mtime in 1.0.4, use 0
            ...METRIC_TYPES.reduce((acc, metricType) => ({
                ...acc,
                [metricType]: data.checkpoints[metricType][filePath] || 0
            }), {} as FileCheckpointMetrics)
        };
        migratedData.checkpoints[filePath] = metrics;
    });

    // Get all unique dates
    const dates = new Set<DateString>();
    METRIC_TYPES.forEach(metricType => {
        Object.keys(data.activityOverTime[metricType]).forEach(date => dates.add(date));
    });

    // Build new activityOverTime structure
    dates.forEach(date => {
        migratedData.activityOverTime[date] = METRIC_TYPES.reduce((acc, metricType) => ({
            ...acc,
            [metricType]: data.activityOverTime[metricType][date] || 0
        }), {} as DateActivityMetrics);
    });

    return migratedData;
} 