import { DEV_BUILD } from "./config";
import { CURRENT_DATA_FILE, CURRENT_DATA_SCHEMA, DATA_FOLDER } from "./constants";
import { LEGACY_DATA_SCHEMAS } from "./constants";
import ActivityHeatmapPlugin from "./main";
import { ActivityHeatmapData, DateString, HeatmapActivityData, MetricType } from "./types";
import { createMockData, isActivityOverTimeData, isActivityOverTimeDataSchemaV0 } from "./utils";

export class DataReader {
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.plugin = plugin;
    }

    /**
     * Get activity data to power the heatmap visualization, merging data from all data storage files (current and legacy).
     * @param metricType - The type of metric to get data for.
     * @returns Heatmap activity data (KV pair of date: activityOverTime metric value).
     */
    async getActivityDataForHeatmap(metricType: MetricType): Promise<HeatmapActivityData> {
        if (DEV_BUILD) {
            return createMockData();
        }
        const dataSources = await this.getDataSources(metricType);
        return dataSources
            .filter((source): source is HeatmapActivityData => source !== null)
            .reduce((merged, current) => this.mergeActivityData(merged, current), 
                this.getEmptyHeatmapActivityData());
    }

    /**
     * Pulls and collects heatmap activity data from all data storage files: both current and legacy. 
     * @param metricType - The type of metric to get data for.
     * @returns Array of data sources (HeatmapActivityData).
     */
    private async getDataSources(metricType: MetricType): Promise<HeatmapActivityData[]> {
        const dataSources = await Promise.all([CURRENT_DATA_SCHEMA, ...LEGACY_DATA_SCHEMAS].map(schema_version => this.getDataForSchemaVersion(schema_version, metricType)));
        return dataSources.filter((source): source is HeatmapActivityData => source !== null);
    }

    /**
     * Pulls and collects heatmap activity data from a specific data storage file.
     * @param version - The version of the data storage file to pull data from.
     * @param metricType - The type of metric to get data for.
     * @returns Heatmap activity data (KV pair of date: activityOverTime metric value), or null if the data is not found or in an unexpected format.
     */
    private async getDataForSchemaVersion(schema_version: string, metricType: MetricType): Promise<HeatmapActivityData | null> {
        switch (schema_version) {
            case CURRENT_DATA_SCHEMA:
                return await this.getDataForCurrentSchema(metricType);
            case 'V0':
                return await this.getDataForSchemaV0(metricType);
            default:
                return null;
        }
    }

    /**
     * Merges two heatmap activity data sets, summing values for overlapping dates.
     * @param base - The base heatmap activity data.
     * @param overlay - The overlay heatmap activity data.
     * @returns Merged heatmap activity data.
     */
    private mergeActivityData(base: HeatmapActivityData, overlay: HeatmapActivityData): HeatmapActivityData {
        const result = { ...base };
        Object.entries(overlay).forEach(([date, value]) => {
            result[date] = (result[date] || 0) + value;
        });
        return result;
    }

    /**
     * Returns an empty heatmap activity data set, used as a fallback when no data is found.
     * @returns Empty heatmap activity data.
     */
    private getEmptyHeatmapActivityData(): HeatmapActivityData {
        return {} as Record<DateString, number>;
    }


    /**
     * Reads, validates, and transforms heatmap activity data from the current data storage file.
     * @param metricType - The type of metric to get data for.
     * @returns Heatmap activity data (KV pair of date: activityOverTime metric value), or null if the data is not found or in an unexpected format.
     */
    private async getDataForCurrentSchema(metricType: MetricType): Promise<HeatmapActivityData | null> {
        try {
            const data = await this.plugin.app.vault.adapter.read(
                this.plugin.manifest.dir + "/" + DATA_FOLDER + "/" + CURRENT_DATA_FILE
            ).then(data => JSON.parse(data)) as ActivityHeatmapData;

            if (!isActivityOverTimeData(data.activityOverTime)) {
                console.error("Current activity over time data is not in the expected format!");
                return null;
            }

            const transformedData: HeatmapActivityData = {};
            Object.entries(data.activityOverTime).forEach(([date, metrics]) => {
                if (metrics[metricType]) {
                    transformedData[date] = metrics[metricType];
                }
            });
            return transformedData;
        } catch (error) {
            return null;
        }
    }

    /**
     * Reads, validates, and transforms heatmap activity data from the legacy data storage file (v1.0.4).
     * @param metricType - The type of metric to get data for.
     * @returns Heatmap activity data (KV pair of date: activityOverTime metric value), or null if the data is not found or in an unexpected format.
     */
    private async getDataForSchemaV0(metricType: MetricType): Promise<HeatmapActivityData | null> {
        const legacyFile = await this.plugin.loadData();
        if (!legacyFile || !('activityOverTime' in legacyFile) || !isActivityOverTimeDataSchemaV0(legacyFile.activityOverTime)) {
            return null;
        }
        return legacyFile.activityOverTime[metricType];
    }

}

