import { ActivityHeatmapDataManager } from './dataManager';
import { Heatmap } from './heatmap';
import type { ActivityHeatmapData } from './types';

export class HeatmapController {
    private heatmap: Heatmap;

    constructor(private dataManager: ActivityHeatmapDataManager, private container: HTMLElement) {
        this.heatmap = new Heatmap(container);
    }

    async updateHeatmap() {
        const data = await this.dataManager.getActivityHeatmapData();
        const formattedData = this.formatData(data);
        this.heatmap.render(formattedData);
    }

    private formatData(data: ActivityHeatmapData): { [date: string]: number } {
        const formattedData: { [date: string]: number } = {};
        for (const metric in data.activityOverTime) {
            for (const date in data.activityOverTime[metric]) {
                if (!formattedData[date]) {
                    formattedData[date] = 0;
                }
                formattedData[date] += data.activityOverTime[metric][date];
            }
        }
        return formattedData;
    }
}
