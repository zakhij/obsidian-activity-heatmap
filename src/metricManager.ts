import type { ActivityOverTimeData, DateActivityMetrics, FileCheckpointData, FileCheckpointMetrics, MetricType } from './types'
import type ActivityHeatmapPlugin from './main'
import type { TFile } from 'obsidian';
import { calculateAbsoluteDifference, getDateStringFromTimestamp } from './utils';
import { METRIC_TYPES } from './constants';

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
     * Calculates the metrics for a single file and returns the new checkpoint metrics and updated activity over time data.
     * @param file - The Obsidian TFile to calculate metrics for
     * @param fileCheckpointMetrics - The existing checkpoint metrics for the file, if any
     * @param activityOverTime - The existing activity over time data (may be empty)
     * @param isFirstTime - Whether this is a first-time user (i.e. no existing data.json file)
     */
    async calculateFileMetrics(
        file: TFile, 
        fileCheckpointMetrics: FileCheckpointMetrics | null, 
        activityOverTime: ActivityOverTimeData, 
        isFirstTime: boolean
    ): Promise<{ newFileCheckpointMetrics: FileCheckpointData; activityOverTime: ActivityOverTimeData}> {
        
        const newFileCheckpointMetrics = {} as FileCheckpointData;
        newFileCheckpointMetrics.mtime = file.stat.mtime;

        for (const metricType of METRIC_TYPES) {
            const calculator = this.metricCalculators[metricType];
            
            const metricValue = await calculator(file);
            newFileCheckpointMetrics[metricType] = metricValue;

            // If this is not the first time, modify activity over time
            if (!isFirstTime) {
                const dateString = getDateStringFromTimestamp(file.stat.mtime);
                
                // Initialize the date object if it doesn't exist
                if (!activityOverTime[dateString]) {
                    activityOverTime[dateString] = {} as DateActivityMetrics;
                }
                
                // Initialize the metric if it doesn't exist
                if (!activityOverTime[dateString][metricType]) {
                    activityOverTime[dateString][metricType] = 0;
                }

                const previousValue = fileCheckpointMetrics?.[metricType];
                const absoluteDifference = calculateAbsoluteDifference(metricValue, previousValue);
                activityOverTime[dateString][metricType] += absoluteDifference;
            }
        }

        return { newFileCheckpointMetrics, activityOverTime };
    }

   
}
