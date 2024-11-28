import type { MetricType } from './metrics';

export interface ActivityHeatmapSettings {
    metricType: MetricType;
    useMockData?: boolean;
    year: string;
} 