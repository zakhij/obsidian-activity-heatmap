import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData, MetricType, ActivityHeatmapData, CheckpointData, HeatmapActivityData } from './types';
import { DEV_BUILD } from './config';
import { getCurrentDate, createMockData, isActivityOverTimeData, isCheckpointData } from './utils'
import { TFile } from 'obsidian';
import { METRIC_TYPES } from './constants';
import { isActivityHeatmapData } from './utils';

/**
 * Manages activity heatmap data for the plugin.
 */
export class ActivityHeatmapDataManager {
    private metricManager: MetricManager;
    private saveQueue: Promise<void> = Promise.resolve();

    /**
     * Creates an instance of ActivityHeatmapDataManager, which is responsible for reads/writes of activity heatmap data to disk.
     * @param plugin - The main plugin instance.
     */
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.metricManager = new MetricManager(plugin);
    }

    /**
     * Updates metrics for a single file and saves the data.
     * @param file - The Obsidian TFile to update metrics for
     * @param isFirstTimeUpdate - Whether this is a first-time update (i.e. no existing data.json file)
     */
    async updateMetricsForFile(file: TFile, isFirstTimeUpdate: boolean) {
        this.saveQueue = this.saveQueue.then(async () => {
            const data = await this.parseActivityData();
            
            for (const metricType of METRIC_TYPES) {
                const { checkpoint, activity } = await this.metricManager.calculateMetricsForFile(
                    metricType,
                    file,
                    data,
                    isFirstTimeUpdate
                );
                                
                data.checkpoints[metricType] = {
                    ...data.checkpoints[metricType],
                    [file.path]: checkpoint[file.path]
                };
                data.activityOverTime[metricType] = activity;
            }
            
            await this.plugin.saveData(data);
        });
        
        await this.saveQueue;
    }

    /**
     * Removes metrics for a deleted file from all metric types.
     * @param filePath - The path of the file that was deleted
     */
    async removeFileMetrics(filePath: string) {
        const data = await this.parseActivityData();
        for (const metricType of METRIC_TYPES) {
            if (data.checkpoints[metricType]) {
                delete data.checkpoints[metricType][filePath];
            }
        }

        await this.plugin.saveData(data);
    }


    /**
     * Retrieves activity heatmap data for a specific metric type.
     * In case of invalid data, returns an empty activity heatmap data structure.
     * @param metricType - The type of metric to retrieve data for.
     * @returns A promise that resolves to the activity data.
     */
    async getActivityHeatmapData(metricType: MetricType): Promise<HeatmapActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return createMockData();
        }
        let data = await this.parseActivityData();
        if (!data) {
            data = this.getEmptyActivityHeatmapData();
        }
        const transformedData: HeatmapActivityData = {};
        Object.entries(data.activityOverTime).forEach(([date, metrics]) => {
            if (metrics[metricType]) {
                transformedData[date] = metrics[metricType];
            }
        });
        
        return transformedData;
    }
        

    /**
     * Constructs an empty activity heatmap data structure for heatmap display.
     * @returns An empty activity heatmap data structure.
     */
    private getEmptyActivityHeatmapData(): ActivityHeatmapData {
        return {
            version: this.plugin.manifest.version,
            checkpoints: METRIC_TYPES.reduce((acc, metric) => ({
                ...acc,
                [metric]: {} as CheckpointData
            }), {} as Record<MetricType, CheckpointData>),
            activityOverTime: METRIC_TYPES.reduce((acc, metric) => ({
                ...acc,
                [metric]: {} as Record<string, number>
            }), {} as Record<MetricType, Record<string, number>>)
        } as ActivityHeatmapData;
    }


    /**
	 * Parses the data read from disk (plugin's data.json file) into a usable format.
     * If the data is not in the expected format, it returns an empty data structure to prevent errors.
	 * @returns The parsed activity data.
	 */
	async parseActivityData(): Promise<ActivityHeatmapData | null> {
		const loadedData = await this.plugin.loadData();

        // If data.json doesn't exist, return null.
        if (!loadedData) {
            return null;
        }

        // If version does not exist or is behind the current version, return null.
        if (!loadedData.version || loadedData.version < this.plugin.manifest.version) {
            return null;
        }

        // If activity is not in the expected format, return null.
        if (!isActivityOverTimeData(loadedData.activityOverTime)) {
            return null;
        }

        // If checkpoints are not in the expected format, return null.
        if (!isCheckpointData(loadedData.checkpoints)) {
            return null;
        }

        return {
            version: loadedData.version,
            checkpoints: loadedData.checkpoints,
            activityOverTime: loadedData.activityOverTime
        } as ActivityHeatmapData;
    }
}
