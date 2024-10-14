import type { ActivityHeatmapData, CheckpointData, ActivityData } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';

export abstract class MetricManager {
    constructor(protected plugin: ActivityHeatmapPlugin, public metricName: string) {}

    abstract getMetricValue(file: TFile): number | Promise<number>;

    async calculateMetrics(files: TFile[], latestData: ActivityHeatmapData, dateToday: string): Promise<{ checkpoint: CheckpointData; activity: ActivityData}> {
        const checkpoint: CheckpointData = {};
        const activity: ActivityData = { ...latestData.activityOverTime[this.metricName] };
        let absoluteDifferenceSum = 0;
        const isFirstCheckpoint = !latestData.checkpoints[this.metricName] || Object.keys(latestData.checkpoints[this.metricName]).length === 0;

        for (const file of files) {
            try {
                const metricValue = await this.getMetricValue(file);
                checkpoint[file.path] = metricValue;

            if (!isFirstCheckpoint) {
                const previousValue = latestData.checkpoints[this.metricName]?.[file.path];
                if (previousValue !== undefined) {
                    absoluteDifferenceSum += Math.abs(metricValue - previousValue);
                } else {
                    // New file, count its full value as activity
                    absoluteDifferenceSum += metricValue;
                    }
                }
            } catch (error) {
            }
        }

        // Update activity only if it's not the first checkpoint
        if (!isFirstCheckpoint) {
            activity[dateToday] = (activity[dateToday] || 0) + absoluteDifferenceSum;
        }

        return { checkpoint, activity};
        
    }
}

export class FileSizeDataManager extends MetricManager {
    constructor(plugin: ActivityHeatmapPlugin) {
        super(plugin, 'fileSize');
    }

    getMetricValue(file: TFile): number {
        return file.stat.size;
    }
}

export class WordCountDataManager extends MetricManager {
    constructor(plugin: ActivityHeatmapPlugin) {
        super(plugin, 'wordCount');
    }

    //Rather trivial implementation, but it's a start
    async getMetricValue(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        return content.split(/\s+/).length;
    }
}