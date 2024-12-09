import { DEV_BUILD } from "./config";
import ActivityHeatmapPlugin from "./main";
import { ActivityHeatmapData, ActivityOverTimeData, ActivityOverTimeDataLegacy1_0_4, CheckpointData, DateActivityMetrics, HeatmapActivityData, MetricType } from "./types";
import { createMockData, getEmptyActivityHeatmapData, isActivityOverTimeData, isActivityOverTimeDataLegacy1_0_4 } from "./utils";

export class dataReader {
    constructor(private plugin: ActivityHeatmapPlugin) {
        this.plugin = plugin;
    }

    async getActivityDataForHeatmap(metricType: MetricType): Promise<HeatmapActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return createMockData();
        }
        let activityData = await this.validateActivityOverTimeData();
        if (!activityData) {
            activityData = getEmptyActivityHeatmapData().activityOverTime;
        }
        const transformedData: HeatmapActivityData = {};
        Object.entries(activityData).forEach(([date, metrics]) => {
            if (metrics[metricType]) {
                transformedData[date] = metrics[metricType];
            }
        });
        
        return transformedData;
    }

    async validateActivityOverTimeData(): Promise<ActivityOverTimeData | null> {
        const legacyFile = await this.plugin.loadData();
        const hasLegacyData = legacyFile && 'activityOverTime' in legacyFile;
        let v1_0_5Data: ActivityHeatmapData | null = null;
        try {
            v1_0_5Data = await this.plugin.app.vault.adapter.read(
                this.plugin.manifest.dir + '/activity_heatmap_data/v1_0_5.json'
            ).then(data => JSON.parse(data));
        } catch (error) {
        }

        let combinedData: ActivityOverTimeData = {};
        
        if (v1_0_5Data) {
            if (!isActivityOverTimeData(v1_0_5Data.activityOverTime)) {
                console.error("v1_0_5 activity over time data is not in the expected format!");
                return null;
            }
            combinedData = v1_0_5Data.activityOverTime;
        }

        if (hasLegacyData) {
            if (!isActivityOverTimeDataLegacy1_0_4(legacyFile.activityOverTime)) {
                console.error("Legacy activity over time data is not in the expected format!");
                return null;
            }
            const legacyConverted = await this.convertActivityOverTimeDataLegacyToV1_0_5(legacyFile.activityOverTime);
            Object.entries(legacyConverted).forEach(([date, legacyMetrics]) => {
                if (combinedData[date]) {
                    Object.keys(legacyMetrics).forEach((metricType: MetricType) => {
                        combinedData[date][metricType] = 
                            (combinedData[date][metricType] || 0) + 
                            (legacyMetrics[metricType] || 0);
                    });
                } else {
                    combinedData[date] = legacyMetrics;
                }
            });
        }
        return combinedData;
    }

    async convertActivityOverTimeDataLegacyToV1_0_5(legacyData: ActivityOverTimeDataLegacy1_0_4): Promise<ActivityOverTimeData> {
        const newData: ActivityOverTimeData = {};
        const allDates = new Set<string>();
        Object.values(legacyData).forEach(metricData => {
            Object.keys(metricData).forEach(date => allDates.add(date));
        });
        
        allDates.forEach(date => {
            newData[date] = {} as DateActivityMetrics;
            Object.entries(legacyData).forEach(([metricType, metricData]) => {
                newData[date][metricType as MetricType] = metricData[date] || 0;
            });
        });
        
        return newData;
    }

}

