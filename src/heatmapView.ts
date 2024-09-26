import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Heatmap } from './heatmap';
import ActivityHeatmapPlugin from './main';
import { ActivityData } from './types';

export const VIEW_TYPE_HEATMAP = 'heatmap-view';

export class HeatmapView extends ItemView {
    private heatmap: Heatmap;
    private plugin: ActivityHeatmapPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: ActivityHeatmapPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.heatmap = new Heatmap();
    }

    getViewType() {
        return VIEW_TYPE_HEATMAP;
    }

    getDisplayText() {
        return 'Activity Heatmap';
    }

    async onOpen() {
        console.log("Opening heatmap view, using mock data:", this.plugin.settings.useMockData);
        const container = this.containerEl.children[1];
        container.empty();
        const heatmapContainer = container.createEl('div', { attr: { id: 'heatmap-container' } });
        
        this.heatmap.setContainer(heatmapContainer);
        this.heatmap.render(await this.getHeatmapData());
    }

    async getHeatmapData(): Promise<ActivityData> {
        const metricType = this.plugin.settings.metricType;
        return this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, metricType);
    }

    async onClose() {
        // Cleanup if necessary
    }
}

