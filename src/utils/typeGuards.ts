import { METRIC_TYPES } from '../constants';
import type { 
    CheckpointData, 
    ActivityOverTimeData,
    MetricType,
    CheckpointDataSchemaV0,
    ActivityOverTimeDataSchemaV0,
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
 * Type guard for CheckpointDataSchemaV0 (Record<MetricType, Record<FilePath, number>>)
 */
export function isCheckpointDataSchemaV0(data: any): data is CheckpointDataSchemaV0 {
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
 * Type guard for ActivityOverTimeDataLegacyV0 (Record<MetricType, Record<DateString, number>>)
 */
export function isActivityOverTimeDataSchemaV0(data: any): data is ActivityOverTimeDataSchemaV0 {
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