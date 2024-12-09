import { DEV_BUILD } from "./config";
import ActivityHeatmapPlugin from "./main";
import { ActivityHeatmapData, DateString, HeatmapActivityData, MetricType } from "./types";
import { createMockData, isActivityOverTimeData, isActivityOverTimeDataLegacy1_0_4 } from "./utils";

export class dataReader {
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.plugin = plugin;
    }

    async getActivityDataForHeatmap(metricType: MetricType): Promise<HeatmapActivityData> {
        if (DEV_BUILD) {
            return createMockData();
        }

        const dataSources = [
            await this.getV1_0_5Data(metricType),
            await this.getV1_0_4Data(metricType)
        ];

        return dataSources
            .filter((source): source is HeatmapActivityData => source !== null)
            .reduce((merged, current) => this.mergeActivityData(merged, current), 
                this.getEmptyHeatmapActivityData());
    }

    private mergeActivityData(base: HeatmapActivityData, overlay: HeatmapActivityData): HeatmapActivityData {
        const result = { ...base };
        Object.entries(overlay).forEach(([date, value]) => {
            result[date] = (result[date] || 0) + value;
        });
        return result;
    }

    private getEmptyHeatmapActivityData(): HeatmapActivityData {
        return {} as Record<DateString, number>;
    }


    private async getV1_0_5Data(metricType: MetricType): Promise<HeatmapActivityData | null> {
        try {
            const data = await this.plugin.app.vault.adapter.read(
                this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json'
            ).then(data => JSON.parse(data)) as ActivityHeatmapData;

            if (!isActivityOverTimeData(data.activityOverTime)) {
                console.error("v1_0_5 activity over time data is not in the expected format!");
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

    private async getV1_0_4Data(metricType: MetricType): Promise<HeatmapActivityData | null> {
        const legacyFile = await this.plugin.loadData();
        if (!legacyFile || !('activityOverTime' in legacyFile) || !isActivityOverTimeDataLegacy1_0_4(legacyFile.activityOverTime)) {
            return null;
        }
        return legacyFile.activityOverTime[metricType];
    }

}

