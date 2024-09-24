import type { ActivityHeatmapData} from './types'
import type ActivityHeatmapPlugin from './main'
import { MetricManager, FileSizeDataManager, WordCountDataManager } from './metricManager';



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

    async getActivityHeatmapData(): Promise<ActivityHeatmapData> {
        await this.loadData();
        return this.data;
    }
}
