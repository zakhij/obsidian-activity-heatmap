import type { ActivityHeatmapData} from './types'
import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData } from './types';
import { DEV_BUILD } from './config';
import type { MetricType } from './types'
import { getCurrentDate, createMockData } from './utils'

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
     * Updates metrics for all files and saves the data.
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
}
