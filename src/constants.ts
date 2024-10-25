import { ActivityHeatmapSettings } from './types';



export const DEFAULT_SETTINGS: ActivityHeatmapSettings = {
    metricType: 'fileSize',
    updateIntervalSeconds: 5,
    year: new Date().getFullYear().toString(),
};
