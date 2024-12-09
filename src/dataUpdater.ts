import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { MetricType, ActivityHeatmapData, CheckpointData, HeatmapActivityData, ActivityOverTimeData, CheckpointDataLegacy1_0_4, FileCheckpointData, FilePath, DateActivityMetrics, ActivityOverTimeDataLegacy1_0_4 } from './types';
import { createMockData, getEmptyActivityHeatmapData, isActivityOverTimeData, isActivityOverTimeDataLegacy1_0_4, isCheckpointData, isCheckpointDataLegacy1_0_4 } from './utils'
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
                console.log("First time update - creating empty data");
                data = getEmptyActivityHeatmapData();
            }
            else {
                // Validate checkpoint and activity over time data structures
                // If invalid, data will be null and no further processing will be done
                const checkpoints = await this.validateCheckpointData();
                const activityOverTime = await this.validateActivityOverTimeData();
                if (checkpoints && activityOverTime) {
                    data = { checkpoints, activityOverTime };
                    console.log("Data validated successfully");
                }
            }
            if (data) {
                const fileCheckpointMetrics = data.checkpoints[file.path];
                const { newFileCheckpointMetrics, activityOverTime } = await this.metricManager.calculateFileMetrics(file, fileCheckpointMetrics, data.activityOverTime, isFirstTime);

                data.checkpoints[file.path] = newFileCheckpointMetrics;
                data.activityOverTime = activityOverTime;
                // Check if v1_0_5.json exists, create directory and file if not
                const v1_0_5Path = this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json';
                try {
                    await this.plugin.app.vault.adapter.mkdir(this.plugin.manifest.dir + '/activity_heatmap_data');
                } catch (error) {
                    // Directory may already exist, continue
                }
                await this.plugin.app.vault.adapter.write(v1_0_5Path, JSON.stringify(data, null, 2));
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
        let v1_0_5Data: ActivityHeatmapData | null = null;
        try {
            v1_0_5Data = await this.plugin.app.vault.adapter.read(this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json').then(data => JSON.parse(data));
        } catch (error) {
        }

        if (v1_0_5Data) {
            if (!isCheckpointData(v1_0_5Data.checkpoints)) {
                console.error("v1_0_5 checkpoint data is not in the expected format!");
                return null;
            }
            return v1_0_5Data.checkpoints;
        }

        else if (hasLegacyData && !isCheckpointDataLegacy1_0_4(legacyFile.checkpoints)) {
            console.error("Legacy checkpoint data is not in the expected format!");
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
        try {
            const v1_0_5Data = await this.plugin.app.vault.adapter.read(
                this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json'
            ).then(data => JSON.parse(data));

            if (!isActivityOverTimeData(v1_0_5Data.activityOverTime)) {
                console.error("v1_0_5 activity over time data is not in the expected format!");
                return null;
            }
            return v1_0_5Data.activityOverTime;
        } catch (error) {
            return getEmptyActivityHeatmapData().activityOverTime;
        }
    }





   
	
}