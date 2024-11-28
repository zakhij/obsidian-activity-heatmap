import ActivityHeatmapPlugin from "./main";
import { ActivityHeatmapData, ActivityHeatmapDataLegacy1_0_4 } from "./types";
import { migrate1_0_4To1_0_5 } from "./migrations/1_0_4";
import { isActivityOverTimeDataLegacy1_0_4, isCheckpointDataLegacy1_0_4 } from "./utils";

export class MigrationManager {
    constructor(private plugin: ActivityHeatmapPlugin) {}

    async migrateIfNeeded(): Promise<void> {
        console.log("Checking for migrations...");
        const data = await this.plugin.loadData();
        if (!data) return; // New installation

        const currentVersion = this.plugin.manifest.version;
        const dataVersion = data.version || '1.0.4';

        if (dataVersion === currentVersion) return;

        console.log(`Migrating from ${dataVersion} to ${currentVersion}`);
        await this.executeMigration(data, dataVersion, currentVersion);
    }

    private async executeMigration(data: any, fromVersion: string, toVersion: string): Promise<void> {
        try {
            // First validate the source data structure
            if (!this.isValidDataStructure(data, fromVersion)) {
                throw new Error(`Data structure invalid for version ${fromVersion}`);
            }

            // Perform the actual migration
            const migratedData = this.migrateDataToLatestVersion(data, fromVersion);

            // Save the migrated data
            await this.plugin.saveData(migratedData);
        } catch (error) {
            throw new Error(`Failed to migrate from ${fromVersion} to ${toVersion}: ${error.message}`);
        }
    }

    private isValidDataStructure(data: any, version: string): boolean {
        switch (version) {
            case '1.0.4':
                return (
                    isCheckpointDataLegacy1_0_4(data.checkpoints) &&
                    isActivityOverTimeDataLegacy1_0_4(data.activityOverTime)
                );
            default:
                return false;
        }
    }

    private migrateDataToLatestVersion(data: any, fromVersion: string): ActivityHeatmapData {
        switch (fromVersion) {
            case '1.0.4':
                return migrate1_0_4To1_0_5(data as ActivityHeatmapDataLegacy1_0_4);
            default:
                throw new Error(`Unknown version ${fromVersion}`);
        }
    }
} 