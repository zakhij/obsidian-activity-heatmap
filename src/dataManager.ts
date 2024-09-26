import type { ActivityHeatmapData} from './types'
import type ActivityHeatmapPlugin from './main'
import { MetricManager, FileSizeDataManager, WordCountDataManager } from './metricManager';
import { ActivityData } from './types';


export class ActivityHeatmapDataManager {
    private data: ActivityHeatmapData;
    private metricManagers: MetricManager[];

    constructor(private plugin: ActivityHeatmapPlugin) {
        this.data = { checkpoints: {}, activityOverTime: {} };
        this.metricManagers = [
            new FileSizeDataManager(plugin),
            new WordCountDataManager(plugin)
        ];
    }

    async loadData() {
        this.data = await this.plugin.loadData() || { checkpoints: {}, activityOverTime: {} };
    }

    async saveData() {
        await this.plugin.saveData(this.data);
    }

    async updateMetrics() {
        const today = new Date().toISOString().split('T')[0];
        await this.loadData();

        // Get the files here, right before we use them
        const files = this.plugin.app.vault.getMarkdownFiles();
        console.log("Number of files:", files.length);

        for (const manager of this.metricManagers) {
            const { checkpoint, activity } = await manager.calculateMetrics(files, this.data, today);
            this.data.checkpoints[manager.metricName] = checkpoint;
            this.data.activityOverTime[manager.metricName] = activity;
        }
        await this.saveData();
    }

    //TODO: Change this such that we're returning data for the selected metric (param), and
    // only the activity over time data.
    async getActivityHeatmapData(useMockData: boolean, metricType: string): Promise<ActivityData> {
        if (useMockData) {
            return this.createMockData();
        }
        await this.loadData();
        return this.data.activityOverTime[metricType];
    }


    private createMockData(): ActivityData {
        const startDate = new Date('2024-03-01');
        const endDate = new Date('2024-09-01');
        const mockData: ActivityData = {};

        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateString = date.toISOString().split('T')[0];
            mockData[dateString] = Math.floor(Math.random() * 100);
        }

        return mockData;
    }


}
