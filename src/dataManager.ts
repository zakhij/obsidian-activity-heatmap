import type { ActivityHeatmapData, CheckpointData, ActivityData } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';

abstract class MetricManager {
    constructor(protected plugin: ActivityHeatmapPlugin, public metricName: string) {}

    abstract getMetricValue(file: TFile): number | Promise<number>;

    async calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): Promise<{ checkpoint: CheckpointData; activity: ActivityData }> {
        const checkpoint: CheckpointData = {};
        const activity: ActivityData = {};
        let absoluteDifferenceSum = 0;

        for (const file of files) {
            const metricValue = await Promise.resolve(this.getMetricValue(file));
            checkpoint[file.path] = metricValue;

            if (latestData.checkpoints[this.metricName] && latestData.checkpoints[this.metricName][file.path] !== undefined) {
                absoluteDifferenceSum += Math.abs(metricValue - latestData.checkpoints[this.metricName][file.path]);
            } else {
                absoluteDifferenceSum += metricValue;
            }
        }

        activity[dateToday] = absoluteDifferenceSum;

        return { checkpoint, activity };
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

    async getMetricValue(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        return content.split(/\s+/).length;
    }
}

export class ActivityHeatmapDataManager {
    private data: ActivityHeatmapData;
    private metricManagers: MetricManager[];
    private files: TFile[];

    constructor(private plugin: ActivityHeatmapPlugin) {
        this.data = { checkpoints: {}, activityOverTime: {} };
        this.metricManagers = [
            new FileSizeDataManager(plugin),
            new WordCountDataManager(plugin)
        ];

        this.files = this.plugin.app.vault.getMarkdownFiles();
    }

    async loadData() {
        this.data = await this.plugin.loadData() || { checkpoints: {}, activityOverTime: {} };
    }

    async saveData() {
        await this.plugin.saveData(this.data);
    }

    async updateMetrics() {
        const today = new Date().toISOString().split('T')[0];
        for (const manager of this.metricManagers) {
            const { checkpoint, activity } = await manager.calculateMetrics(this.files, this.data, today);
            this.data.checkpoints[manager.metricName] = checkpoint;
            this.data.activityOverTime[manager.metricName] = activity;
        }
        await this.saveData();
    }
}
