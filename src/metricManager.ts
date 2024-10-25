import type { ActivityHeatmapData, CheckpointData, ActivityData, MetricType } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';
import { calculateAbsoluteDifference, isFirstCheckpoint } from './utils';

type MetricCalculator = (file: TFile) => number | Promise<number>;

/**
 * Manages metric calculations for the activity heatmap.
 */
export class MetricManager {
    private metricCalculators: Record<MetricType, MetricCalculator>;

    /**
     * Creates an instance of MetricManager.
     * @param plugin - The main plugin instance.
     */
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.metricCalculators = {
            fileSize: this.calculateFileSize.bind(this),
            wordCount: this.calculateWordCount.bind(this),
        };
    }

    /**
     * Registers a new metric calculator.
     * @param metricName - The name of the metric.
     * @param calculator - The function to calculate the metric.
     */
    registerMetricCalculator(metricName: MetricType, calculator: MetricCalculator) {
        this.metricCalculators[metricName] = calculator;
    }

    /**
     * Calculates the file size metric.
     * @param file - The file to calculate the metric for.
     * @returns The file size in bytes.
     */
    private calculateFileSize(file: TFile): number {
        return file.stat.size;
    }

    /**
     * Calculates the word count metric.
     * @param file - The file to calculate the metric for.
     * @returns A promise that resolves to the word count.
     */
    private async calculateWordCount(file: TFile): Promise<number> {
        const content = await this.plugin.app.vault.read(file);
        return content.split(/\s+/).length;
    }

    /**
     * Calculates metrics for all files and updates the activity data.
     * @param metricName - The name of the metric to calculate.
     * @param files - An array of files to process.
     * @param latestData - The current activity heatmap data.
     * @param dateToday - The current date as a string.
     * @returns A promise that resolves to the updated checkpoint and activity data.
     */
    async calculateMetrics(metricName: MetricType, files: TFile[], latestData: ActivityHeatmapData, dateToday: string): Promise<{ checkpoint: CheckpointData; activity: ActivityData }> {
        const calculator = this.metricCalculators[metricName];
        if (!calculator) {
            throw new Error(`No calculator found for metric: ${metricName}`);
        }

        const checkpoint: CheckpointData = {};
        const activity: ActivityData = { ...latestData.activityOverTime[metricName] };
        let absoluteDifferenceSum = 0;
        const isFirstCheckpointForMetric = isFirstCheckpoint(latestData.checkpoints[metricName]);

        for (const file of files) {
            try {
                const metricValue = await calculator(file);
                checkpoint[file.path] = metricValue;

                if (!isFirstCheckpointForMetric) {
                    const previousValue = latestData.checkpoints[metricName]?.[file.path];
                    absoluteDifferenceSum += calculateAbsoluteDifference(metricValue, previousValue);
                }
            } catch (error) {
                console.error(`Error calculating ${metricName} for file ${file.path}:`, error);
            }
        }

        if (!isFirstCheckpointForMetric) {
            activity[dateToday] = (activity[dateToday] || 0) + absoluteDifferenceSum;
        }

        return { checkpoint, activity };
    }
}
