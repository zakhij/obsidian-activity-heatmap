import { METRIC_TYPES } from '../constants';
import type { 
    CheckpointData, 
    ActivityOverTimeData,
    CheckpointDataLegacy1_0_4,
    ActivityOverTimeDataLegacy1_0_4,
    MetricType
} from '../types/'


/**
 * Type guard for CheckpointData (Record<FilePath, FileMetrics>)
 */
export function isCheckpointData(data: any): data is CheckpointData {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([filePath, metrics]) => 
        typeof filePath === 'string' &&
        typeof metrics === 'object' &&
        metrics !== null &&
        'mtime' in metrics &&
        typeof metrics.mtime === 'number' &&
        METRIC_TYPES.every(metricType =>
            metricType in metrics &&              
            typeof metrics[metricType] === 'number' 
        )
    );
}



/**
 * Type guard for ActivityOverTimeData (Record<DateString, Record<MetricType, number>>)
 */
export function isActivityOverTimeData(data: any): data is ActivityOverTimeData {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([date, metrics]) => 
        typeof metrics === 'object' &&
        metrics !== null &&
        !isNaN(Date.parse(date)) &&
        Object.entries(metrics).every(([metric, value]) =>
            METRIC_TYPES.includes(metric as MetricType) &&
            typeof value === 'number'
        )
    );
}


/**
 * Type guard for CheckpointDataLegacy1_0_4 (Record<MetricType, Record<FilePath, number>>)
 */
export function isCheckpointDataLegacy1_0_4(data: any): data is CheckpointDataLegacy1_0_4 {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([metric, dateValues]) => 
        METRIC_TYPES.includes(metric as MetricType) &&
        typeof dateValues === 'object' &&
        dateValues !== null &&
        Object.entries(dateValues).every(([date, value]) =>
            typeof value === 'number'
        )
    );
}

/**
 * Type guard for ActivityOverTimeDataLegacy1_0_4 (Record<MetricType, Record<DateString, number>>)
 */
export function isActivityOverTimeDataLegacy1_0_4(data: any): data is ActivityOverTimeDataLegacy1_0_4 {
    if (typeof data !== 'object' || data === null) return false;
    
    return Object.entries(data).every(([metric, dateValues]) => 
        METRIC_TYPES.includes(metric as MetricType) &&
        typeof dateValues === 'object' &&
        dateValues !== null &&
        Object.entries(dateValues).every(([date, value]) =>
            !isNaN(Date.parse(date)) && 
            typeof value === 'number'
        )
    );
}