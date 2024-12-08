import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { MetricType, ActivityHeatmapData, CheckpointData, HeatmapActivityData, ActivityOverTimeData, CheckpointDataLegacy1_0_4, FileCheckpointData, FilePath, DateActivityMetrics, ActivityOverTimeDataLegacy1_0_4 } from './types';
import { DEV_BUILD } from './config';
import { createMockData, isActivityOverTimeData, isActivityOverTimeDataLegacy1_0_4, isCheckpointData, isCheckpointDataLegacy1_0_4 } from './utils'
import { TFile } from 'obsidian';

/**
 * Manages activity heatmap data for the plugin.
 */
export class DataUpdater {
    private metricManager: MetricManager;
    private saveQueue: Promise<void> = Promise.resolve();

    /**
     * Creates an instance of DataUpdater, which is responsible for updates to activity heatmap data.
     * @param plugin - The main plugin instance.
     */
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.metricManager = new MetricManager(plugin);
    }

    /**
     * Examines a single file's changes and determines the new checkpoint and activity over time data.
     * Writes the updated data to disk.
     * @param file - The Obsidian TFile to update metrics for
     * @param isFirstTime - Whether this is a first-time user (i.e. no existing data.json file)
     */
    async updateFileData(file: TFile, isFirstTime: boolean) {
        this.saveQueue = this.saveQueue.then(async () => {

            let data: ActivityHeatmapData | null = null;
            if (isFirstTime) {
                data = this.getEmptyActivityHeatmapData();
            }
            else {
                // Validate checkpoint and activity over time data structures
                // If invalid, data will be null and no further processing will be done
                const checkpoints = await this.validateCheckpointData();
                const activityOverTime = await this.validateActivityOverTimeData();
                if (checkpoints && activityOverTime) {
                    data = { checkpoints, activityOverTime };
                }
            }
            if (data) {
                const fileCheckpointMetrics = data.checkpoints[file.path];
                const { newFileCheckpointMetrics, activityOverTime } = await this.metricManager.calculateFileMetrics(file, fileCheckpointMetrics, data.activityOverTime, isFirstTime);

                data.checkpoints[file.path] = newFileCheckpointMetrics;
                data.activityOverTime = activityOverTime;
                await this.plugin.app.vault.adapter.write(this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json', JSON.stringify(data));
            }
            else {
                console.error("Not updating file data for " + file.path + " because data is invalid!");
            }

            
        });

        await this.saveQueue;
    }

    /**
     * Removes metrics for a deleted file from all metric types.
     * @param file - The file that was deleted
     */
    async removeFileData(file: TFile) {
        const data = await this.plugin.app.vault.adapter.read(this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json').then(data => JSON.parse(data));
        if (data) {
            delete data.checkpoints[file.path];
            await this.plugin.app.vault.adapter.write(this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json', JSON.stringify(data));
        }
    }


    async validateCheckpointData(): Promise<CheckpointData | null> {
        const legacyFile = await this.plugin.loadData();
        const hasLegacyData = legacyFile && 'checkpoints' in legacyFile;
        const v1_0_5Data = await this.plugin.app.vault.adapter.read(this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json').then(data => JSON.parse(data));

        if (v1_0_5Data) {
            if (!isCheckpointData(v1_0_5Data.checkpoints)) {
                console.error("Checkpoint data is not in the expected format!");
                return null;
            }
            return v1_0_5Data.checkpoints;
        }

        else if (hasLegacyData && !isCheckpointDataLegacy1_0_4(legacyFile.checkpoints)) {
            console.error("Checkpoint data is not in the expected format!");
            return null;
        }
        return this.convertCheckpointDataLegacyToV1_0_5(legacyFile.checkpoints);
    }

    async convertCheckpointDataLegacyToV1_0_5(legacyData: CheckpointDataLegacy1_0_4): Promise<CheckpointData> {
        const newData: CheckpointData = {};
        
        // Get all unique file paths from all metric types
        const allFilePaths = new Set<FilePath>();
        Object.values(legacyData).forEach(metricData => {
            Object.keys(metricData).forEach(filePath => {
                allFilePaths.add(filePath);
            });
        });
        
        // For each file path, create a new FileCheckpointData object
        allFilePaths.forEach(filePath => {
            const fileMetrics: FileCheckpointData = {
                mtime: 0, // Default to 0 since legacy data doesn't have mtime
            } as FileCheckpointData;
            
            // Copy each metric value for this file
            Object.entries(legacyData).forEach(([metricType, metricData]) => {
                fileMetrics[metricType as MetricType] = metricData[filePath] || 0;
            });
            
            newData[filePath] = fileMetrics;
        });
        
        return newData;
    }

    async validateActivityOverTimeData(): Promise<ActivityOverTimeData | null> {
        const legacyFile = await this.plugin.loadData();
        const hasLegacyData = legacyFile && 'activityOverTime' in legacyFile;
        const v1_0_5Data = await this.plugin.app.vault.adapter.read(
            this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json'
        ).then(data => JSON.parse(data));

        let combinedData: ActivityOverTimeData = {};
        
        if (v1_0_5Data) {
            if (!isActivityOverTimeData(v1_0_5Data.activityOverTime)) {
                console.error("Activity over time data is not in the expected format!");
                return null;
            }
            combinedData = v1_0_5Data.activityOverTime;
        }

        if (hasLegacyData) {
            if (!isActivityOverTimeDataLegacy1_0_4(legacyFile.activityOverTime)) {
                console.error("Activity over time data is not in the expected format!");
                return null;
            }
            const legacyConverted = await this.convertActivityOverTimeDataLegacyToV1_0_5(legacyFile.activityOverTime);
            
            // Merge the data, adding values for dates that exist in both
            Object.entries(legacyConverted).forEach(([date, legacyMetrics]) => {
                if (combinedData[date]) {
                    // Both dates exist - add each metric value
                    Object.keys(legacyMetrics).forEach((metricType: MetricType) => {
                        combinedData[date][metricType] = 
                            (combinedData[date][metricType] || 0) + 
                            (legacyMetrics[metricType] || 0);
                    });
                } else {
                    // Only legacy data exists for this date
                    combinedData[date] = legacyMetrics;
                }
            });
        }
        
        return combinedData;
    }

    async convertActivityOverTimeDataLegacyToV1_0_5(legacyData: ActivityOverTimeDataLegacy1_0_4): Promise<ActivityOverTimeData> {
        const newData: ActivityOverTimeData = {};
        Object.entries(legacyData).forEach(([date, metrics]) => {
            newData[date] = metrics as DateActivityMetrics;
        });
        return newData;
    }


    /**
     * Constructs an empty activity heatmap data structure.
     * @returns An empty activity heatmap data structure.
     */
    private getEmptyActivityHeatmapData(): ActivityHeatmapData {
        return {
            checkpoints: {} as CheckpointData,
            activityOverTime: {} as ActivityOverTimeData
        };
    }


    async getActivityDataForHeatmap(metricType: MetricType): Promise<HeatmapActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return createMockData();
        }
        let activityData = await this.validateActivityOverTimeData();
        if (!activityData) {
            activityData = this.getEmptyActivityHeatmapData().activityOverTime;
        }
        const transformedData: HeatmapActivityData = {};
        Object.entries(activityData).forEach(([date, metrics]) => {
            if (metrics[metricType]) {
                transformedData[date] = metrics[metricType];
            }
        });
        
        return transformedData;
    }




   
	
}