import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData, MetricType, ActivityHeatmapData } from './types';
import { DEV_BUILD } from './config';
import { getCurrentDate, createMockData } from './utils'
import { TFile } from 'obsidian';
import { METRIC_TYPES } from './constants';

/**
 * Manages activity heatmap data for the plugin.
 */
export class ActivityHeatmapDataManager {
    private metricManager: MetricManager;
    private data: ActivityHeatmapData;


    /**
     * Creates an instance of ActivityHeatmapDataManager.
     * @param plugin - The main plugin instance.
     * @param loadedData - The parsed activity heatmap data from the data.json file.
     */
    constructor(private plugin: ActivityHeatmapPlugin, loadedData: ActivityHeatmapData) {
        this.metricManager = new MetricManager(plugin);
        this.data = loadedData;
    }

    /**
     * Updates metrics for a single file and saves the data.
     * This method is more efficient than updating all files as it only processes
     * the changes for a single file.
     * 
     * @param file - The Obsidian TFile to update metrics for
     */
    async updateMetricsForFile(file: TFile) {
        const today = getCurrentDate();

        for (const metricType of METRIC_TYPES) {
            const { checkpoint, activity } = await this.metricManager.calculateMetricsForFile(
                metricType,
                file,
                this.data,
                today
            );
            
            // Update only the specific file's checkpoint
            this.data.checkpoints[metricType] = {
                ...this.data.checkpoints[metricType],
                [file.path]: checkpoint[file.path]
            };
            this.data.activityOverTime[metricType] = activity;
        }

        await this.plugin.saveData(this.data);
    }

    /**
     * Removes metrics for a deleted file from all metric types.
     * This cleanup ensures we don't maintain data for files that no longer exist.
     * 
     * @param filePath - The path of the file that was deleted
     */
    async removeFileMetrics(filePath: string) {
        for (const metricType of METRIC_TYPES) {
            if (this.data.checkpoints[metricType]) {
                delete this.data.checkpoints[metricType][filePath];
            }
        }

        await this.plugin.saveData(this.data);
    }

    /**
     * Retrieves activity heatmap data for a specific metric type.
     * @param metricType - The type of metric to retrieve data for.
     * @returns A promise that resolves to the activity data.
     */
    async getActivityHeatmapData(metricType: MetricType): Promise<ActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return createMockData();
        }
        return this.data.activityOverTime[metricType];
    }

}
