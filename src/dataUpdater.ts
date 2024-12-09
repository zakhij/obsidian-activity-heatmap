import { CURRENT_DATA_FILE, DATA_FOLDER, LEGACY_DATA_VERSIONS } from './constants';
import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { MetricType, ActivityHeatmapData, CheckpointData, ActivityOverTimeData, CheckpointDataLegacy1_0_4, FileCheckpointData, FilePath } from './types';
import { isActivityOverTimeData, isCheckpointData, isCheckpointDataLegacy1_0_4 } from './utils'
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

            // Validate checkpoint and activity over time data structures
            // If invalid, data will be null and no further processing will be done
            const checkpoints = await this.validateCheckpointData();
            const activityOverTime = await this.validateActivityOverTimeData();
            if (!checkpoints || !activityOverTime) {
                if (isFirstTime) {
                    data = this.getEmptyActivityHeatmapData();
                } else {
                    console.error("Data is not valid and not first time");
                    return;
                }
            } else {
                data = { checkpoints, activityOverTime };
            }

            
            if (data) {
                const fileCheckpointMetrics = data.checkpoints[file.path];
                const { newFileCheckpointMetrics, activityOverTime } = await this.metricManager.calculateFileMetrics(file, fileCheckpointMetrics, data.activityOverTime, isFirstTime);

                data.checkpoints[file.path] = newFileCheckpointMetrics;
                data.activityOverTime = activityOverTime;

                await this.writeToCurrentDataFile(data);
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
        const data = await this.readCurrentDataFile();
        if (data) {
            delete data.checkpoints[file.path];
            await this.writeToCurrentDataFile(data);
        }
    }

    /**
     * Writes the activity heatmap data to the current data file.
     * In case where the file does not exist already, it will be created.
     * @param data - The activity heatmap data to write
     */
    private async writeToCurrentDataFile(data: ActivityHeatmapData) {
        const folderExists = await this.plugin.app.vault.adapter.exists(this.plugin.manifest.dir + "/" + DATA_FOLDER);
        
        if (!folderExists) {
            await this.plugin.app.vault.adapter.mkdir(this.plugin.manifest.dir + "/" + DATA_FOLDER);
        }
        
        await this.plugin.app.vault.adapter.write(this.plugin.manifest.dir + "/" + DATA_FOLDER + "/" + CURRENT_DATA_FILE, JSON.stringify(data, null, 2));
    }

    private async readCurrentDataFile(): Promise<ActivityHeatmapData | null> {
        try {
            return await this.plugin.app.vault.adapter.read(this.plugin.manifest.dir + "/" + DATA_FOLDER + '/' + CURRENT_DATA_FILE).then(data => JSON.parse(data));
        } catch (error) {
            return null;
        }
    }

    private async validateCheckpointData(): Promise<CheckpointData | null> {
        
        const currentData = await this.readCurrentDataFile();

        if (currentData) {
            if (!isCheckpointData(currentData.checkpoints)) {
                console.error("Current checkpoint data is not in the expected format!");
                return null;
            }
            return currentData.checkpoints;
        }

        for (const version of LEGACY_DATA_VERSIONS) {
            const data = await this.validateCheckpointDataLegacyVersions(version);
            if (data) {
                return data;
            }
        }

        return null;
    }


    private async validateCheckpointDataLegacyVersions(version: string): Promise<CheckpointData | null> {
        switch (version) {
            case "1.0.4":
                const data = await this.plugin.loadData();
                if (data && 'checkpoints' in data && isCheckpointDataLegacy1_0_4(data.checkpoints)) {
                    return this.convertCheckpointLegacy1_0_4ToCurrentData(data.checkpoints);
                }
                return null;
            default:
                return null;
        }
    }

    private convertCheckpointLegacy1_0_4ToCurrentData(legacyData: CheckpointDataLegacy1_0_4): CheckpointData {
        const newData: CheckpointData = {};
        
        const allFilePaths = new Set<FilePath>();
        Object.values(legacyData).forEach(metricData => {
            Object.keys(metricData).forEach(filePath => {
                allFilePaths.add(filePath);
            });
        });
        
        allFilePaths.forEach(filePath => {
            const fileMetrics: FileCheckpointData = {
                mtime: 0, // Default to 0 since legacy data doesn't have mtime
            } as FileCheckpointData;
            
            Object.entries(legacyData).forEach(([metricType, metricData]) => {
                fileMetrics[metricType as MetricType] = metricData[filePath] || 0;
            });
            
            newData[filePath] = fileMetrics;
        });
        
        return newData;
    }

    private async validateActivityOverTimeData(): Promise<ActivityOverTimeData | null> {
        const currentData = await this.readCurrentDataFile();

        if (!currentData) {
            return this.getEmptyActivityHeatmapData().activityOverTime;
        }

        if (!isActivityOverTimeData(currentData.activityOverTime)) {
            console.error("Current activity over time data is not in the expected format!");
            return null;
        }
        return currentData.activityOverTime;
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
	
}