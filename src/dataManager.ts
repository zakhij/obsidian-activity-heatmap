import type { ActivityHeatmapData} from './types'
import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData } from './types';
import { DEV_BUILD } from './config';
import type { MetricType } from './types'


export class ActivityHeatmapDataManager {
    private data: ActivityHeatmapData;
    private metricManager: MetricManager;

    constructor(private plugin: ActivityHeatmapPlugin, loadedData: ActivityHeatmapData) {
        this.data = loadedData;
        this.metricManager = new MetricManager(plugin);
    }

    async updateMetrics() {
        const today = new Date().toISOString().split('T')[0];
        const files = this.plugin.app.vault.getMarkdownFiles();

        const metricTypes: MetricType[] = ['fileSize', 'wordCount'];

        for (const metricType of metricTypes) {
            const { checkpoint, activity } = await this.metricManager.calculateMetrics(metricType, files, this.data, today);
            this.data.checkpoints[metricType] = checkpoint;
            this.data.activityOverTime[metricType] = activity;
        }

        await this.plugin.saveData(this.data);
    }

    
    async getActivityHeatmapData(metricType: MetricType): Promise<ActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return this.createMockData();
        }
        return this.data.activityOverTime[metricType];
    }


    private createMockData(): ActivityData {
        const today = new Date();
        const endDate = today;
        const startDate = new Date(today.getFullYear(), today.getMonth() - 15, today.getDate());
        const mockData: ActivityData = {};

        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateString = date.toISOString().split('T')[0];
            mockData[dateString] = Math.floor(Math.random() * 100);
        }

        return mockData;
    }


}
