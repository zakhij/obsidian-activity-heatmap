import type { ActivityHeatmapData, CheckpointData, ActivityData, MetricType } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';
import { calculateAbsoluteDifference} from './utils';

type MetricCalculator = (file: TFile) => number | Promise<number>;

/**
 * Manages metric calculations for the activity heatmap.
 */
export class MetricManager {
    private metricCalculators: Record<MetricType, MetricCalculator>;

    /**
     * Creates an instance of MetricManager, which is responsible for calculating metrics for files.
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
     * Calculates metrics for a single file and updates the activity data.
     * This method handles the calculation of a specific metric type for one file,
     * updating both the checkpoint and activity data accordingly.
     * 
     * @param metricName - The type of metric to calculate (e.g., 'fileSize', 'wordCount')
     * @param file - The Obsidian TFile to calculate metrics for
     * @param latestData - The current state of all activity heatmap data
     * @param dateToday - The current date in string format
     * @returns An object containing the updated checkpoint and activity data
     */
    async calculateMetricsForFile(
        metricName: MetricType,
        file: TFile,
        latestData: ActivityHeatmapData,
        dateToday: string
    ): Promise<{ checkpoint: CheckpointData; activity: ActivityData }> {
        const calculator = this.metricCalculators[metricName];
        if (!calculator) {
            throw new Error(`No calculator found for metric: ${metricName}`);
        }


        const checkpoint: CheckpointData = {};
        const activity: ActivityData = { ...latestData.activityOverTime[metricName] };
        
        try {
            const metricValue = await calculator(file);
            checkpoint[file.path] = metricValue;

            if (latestData.checkpoints[metricName] && file.path in latestData.checkpoints[metricName]) {
                const previousValue = latestData.checkpoints[metricName][file.path];
                const absoluteDifference = calculateAbsoluteDifference(metricValue, previousValue);
                activity[dateToday] = (activity[dateToday] || 0) + absoluteDifference;
            }
        } catch (error) {
            console.error(`Error calculating ${metricName} for file ${file.path}:`, error);
        }

        return { checkpoint, activity };
    }
}
