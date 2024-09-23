import type { ActivityHeatmapData, CheckpointData, ActivityData } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';

abstract class MetricManager {
    constructor(protected plugin: ActivityHeatmapPlugin, public metricName: string) {}

    abstract getMetricValue(file: TFile): number | Promise<number>;

    async calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): Promise<{ checkpoint: CheckpointData; activity: ActivityData }> {
        const checkpoint: CheckpointData = {};
        const activity: ActivityData = { ...latestData.activityOverTime[this.metricName] };
        let absoluteDifferenceSum = 0;

        try {
            for (const file of files) {
                const metricValue = await this.getMetricValue(file);
                checkpoint[file.path] = metricValue;

                const previousValue = latestData.checkpoints[this.metricName]?.[file.path];
                if (previousValue !== undefined) {
                    absoluteDifferenceSum += Math.abs(metricValue - previousValue);
                } else {
                    absoluteDifferenceSum += metricValue;
                }
            }

            // Update or create activity entry for today
            activity[dateToday] = (activity[dateToday] || 0) + absoluteDifferenceSum;

            return { checkpoint, activity };
        } catch (error) {
            console.error(`Error calculating ${this.metricName}:`, error);
            throw error;
        }
    }
}

class FileSizeDataManager extends MetricManager {
    constructor(plugin: ActivityHeatmapPlugin) {
        super(plugin, 'fileSize');
    }

    getMetricValue(file: TFile): number {
        return file.stat.size;
    }
}

class WordCountDataManager extends MetricManager {
    constructor(plugin: ActivityHeatmapPlugin) {
        super(plugin, 'wordCount');
    }

    //Rather trivial implementation, but it's a start
    async getMetricValue(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        return content.split(/\s+/).length;
    }
}

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
}
