import type ActivityHeatmapPlugin from './main'
import { MetricManager } from './metricManager';
import { ActivityData, MetricType, ActivityHeatmapData } from './types';
import { DEV_BUILD } from './config';
import { getCurrentDate, createMockData } from './utils'
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
     */
    async updateMetricsForFile(file: TFile) {
        this.saveQueue = this.saveQueue.then(async () => {
            const today = getCurrentDate();
            const data = await this.parseActivityData();
            
            for (const metricType of METRIC_TYPES) {
                const { checkpoint, activity } = await this.metricManager.calculateMetricsForFile(
                    metricType,
                    file,
                    data,
                    today
                );
                
                data.checkpoints[metricType] = {
                    ...data.checkpoints[metricType],
                    [file.path]: checkpoint[file.path]
                };
                data.activityOverTime[metricType] = activity;
            }
            
            await this.plugin.saveData(data);
        });
        
        // Wait for this update to complete
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
     * @param metricType - The type of metric to retrieve data for.
     * @returns A promise that resolves to the activity data.
     */
    async getActivityHeatmapData(metricType: MetricType): Promise<ActivityData> {
        if (DEV_BUILD && this.plugin.settings.useMockData) {
            console.log("Using mock data");
            return createMockData();
        }
        const data = await this.parseActivityData();
        return data.activityOverTime[metricType];
    }

    /**
	 * Parses the data read from disk (plugin's data.json file) into a usable format.
     * If the data is not in the expected format, it returns an empty data structure to prevent errors.
	 * @returns The parsed activity data.
	 */
	async parseActivityData(): Promise<ActivityHeatmapData> {
		const loadedData = await this.plugin.loadData();

		const emptyFrame: ActivityHeatmapData = {
			checkpoints: METRIC_TYPES.reduce((acc, metric) => ({
				...acc,
				[metric]: {} as Record<string, number>
			}), {} as Record<MetricType, Record<string, number>>),
			activityOverTime: METRIC_TYPES.reduce((acc, metric) => ({
				...acc,
				[metric]: {} as Record<string, number>
			}), {} as Record<MetricType, Record<string, number>>)
		};

		// Case of new user (no data.json)
		if (!loadedData) {
			return emptyFrame;
		}

		// Case of invalid or malformed activity heatmap data
		if (!isActivityHeatmapData(loadedData)) {
			return emptyFrame;
		}

		// Correct case: extract only the ActivityHeatmapData properties
		return {
			checkpoints: loadedData.checkpoints,
			activityOverTime: loadedData.activityOverTime
		};
	}
}
