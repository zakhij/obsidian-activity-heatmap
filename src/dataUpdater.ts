import { CURRENT_DATA_FILE, DATA_FOLDER, LEGACY_DATA_SCHEMAS } from './constants';
import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { MetricType, ActivityHeatmapData, CheckpointData, ActivityOverTimeData,  FileCheckpointData, FilePath, CheckpointDataSchemaV0 } from './types';
import { isActivityOverTimeData, isCheckpointData, isCheckpointDataSchemaV0 } from './utils'
import { TFile } from 'obsidian';

/**
 * Manages activity heatmap data for the plugin.
 */
export class DataUpdater {
    private metricManager: MetricManager;
    private saveQueue: Promise<void> = Promise.resolve();

    /**
     * Creates an instance of DataUpdater, which is responsible for writing updates to activity heatmap data storage.
     * @param plugin - The main plugin instance.
     */
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.metricManager = new MetricManager(plugin);
    }

    /**
     * Examines a single file's changes and determines the new checkpoint and activity over time data.
     * Writes the updated data to disk in the current data file.
     * @param file - The Obsidian TFile to update metrics for
     * @param isFirstTime - Whether this is a first-time user (i.e. no existing data.json file)
     */
    async updateFileData(file: TFile, isFirstTime: boolean): Promise<void> {
        this.saveQueue = this.saveQueue.then(async () => {

            let data: ActivityHeatmapData | null = null;

            // Validate checkpoint and activity-over-time data structures
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
    async removeFileData(file: TFile): Promise<void> {
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
    private async writeToCurrentDataFile(data: ActivityHeatmapData): Promise<void> {
        const folderExists = await this.plugin.app.vault.adapter.exists(this.plugin.manifest.dir + "/" + DATA_FOLDER);
        if (!folderExists) {
            await this.plugin.app.vault.adapter.mkdir(this.plugin.manifest.dir + "/" + DATA_FOLDER);
        }
        await this.plugin.app.vault.adapter.write(this.plugin.manifest.dir + "/" + DATA_FOLDER + "/" + CURRENT_DATA_FILE, JSON.stringify(data, null, 2));
    }

    /**
     * Reads the current data file.
     * @returns The current data file's contents, or null if it does not exist.
     */
    private async readCurrentDataFile(): Promise<ActivityHeatmapData | null> {
        try {
            return await this.plugin.app.vault.adapter.read(this.plugin.manifest.dir + "/" + DATA_FOLDER + '/' + CURRENT_DATA_FILE).then(data => JSON.parse(data));
        } catch (error) {
            return null;
        }
    }

    /**
     * Validates the checkpoint data across all data storage files (current and legacy)
     * @returns The checkpoint data, or null if it does not exist or is not in the expected format.
     */
    private async validateCheckpointData(): Promise<CheckpointData | null> {
        const currentData = await this.readCurrentDataFile();
        if (currentData) {
            if (!isCheckpointData(currentData.checkpoints)) {
                console.error("Current checkpoint data is not in the expected format!");
                return null;
            }
            return currentData.checkpoints;
        }

        for (const schema of LEGACY_DATA_SCHEMAS) {
            const data = await this.validateCheckpointDataLegacySchemas(schema);
            if (data) {
                return data;
            }
        }

        return null;
    }

    /**
     * Validates the checkpoint data across all legacy data storage files.
     * @param version - The version of the legacy data storage file to validate
     * @returns The checkpoint data, or null if it does not exist or is not in the expected format.
     */
    private async validateCheckpointDataLegacySchemas(schema_version: string): Promise<CheckpointData | null> {
        switch (schema_version) {
            case "V0":
                const data = await this.plugin.loadData();
                if (data && 'checkpoints' in data && isCheckpointDataSchemaV0(data.checkpoints)) {
                    return this.convertCheckpointSchemaV0ToCurrentSchema(data.checkpoints);
                }
                return null;
            default:
                return null;
        }
    }

    /**
     * Converts the legacy checkpoint data (v0) to the current checkpoint data format.
     * @param legacyData - The legacy checkpoint data to convert
     * @returns The converted checkpoint data
     */
    private convertCheckpointSchemaV0ToCurrentSchema(legacyData: CheckpointDataSchemaV0): CheckpointData {
        const newData: CheckpointData = {};
        
        const allFilePaths = new Set<FilePath>();
        Object.values(legacyData).forEach(metricData => {
            Object.keys(metricData).forEach(filePath => {
                allFilePaths.add(filePath);
            });
        });
        
        allFilePaths.forEach(filePath => {
            const fileMetrics: FileCheckpointData = {
                mtime: 0, // Default to 0 since v0 data schema doesn't have mtime
            } as FileCheckpointData;
            
            Object.entries(legacyData).forEach(([metricType, metricData]) => {
                fileMetrics[metricType as MetricType] = metricData[filePath] || 0;
            });
            
            newData[filePath] = fileMetrics;
        });
        
        return newData;
    }


    /**
     * Validates the activity-over-time data, only in the current data file
     * @returns The activity-over-time data... or null if it's not in the expected format... 
     * or an empty activity-over-time data structure if the current data file does not exist
     */
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