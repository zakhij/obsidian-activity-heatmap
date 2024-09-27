import { App, Modal } from 'obsidian';
import { Heatmap } from './heatmap';
import { ActivityData } from './types';
import  ActivityHeatmapPlugin  from './main';

export class HeatmapModal extends Modal {
    private heatmap: Heatmap;
    private plugin: ActivityHeatmapPlugin;

    constructor(app: App, plugin: ActivityHeatmapPlugin) {
        super(app);
        this.heatmap = new Heatmap();
        this.plugin = plugin;

    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.createEl('h2', {text: 'Heatmap'});

        const heatmapContainer = contentEl.createDiv();
        heatmapContainer.id = 'heatmap-container';
        
        // Assuming your Heatmap class has a setContainerId method
        this.heatmap.setContainer(heatmapContainer);
        
        // Fetch your data here
        const data = await this.getHeatmapData();
        
        // Render the heatmap
        this.heatmap.render(data);
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }

    private async getHeatmapData(): Promise<ActivityData> {
        const metricType = this.plugin.settings.metricType;
        return this.plugin.dataManager.getActivityHeatmapData(this.plugin.settings.useMockData, metricType);
    }
}
