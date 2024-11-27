import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { MetricType, ActivityHeatmapData, CheckpointData, HeatmapActivityData, ActivityOverTimeData } from './types';
import { DEV_BUILD } from './config';
import { createMockData, isActivityOverTimeData, isCheckpointData } from './utils'
import { TFile } from 'obsidian';
import { METRIC_TYPES } from './constants';
import { first } from 'lodash-es';

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
     * Updates the data for a single file.
     */
    async updateFileData(file: TFile, isFirstTime: boolean) {
        this.saveQueue = this.saveQueue.then(async () => {
            
            const data = await this.parseActivityData(isFirstTime);

            if (data) {
                const fileCheckpointMetrics = data.checkpoints[file.path];
                const { newFileCheckpointMetrics, activityOverTime } = await this.metricManager.calculateFileMetrics(file, fileCheckpointMetrics, data.activityOverTime, isFirstTime);

                data.checkpoints[file.path] = newFileCheckpointMetrics;
                data.activityOverTime = activityOverTime;
                await this.plugin.saveData(data);
            }

            
        });

        await this.saveQueue;
    }

    /**
     * Updates metrics for a single file and saves the data.
     * @param file - The Obsidian TFile to update metrics for
     * @param isFirstTimeUpdate - Whether this is a first-time update (i.e. no existing data.json file)
     */
    async updateMetricsForFile(file: TFile, isFirstTimeUpdate: boolean) {
        this.saveQueue = this.saveQueue.then(async () => {
            const data = await this.parseActivityData(false);
            
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
     * @param file - The file that was deleted
     */
    async removeFileData(file: TFile) {
        const data = await this.parseActivityData(false);
        if (data) {
            delete data.checkpoints[file.path];
            await this.plugin.saveData(data);
        }
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
        let data = await this.parseActivityData(false);
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
     * Constructs an empty activity heatmap data structure.
     * @returns An empty activity heatmap data structure.
     */
    private getEmptyActivityHeatmapData(): ActivityHeatmapData {
        return {
            version: this.plugin.manifest.version,
            checkpoints: {} as CheckpointData,
            activityOverTime: {} as ActivityOverTimeData
        };
    }


    /**
	 * Parses the data read from disk (plugin's data.json file) into a usable format.
     * If the data is not in the expected format, it returns an empty data structure to prevent errors.
	 * @returns The parsed activity data.
	 */
	async parseActivityData(isFirstTime: boolean): Promise<ActivityHeatmapData | null> {
		const loadedData = await this.plugin.loadData();

        if (isFirstTime) {
            return this.getEmptyActivityHeatmapData();
        }

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
