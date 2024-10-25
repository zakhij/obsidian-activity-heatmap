import type { ActivityHeatmapData, CheckpointData, ActivityData } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';

type MetricCalculator = (file: TFile) => number | Promise<number>;

export class MetricManager {
    private metricCalculators: Record<string, MetricCalculator> = {};

    constructor(private plugin: ActivityHeatmapPlugin) {
        this.registerMetricCalculator('fileSize', this.calculateFileSize.bind(this));
        this.registerMetricCalculator('wordCount', this.calculateWordCount.bind(this));
    }

    registerMetricCalculator(metricName: string, calculator: MetricCalculator) {
        this.metricCalculators[metricName] = calculator;
    }

    private calculateFileSize(file: TFile): number {
        return file.stat.size;
    }

    private async calculateWordCount(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        return content.split(/\s+/).length;
    }

    async calculateMetrics(metricName: string, files: TFile[], latestData: ActivityHeatmapData, dateToday: string): Promise<{ checkpoint: CheckpointData; activity: ActivityData }> {
        const calculator = this.metricCalculators[metricName];
        if (!calculator) {
            throw new Error(`No calculator found for metric: ${metricName}`);
        }

        const checkpoint: CheckpointData = {};
        const activity: ActivityData = { ...latestData.activityOverTime[metricName] };
        let absoluteDifferenceSum = 0;
        const isFirstCheckpoint = !latestData.checkpoints[metricName] || Object.keys(latestData.checkpoints[metricName]).length === 0;

        for (const file of files) {
            try {
                const metricValue = await calculator(file);
                checkpoint[file.path] = metricValue;

                if (!isFirstCheckpoint) {
                    const previousValue = latestData.checkpoints[metricName]?.[file.path];
                    if (previousValue !== undefined) {
                        absoluteDifferenceSum += Math.abs(metricValue - previousValue);
                    } else {
                        absoluteDifferenceSum += metricValue;
                    }
                }
            } catch (error) {
                console.error(`Error calculating ${metricName} for file ${file.path}:`, error);
            }
        }

        if (!isFirstCheckpoint) {
            activity[dateToday] = (activity[dateToday] || 0) + absoluteDifferenceSum;
        }

        return { checkpoint, activity };
    }
}
