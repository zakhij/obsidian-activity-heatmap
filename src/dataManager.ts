import type { ActivityHeatmapData} from './types'
import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData } from './types';
import { DEV_BUILD } from './config';
import type { MetricType } from './types'
import { getCurrentDate, createMockData } from './utils'
import { TFile } from 'obsidian';

/**
 * Manages activity heatmap data for the plugin.
 */
export class ActivityHeatmapDataManager {
    private data: ActivityHeatmapData;
    private metricManager: MetricManager;

    /**
     * Creates an instance of ActivityHeatmapDataManager.
     * @param plugin - The main plugin instance.
     * @param loadedData - The initial activity heatmap data.
     */
    constructor(private plugin: ActivityHeatmapPlugin, loadedData: ActivityHeatmapData) {
        this.data = loadedData;
        this.metricManager = new MetricManager(plugin);
    }

    /**
     * Updates metrics for all files and saves the data. Currently not in use.
     */
    async updateMetrics() {
        const today = getCurrentDate();
        const files = this.plugin.app.vault.getMarkdownFiles();

        const metricTypes: MetricType[] = ['fileSize', 'wordCount'];

        for (const metricType of metricTypes) {
            const { checkpoint, activity } = await this.metricManager.calculateMetrics(metricType, files, this.data, today);
            this.data.checkpoints[metricType] = checkpoint;
            this.data.activityOverTime[metricType] = activity;
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

    /**
     * Updates metrics for a single file and saves the data.
     * This method is more efficient than updating all files as it only processes
     * the changes for a single file.
     * 
     * @param file - The Obsidian TFile to update metrics for
     */
    async updateMetricsForFile(file: TFile) {
        const today = getCurrentDate();
        const metricTypes: MetricType[] = ['fileSize', 'wordCount'];

        for (const metricType of metricTypes) {
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
        const metricTypes: MetricType[] = ['fileSize', 'wordCount'];

        for (const metricType of metricTypes) {
            if (this.data.checkpoints[metricType]) {
                delete this.data.checkpoints[metricType][filePath];
            }
        }

        await this.plugin.saveData(this.data);
    }
}
