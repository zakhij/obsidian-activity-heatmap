import type { ActivityHeatmapData } from './types'
import type ActivityHeatmapPlugin from './main'

export class DataManager {
    private data: ActivityHeatmapData; 

    constructor(
        private plugin: ActivityHeatmapPlugin
    ) {
        this.data = {}
    }

    async loadData() {
        this.data = await this.plugin.loadData() || {};
    }

    async saveData() {
        await this.plugin.saveData(this.data);
    }

    
}
