import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Heatmap } from './heatmap';
import  ActivityHeatmapPlugin from './main';
import { ActivityData } from './types';

export const VIEW_TYPE_HEATMAP = 'heatmap-view';

export class HeatmapView extends ItemView {
    private heatmap: Heatmap;
    private plugin: ActivityHeatmapPlugin;
    private useMockData: boolean;

    constructor(leaf: WorkspaceLeaf, plugin: ActivityHeatmapPlugin, useMockData: boolean) {
        super(leaf);
        this.plugin = plugin;
        this.heatmap = new Heatmap();
        this.useMockData = useMockData;

    }

    getViewType() {
        return VIEW_TYPE_HEATMAP;
    }

    getDisplayText() {
        return 'Activity Heatmap';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        const heatmapContainer = container.createEl('div', { attr: { id: 'heatmap-container' } });
        
        this.heatmap.setContainer(heatmapContainer);
        this.heatmap.render(await this.getHeatmapData());

    }

    async getHeatmapData(): Promise<ActivityData> {
        const metricType = this.plugin.settings.metricType;
        return this.plugin.dataManager.getActivityHeatmapData(this.useMockData, metricType);
    }

    async onClose() {
        // Cleanup if necessary
    }
}
